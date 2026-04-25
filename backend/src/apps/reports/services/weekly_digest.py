"""
Weekly student digest generator — produces AI narrative from raw attendance + notes.

Called by the Celery beat task every Monday for the previous week.
"""
import logging
from datetime import date, timedelta

from apps.academics.models import Student, StudentAttendance, StudentProgress
from apps.reports.models import WeeklyStudentDigest
from integrations.gemini import ask_gemini

log = logging.getLogger("reports.weekly_digest")


def _week_range(week_start: date):
    return week_start, week_start + timedelta(days=6)


async def generate_for_student(student: Student, week_start: date) -> WeeklyStudentDigest | None:
    week_end = week_start + timedelta(days=6)

    attendance_qs = StudentAttendance.objects.filter(
        student=student, date__gte=week_start, date__lte=week_end
    )
    days_present = await attendance_qs.filter(is_present=True).acount()
    days_absent  = await attendance_qs.filter(is_present=False).acount()
    total = days_present + days_absent
    pct   = round((days_present / total * 100) if total else 0, 1)

    notes_qs = StudentProgress.objects.filter(
        student=student, created_at__date__gte=week_start, created_at__date__lte=week_end
    ).order_by("-created_at")
    raw_notes = [
        {"category": n.category, "note": n.note}
        async for n in notes_qs
    ]

    if not raw_notes and days_present == 0:
        log.info("No data for student %s week %s — skipping", student.pk, week_start)
        return None

    note_lines = "\n".join(f"- [{n['category']}] {n['note']}" for n in raw_notes) or "No notes this week."

    system = (
        "You are a friendly school assistant writing a weekly report for parents. "
        "Use simple, warm, encouraging language. Avoid jargon. "
        "Structure your response as JSON with keys: "
        "strengths_summary, weaknesses_summary, teacher_highlights, overall_summary. "
        "Each value is 1-3 sentences. overall_summary must be uplifting."
    )
    user = (
        f"Student: {student.full_name}\n"
        f"Week: {week_start} to {week_end}\n"
        f"Attendance: {days_present} days present, {days_absent} absent ({pct}%)\n"
        f"Teacher notes:\n{note_lines}"
    )

    import json
    try:
        raw = await ask_gemini(system=system, user=user)
        parsed = json.loads(raw)
    except Exception:
        parsed = {
            "strengths_summary": "",
            "weaknesses_summary": "",
            "teacher_highlights": note_lines,
            "overall_summary": f"{student.full_name} attended {days_present} day(s) this week.",
        }

    digest, _ = await WeeklyStudentDigest.objects.aupdate_or_create(
        student=student,
        week_start=week_start,
        defaults={
            "school": student.school,
            "days_present": days_present,
            "days_absent": days_absent,
            "attendance_pct": pct,
            "strengths_summary": parsed.get("strengths_summary", ""),
            "weaknesses_summary": parsed.get("weaknesses_summary", ""),
            "teacher_highlights": parsed.get("teacher_highlights", ""),
            "overall_summary": parsed.get("overall_summary", ""),
            "raw_progress_notes": raw_notes,
        },
    )
    return digest


async def generate_for_school(school, week_start: date):
    """Generate digests for all students in a school for the given week."""
    from apps.academics.models import Student
    async for student in Student.objects.filter(school=school).select_related("school"):
        try:
            await generate_for_student(student, week_start)
        except Exception as exc:
            log.error("Digest failed for student %s: %s", student.pk, exc)
