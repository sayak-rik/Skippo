import hmac
import logging
from datetime import timezone as dt_timezone

from django.conf import settings
from django.core.exceptions import ValidationError
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


def _build_exam_url(pod_url: str, access_token, session_id, test_id) -> str:
    """Build the student-facing exam URL from a pod URL.

    The pod URL may already carry a query string (e.g. ?fly_machine_id=… used
    for Fly.io machine routing), so the /test/<token> path and the sid/tid
    params have to be merged rather than naively concatenated.
    """
    from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

    parts = urlsplit(pod_url)
    path = parts.path.rstrip("/") + f"/test/{access_token}"
    query = parse_qsl(parts.query, keep_blank_values=True)
    query += [("sid", str(session_id)), ("tid", str(test_id))]
    return urlunsplit((parts.scheme, parts.netloc, path, urlencode(query), ""))


def _parse_aware(value):
    """Parse an incoming ISO timestamp into an aware datetime, defaulting to now."""
    if value:
        dt = parse_datetime(str(value))
        if dt is not None:
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt, dt_timezone.utc)
            return dt
    return timezone.now()


# ── Module health ──────────────────────────────────────────────────────────────

class AssessmentsRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "assessments", "status": "ready"})


# ── Admin: Test CRUD ───────────────────────────────────────────────────────────

class AdminTestListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.assessments.models import OnlineTest
        from apps.assessments.serializers import OnlineTestListSerializer

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)

        status_filter = request.query_params.get("status")
        qs = OnlineTest.objects.filter(school=school).order_by("-available_from")
        if status_filter:
            qs = qs.filter(status=status_filter)

        return Response(OnlineTestListSerializer(qs, many=True).data)

    def post(self, request):
        from apps.academics.models import AcademicYear, Classroom, Subject
        from apps.assessments.models import OnlineTest
        from apps.assessments.serializers import OnlineTestDetailSerializer, OnlineTestWriteSerializer

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)

        serializer = OnlineTestWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        classroom_ids = serializer.validated_data.pop("classroom_ids", [])
        test = OnlineTest.objects.create(
            school=school,
            created_by=request.user,
            **serializer.validated_data,
        )
        if classroom_ids:
            test.classrooms.set(
                Classroom.objects.filter(id__in=classroom_ids, school=school)
            )

        return Response(OnlineTestDetailSerializer(test).data, status=201)


class AdminTestDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_test(self, request, test_id):
        from apps.assessments.models import OnlineTest

        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            return OnlineTest.objects.get(id=test_id, school=school), None
        except OnlineTest.DoesNotExist:
            return None, Response({"detail": "Test not found."}, status=404)

    def get(self, request, test_id):
        from apps.assessments.serializers import OnlineTestDetailSerializer

        test, err = self._get_test(request, test_id)
        if err:
            return err
        return Response(OnlineTestDetailSerializer(test).data)

    def patch(self, request, test_id):
        from apps.academics.models import Classroom
        from apps.assessments.serializers import OnlineTestDetailSerializer, OnlineTestWriteSerializer

        test, err = self._get_test(request, test_id)
        if err:
            return err
        if test.status != "draft":
            return Response({"detail": "Only draft tests can be edited."}, status=400)

        serializer = OnlineTestWriteSerializer(test, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        classroom_ids = serializer.validated_data.pop("classroom_ids", None)
        serializer.save()
        if classroom_ids is not None:
            school = _school(request)
            test.classrooms.set(Classroom.objects.filter(id__in=classroom_ids, school=school))

        return Response(OnlineTestDetailSerializer(test).data)

    def delete(self, request, test_id):
        test, err = self._get_test(request, test_id)
        if err:
            return err
        if test.status != "draft":
            return Response({"detail": "Only draft tests can be deleted."}, status=400)
        test.delete()
        return Response(status=204)


class AdminTestPublishView(APIView):
    """Publish a test: register with loadbalancer, mint student tokens, notify parents."""
    permission_classes = [IsAuthenticated]

    def post(self, request, test_id):
        from apps.academics.models import Student
        from apps.assessments.models import OnlineTest, StudentTestToken
        from apps.assessments.serializers import OnlineTestDetailSerializer
        from apps.assessments.services import build_test_config, register_test
        from apps.notifications.push import notify_parents_of_students

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        try:
            test = OnlineTest.objects.get(id=test_id, school=school)
        except OnlineTest.DoesNotExist:
            return Response({"detail": "Test not found."}, status=404)

        if test.status != "draft":
            return Response({"detail": "Test is already published or closed."}, status=400)
        if not test.questions.exists():
            return Response({"detail": "Add at least one question before publishing."}, status=400)

        # 1. Register with loadbalancer (best-effort)
        webhook_url    = f"{getattr(settings, 'BACKEND_PUBLIC_URL', '')}/api/assessments/webhook/results/"
        webhook_secret = getattr(settings, "EXAM_WEBHOOK_SECRET", "")
        lb_resp = register_test(
            test_id=str(test.id),
            test_config=build_test_config(test),
            webhook_url=webhook_url,
            webhook_secret=webhook_secret,
        )
        if lb_resp.get("lb_test_id"):
            test.lb_test_id = lb_resp["lb_test_id"]

        # 2. Mint a token for each student in the enrolled classrooms
        classroom_ids = list(test.classrooms.values_list("id", flat=True))
        students = Student.objects.filter(
            classroom_id__in=classroom_ids, is_active=True, school=school
        )
        tokens_to_create = []
        existing_student_ids = set(
            StudentTestToken.objects.filter(test=test).values_list("student_id", flat=True)
        )
        for student in students:
            if student.id not in existing_student_ids:
                tokens_to_create.append(
                    StudentTestToken(
                        school=school,
                        test=test,
                        student=student,
                        expires_at=test.available_until,
                    )
                )
        StudentTestToken.objects.bulk_create(tokens_to_create)

        # 3. Push notification to all parents
        student_ids = list(students.values_list("id", flat=True))
        subject_name = test.subject.name if test.subject else "a subject"
        notify_parents_of_students(
            student_ids=student_ids,
            title=f"Upcoming Online Test: {test.title}",
            body=(
                f"{subject_name} online test on "
                f"{test.available_from.strftime('%d %b, %I:%M %p')}. "
                f"Duration: {test.duration_minutes} min. Tap to access."
            ),
            data={"type": "online_test", "test_id": str(test.id)},
        )

        test.status = OnlineTest.Status.PUBLISHED
        test.save(update_fields=["status", "lb_test_id"])

        return Response(OnlineTestDetailSerializer(test).data)


class AdminTestCloseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, test_id):
        from apps.assessments.models import OnlineTest

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        try:
            test = OnlineTest.objects.get(id=test_id, school=school)
        except OnlineTest.DoesNotExist:
            return Response({"detail": "Test not found."}, status=404)

        if test.status == "closed":
            return Response({"detail": "Already closed."}, status=400)
        test.status = "closed"
        test.save(update_fields=["status"])
        return Response({"detail": "Test closed."})


# ── Admin: Questions ───────────────────────────────────────────────────────────

class AdminTestQuestionListView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_test(self, request, test_id):
        from apps.assessments.models import OnlineTest

        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            return OnlineTest.objects.get(id=test_id, school=school), None
        except OnlineTest.DoesNotExist:
            return None, Response({"detail": "Test not found."}, status=404)

    def get(self, request, test_id):
        from apps.assessments.serializers import TestQuestionSerializer

        test, err = self._get_test(request, test_id)
        if err:
            return err
        return Response(TestQuestionSerializer(test.questions.all(), many=True).data)

    def post(self, request, test_id):
        from apps.assessments.models import TestQuestion
        from apps.assessments.serializers import TestQuestionSerializer, TestQuestionWriteSerializer

        test, err = self._get_test(request, test_id)
        if err:
            return err
        if test.status != "draft":
            return Response({"detail": "Questions can only be added to draft tests."}, status=400)

        serializer = TestQuestionWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        # Auto-assign order if not provided
        if "order" not in serializer.validated_data or serializer.validated_data["order"] == 0:
            last = test.questions.order_by("-order").first()
            serializer.validated_data["order"] = (last.order + 1) if last else 1

        question = TestQuestion.objects.create(test=test, **serializer.validated_data)
        return Response(TestQuestionSerializer(question).data, status=201)


class AdminTestQuestionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_question(self, request, test_id, question_id):
        from apps.assessments.models import OnlineTest, TestQuestion

        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            test = OnlineTest.objects.get(id=test_id, school=school)
        except OnlineTest.DoesNotExist:
            return None, Response({"detail": "Test not found."}, status=404)
        try:
            return TestQuestion.objects.get(id=question_id, test=test), None
        except TestQuestion.DoesNotExist:
            return None, Response({"detail": "Question not found."}, status=404)

    def get(self, request, test_id, question_id):
        from apps.assessments.serializers import TestQuestionSerializer

        question, err = self._get_question(request, test_id, question_id)
        if err:
            return err
        return Response(TestQuestionSerializer(question).data)

    def patch(self, request, test_id, question_id):
        from apps.assessments.serializers import TestQuestionSerializer, TestQuestionWriteSerializer

        question, err = self._get_question(request, test_id, question_id)
        if err:
            return err
        if question.test.status != "draft":
            return Response({"detail": "Questions can only be edited on draft tests."}, status=400)

        serializer = TestQuestionWriteSerializer(question, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(TestQuestionSerializer(question).data)

    def delete(self, request, test_id, question_id):
        question, err = self._get_question(request, test_id, question_id)
        if err:
            return err
        if question.test.status != "draft":
            return Response({"detail": "Questions can only be deleted from draft tests."}, status=400)
        question.delete()
        return Response(status=204)


# ── Admin: Results ─────────────────────────────────────────────────────────────

class AdminTestResultsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, test_id):
        from apps.assessments.models import OnlineTest, TestResult
        from apps.assessments.serializers import TestResultSerializer

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        try:
            test = OnlineTest.objects.get(id=test_id, school=school)
        except OnlineTest.DoesNotExist:
            return Response({"detail": "Test not found."}, status=404)

        results = TestResult.objects.filter(test=test).select_related("student").prefetch_related("proctoring_events")
        return Response(TestResultSerializer(results, many=True).data)


class AdminResultDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_result(self, request, result_id):
        from apps.assessments.models import TestResult

        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            return TestResult.objects.get(id=result_id, school=school), None
        except TestResult.DoesNotExist:
            return None, Response({"detail": "Result not found."}, status=404)

    def get(self, request, result_id):
        from apps.assessments.serializers import TestResultDetailSerializer

        result, err = self._get_result(request, result_id)
        if err:
            return err
        return Response(TestResultDetailSerializer(result).data)


class AdminResultPublishView(APIView):
    """Mark a result as visible to the parent and push a notification."""
    permission_classes = [IsAuthenticated]

    def post(self, request, result_id):
        from apps.assessments.models import TestResult
        from apps.assessments.tasks import notify_result_published

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        try:
            result = TestResult.objects.get(id=result_id, school=school)
        except TestResult.DoesNotExist:
            return Response({"detail": "Result not found."}, status=404)

        if result.is_published:
            return Response({"detail": "Already published."}, status=400)

        result.is_published = True
        result.save(update_fields=["is_published"])
        notify_result_published.delay(result.id)
        return Response({"detail": "Result published."})


# ── Teacher: Test overview ─────────────────────────────────────────────────────

class TeacherTestListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.academics.models import ClassSession
        from apps.accounts.models import TeacherProfile
        from apps.assessments.models import OnlineTest
        from apps.assessments.serializers import OnlineTestListSerializer

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)

        # Resolve classrooms the requesting teacher is assigned to
        classroom_ids = []
        try:
            teacher = TeacherProfile.objects.get(user=request.user)
            classroom_ids = list(
                ClassSession.objects.filter(teacher=teacher, is_active=True)
                .values_list("classroom_id", flat=True)
                .distinct()
            )
        except Exception:
            pass

        qs = OnlineTest.objects.filter(
            school=school, classrooms__id__in=classroom_ids
        ).distinct().order_by("-available_from")

        return Response(OnlineTestListSerializer(qs, many=True).data)


class TeacherTestResultsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, test_id):
        from apps.academics.models import ClassSession
        from apps.accounts.models import TeacherProfile
        from apps.assessments.models import OnlineTest, TestResult
        from apps.assessments.serializers import TestResultSerializer

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        try:
            test = OnlineTest.objects.get(id=test_id, school=school)
        except OnlineTest.DoesNotExist:
            return Response({"detail": "Test not found."}, status=404)

        results = TestResult.objects.filter(test=test).select_related("student").prefetch_related("proctoring_events")
        return Response(TestResultSerializer(results, many=True).data)


# ── Parent: Test access ────────────────────────────────────────────────────────

class ParentStudentTestListView(APIView):
    """List upcoming/active tests for a specific student."""
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        from apps.academics.models import Student, StudentParentLink
        from apps.accounts.models import ParentProfile
        from apps.assessments.models import OnlineTest, StudentTestToken
        from apps.assessments.serializers import TestAccessSerializer

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)

        # Verify parent is linked to this student
        try:
            parent = ParentProfile.objects.get(user=request.user)
        except ParentProfile.DoesNotExist:
            return Response({"detail": "Parent profile not found."}, status=403)

        linked = StudentParentLink.objects.filter(parent=parent, student_id=student_id).exists()
        if not linked:
            return Response({"detail": "Not authorised for this student."}, status=403)

        now = timezone.now()
        tokens = StudentTestToken.objects.filter(
            student_id=student_id,
            test__school=school,
            test__status=OnlineTest.Status.PUBLISHED,
            expires_at__gte=now,
        ).select_related("test__subject")

        return Response(TestAccessSerializer(tokens, many=True).data)


class ParentStudentTestAccessView(APIView):
    """Allocate a pod for a student and return the exam URL.

    Idempotent: if a pod is already allocated, returns the existing URL.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, student_id, test_id):
        from apps.academics.models import Student, StudentParentLink
        from apps.accounts.models import ParentProfile
        from apps.assessments.models import OnlineTest, StudentTestToken
        from apps.assessments.services import allocate_pod

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)

        # Auth: verify parent → student link
        try:
            parent = ParentProfile.objects.get(user=request.user)
        except ParentProfile.DoesNotExist:
            return Response({"detail": "Parent profile not found."}, status=403)

        if not StudentParentLink.objects.filter(parent=parent, student_id=student_id).exists():
            return Response({"detail": "Not authorised for this student."}, status=403)

        try:
            test = OnlineTest.objects.get(id=test_id, school=school, status=OnlineTest.Status.PUBLISHED)
        except OnlineTest.DoesNotExist:
            return Response({"detail": "Test not found or not available."}, status=404)

        now = timezone.now()
        if now < test.available_from:
            return Response({"detail": "Test has not started yet."}, status=400)
        if now > test.available_until:
            return Response({"detail": "Test window has closed."}, status=400)

        try:
            token = StudentTestToken.objects.get(test=test, student_id=student_id)
        except StudentTestToken.DoesNotExist:
            return Response({"detail": "No access token found for this student."}, status=404)

        if token.is_used:
            return Response({"detail": "This test has already been submitted."}, status=400)

        # Return existing pod allocation if already done
        if token.pod_url and token.session_id:
            exam_url = _build_exam_url(token.pod_url, token.token, token.session_id, test.id)
            return Response({
                "exam_url":     exam_url,
                "pod_url":      token.pod_url,
                "session_id":   str(token.session_id),
                "access_token": str(token.token),
            })

        # Allocate a new pod via loadbalancer
        lb_resp = allocate_pod(
            test_id=str(test.id),
            student_id=student_id,
            access_token=str(token.token),
        )

        if not lb_resp.get("pod_url"):
            log.error("Loadbalancer returned no pod_url for test %s student %s", test.id, student_id)
            return Response({"detail": "Could not allocate an exam server. Please try again shortly."}, status=503)

        token.pod_url = lb_resp["pod_url"]
        token.session_id = lb_resp.get("session_id")
        token.save(update_fields=["pod_url", "session_id"])

        # Include session_id and test_id as query params so the exam-engine
        # can initialise the session without a separate token-lookup call.
        exam_url = _build_exam_url(token.pod_url, token.token, token.session_id, test.id)
        return Response({
            "exam_url":     exam_url,
            "pod_url":      token.pod_url,
            "session_id":   str(token.session_id),
            "access_token": str(token.token),
        })


# ── Webhook: Receive results from exam-engine ─────────────────────────────────

class WebhookResultsView(APIView):
    permission_classes = [permissions.AllowAny]

    def _verify_secret(self, request) -> bool:
        expected = getattr(settings, "EXAM_WEBHOOK_SECRET", "")
        if not expected:
            return True  # secret not configured in dev
        received = request.headers.get("X-Webhook-Secret", "")
        return hmac.compare_digest(expected, received)

    def post(self, request):
        from apps.assessments.models import (
            OnlineTest, ProctoringLog, StudentTestToken, TestResult,
        )
        from apps.assessments.tasks import notify_teacher_result_received
        from apps.assessments.services import release_session

        if not self._verify_secret(request):
            return Response({"detail": "Forbidden."}, status=403)

        data = request.data
        access_token = data.get("access_token")
        if not access_token:
            return Response({"detail": "access_token is required."}, status=400)

        try:
            token = StudentTestToken.objects.select_related("test", "student").get(
                token=access_token
            )
        except (StudentTestToken.DoesNotExist, ValueError, ValidationError):
            return Response({"detail": "Invalid access token."}, status=404)

        # Idempotency: ignore duplicate webhook deliveries
        if hasattr(token, "result"):
            return Response({"detail": "Already recorded."}, status=200)

        score     = float(data.get("score", 0))
        max_score = float(data.get("max_score", token.test.total_points or 1))
        percentage = (score / max_score * 100) if max_score else 0

        completed_at = _parse_aware(data.get("completed_at"))

        result = TestResult.objects.create(
            school=token.school,
            test=token.test,
            student=token.student,
            token=token,
            score=score,
            max_score=max_score,
            percentage=percentage,
            time_taken_seconds=int(data.get("time_taken_seconds", 0)),
            completion_reason=data.get("completion_reason", TestResult.CompletionReason.SUBMITTED),
            answers=data.get("answers", []),
            completed_at=completed_at,
        )

        # Save individual proctoring anomaly events
        proctoring_events = data.get("proctoring_events", [])
        if proctoring_events:
            ProctoringLog.objects.bulk_create([
                ProctoringLog(
                    result=result,
                    event_type=e.get("type", "looking_away"),
                    severity=e.get("severity", ProctoringLog.Severity.WARNING),
                    occurred_at=_parse_aware(e.get("timestamp")),
                )
                for e in proctoring_events
            ])

        token.is_used = True
        token.used_at = timezone.now()
        token.save(update_fields=["is_used", "used_at"])

        # Release the pod session slot (best-effort)
        if token.session_id:
            release_session(str(token.session_id))

        # Async: notify teacher
        notify_teacher_result_received.delay(result.id)

        return Response({"detail": "Result recorded.", "result_id": result.id}, status=201)
