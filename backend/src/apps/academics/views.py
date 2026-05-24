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


def _school(request) -> School:
    return School.objects.get(slug=request.tenant_slug)


# ── Module health ─────────────────────────────────────────────────────────────

class AcademicsRootView(APIView):
    """Liveness probe for the academics module."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"module": "academics", "status": "ready", "mode": "live"})


# ── Teacher schedule & roster ─────────────────────────────────────────────────

class TeacherScheduleView(APIView):
    """Return just the session schedule (no roster) for the requesting teacher."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.utils import timezone
        from apps.academics.models import ClassSession

        today = timezone.now().date()
        sessions_qs = (
            ClassSession.objects
            .filter(weekday=today.isoweekday(), is_active=True)
            .select_related("classroom", "teacher__user", "school")
        )
        if request.user and request.user.is_authenticated:
            from apps.accounts.models import TeacherProfile
            try:
                teacher = TeacherProfile.objects.get(user=request.user)
                sessions_qs = sessions_qs.filter(teacher=teacher)
            except TeacherProfile.DoesNotExist:
                pass
        sessions_qs = sessions_qs.order_by("starts_at")[:20]
        results = [
            {
                "id": s.id,
                "title": s.title,
                "classroomId": s.classroom.id,
                "classroomName": s.classroom.name,
                "startsAt": str(s.starts_at),
                "endsAt": str(s.ends_at),
            }
            for s in sessions_qs
        ]
        return Response({"results": results})


class TeacherDashboardView(APIView):
    """Return the full teacher dashboard: schedule + roster + daily preview."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.utils import timezone
        from apps.academics.models import ClassSession

        today = timezone.now().date()
        sessions_qs = (
            ClassSession.objects
            .filter(weekday=today.isoweekday(), is_active=True)
            .select_related("classroom")
        )
        teacher = None
        if request.user and request.user.is_authenticated:
            from apps.accounts.models import TeacherProfile
            try:
                teacher = TeacherProfile.objects.get(user=request.user)
                sessions_qs = sessions_qs.filter(teacher=teacher)
            except TeacherProfile.DoesNotExist:
                pass

        schedule = [
            {
                "id": s.id,
                "title": s.title,
                "classroomName": s.classroom.name,
                "startsAt": str(s.starts_at),
                "endsAt": str(s.ends_at),
            }
            for s in sessions_qs.order_by("starts_at")
        ]

        roster = []
        if teacher:
            classroom_ids = sessions_qs.values_list("classroom_id", flat=True)
            for student in Student.objects.filter(classroom_id__in=classroom_ids).order_by("full_name")[:50]:
                roster.append({
                    "id": student.id,
                    "name": student.full_name,
                    "classroomId": student.classroom_id,
                })

        return Response({"schedule": schedule, "roster": roster, "dailyPreview": []})


class ClassRosterView(APIView):
    """Return the student roster for a specific class session."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, class_session_id: int):
        from apps.academics.models import ClassSession

        session = (
            ClassSession.objects
            .filter(id=class_session_id)
            .select_related("classroom")
            .first()
        )
        if not session:
            return Response({"detail": "Class session not found."}, status=status.HTTP_404_NOT_FOUND)

        students = Student.objects.filter(classroom=session.classroom).order_by("full_name")
        results = [
            {"id": s.id, "name": s.full_name, "rollNumber": s.roll_number}
            for s in students
        ]
        return Response({
            "session": {
                "id": session.id,
                "title": session.title,
                "classroomName": session.classroom.name,
            },
            "results": results,
        })


# ── Attendance ────────────────────────────────────────────────────────────────

class MarkAttendanceView(APIView):
    """Mark a student present or absent for a class session.

    POST body (optional):
        is_present (bool, default true) – false to record an absence.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, class_session_id: int, student_id: int):
        from django.utils import timezone
        from apps.academics.models import ClassSession, StudentAttendance

        # Accept explicit is_present flag; default to True (mark present)
        raw = request.data.get("is_present", True)
        is_present = raw if isinstance(raw, bool) else str(raw).lower() not in {"false", "0", "no"}

        session = (
            ClassSession.objects
            .filter(id=class_session_id)
            .select_related("school", "classroom")
            .first()
        )
        if not session:
            return Response({"detail": "Class session not found."}, status=status.HTTP_404_NOT_FOUND)

        student = Student.objects.filter(id=student_id).first()
        if not student:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()
        attendance, _ = StudentAttendance.objects.update_or_create(
            school=session.school,
            student=student,
            session=session,
            date=today,
            defaults={
                "is_present": is_present,
                "classroom": session.classroom,
                "event_type": "present" if is_present else "absent",
            },
        )
        return Response(
            {
                "id": attendance.id,
                "studentId": student_id,
                "isPresent": attendance.is_present,
                "date": str(attendance.date),
            },
            status=status.HTTP_201_CREATED,
        )


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
        from apps.academics.models import ClassSession, StudentProgress

        note = request.data.get("note", "").strip()
        category = request.data.get("category", "teacher_comment")
        if not note:
            return Response({"detail": "A comment is required."}, status=status.HTTP_400_BAD_REQUEST)

        session = (
            ClassSession.objects
            .filter(id=class_session_id)
            .select_related("school", "classroom", "teacher")
            .first()
        )
        if not session:
            return Response({"detail": "Class session not found."}, status=status.HTTP_404_NOT_FOUND)

        student = Student.objects.filter(id=student_id).first()
        if not student:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        progress = StudentProgress.objects.create(
            school=session.school,
            student=student,
            classroom=session.classroom,
            session=session,
            teacher=session.teacher,
            category=category,
            note=note,
        )
        return Response(
            {
                "id": progress.id,
                "studentId": student_id,
                "category": progress.category,
                "note": progress.note,
                "createdAt": str(progress.created_at),
            },
            status=status.HTTP_201_CREATED,
        )


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
        from apps.academics.models import ClassBroadcast

        broadcasts = (
            ClassBroadcast.objects
            .filter(session_id=class_session_id)
            .select_related("teacher__user")
            .order_by("-created_at")[:50]
        )
        results = [
            {"id": b.id, "message": b.message, "createdAt": str(b.created_at)}
            for b in broadcasts
        ]
        return Response({"results": results})

    def post(self, request, class_session_id: int):
        from apps.academics.models import ClassBroadcast, ClassSession, StudentParentLink
        from common.sms import send_sms

        message = request.data.get("message", "").strip()
        if not message:
            return Response({"detail": "A message is required."}, status=status.HTTP_400_BAD_REQUEST)

        session = (
            ClassSession.objects
            .filter(id=class_session_id)
            .select_related("school", "classroom", "teacher")
            .first()
        )
        if not session:
            return Response({"detail": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        broadcast = ClassBroadcast.objects.create(
            school=session.school,
            session=session,
            classroom=session.classroom,
            teacher=session.teacher,
            message=message,
        )

        # Send SMS/notification to parents of students in this classroom
        for student in Student.objects.filter(classroom=session.classroom):
            for link in (
                StudentParentLink.objects
                .filter(student=student, is_primary=True)
                .select_related("parent")
            ):
                if link.parent.phone:
                    send_sms(
                        to=link.parent.phone,
                        message=f"Skippo: Message from {session.title} class – {message[:100]}",
                    )

        return Response(
            {
                "id": broadcast.id,
                "message": broadcast.message,
                "createdAt": str(broadcast.created_at),
            },
            status=status.HTTP_201_CREATED,
        )


# ── Assist requests ───────────────────────────────────────────────────────────

class AssistRequestListView(APIView):
    """List all pending assist requests raised by parents for a class session.

    Teachers see these inside each student card on the Attendance screen.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, class_session_id: int):
        from apps.academics.models import AssistRequest

        requests = (
            AssistRequest.objects
            .filter(session_id=class_session_id, status="pending")
            .select_related("student")
            .order_by("-created_at")
        )
        results = [
            {
                "id": r.id,
                "studentId": r.student.id,
                "studentName": r.student.full_name,
                "question": r.question,
                "createdAt": str(r.created_at),
            }
            for r in requests
        ]
        return Response({"results": results})


class ResolveAssistRequestView(APIView):
    """Mark an assist request as resolved, optionally storing the teacher's reply.

    POST body:
        reply (str, optional) – a short message sent back to the parent.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, request_id: int):
        from django.utils import timezone
        from apps.academics.models import AssistRequest

        reply = request.data.get("reply", "").strip()
        req = AssistRequest.objects.filter(id=request_id).first()
        if not req:
            return Response({"detail": "Assist request not found."}, status=status.HTTP_404_NOT_FOUND)

        req.status = "resolved"
        req.teacher_reply = reply
        req.resolved_at = timezone.now()
        req.save()
        return Response({"id": req.id, "status": req.status, "reply": req.teacher_reply})


# ── Class picker ──────────────────────────────────────────────────────────────

class ClassroomListView(APIView):
    """Return all classrooms available for the teacher class-picker feature.

    Used when a teacher is verbally assigned to a different class and needs to
    override their scheduled session with a manually selected classroom.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        classrooms = Classroom.objects.all().select_related("school").order_by("name")[:100]
        results = [
            {
                "id": c.id,
                "name": c.name,
                "section": c.section,
                "schoolSlug": c.school.slug,
            }
            for c in classrooms
        ]
        return Response({"results": results})


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
        from apps.accounts.models import TeacherProfile

        if not (request.user and request.user.is_authenticated):
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            teacher = TeacherProfile.objects.get(user=request.user)
        except TeacherProfile.DoesNotExist:
            return Response({"detail": "Teacher profile not found."}, status=status.HTTP_404_NOT_FOUND)

        teacher.schedule_preferences = request.data
        teacher.save(update_fields=["schedule_preferences"])
        return Response({"detail": "Preferences saved.", "preferences": teacher.schedule_preferences})


# ── Parent report ─────────────────────────────────────────────────────────────

class ParentStudentReportView(APIView):
    """Return unread progress notes and daily reports for a parent's student."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, student_id: int):
        from apps.academics.models import StudentProgress

        unread_qs = (
            StudentProgress.objects
            .filter(student_id=student_id, is_read_by_parent=False)
            .order_by("-created_at")
        )
        unread_count = unread_qs.count()
        unread_preview = [
            {
                "id": p.id,
                "category": p.category,
                "note": p.note,
                "createdAt": str(p.created_at),
            }
            for p in unread_qs[:3]
        ]
        return Response({
            "unread_comment_count": unread_count,
            "unread_comments_preview": unread_preview,
            "daily_reports": [],
        })


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


class AdminParentInviteView(APIView):
    """Admin: send SMS invites to parents of students without a linked account.

    POST /api/academics/admin/students/send-invites/

    Optional body:
        student_ids (list[int]) – if omitted, invites all no-parent students
                                  with a pending_parent_phone.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        from common.sms import get_app_link, send_sms

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=status.HTTP_404_NOT_FOUND)

        student_ids = request.data.get("student_ids")
        qs = (
            Student.objects
            .filter(school=school, pending_parent_phone__isnull=False)
            .exclude(pending_parent_phone="")
        )
        if student_ids:
            qs = qs.filter(id__in=student_ids)

        # Exclude students that already have a parent linked
        linked_ids = set(
            StudentParentLink.objects
            .filter(student__in=qs)
            .values_list("student_id", flat=True)
        )
        targets = [s for s in qs if s.id not in linked_ids]

        if not targets:
            return Response({"sent": 0, "failed": 0, "detail": "No eligible students."})

        app_link = get_app_link()
        sent = 0
        failed = 0

        for student in targets:
            parent_name = student.pending_parent_name or "Parent"
            message = (
                f"Hi {parent_name}! {student.full_name} has been enrolled at school. "
                f"Download the Skippo Parent app to stay connected: {app_link}"
            )
            ok = send_sms(student.pending_parent_phone, message)
            if ok:
                sent += 1
            else:
                failed += 1

        return Response({"sent": sent, "failed": failed})


# ── Admin: Academic Years ──────────────────────────────────────────────────────

class AdminAcademicYearListView(APIView):
    """GET list / POST create academic years for the school."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.academics.serializers import AcademicYearSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        from apps.academics.models import AcademicYear
        years = AcademicYear.objects.filter(school=school).prefetch_related("sessions")
        return Response(AcademicYearSerializer(years, many=True).data)

    def post(self, request):
        from apps.academics.serializers import AcademicYearWriteSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        ser = AcademicYearWriteSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        from apps.academics.models import AcademicYear
        if ser.validated_data.get("is_current"):
            AcademicYear.objects.filter(school=school, is_current=True).update(is_current=False)
        year = ser.save(school=school)
        from apps.academics.serializers import AcademicYearSerializer
        return Response(AcademicYearSerializer(year).data, status=201)


class AdminAcademicYearDetailView(APIView):
    """GET / PATCH / DELETE a single academic year."""
    permission_classes = [IsAuthenticated]

    def _get(self, request, year_id):
        from apps.academics.models import AcademicYear
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            return AcademicYear.objects.get(id=year_id, school=school), None
        except AcademicYear.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=404)

    def get(self, request, year_id):
        obj, err = self._get(request, year_id)
        if err:
            return err
        from apps.academics.serializers import AcademicYearSerializer
        return Response(AcademicYearSerializer(obj).data)

    def patch(self, request, year_id):
        obj, err = self._get(request, year_id)
        if err:
            return err
        from apps.academics.serializers import AcademicYearWriteSerializer
        from apps.academics.models import AcademicYear
        ser = AcademicYearWriteSerializer(obj, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        if ser.validated_data.get("is_current"):
            AcademicYear.objects.filter(school=obj.school, is_current=True).exclude(id=obj.id).update(is_current=False)
        obj = ser.save()
        from apps.academics.serializers import AcademicYearSerializer
        return Response(AcademicYearSerializer(obj).data)

    def delete(self, request, year_id):
        obj, err = self._get(request, year_id)
        if err:
            return err
        obj.delete()
        return Response(status=204)


class AdminAcademicYearSetCurrentView(APIView):
    """POST: mark a year as current, unmark all others."""
    permission_classes = [IsAuthenticated]

    def post(self, request, year_id):
        from apps.academics.models import AcademicYear
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        try:
            year = AcademicYear.objects.get(id=year_id, school=school)
        except AcademicYear.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        AcademicYear.objects.filter(school=school, is_current=True).update(is_current=False)
        year.is_current = True
        year.save(update_fields=["is_current"])
        return Response({"detail": "Set as current year."})


class AdminAcademicSessionListView(APIView):
    """GET list / POST create sessions for an academic year."""
    permission_classes = [IsAuthenticated]

    def _year(self, request, year_id):
        from apps.academics.models import AcademicYear
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, None, Response({"detail": "School not found."}, status=404)
        try:
            return school, AcademicYear.objects.get(id=year_id, school=school), None
        except AcademicYear.DoesNotExist:
            return None, None, Response({"detail": "Year not found."}, status=404)

    def get(self, request, year_id):
        _, year, err = self._year(request, year_id)
        if err:
            return err
        from apps.academics.serializers import AcademicSessionSerializer
        return Response(AcademicSessionSerializer(year.sessions.all(), many=True).data)

    def post(self, request, year_id):
        school, year, err = self._year(request, year_id)
        if err:
            return err
        from apps.academics.serializers import AcademicSessionWriteSerializer, AcademicSessionSerializer
        from apps.academics.models import AcademicSession
        ser = AcademicSessionWriteSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        if ser.validated_data.get("is_current"):
            AcademicSession.objects.filter(academic_year=year, is_current=True).update(is_current=False)
        session = ser.save(school=school, academic_year=year)
        return Response(AcademicSessionSerializer(session).data, status=201)


class AdminAcademicSessionDetailView(APIView):
    """GET / PATCH / DELETE a single session."""
    permission_classes = [IsAuthenticated]

    def _get(self, request, year_id, session_id):
        from apps.academics.models import AcademicYear, AcademicSession
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, None, Response({"detail": "School not found."}, status=404)
        try:
            year = AcademicYear.objects.get(id=year_id, school=school)
        except AcademicYear.DoesNotExist:
            return None, None, Response({"detail": "Year not found."}, status=404)
        try:
            return year, AcademicSession.objects.get(id=session_id, academic_year=year), None
        except AcademicSession.DoesNotExist:
            return None, None, Response({"detail": "Session not found."}, status=404)

    def patch(self, request, year_id, session_id):
        year, obj, err = self._get(request, year_id, session_id)
        if err:
            return err
        from apps.academics.serializers import AcademicSessionWriteSerializer, AcademicSessionSerializer
        from apps.academics.models import AcademicSession
        ser = AcademicSessionWriteSerializer(obj, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        if ser.validated_data.get("is_current"):
            AcademicSession.objects.filter(academic_year=year, is_current=True).exclude(id=obj.id).update(is_current=False)
        obj = ser.save()
        return Response(AcademicSessionSerializer(obj).data)

    def delete(self, request, year_id, session_id):
        _, obj, err = self._get(request, year_id, session_id)
        if err:
            return err
        obj.delete()
        return Response(status=204)


# ── Admin: Subjects ────────────────────────────────────────────────────────────

class AdminSubjectListView(APIView):
    """GET list / POST create subjects."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.academics.models import Subject
        from apps.academics.serializers import SubjectSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        qs = Subject.objects.filter(school=school)
        if request.query_params.get("active_only") == "true":
            qs = qs.filter(is_active=True)
        return Response(SubjectSerializer(qs, many=True).data)

    def post(self, request):
        from apps.academics.models import Subject
        from apps.academics.serializers import SubjectSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        ser = SubjectSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        subj = ser.save(school=school)
        return Response(SubjectSerializer(subj).data, status=201)


class AdminSubjectDetailView(APIView):
    """GET / PATCH / DELETE a single subject."""
    permission_classes = [IsAuthenticated]

    def _get(self, request, subject_id):
        from apps.academics.models import Subject
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            return Subject.objects.get(id=subject_id, school=school), None
        except Subject.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=404)

    def get(self, request, subject_id):
        obj, err = self._get(request, subject_id)
        if err:
            return err
        from apps.academics.serializers import SubjectSerializer
        return Response(SubjectSerializer(obj).data)

    def patch(self, request, subject_id):
        obj, err = self._get(request, subject_id)
        if err:
            return err
        from apps.academics.serializers import SubjectSerializer
        ser = SubjectSerializer(obj, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        return Response(SubjectSerializer(ser.save()).data)

    def delete(self, request, subject_id):
        obj, err = self._get(request, subject_id)
        if err:
            return err
        obj.delete()
        return Response(status=204)


# ── Admin: Houses / Groups ─────────────────────────────────────────────────────

class AdminHouseListView(APIView):
    """GET list / POST create houses."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.academics.models import House
        from apps.academics.serializers import HouseSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        return Response(HouseSerializer(House.objects.filter(school=school), many=True).data)

    def post(self, request):
        from apps.academics.models import House
        from apps.academics.serializers import HouseSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        ser = HouseSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        return Response(HouseSerializer(ser.save(school=school)).data, status=201)


class AdminHouseDetailView(APIView):
    """GET / PATCH / DELETE a single house."""
    permission_classes = [IsAuthenticated]

    def _get(self, request, house_id):
        from apps.academics.models import House
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            return House.objects.get(id=house_id, school=school), None
        except House.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=404)

    def get(self, request, house_id):
        obj, err = self._get(request, house_id)
        if err:
            return err
        from apps.academics.serializers import HouseSerializer
        return Response(HouseSerializer(obj).data)

    def patch(self, request, house_id):
        obj, err = self._get(request, house_id)
        if err:
            return err
        from apps.academics.serializers import HouseSerializer
        ser = HouseSerializer(obj, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        return Response(HouseSerializer(ser.save()).data)

    def delete(self, request, house_id):
        obj, err = self._get(request, house_id)
        if err:
            return err
        obj.delete()
        return Response(status=204)


# ── Admin: Holidays ────────────────────────────────────────────────────────────

class AdminHolidayListView(APIView):
    """GET list / POST create holidays. Filter by ?academic_year=<id>."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.academics.models import Holiday
        from apps.academics.serializers import HolidaySerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        qs = Holiday.objects.filter(school=school)
        yr = request.query_params.get("academic_year")
        if yr:
            qs = qs.filter(academic_year_id=yr)
        return Response(HolidaySerializer(qs, many=True).data)

    def post(self, request):
        from apps.academics.models import Holiday
        from apps.academics.serializers import HolidaySerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        ser = HolidaySerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        return Response(HolidaySerializer(ser.save(school=school)).data, status=201)


class AdminHolidayDetailView(APIView):
    """GET / PATCH / DELETE a single holiday."""
    permission_classes = [IsAuthenticated]

    def _get(self, request, holiday_id):
        from apps.academics.models import Holiday
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            return Holiday.objects.get(id=holiday_id, school=school), None
        except Holiday.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=404)

    def get(self, request, holiday_id):
        obj, err = self._get(request, holiday_id)
        if err:
            return err
        from apps.academics.serializers import HolidaySerializer
        return Response(HolidaySerializer(obj).data)

    def patch(self, request, holiday_id):
        obj, err = self._get(request, holiday_id)
        if err:
            return err
        from apps.academics.serializers import HolidaySerializer
        ser = HolidaySerializer(obj, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        return Response(HolidaySerializer(ser.save()).data)

    def delete(self, request, holiday_id):
        obj, err = self._get(request, holiday_id)
        if err:
            return err
        obj.delete()
        return Response(status=204)


# ── Admin: Academic Events ─────────────────────────────────────────────────────

class AdminAcademicEventListView(APIView):
    """GET list / POST create academic events. Filter by ?academic_year=<id>."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.academics.models import AcademicEvent
        from apps.academics.serializers import AcademicEventSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        qs = AcademicEvent.objects.filter(school=school)
        yr = request.query_params.get("academic_year")
        if yr:
            qs = qs.filter(academic_year_id=yr)
        return Response(AcademicEventSerializer(qs, many=True).data)

    def post(self, request):
        from apps.academics.models import AcademicEvent
        from apps.academics.serializers import AcademicEventSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        ser = AcademicEventSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        return Response(AcademicEventSerializer(ser.save(school=school)).data, status=201)


class AdminAcademicEventDetailView(APIView):
    """GET / PATCH / DELETE a single academic event."""
    permission_classes = [IsAuthenticated]

    def _get(self, request, event_id):
        from apps.academics.models import AcademicEvent
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            return AcademicEvent.objects.get(id=event_id, school=school), None
        except AcademicEvent.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=404)

    def get(self, request, event_id):
        obj, err = self._get(request, event_id)
        if err:
            return err
        from apps.academics.serializers import AcademicEventSerializer
        return Response(AcademicEventSerializer(obj).data)

    def patch(self, request, event_id):
        obj, err = self._get(request, event_id)
        if err:
            return err
        from apps.academics.serializers import AcademicEventSerializer
        ser = AcademicEventSerializer(obj, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        return Response(AcademicEventSerializer(ser.save()).data)

    def delete(self, request, event_id):
        obj, err = self._get(request, event_id)
        if err:
            return err
        obj.delete()
        return Response(status=204)


# ── Admin: Student Admission & Profile ────────────────────────────────────────

class AdminStudentCreateView(APIView):
    """POST: create a student via the full admission form."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.academics.serializers import StudentAdmissionSerializer, StudentDetailSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        ser = StudentAdmissionSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        student = ser.save(school=school)
        return Response(StudentDetailSerializer(student).data, status=201)


class AdminStudentDetailView(APIView):
    """GET / PATCH / DELETE a single student profile."""
    permission_classes = [IsAuthenticated]

    def _get(self, request, student_id):
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            return Student.objects.select_related("classroom", "house").get(id=student_id, school=school), None
        except Student.DoesNotExist:
            return None, Response({"detail": "Student not found."}, status=404)

    def get(self, request, student_id):
        from apps.academics.serializers import StudentDetailSerializer
        student, err = self._get(request, student_id)
        if err:
            return err
        data = StudentDetailSerializer(student).data

        # Attach parent info
        from apps.academics.models import StudentParentLink
        links = (
            StudentParentLink.objects
            .filter(student=student)
            .select_related("parent__user")
        )
        data["parents"] = [
            {
                "id": lnk.parent.id,
                "name": lnk.parent.user.get_full_name() or lnk.parent.user.email,
                "phone": lnk.parent.phone,
                "is_primary": lnk.is_primary,
            }
            for lnk in links
        ]

        # Attach documents
        from apps.academics.models import StudentDocument
        from apps.academics.serializers import StudentDocumentSerializer
        docs = StudentDocument.objects.filter(student=student)
        data["documents"] = StudentDocumentSerializer(docs, many=True).data

        # Attach transfer certificates
        from apps.academics.models import TransferCertificate
        from apps.academics.serializers import TransferCertificateSerializer
        tcs = TransferCertificate.objects.filter(student=student)
        data["transfer_certificates"] = TransferCertificateSerializer(tcs, many=True).data

        return Response(data)

    def patch(self, request, student_id):
        from apps.academics.serializers import StudentAdmissionSerializer, StudentDetailSerializer
        student, err = self._get(request, student_id)
        if err:
            return err
        ser = StudentAdmissionSerializer(student, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        return Response(StudentDetailSerializer(ser.save()).data)

    def delete(self, request, student_id):
        student, err = self._get(request, student_id)
        if err:
            return err
        student.is_active = False
        student.save(update_fields=["is_active"])
        return Response({"detail": "Student deactivated."})


# ── Admin: Student Documents ───────────────────────────────────────────────────

class AdminStudentDocumentListView(APIView):
    """GET list / POST upload a document for a student."""
    permission_classes = [IsAuthenticated]

    def _student(self, request, student_id):
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            return Student.objects.get(id=student_id, school=school), None
        except Student.DoesNotExist:
            return None, Response({"detail": "Student not found."}, status=404)

    def get(self, request, student_id):
        from apps.academics.models import StudentDocument
        from apps.academics.serializers import StudentDocumentSerializer
        student, err = self._student(request, student_id)
        if err:
            return err
        docs = StudentDocument.objects.filter(student=student)
        return Response(StudentDocumentSerializer(docs, many=True).data)

    def post(self, request, student_id):
        from apps.academics.models import StudentDocument
        from apps.academics.serializers import StudentDocumentSerializer
        student, err = self._student(request, student_id)
        if err:
            return err
        doc_type  = request.data.get("document_type", "other")
        file_name = (request.data.get("file_name") or "").strip()
        file_key  = (request.data.get("file_key") or "").strip()
        if not file_name or not file_key:
            return Response({"detail": "file_name and file_key are required."}, status=400)
        doc = StudentDocument.objects.create(
            school=student.school, student=student,
            document_type=doc_type, file_name=file_name, file_key=file_key,
            uploaded_by=request.user,
        )
        return Response(StudentDocumentSerializer(doc).data, status=201)


class AdminStudentDocumentDetailView(APIView):
    """DELETE a student document."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, student_id, doc_id):
        from apps.academics.models import StudentDocument
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        try:
            doc = StudentDocument.objects.get(id=doc_id, student_id=student_id, school=school)
        except StudentDocument.DoesNotExist:
            return Response({"detail": "Document not found."}, status=404)
        doc.delete()
        return Response(status=204)


# ── Admin: Student Promotion ───────────────────────────────────────────────────

class AdminStudentPromoteView(APIView):
    """POST: bulk-promote students from one classroom to another.

    Body:
        from_classroom_id: int
        to_classroom_id:   int
        student_ids:       list[int]  (optional — if omitted, promotes all in from_classroom)
        academic_year_id:  int        (optional)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.academics.models import StudentPromotion
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)

        from_id = request.data.get("from_classroom_id")
        to_id   = request.data.get("to_classroom_id")
        if not from_id or not to_id:
            return Response({"detail": "from_classroom_id and to_classroom_id are required."}, status=400)
        if from_id == to_id:
            return Response({"detail": "Source and destination classrooms must differ."}, status=400)

        try:
            from_cls = Classroom.objects.get(id=from_id, school=school)
            to_cls   = Classroom.objects.get(id=to_id, school=school)
        except Classroom.DoesNotExist:
            return Response({"detail": "Classroom not found."}, status=404)

        qs = Student.objects.filter(school=school, classroom=from_cls, is_active=True)
        student_ids = request.data.get("student_ids")
        if student_ids:
            qs = qs.filter(id__in=student_ids)

        count = qs.count()
        qs.update(classroom=to_cls)

        academic_year_id = request.data.get("academic_year_id")
        StudentPromotion.objects.create(
            school=school,
            from_classroom=from_cls,
            to_classroom=to_cls,
            promoted_by=request.user,
            student_count=count,
            academic_year_id=academic_year_id or None,
        )

        return Response({
            "detail": f"Promoted {count} student(s) from {from_cls.name} to {to_cls.name}.",
            "count": count,
        })


# ── Admin: Transfer Certificates ──────────────────────────────────────────────

class AdminTransferCertificateListView(APIView):
    """GET list / POST issue a transfer certificate."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.academics.models import TransferCertificate
        from apps.academics.serializers import TransferCertificateSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        qs = TransferCertificate.objects.filter(school=school).select_related("student")
        student_id = request.query_params.get("student_id")
        if student_id:
            qs = qs.filter(student_id=student_id)
        return Response(TransferCertificateSerializer(qs, many=True).data)

    def post(self, request):
        from apps.academics.models import TransferCertificate
        from apps.academics.serializers import TransferCertificateSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        student_id = request.data.get("student_id")
        if not student_id:
            return Response({"detail": "student_id is required."}, status=400)
        try:
            student = Student.objects.get(id=student_id, school=school)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found."}, status=404)

        tc = TransferCertificate.objects.create(
            school=school,
            student=student,
            issued_date=request.data.get("issued_date") or __import__("datetime").date.today(),
            reason=request.data.get("reason", "new_school"),
            remark=request.data.get("remark", ""),
            issued_by=request.user,
        )
        # Deactivate the student after TC is issued
        student.is_active = False
        student.save(update_fields=["is_active"])

        return Response(TransferCertificateSerializer(tc).data, status=201)


# ── Admin: Timetable ──────────────────────────────────────────────────────────

class AdminTimetableListView(APIView):
    """GET list (filter ?classroom_id=) / POST create a timetable."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.academics.models import Timetable
        from apps.academics.serializers import TimetableSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        qs = Timetable.objects.filter(school=school).select_related("classroom", "academic_year")
        classroom_id = request.query_params.get("classroom_id")
        if classroom_id:
            qs = qs.filter(classroom_id=classroom_id)
        return Response(TimetableSerializer(qs, many=True).data)

    def post(self, request):
        from apps.academics.serializers import TimetableWriteSerializer, TimetableSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        ser = TimetableWriteSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        timetable = ser.save(school=school)
        return Response(TimetableSerializer(timetable).data, status=201)


class AdminTimetableDetailView(APIView):
    """GET / PATCH / DELETE a single timetable."""
    permission_classes = [IsAuthenticated]

    def _get(self, request, timetable_id):
        from apps.academics.models import Timetable
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            return Timetable.objects.select_related("classroom", "academic_year").get(
                id=timetable_id, school=school
            ), None
        except Timetable.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=404)

    def get(self, request, timetable_id):
        from apps.academics.serializers import TimetableSerializer
        obj, err = self._get(request, timetable_id)
        if err:
            return err
        return Response(TimetableSerializer(obj).data)

    def patch(self, request, timetable_id):
        from apps.academics.serializers import TimetableWriteSerializer, TimetableSerializer
        obj, err = self._get(request, timetable_id)
        if err:
            return err
        ser = TimetableWriteSerializer(obj, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        return Response(TimetableSerializer(ser.save()).data)

    def delete(self, request, timetable_id):
        obj, err = self._get(request, timetable_id)
        if err:
            return err
        obj.delete()
        return Response(status=204)


class AdminTimetableSlotBulkView(APIView):
    """POST: replace all slots for a timetable with the submitted set.

    Body: {"slots": [{"weekday":1,"period_number":1,"starts_at":"08:00",
                      "ends_at":"08:45","slot_type":"regular",
                      "subject":3,"teacher":null}, ...]}

    Deletes all existing slots for that timetable and recreates them.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, timetable_id):
        from apps.academics.models import Timetable, TimetableSlot
        from apps.academics.serializers import TimetableSlotSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        try:
            timetable = Timetable.objects.get(id=timetable_id, school=school)
        except Timetable.DoesNotExist:
            return Response({"detail": "Timetable not found."}, status=404)

        slots_data = request.data.get("slots")
        if not isinstance(slots_data, list):
            return Response({"detail": "slots must be a list."}, status=400)

        # Validate all slots before writing
        serializers = []
        for item in slots_data:
            ser = TimetableSlotSerializer(data=item)
            if not ser.is_valid():
                return Response({"detail": "Invalid slot data.", "errors": ser.errors}, status=400)
            serializers.append(ser)

        # Replace: delete existing, recreate
        TimetableSlot.objects.filter(timetable=timetable).delete()
        created = []
        for ser in serializers:
            slot = ser.save(timetable=timetable, school=school)
            created.append(slot)

        return Response(TimetableSlotSerializer(created, many=True).data, status=201)


# ── Admin: Homework ───────────────────────────────────────────────────────────

class AdminHomeworkListView(APIView):
    """GET list (filter ?classroom_id=, ?subject_id=) / POST create homework."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.academics.models import Homework
        from apps.academics.serializers import HomeworkSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        qs = Homework.objects.filter(school=school).select_related("classroom", "subject", "teacher__user")
        classroom_id = request.query_params.get("classroom_id")
        subject_id   = request.query_params.get("subject_id")
        if classroom_id:
            qs = qs.filter(classroom_id=classroom_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        return Response(HomeworkSerializer(qs, many=True).data)

    def post(self, request):
        from apps.academics.serializers import HomeworkWriteSerializer, HomeworkSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        ser = HomeworkWriteSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        homework = ser.save(school=school)
        return Response(HomeworkSerializer(homework).data, status=201)


class AdminHomeworkDetailView(APIView):
    """GET / PATCH / DELETE a single homework entry."""
    permission_classes = [IsAuthenticated]

    def _get(self, request, homework_id):
        from apps.academics.models import Homework
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            return Homework.objects.select_related("classroom", "subject", "teacher__user").get(
                id=homework_id, school=school
            ), None
        except Homework.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=404)

    def get(self, request, homework_id):
        from apps.academics.serializers import HomeworkSerializer
        obj, err = self._get(request, homework_id)
        if err:
            return err
        return Response(HomeworkSerializer(obj).data)

    def patch(self, request, homework_id):
        from apps.academics.serializers import HomeworkWriteSerializer, HomeworkSerializer
        obj, err = self._get(request, homework_id)
        if err:
            return err
        ser = HomeworkWriteSerializer(obj, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        return Response(HomeworkSerializer(ser.save()).data)

    def delete(self, request, homework_id):
        obj, err = self._get(request, homework_id)
        if err:
            return err
        obj.delete()
        return Response(status=204)


# ── Admin: Exams ──────────────────────────────────────────────────────────────

class AdminExamListView(APIView):
    """GET list (filter ?academic_year_id=) / POST create an exam."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.academics.models import Exam
        from apps.academics.serializers import ExamSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        qs = Exam.objects.filter(school=school).select_related("academic_year")
        academic_year_id = request.query_params.get("academic_year_id")
        if academic_year_id:
            qs = qs.filter(academic_year_id=academic_year_id)
        return Response(ExamSerializer(qs, many=True).data)

    def post(self, request):
        from apps.academics.serializers import ExamWriteSerializer, ExamSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        ser = ExamWriteSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        exam = ser.save(school=school)
        return Response(ExamSerializer(exam).data, status=201)


class AdminExamDetailView(APIView):
    """GET / PATCH / DELETE a single exam."""
    permission_classes = [IsAuthenticated]

    def _get(self, request, exam_id):
        from apps.academics.models import Exam
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            return Exam.objects.select_related("academic_year").get(id=exam_id, school=school), None
        except Exam.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=404)

    def get(self, request, exam_id):
        from apps.academics.serializers import ExamSerializer
        obj, err = self._get(request, exam_id)
        if err:
            return err
        return Response(ExamSerializer(obj).data)

    def patch(self, request, exam_id):
        from apps.academics.serializers import ExamWriteSerializer, ExamSerializer
        obj, err = self._get(request, exam_id)
        if err:
            return err
        ser = ExamWriteSerializer(obj, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        return Response(ExamSerializer(ser.save()).data)

    def delete(self, request, exam_id):
        obj, err = self._get(request, exam_id)
        if err:
            return err
        obj.delete()
        return Response(status=204)


class AdminExamPublishView(APIView):
    """POST: toggle is_published on an exam."""
    permission_classes = [IsAuthenticated]

    def post(self, request, exam_id):
        from apps.academics.models import Exam
        from apps.academics.serializers import ExamSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        try:
            exam = Exam.objects.get(id=exam_id, school=school)
        except Exam.DoesNotExist:
            return Response({"detail": "Exam not found."}, status=404)
        exam.is_published = not exam.is_published
        exam.save(update_fields=["is_published"])
        return Response(ExamSerializer(exam).data)


class AdminExamScheduleListView(APIView):
    """GET list of exam schedules for an exam / POST create a schedule entry.

    URL: /admin/exams/<exam_id>/schedules/
    """
    permission_classes = [IsAuthenticated]

    def _exam(self, request, exam_id):
        from apps.academics.models import Exam
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, None, Response({"detail": "School not found."}, status=404)
        try:
            return school, Exam.objects.get(id=exam_id, school=school), None
        except Exam.DoesNotExist:
            return None, None, Response({"detail": "Exam not found."}, status=404)

    def get(self, request, exam_id):
        from apps.academics.models import ExamSchedule
        from apps.academics.serializers import ExamScheduleSerializer
        _, exam, err = self._exam(request, exam_id)
        if err:
            return err
        qs = ExamSchedule.objects.filter(exam=exam).select_related("classroom", "subject")
        return Response(ExamScheduleSerializer(qs, many=True).data)

    def post(self, request, exam_id):
        from apps.academics.serializers import ExamScheduleSerializer
        school, exam, err = self._exam(request, exam_id)
        if err:
            return err
        ser = ExamScheduleSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        schedule = ser.save(school=school, exam=exam)
        return Response(ExamScheduleSerializer(schedule).data, status=201)


class AdminExamScheduleDetailView(APIView):
    """PATCH / DELETE a single exam schedule entry.

    URL: /admin/exams/<exam_id>/schedules/<schedule_id>/
    """
    permission_classes = [IsAuthenticated]

    def _get(self, request, exam_id, schedule_id):
        from apps.academics.models import Exam, ExamSchedule
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, Response({"detail": "School not found."}, status=404)
        try:
            exam = Exam.objects.get(id=exam_id, school=school)
        except Exam.DoesNotExist:
            return None, Response({"detail": "Exam not found."}, status=404)
        try:
            return ExamSchedule.objects.select_related("classroom", "subject").get(
                id=schedule_id, exam=exam
            ), None
        except ExamSchedule.DoesNotExist:
            return None, Response({"detail": "Schedule not found."}, status=404)

    def patch(self, request, exam_id, schedule_id):
        from apps.academics.serializers import ExamScheduleSerializer
        obj, err = self._get(request, exam_id, schedule_id)
        if err:
            return err
        ser = ExamScheduleSerializer(obj, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        return Response(ExamScheduleSerializer(ser.save()).data)

    def delete(self, request, exam_id, schedule_id):
        obj, err = self._get(request, exam_id, schedule_id)
        if err:
            return err
        obj.delete()
        return Response(status=204)


# ── Admin: Marks Entry ────────────────────────────────────────────────────────

class AdminExamResultsView(APIView):
    """GET all results for an ExamSchedule (sorted by roll_number) /
    POST bulk upsert marks.

    URL: /admin/exam-schedules/<schedule_id>/results/

    POST body:
        {"results": [{"student_id": 5, "marks_obtained": 78.5, "is_absent": false}, ...]}
    Uses update_or_create on (exam_schedule, student).
    """
    permission_classes = [IsAuthenticated]

    def _schedule(self, request, schedule_id):
        from apps.academics.models import ExamSchedule
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, None, Response({"detail": "School not found."}, status=404)
        try:
            return school, ExamSchedule.objects.select_related("exam", "classroom", "subject").get(
                id=schedule_id, school=school
            ), None
        except ExamSchedule.DoesNotExist:
            return None, None, Response({"detail": "Exam schedule not found."}, status=404)

    def get(self, request, schedule_id):
        from apps.academics.models import ExamResult
        from apps.academics.serializers import ExamResultSerializer
        _, schedule, err = self._schedule(request, schedule_id)
        if err:
            return err
        qs = (
            ExamResult.objects
            .filter(exam_schedule=schedule)
            .select_related("student")
            .order_by("student__roll_number")
        )
        return Response(ExamResultSerializer(qs, many=True).data)

    def post(self, request, schedule_id):
        from apps.academics.models import ExamResult, Student
        from apps.academics.serializers import ExamResultSerializer
        school, schedule, err = self._schedule(request, schedule_id)
        if err:
            return err

        results_data = request.data.get("results")
        if not isinstance(results_data, list):
            return Response({"detail": "results must be a list."}, status=400)

        upserted = []
        for item in results_data:
            student_id     = item.get("student_id")
            marks_obtained = item.get("marks_obtained")
            is_absent      = bool(item.get("is_absent", False))

            if not student_id:
                return Response({"detail": "student_id is required for each result."}, status=400)

            try:
                student = Student.objects.get(id=student_id, school=school)
            except Student.DoesNotExist:
                return Response({"detail": f"Student {student_id} not found."}, status=404)

            result, _ = ExamResult.objects.update_or_create(
                exam_schedule=schedule,
                student=student,
                defaults={
                    "school":         school,
                    "marks_obtained": None if is_absent else marks_obtained,
                    "is_absent":      is_absent,
                },
            )
            upserted.append(result)

        return Response(ExamResultSerializer(upserted, many=True).data, status=status.HTTP_200_OK)


# ── Admin: Report Cards ───────────────────────────────────────────────────────

class AdminReportCardGenerateView(APIView):
    """POST: generate/regenerate report cards for all students in a classroom for an exam.

    URL: /admin/exams/<exam_id>/report-cards/generate/
    Body: {"classroom_id": 3}

    Algorithm:
      1. Get all ExamSchedules for this exam + classroom.
      2. Get all active students in classroom.
      3. For each student: sum max_marks from schedules,
         sum obtained_marks from ExamResults (absent = 0).
      4. Compute percentage, grade (via _compute_grade from models), rank.
      5. create_or_update ReportCard per student.
    Returns list of generated ReportCards.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, exam_id):
        from apps.academics.models import (
            Exam, ExamSchedule, ExamResult, ReportCard, _compute_grade,
        )
        from apps.academics.serializers import ReportCardSerializer

        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)

        try:
            exam = Exam.objects.get(id=exam_id, school=school)
        except Exam.DoesNotExist:
            return Response({"detail": "Exam not found."}, status=404)

        classroom_id = request.data.get("classroom_id")
        if not classroom_id:
            return Response({"detail": "classroom_id is required."}, status=400)

        try:
            classroom = Classroom.objects.get(id=classroom_id, school=school)
        except Classroom.DoesNotExist:
            return Response({"detail": "Classroom not found."}, status=404)

        # Step 1: all ExamSchedules for this exam + classroom
        schedules = list(
            ExamSchedule.objects.filter(exam=exam, classroom=classroom, school=school)
        )
        if not schedules:
            return Response({"detail": "No exam schedules found for this exam and classroom."}, status=400)

        total_max = sum(s.max_marks for s in schedules)

        # Step 2: all active students in classroom
        students = list(
            Student.objects.filter(school=school, classroom=classroom, is_active=True)
        )
        if not students:
            return Response({"detail": "No active students in classroom."}, status=400)

        # Build a marks lookup: (schedule_id, student_id) -> ExamResult
        result_qs = ExamResult.objects.filter(
            exam_schedule__in=schedules,
            student__in=students,
        )
        results_map = {}
        for r in result_qs:
            results_map[(r.exam_schedule_id, r.student_id)] = r

        # Step 3 + 4: compute per-student aggregates
        student_totals = []
        for student in students:
            obtained = 0.0
            for sched in schedules:
                result = results_map.get((sched.id, student.id))
                if result and not result.is_absent and result.marks_obtained is not None:
                    obtained += float(result.marks_obtained)
            percentage = (obtained / total_max * 100) if total_max else 0.0
            grade = _compute_grade(percentage)
            student_totals.append({
                "student":    student,
                "obtained":   obtained,
                "percentage": percentage,
                "grade":      grade,
            })

        # Step 4: compute rank (descending by obtained marks; ties share rank)
        student_totals.sort(key=lambda x: x["obtained"], reverse=True)
        rank = 0
        prev_obtained = None
        rank_counter  = 0
        for entry in student_totals:
            rank_counter += 1
            if entry["obtained"] != prev_obtained:
                rank = rank_counter
            entry["rank"] = rank
            prev_obtained = entry["obtained"]

        # Step 5: create_or_update ReportCard per student
        report_cards = []
        for entry in student_totals:
            rc, _ = ReportCard.objects.update_or_create(
                student=entry["student"],
                exam=exam,
                defaults={
                    "school":         school,
                    "academic_year":  exam.academic_year,
                    "total_marks":    total_max,
                    "obtained_marks": entry["obtained"],
                    "percentage":     round(entry["percentage"], 2),
                    "grade":          entry["grade"],
                    "rank":           entry["rank"],
                },
            )
            report_cards.append(rc)

        return Response(ReportCardSerializer(report_cards, many=True).data, status=201)


class AdminReportCardListView(APIView):
    """GET list of report cards, filter by ?exam_id= and/or ?classroom_id=.

    URL: /admin/report-cards/?exam_id=&classroom_id=
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.academics.models import ReportCard
        from apps.academics.serializers import ReportCardSerializer
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)

        qs = ReportCard.objects.filter(school=school).select_related(
            "student", "exam", "academic_year"
        )
        exam_id      = request.query_params.get("exam_id")
        classroom_id = request.query_params.get("classroom_id")
        if exam_id:
            qs = qs.filter(exam_id=exam_id)
        if classroom_id:
            qs = qs.filter(student__classroom_id=classroom_id)
        return Response(ReportCardSerializer(qs, many=True).data)


class AdminReportCardPublishView(APIView):
    """POST: set is_published=True for all report cards of an exam + classroom.

    URL: /admin/exams/<exam_id>/report-cards/publish/
    Body: {"classroom_id": 3}
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, exam_id):
        from apps.academics.models import Exam, ReportCard
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)

        try:
            exam = Exam.objects.get(id=exam_id, school=school)
        except Exam.DoesNotExist:
            return Response({"detail": "Exam not found."}, status=404)

        classroom_id = request.data.get("classroom_id")
        if not classroom_id:
            return Response({"detail": "classroom_id is required."}, status=400)

        updated = ReportCard.objects.filter(
            school=school,
            exam=exam,
            student__classroom_id=classroom_id,
        ).update(is_published=True)

        return Response({"detail": f"Published {updated} report card(s).", "count": updated})


# ── Admin: UDISE Report ───────────────────────────────────────────────────────

def _build_udise_summary(school, report):
    """Compute auto-filled UDISE sections from existing school data."""
    from apps.academics.models import Classroom, Student, ExamResult, Exam, ExamSchedule
    from apps.accounts.models import TeacherProfile
    from django.db.models import Count, Q, Avg

    # ── Section 1: Student Enrollment by class ────────────────────────────
    classrooms = Classroom.objects.filter(school=school).order_by("name", "section")
    enrollment_rows = []
    total_enrollment = {"total": 0, "boys": 0, "girls": 0, "sc": 0, "st": 0, "obc": 0, "ews": 0, "general": 0}
    for cls in classrooms:
        qs = Student.objects.filter(school=school, classroom=cls, is_active=True)
        row = {
            "classroom": f"{cls.name}{(' ' + cls.section) if cls.section else ''}",
            "total":   qs.count(),
            "boys":    qs.filter(gender="male").count(),
            "girls":   qs.filter(gender="female").count(),
            "sc":      qs.filter(category="sc").count(),
            "st":      qs.filter(category="st").count(),
            "obc":     qs.filter(category="obc").count(),
            "ews":     qs.filter(category="ews").count(),
            "general": qs.filter(category="general").count(),
        }
        enrollment_rows.append(row)
        for key in total_enrollment:
            total_enrollment[key] += row[key]

    # ── Section 2: Teacher summary ────────────────────────────────────────
    teachers = TeacherProfile.objects.filter(school=school).select_related("user")
    classroom_map = {
        cls.teacher_id: f"{cls.name}{(' ' + cls.section) if cls.section else ''}"
        for cls in classrooms if cls.teacher_id
    }
    teacher_rows = []
    for tp in teachers:
        teacher_rows.append({
            "id":            tp.id,
            "name":          tp.user.get_full_name() or tp.user.email,
            "email":         tp.user.email,
            "employee_code": tp.employee_code,
            "class_teacher_of": classroom_map.get(tp.id, ""),
        })

    # ── Section 4: Academic performance summary ───────────────────────────
    # Gather published report cards grouped by exam
    from apps.academics.models import ReportCard
    exam_ids = (
        ReportCard.objects
        .filter(school=school)
        .values_list("exam_id", flat=True)
        .distinct()
    )
    academic_rows = []
    for exam in Exam.objects.filter(id__in=exam_ids).select_related("academic_year"):
        cards = ReportCard.objects.filter(school=school, exam=exam)
        total = cards.count()
        if total == 0:
            continue
        passed     = cards.filter(percentage__gte=35).count()
        avg_pct    = cards.aggregate(a=Avg("percentage"))["a"] or 0
        academic_rows.append({
            "exam_name":   exam.name,
            "exam_type":   exam.exam_type,
            "year":        exam.academic_year.name if exam.academic_year else "",
            "total":       total,
            "passed":      passed,
            "pass_pct":    round(passed / total * 100, 1) if total else 0,
            "avg_pct":     round(float(avg_pct), 1),
        })

    return {
        "enrollment":    enrollment_rows,
        "enrollment_total": total_enrollment,
        "teachers":      teacher_rows,
        "teacher_count": len(teacher_rows),
        "student_count": total_enrollment["total"],
        "academics":     academic_rows,
    }


class AdminUDISEReportListView(APIView):
    """GET list / POST create a UDISE report."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.academics.models import UDISEReport
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        reports = UDISEReport.objects.filter(school=school).select_related("academic_year")
        data = [{
            "id":            r.id,
            "academic_year": r.academic_year.name if r.academic_year else "",
            "academic_year_id": r.academic_year_id,
            "udise_code":    r.udise_code,
            "status":        r.status,
            "submitted_at":  r.submitted_at,
            "created_at":    r.created_at,
        } for r in reports]
        return Response(data)

    def post(self, request):
        from apps.academics.models import UDISEReport, AcademicYear
        try:
            school = _school(request)
        except School.DoesNotExist:
            return Response({"detail": "School not found."}, status=404)
        year_id    = request.data.get("academic_year_id")
        udise_code = request.data.get("udise_code", "")
        if not year_id:
            return Response({"detail": "academic_year_id is required."}, status=400)
        try:
            year = AcademicYear.objects.get(id=year_id, school=school)
        except AcademicYear.DoesNotExist:
            return Response({"detail": "Academic year not found."}, status=404)
        report, created = UDISEReport.objects.get_or_create(
            school=school, academic_year=year,
            defaults={"udise_code": udise_code},
        )
        if not created and udise_code:
            report.udise_code = udise_code
            report.save(update_fields=["udise_code"])
        return Response({
            "id":            report.id,
            "academic_year": year.name,
            "academic_year_id": year.id,
            "udise_code":    report.udise_code,
            "status":        report.status,
            "submitted_at":  report.submitted_at,
            "created_at":    report.created_at,
        }, status=201 if created else 200)


class AdminUDISEReportDetailView(APIView):
    """GET full report with auto-computed summary / PATCH to save infrastructure / POST submit."""
    permission_classes = [IsAuthenticated]

    def _get(self, request, report_id):
        from apps.academics.models import UDISEReport
        try:
            school = _school(request)
        except School.DoesNotExist:
            return None, None, Response({"detail": "School not found."}, status=404)
        try:
            return school, UDISEReport.objects.select_related("academic_year").get(id=report_id, school=school), None
        except UDISEReport.DoesNotExist:
            return None, None, Response({"detail": "Not found."}, status=404)

    def get(self, request, report_id):
        school, report, err = self._get(request, report_id)
        if err:
            return err
        summary = _build_udise_summary(school, report)
        return Response({
            "id":             report.id,
            "academic_year":  report.academic_year.name if report.academic_year else "",
            "academic_year_id": report.academic_year_id,
            "udise_code":     report.udise_code,
            "status":         report.status,
            "infrastructure": report.infrastructure,
            "submitted_at":   report.submitted_at,
            "created_at":     report.created_at,
            **summary,
        })

    def patch(self, request, report_id):
        school, report, err = self._get(request, report_id)
        if err:
            return err
        if "infrastructure" in request.data:
            report.infrastructure = request.data["infrastructure"]
        if "udise_code" in request.data:
            report.udise_code = request.data["udise_code"]
        report.save(update_fields=["infrastructure", "udise_code"])
        return Response({"detail": "Saved.", "infrastructure": report.infrastructure, "udise_code": report.udise_code})

    def post(self, request, report_id):
        """Submit the report (mark as submitted)."""
        from django.utils import timezone
        school, report, err = self._get(request, report_id)
        if err:
            return err
        report.status       = "submitted"
        report.submitted_at = timezone.now()
        report.submitted_by = request.user
        report.save(update_fields=["status", "submitted_at", "submitted_by"])
        return Response({"detail": "Report marked as submitted.", "status": report.status, "submitted_at": report.submitted_at})
