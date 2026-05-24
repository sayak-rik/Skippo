from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academics.models import Student
from apps.dismissal.models import DismissalIntent


def _get_queue(school_id: int) -> dict:
    """Build the dismissal queue snapshot for a school."""
    intents = DismissalIntent.objects.filter(
        school_id=school_id, status__in=["pending", "notified"]
    ).select_related("student", "parent__user").order_by("created_at")
    return {
        "queue": [
            {
                "id": i.id,
                "studentId": i.student.id,
                "studentName": i.student.full_name,
                "etaMinutes": i.eta_minutes,
                "status": i.status,
                "createdAt": str(i.created_at),
            }
            for i in intents
        ],
        "count": intents.count(),
    }


def _broadcast_queue(school_id: int) -> None:
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    payload = _get_queue(school_id)
    async_to_sync(channel_layer.group_send)(
        f"dismissal_{school_id}",
        {"type": "dismissal.update", "payload": payload},
    )


class DismissalRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "dismissal", "status": "ready", "mode": "live"})


class DismissalIntentView(APIView):
    """POST /api/dismissal/intent/  — parent signals they are on the way."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        student_id = request.data.get("student_id")
        eta_minutes = request.data.get("eta_minutes", 5)
        try:
            student_id = int(student_id)
            eta_minutes = int(eta_minutes)
        except (TypeError, ValueError):
            return Response(
                {"detail": "student_id and eta_minutes must be integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student = Student.objects.filter(id=student_id).select_related("school").first()
        if not student:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        # Upsert: if a pending intent already exists, update it
        parent = None
        if request.user and request.user.is_authenticated:
            from apps.accounts.models import ParentProfile
            parent = ParentProfile.objects.filter(user=request.user).first()

        intent, _ = DismissalIntent.objects.update_or_create(
            school=student.school,
            student=student,
            status=DismissalIntent.Status.PENDING,
            defaults={"eta_minutes": eta_minutes, "parent": parent},
        )
        _broadcast_queue(student.school_id)
        return Response(
            {
                "intent": {
                    "id": intent.id,
                    "studentId": student_id,
                    "etaMinutes": eta_minutes,
                    "status": intent.status,
                }
            },
            status=status.HTTP_201_CREATED,
        )

    def get(self, request):
        """GET /api/dismissal/intent/?student_id=1  — fetch current intent for a student."""
        student_id = request.query_params.get("student_id")
        try:
            student_id = int(student_id)
        except (TypeError, ValueError):
            return Response({"detail": "Invalid student_id."}, status=status.HTTP_400_BAD_REQUEST)

        intent = DismissalIntent.objects.filter(
            student_id=student_id, status__in=["pending", "notified"]
        ).order_by("-created_at").first()
        if intent is None:
            return Response({"intent": None})
        return Response(
            {
                "intent": {
                    "id": intent.id,
                    "studentId": student_id,
                    "etaMinutes": intent.eta_minutes,
                    "status": intent.status,
                    "createdAt": str(intent.created_at),
                }
            }
        )


class DismissalQueueView(APIView):
    """GET /api/dismissal/queue/  — school dashboard fetches the live queue."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        school_id = request.query_params.get("school_id", 1)
        try:
            school_id = int(school_id)
        except (TypeError, ValueError):
            return Response({"detail": "Invalid school_id."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(_get_queue(school_id))


class DismissalReadyView(APIView):
    """POST /api/dismissal/ready/<student_id>/  — staff marks a child as ready."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, student_id: int):
        intent = DismissalIntent.objects.filter(
            student_id=student_id, status=DismissalIntent.Status.PENDING
        ).order_by("-created_at").first()
        if not intent:
            return Response(
                {"detail": "No pending pickup intent found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        intent.status = DismissalIntent.Status.NOTIFIED
        intent.notified_at = timezone.now()
        intent.save(update_fields=["status", "notified_at"])
        _broadcast_queue(intent.school_id)
        return Response({"intent": {"id": intent.id, "studentId": student_id, "status": intent.status}})


class DismissalCompleteView(APIView):
    """POST /api/dismissal/complete/<student_id>/  — parent confirms pickup done."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, student_id: int):
        intent = DismissalIntent.objects.filter(
            student_id=student_id,
            status__in=[DismissalIntent.Status.PENDING, DismissalIntent.Status.NOTIFIED],
        ).order_by("-created_at").first()
        if not intent:
            return Response(
                {"detail": "No active pickup intent found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        intent.status = DismissalIntent.Status.COMPLETED
        intent.completed_at = timezone.now()
        intent.save(update_fields=["status", "completed_at"])
        _broadcast_queue(intent.school_id)
        return Response({"intent": {"id": intent.id, "studentId": student_id, "status": intent.status}})
