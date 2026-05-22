import asyncio
import logging
import os

import httpx
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academics.models import Classroom, Student, StudentParentLink
from apps.tenancy.models import School

log = logging.getLogger(__name__)
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


def _school(request) -> School:
    return School.objects.get(slug=request.tenant_slug)


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


# ── AI Teaching Assistant ─────────────────────────────────────────────────────

def _resolve_teacher(request):
    """Return the authenticated teacher profile, or the first one in dev/demo mode."""
    from apps.accounts.models import TeacherProfile
    if hasattr(request, "user") and request.user.is_authenticated:
        return TeacherProfile.objects.filter(user=request.user).first()
    return TeacherProfile.objects.first()


class AITokenStatusView(APIView):
    """Return how many AI tokens the teacher has used and remaining today."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.academics.services.ai_assistant import remaining_tokens
        teacher = _resolve_teacher(request)
        if not teacher:
            return Response({"used": 0, "limit": 5, "remaining": 5})
        return Response(remaining_tokens(teacher))


class AILessonPlanView(APIView):
    """Generate an AI lesson plan for a given subject + topic.

    POST body:
        subject          (str, required)
        topic            (str, required)
        duration_minutes (int, optional, default 45)
        classroom_id     (int, optional)
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from apps.academics.models import Classroom
        from apps.academics.services.ai_assistant import TokenLimitExceeded, generate_lesson_plan

        teacher = _resolve_teacher(request)
        if not teacher:
            return Response({"detail": "No teacher profile found."}, status=status.HTTP_404_NOT_FOUND)

        subject = request.data.get("subject", "").strip()
        topic   = request.data.get("topic", "").strip()
        if not subject or not topic:
            return Response({"detail": "subject and topic are required."}, status=status.HTTP_400_BAD_REQUEST)

        duration  = int(request.data.get("duration_minutes", 45))
        cls_id    = request.data.get("classroom_id")
        classroom = None
        if cls_id:
            classroom = Classroom.objects.filter(pk=cls_id).first()

        try:
            result = asyncio.run(generate_lesson_plan(teacher, subject, topic, duration, classroom))
        except TokenLimitExceeded as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except Exception as exc:
            return Response({"detail": f"AI error: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(result, status=status.HTTP_201_CREATED)


class AIClassSummaryView(APIView):
    """Generate an AI class summary with weak-student and revision-topic suggestions.

    POST body:
        classroom_id (int, required)
        date         (str YYYY-MM-DD, optional — defaults to today)
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from datetime import date
        from apps.academics.models import Classroom
        from apps.academics.services.ai_assistant import TokenLimitExceeded, generate_class_summary

        teacher = _resolve_teacher(request)
        if not teacher:
            return Response({"detail": "No teacher profile found."}, status=status.HTTP_404_NOT_FOUND)

        cls_id = request.data.get("classroom_id")
        if not cls_id:
            return Response({"detail": "classroom_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        classroom = Classroom.objects.filter(pk=cls_id).first()
        if not classroom:
            return Response({"detail": "Classroom not found."}, status=status.HTTP_404_NOT_FOUND)

        raw_date     = request.data.get("date")
        session_date = date.fromisoformat(raw_date) if raw_date else date.today()

        try:
            result = asyncio.run(generate_class_summary(teacher, classroom, session_date))
        except TokenLimitExceeded as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except Exception as exc:
            return Response({"detail": f"AI error: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(result, status=status.HTTP_201_CREATED)


class AIVoiceObservationView(APIView):
    """Log a voice observation transcript; AI structures it and saves as a student note.

    POST body:
        transcript   (str, required) — raw text from speech-to-text
        student_id   (int, optional)
        classroom_id (int, optional)
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from apps.academics.models import Classroom, Student
        from apps.academics.services.ai_assistant import TokenLimitExceeded, log_voice_observation

        teacher = _resolve_teacher(request)
        if not teacher:
            return Response({"detail": "No teacher profile found."}, status=status.HTTP_404_NOT_FOUND)

        transcript = request.data.get("transcript", "").strip()
        if not transcript:
            return Response({"detail": "transcript is required."}, status=status.HTTP_400_BAD_REQUEST)

        student_id   = request.data.get("student_id")
        classroom_id = request.data.get("classroom_id")
        student      = Student.objects.filter(pk=student_id).first() if student_id else None
        classroom    = Classroom.objects.filter(pk=classroom_id).first() if classroom_id else None

        try:
            result = asyncio.run(log_voice_observation(teacher, transcript, student, classroom))
        except TokenLimitExceeded as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except Exception as exc:
            return Response({"detail": f"AI error: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(result, status=status.HTTP_201_CREATED)


# ── Admin: classroom + student management ─────────────────────────────────────

class AdminClassroomListView(APIView):
    """Admin: list all classrooms with student counts.

    GET /api/academics/admin/classrooms/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=status.HTTP_404_NOT_FOUND)

        classrooms = (
            Classroom.objects
            .filter(school=school)
            .select_related("teacher__user")
            .order_by("name", "section")
        )

        results = []
        for cls in classrooms:
            teacher_name = ""
            if cls.teacher and cls.teacher.user:
                teacher_name = cls.teacher.user.get_full_name() or cls.teacher.user.email
            student_count = Student.objects.filter(school=school, classroom=cls).count()
            results.append({
                "id":            cls.id,
                "name":          cls.name,
                "section":       cls.section,
                "teacher":       teacher_name,
                "student_count": student_count,
            })

        return Response({"results": results})


class AdminStudentListView(APIView):
    """Admin: list students, optionally filtered by classroom.

    GET /api/academics/admin/students/?classroom_id=<id>
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=status.HTTP_404_NOT_FOUND)

        classroom_id = request.query_params.get("classroom_id")
        qs = Student.objects.filter(school=school).select_related("classroom")
        if classroom_id:
            qs = qs.filter(classroom_id=classroom_id)
        qs = qs.order_by("classroom__name", "roll_number", "full_name")

        results = []
        for s in qs:
            link = (
                StudentParentLink.objects
                .filter(student=s, is_primary=True)
                .select_related("parent__user")
                .first()
            )
            parent_name  = ""
            parent_phone = ""
            has_parent   = StudentParentLink.objects.filter(student=s).exists()
            if link:
                parent_name  = link.parent.user.get_full_name() or link.parent.user.email
                parent_phone = link.parent.phone

            results.append({
                "id":                    s.id,
                "name":                  s.full_name,
                "roll_number":           s.roll_number,
                "classroom_id":          s.classroom_id,
                "classroom_name":        s.classroom.name    if s.classroom else "",
                "classroom_section":     s.classroom.section if s.classroom else "",
                "parent_name":           parent_name,
                "parent_phone":          parent_phone,
                "has_parent":            has_parent,
                "pending_parent_phone":  s.pending_parent_phone,
                "pending_parent_name":   s.pending_parent_name,
            })

        return Response({"results": results})


class AdminStudentImportView(APIView):
    """Admin: bulk-import students via CSV / XLSX / PDF.

    POST /api/academics/admin/students/import/
    Content-Type: multipart/form-data
    Body: file=<upload>

    The file is forwarded to the LLM Service for intelligent extraction.
    Students and classrooms are created; duplicates are skipped.
    """

    parser_classes     = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    _MAX_SIZE = 50 * 1024 * 1024
    _ALLOWED  = {".csv", ".xlsx", ".xls", ".pdf"}
    _LLM_URL  = os.getenv("LLM_SERVICE_URL", "http://llm-service:8093")

    def post(self, request):
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=status.HTTP_404_NOT_FOUND)

        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"detail": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        if file_obj.size > self._MAX_SIZE:
            return Response(
                {"detail": "File too large. Maximum allowed size is 50 MB."},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        name = file_obj.name or ""
        ext  = ("." + name.rsplit(".", 1)[-1].lower()) if "." in name else ""
        if ext not in self._ALLOWED:
            return Response(
                {"detail": f"Unsupported file type '{ext}'. Allowed: CSV, XLSX, PDF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        file_bytes = file_obj.read()
        try:
            with httpx.Client(timeout=120.0) as client:
                resp = client.post(
                    f"{self._LLM_URL}/extract/students",
                    files={"file": (file_obj.name, file_bytes, "application/octet-stream")},
                )
            resp.raise_for_status()
            payload = resp.json()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.json().get("detail", str(exc)) if exc.response.content else str(exc)
            return Response({"detail": f"LLM Service error: {detail}"}, status=status.HTTP_502_BAD_GATEWAY)
        except httpx.RequestError as exc:
            log.error("LLM Service unreachable: %s", exc)
            return Response({"detail": "LLM Service is unavailable."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        students_data = payload.get("students", [])
        created_count = 0
        skipped_count = 0

        for s in students_data:
            full_name = (s.get("full_name") or "").strip()
            if not full_name:
                continue

            classroom     = None
            classroom_str = (s.get("classroom") or "").strip()
            if classroom_str:
                parts = classroom_str.rsplit("-", 1)
                if len(parts) == 2 and len(parts[1]) <= 2 and parts[1].isalpha():
                    cls_name    = parts[0].strip()
                    cls_section = parts[1].strip().upper()
                else:
                    cls_name    = classroom_str
                    cls_section = ""
                classroom, _ = Classroom.objects.get_or_create(
                    school=school, name=cls_name, section=cls_section
                )

            pending_phone = (s.get("parent_phone") or "").strip()
            pending_name  = (s.get("parent_name")  or "").strip()

            _, created = Student.objects.get_or_create(
                school=school,
                full_name=full_name,
                defaults={
                    "classroom":            classroom,
                    "roll_number":          (s.get("roll_number") or "").strip(),
                    "pending_parent_phone": pending_phone,
                    "pending_parent_name":  pending_name,
                },
            )
            if not created:
                skipped_count += 1
                continue
            created_count += 1

        return Response(
            {
                "success":           True,
                "students_found":    payload.get("students_found", len(students_data)),
                "students_imported": created_count,
                "skipped":           skipped_count,
                "truncated":         payload.get("truncated", False),
            },
            status=status.HTTP_200_OK,
        )
