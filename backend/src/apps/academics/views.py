from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.demo_state import (
    add_comment,
    list_assist_requests,
    list_broadcasts,
    list_classrooms,
    mark_attendance,
    parent_report,
    resolve_assist_request,
    save_schedule_preferences,
    send_broadcast,
    teacher_dashboard,
)


# ── Module health ─────────────────────────────────────────────────────────────

class AcademicsRootView(APIView):
    """Liveness probe for the academics module."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "academics", "status": "ready", "mode": "demo"})


# ── Teacher schedule & roster ─────────────────────────────────────────────────

class TeacherScheduleView(APIView):
    """Return just the session schedule (no roster) for the requesting teacher."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"results": teacher_dashboard()["schedule"]})


class TeacherDashboardView(APIView):
    """Return the full teacher dashboard: schedule + roster + daily preview."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(teacher_dashboard())


class ClassRosterView(APIView):
    """Return the student roster for a specific class session."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, class_session_id: int):
        dashboard = teacher_dashboard()
        session = next((item for item in dashboard["schedule"] if item["id"] == class_session_id), None)
        if session is None:
            return Response({"detail": "Class session not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"session": session, "results": dashboard["roster"]})


# ── Attendance ────────────────────────────────────────────────────────────────

class MarkAttendanceView(APIView):
    """Mark a student present or absent for a class session.

    POST body (optional):
        is_present (bool, default true) – false to record an absence.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, class_session_id: int, student_id: int):
        # Accept explicit is_present flag; default to True (mark present)
        raw = request.data.get("is_present", True)
        is_present = raw if isinstance(raw, bool) else str(raw).lower() not in {"false", "0", "no"}

        result = mark_attendance(class_session_id, student_id, is_present=is_present)
        if result is None:
            return Response({"detail": "Attendance target not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(result, status=status.HTTP_201_CREATED)


# ── Progress notes ────────────────────────────────────────────────────────────

class AddStudentCommentView(APIView):
    """Add a teacher progress note for a student, visible immediately in the parent app.

    POST body:
        note     (str, required) – the note text.
        category (str, optional) – one of academic / participation / behavior /
                                   homework / milestone / concern.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, class_session_id: int, student_id: int):
        note = request.data.get("note", "").strip()
        category = request.data.get("category", "teacher_comment")
        if not note:
            return Response({"detail": "A comment is required."}, status=status.HTTP_400_BAD_REQUEST)

        progress = add_comment(class_session_id, student_id, note=note, category=category)
        if progress is None:
            return Response({"detail": "Comment target not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(progress, status=status.HTTP_201_CREATED)


# ── Class-wide broadcasts ─────────────────────────────────────────────────────

class ClassBroadcastView(APIView):
    """Send a broadcast message to all parents in a class session, or list past ones.

    GET  – returns broadcasts sent for this session, newest first.
    POST – sends a new broadcast.

    POST body:
        message (str, required) – the text to broadcast.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, class_session_id: int):
        return Response({"results": list_broadcasts(class_session_id)})

    def post(self, request, class_session_id: int):
        message = request.data.get("message", "").strip()
        if not message:
            return Response({"detail": "A message is required."}, status=status.HTTP_400_BAD_REQUEST)

        broadcast = send_broadcast(class_session_id, message)
        if broadcast is None:
            return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(broadcast, status=status.HTTP_201_CREATED)


# ── Assist requests ───────────────────────────────────────────────────────────

class AssistRequestListView(APIView):
    """List all pending assist requests raised by parents for a class session.

    Teachers see these inside each student card on the Attendance screen.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, class_session_id: int):
        return Response({"results": list_assist_requests(class_session_id)})


class ResolveAssistRequestView(APIView):
    """Mark an assist request as resolved, optionally storing the teacher's reply.

    POST body:
        reply (str, optional) – a short message sent back to the parent.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, request_id: int):
        reply = request.data.get("reply", "").strip()
        result = resolve_assist_request(request_id, reply=reply)
        if result is None:
            return Response({"detail": "Assist request not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(result, status=status.HTTP_200_OK)


# ── Class picker ──────────────────────────────────────────────────────────────

class ClassroomListView(APIView):
    """Return all classrooms available for the teacher class-picker feature.

    Used when a teacher is verbally assigned to a different class and needs to
    override their scheduled session with a manually selected classroom.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"results": list_classrooms()})


# ── Schedule preferences (first-week setup) ───────────────────────────────────

class SchedulePreferencesView(APIView):
    """Save the teacher's first-week classroom selections as their recurring schedule.

    Called once after the teacher completes the first-week class-selection flow.
    From the next week onwards the backend generates ClassSession records from
    these preferences so the teacher's schedule is pre-populated automatically.

    POST body:
        classroom_ids (list[int], required) – IDs of classrooms the teacher teaches.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        classroom_ids = request.data.get("classroom_ids", [])
        if not isinstance(classroom_ids, list) or not classroom_ids:
            return Response(
                {"detail": "classroom_ids must be a non-empty list of integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        prefs = save_schedule_preferences(classroom_ids)
        return Response(prefs, status=status.HTTP_200_OK)


# ── Parent report ─────────────────────────────────────────────────────────────

class ParentStudentReportView(APIView):
    """Return unread progress notes and daily reports for a parent's student."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, student_id: int):
        return Response(parent_report(student_id))
