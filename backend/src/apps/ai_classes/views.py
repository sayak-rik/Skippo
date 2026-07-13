import hmac
import logging
from datetime import timezone as dt_timezone

from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tenancy.models import School

log = logging.getLogger(__name__)


def _school(request) -> School:
    return School.objects.get(slug=request.tenant_slug)


# ── Health ─────────────────────────────────────────────────────────────────────

class AIClassesRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "ai_classes", "status": "ready"})


# ── Admin: Class CRUD ──────────────────────────────────────────────────────────

class AdminAIClassListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.ai_classes.models import AIClass
        from apps.ai_classes.serializers import AIClassListSerializer

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)

        status_filter = request.query_params.get("status")
        qs = AIClass.objects.filter(school=school)
        if status_filter:
            qs = qs.filter(status=status_filter)

        return Response(AIClassListSerializer(qs, many=True).data)

    def post(self, request):
        from apps.academics.models import Classroom
        from apps.ai_classes.models import AIClass
        from apps.ai_classes.serializers import AIClassDetailSerializer, AIClassWriteSerializer

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)

        serializer = AIClassWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        classroom_id = serializer.validated_data.pop("classroom_id", None)
        ai_class = AIClass.objects.create(
            school=school,
            created_by=request.user,
            **serializer.validated_data,
        )
        if classroom_id:
            try:
                ai_class.classroom = Classroom.objects.get(id=classroom_id, school=school)
                ai_class.save(update_fields=["classroom"])
            except Classroom.DoesNotExist:
                pass

        return Response(AIClassDetailSerializer(ai_class).data, status=201)


class AdminAIClassDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, class_id):
        from apps.ai_classes.models import AIClass

        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            return AIClass.objects.get(id=class_id, school=school), None
        except AIClass.DoesNotExist:
            return None, Response({"detail": "AI class not found."}, status=404)

    def get(self, request, class_id):
        from apps.ai_classes.serializers import AIClassDetailSerializer

        ai_class, err = self._get(request, class_id)
        if err:
            return err
        return Response(AIClassDetailSerializer(ai_class).data)

    def patch(self, request, class_id):
        from apps.ai_classes.serializers import AIClassDetailSerializer, AIClassWriteSerializer

        ai_class, err = self._get(request, class_id)
        if err:
            return err
        if ai_class.status != "draft":
            return Response({"detail": "Only draft classes can be edited."}, status=400)

        serializer = AIClassWriteSerializer(ai_class, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(AIClassDetailSerializer(ai_class).data)

    def delete(self, request, class_id):
        ai_class, err = self._get(request, class_id)
        if err:
            return err
        if ai_class.status not in ("draft",):
            return Response({"detail": "Only draft classes can be deleted."}, status=400)
        ai_class.delete()
        return Response(status=204)


class AdminAIClassActivateView(APIView):
    """Activate a class: register with loadbalancer, spin pod, mint student tokens, notify parents."""
    permission_classes = [IsAuthenticated]

    def post(self, request, class_id):
        from apps.academics.models import Student
        from apps.ai_classes.models import AIClass, StudentClassToken
        from apps.ai_classes.serializers import AIClassDetailSerializer
        from apps.ai_classes.services import allocate_pod, build_class_config, register_class
        from apps.ai_classes.tasks import notify_class_started

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        try:
            ai_class = AIClass.objects.get(id=class_id, school=school)
        except AIClass.DoesNotExist:
            return Response({"detail": "AI class not found."}, status=404)

        if ai_class.status != "draft":
            return Response({"detail": "Class is already active or ended."}, status=400)

        # 1. Register config with loadbalancer
        webhook_url = f"{getattr(settings, 'BACKEND_PUBLIC_URL', '')}/api/ai-classes/webhook/"
        config = build_class_config(ai_class)
        config["webhook_url"]    = webhook_url
        config["webhook_secret"] = getattr(settings, "AI_TEACHER_WEBHOOK_SECRET", "")
        register_class(str(ai_class.id), config)

        # 2. Spin up pod
        lb_resp = allocate_pod(str(ai_class.id))
        if not lb_resp.get("pod_url"):
            log.error("allocate_pod returned no pod_url for class %s", ai_class.id)
            return Response({"detail": "Could not start class server. Try again shortly."}, status=503)

        ai_class.pod_url   = lb_resp["pod_url"]
        ai_class.machine_id = lb_resp.get("machine_id", "")
        ai_class.status    = AIClass.Status.ACTIVE
        ai_class.save(update_fields=["pod_url", "machine_id", "status"])

        # 3. Mint student tokens for the classroom (if linked)
        if ai_class.classroom:
            students = Student.objects.filter(
                classroom=ai_class.classroom, is_active=True, school=school
            )
            existing_ids = set(ai_class.tokens.values_list("student_id", flat=True))
            tokens_to_create = []
            for student in students:
                if student.id not in existing_ids:
                    name = getattr(student, "full_name", None) or str(student.id)
                    tokens_to_create.append(
                        StudentClassToken(
                            school=school,
                            ai_class=ai_class,
                            student=student,
                            student_name=name,
                        )
                    )
            StudentClassToken.objects.bulk_create(tokens_to_create)

        # 4. Push notifications
        notify_class_started.delay(ai_class.id)

        return Response(AIClassDetailSerializer(ai_class).data)


class AdminAIClassEndView(APIView):
    """End an active class: notify engine to close, then schedule pod destruction."""
    permission_classes = [IsAuthenticated]

    def post(self, request, class_id):
        from apps.ai_classes.models import AIClass
        from apps.ai_classes.serializers import AIClassDetailSerializer
        from apps.ai_classes.services import end_class
        from apps.ai_classes.tasks import notify_class_ended

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        try:
            ai_class = AIClass.objects.get(id=class_id, school=school)
        except AIClass.DoesNotExist:
            return Response({"detail": "AI class not found."}, status=404)

        if ai_class.status != "active":
            return Response({"detail": "Class is not active."}, status=400)

        # Tell the loadbalancer to end the class (it will fire the webhook & destroy pod)
        end_class(str(ai_class.id))

        ai_class.status   = AIClass.Status.ENDED
        ai_class.ended_at = timezone.now()
        ai_class.save(update_fields=["status", "ended_at"])

        notify_class_ended.delay(ai_class.id)

        return Response(AIClassDetailSerializer(ai_class).data)


# ── Admin: Tokens + Feedback ───────────────────────────────────────────────────

class AdminClassTokensView(APIView):
    """List all student join tokens (with join URLs) for a class."""
    permission_classes = [IsAuthenticated]

    def get(self, request, class_id):
        from apps.ai_classes.models import AIClass
        from apps.ai_classes.serializers import StudentTokenSerializer

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        try:
            ai_class = AIClass.objects.get(id=class_id, school=school)
        except AIClass.DoesNotExist:
            return Response({"detail": "AI class not found."}, status=404)

        tokens = ai_class.tokens.select_related("student").all()
        return Response(StudentTokenSerializer(tokens, many=True).data)


class AdminClassFeedbackView(APIView):
    """List all feedback for a class."""
    permission_classes = [IsAuthenticated]

    def get(self, request, class_id):
        from apps.ai_classes.models import AIClass
        from apps.ai_classes.serializers import ClassFeedbackSerializer

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        try:
            ai_class = AIClass.objects.get(id=class_id, school=school)
        except AIClass.DoesNotExist:
            return Response({"detail": "AI class not found."}, status=404)

        feedback = ai_class.feedback.all()
        return Response(ClassFeedbackSerializer(feedback, many=True).data)


# ── Parent: AI class access ────────────────────────────────────────────────────

class ParentStudentAIClassListView(APIView):
    """List active AI classes for a student."""
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        from apps.academics.models import StudentParentLink
        from apps.accounts.models import ParentProfile
        from apps.ai_classes.models import AIClass, StudentClassToken
        from apps.ai_classes.serializers import StudentTokenSerializer

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)

        try:
            parent = ParentProfile.objects.get(user=request.user)
        except ParentProfile.DoesNotExist:
            return Response({"detail": "Parent profile not found."}, status=403)

        if not StudentParentLink.objects.filter(parent=parent, student_id=student_id).exists():
            return Response({"detail": "Not authorised for this student."}, status=403)

        tokens = StudentClassToken.objects.filter(
            student_id=student_id,
            ai_class__school=school,
            ai_class__status=AIClass.Status.ACTIVE,
        ).select_related("ai_class")

        return Response(StudentTokenSerializer(tokens, many=True).data)


# ── Webhook: receive events from AI teacher engine ─────────────────────────────

class WebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def _verify(self, request) -> bool:
        expected = getattr(settings, "AI_TEACHER_WEBHOOK_SECRET", "")
        if not expected:
            return True
        received = request.headers.get("X-Webhook-Secret", "")
        return hmac.compare_digest(expected, received)

    def post(self, request):
        from apps.ai_classes.models import AIClass, ClassFeedback, StudentClassToken

        if not self._verify(request):
            return Response({"detail": "Forbidden."}, status=403)

        data   = request.data
        event  = data.get("type")
        class_id = data.get("skippo_class_id") or data.get("class_id")

        if not class_id:
            return Response({"detail": "class_id required."}, status=400)

        try:
            ai_class = AIClass.objects.get(id=class_id)
        except (AIClass.DoesNotExist, ValueError):
            return Response({"detail": "Class not found."}, status=404)

        if event == "class_ended":
            if ai_class.status != AIClass.Status.ENDED:
                ai_class.status   = AIClass.Status.ENDED
                ai_class.ended_at = timezone.now()
            ai_class.class_summary = {
                "conversation_turns": data.get("conversation_turns", 0),
                "student_count":      data.get("student_count", 0),
                "conversation_log":   data.get("conversation_log", []),
                "ended_at":           data.get("ended_at"),
            }
            ai_class.save(update_fields=["status", "ended_at", "class_summary"])
            log.info("webhook: class_ended class_id=%s", class_id)

        elif event == "student_feedback":
            student_name = data.get("student_name", "")
            rating       = int(data.get("rating", 0))
            comment      = data.get("comment", "")
            submitted_at = data.get("submitted_at")

            if 1 <= rating <= 5:
                parsed_at = parse_datetime(str(submitted_at)) if submitted_at else None
                if parsed_at is not None and timezone.is_naive(parsed_at):
                    parsed_at = timezone.make_aware(parsed_at, dt_timezone.utc)
                # Try to match a student token by name
                token = ai_class.tokens.filter(student_name=student_name).first()
                ClassFeedback.objects.create(
                    ai_class=ai_class,
                    student=token.student if token else None,
                    student_name=student_name,
                    rating=rating,
                    comment=comment,
                    submitted_at=parsed_at or timezone.now(),
                )
                log.info("webhook: feedback rating=%s class_id=%s", rating, class_id)

        return Response({"detail": "ok"}, status=200)
