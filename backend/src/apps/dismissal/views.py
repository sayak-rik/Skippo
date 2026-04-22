from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.demo_state import (
    complete_pickup,
    get_dismissal_queue,
    get_parent_intent,
    mark_child_ready,
    signal_arrival,
)


def _broadcast_queue(school_id: int = 1) -> None:
    """Push a fresh queue snapshot to all dashboard subscribers on this school."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    payload = get_dismissal_queue()
    async_to_sync(channel_layer.group_send)(
        f"dismissal_{school_id}",
        {"type": "dismissal.update", "payload": payload},
    )


class DismissalRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "dismissal", "status": "ready", "mode": "demo"})


class DismissalIntentView(APIView):
    """POST /api/dismissal/intent/  — parent signals they are on the way."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        student_id = request.data.get("student_id", 1)
        eta_minutes = request.data.get("eta_minutes", 5)

        try:
            student_id = int(student_id)
            eta_minutes = int(eta_minutes)
        except (TypeError, ValueError):
            return Response(
                {"detail": "student_id and eta_minutes must be integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        intent = signal_arrival(student_id, eta_minutes)
        _broadcast_queue()
        return Response({"intent": intent}, status=status.HTTP_201_CREATED)

    def get(self, request):
        """GET /api/dismissal/intent/?student_id=1  — fetch current intent for a student."""
        student_id = request.query_params.get("student_id", 1)
        try:
            student_id = int(student_id)
        except (TypeError, ValueError):
            return Response({"detail": "Invalid student_id."}, status=status.HTTP_400_BAD_REQUEST)

        intent = get_parent_intent(student_id)
        return Response({"intent": intent})


class DismissalQueueView(APIView):
    """GET /api/dismissal/queue/  — school dashboard fetches the live queue."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(get_dismissal_queue())


class DismissalReadyView(APIView):
    """POST /api/dismissal/ready/<student_id>/  — staff marks a child as ready."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, student_id: int):
        intent = mark_child_ready(student_id)
        if not intent:
            return Response(
                {"detail": "No pending pickup intent found for this student."},
                status=status.HTTP_404_NOT_FOUND,
            )
        _broadcast_queue()
        return Response({"intent": intent})


class DismissalCompleteView(APIView):
    """POST /api/dismissal/complete/<student_id>/  — parent confirms pickup done."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, student_id: int):
        intent = complete_pickup(student_id)
        if not intent:
            return Response(
                {"detail": "No active pickup intent found for this student."},
                status=status.HTTP_404_NOT_FOUND,
            )
        _broadcast_queue()
        return Response({"intent": intent})
