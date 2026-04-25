"""
AI Teaching Assistant service — backed by Gemini.

Every operation costs 1 token from the teacher's daily allowance.
The school-level limit is read from TenantConfig.ai_tokens_per_teacher_per_day (default 5).
"""
import logging
from datetime import date

from apps.academics.models import (
    ClassSummary,
    Classroom,
    LessonPlan,
    Student,
    StudentAttendance,
    StudentProgress,
    TeacherAITokenUsage,
    TeacherVoiceObservation,
)
from integrations.gemini import ask_gemini

log = logging.getLogger("academics.ai_assistant")


# ── Token gate ────────────────────────────────────────────────────────────────

class TokenLimitExceeded(Exception):
    pass


def _daily_limit(teacher) -> int:
    try:
        return teacher.school.config.ai_tokens_per_teacher_per_day
    except Exception:
        return 5


def _consume_token(teacher):
    today = date.today()
    usage, _ = TeacherAITokenUsage.objects.get_or_create(
        school=teacher.school,
        teacher=teacher,
        date=today,
        defaults={"tokens_used": 0},
    )
    limit = _daily_limit(teacher)
    if usage.tokens_used >= limit:
        raise TokenLimitExceeded(
            f"Daily AI token limit of {limit} reached for today."
        )
    TeacherAITokenUsage.objects.filter(pk=usage.pk).update(
        tokens_used=usage.tokens_used + 1
    )


def remaining_tokens(teacher) -> dict:
    today = date.today()
    limit = _daily_limit(teacher)
    try:
        used = TeacherAITokenUsage.objects.get(teacher=teacher, date=today).tokens_used
    except TeacherAITokenUsage.DoesNotExist:
        used = 0
    return {"used": used, "limit": limit, "remaining": max(0, limit - used)}


# ── Lesson Plan ───────────────────────────────────────────────────────────────

async def generate_lesson_plan(teacher, subject: str, topic: str, duration_minutes: int = 45, classroom=None) -> dict:
    _consume_token(teacher)

    system = (
        "You are an expert curriculum designer for Indian K-12 schools. "
        "Generate a structured lesson plan in clear, simple English. "
        "Use the following sections: Learning Objectives, Materials Needed, "
        "Introduction (5 min), Main Activity, Assessment, Homework. "
        "Keep each section concise — bullet points preferred. Max 350 words total."
    )
    user = (
        f"Subject: {subject}\nTopic: {topic}\n"
        f"Duration: {duration_minutes} minutes\n"
        f"Grade/Class: {classroom.name if classroom else 'General'}"
    )

    content = await ask_gemini(system=system, user=user)

    plan = await LessonPlan.objects.acreate(
        school=teacher.school,
        teacher=teacher,
        classroom=classroom,
        subject=subject,
        topic=topic,
        duration_minutes=duration_minutes,
        content=content,
    )
    return {
        "id": plan.pk,
        "subject": subject,
        "topic": topic,
        "duration_minutes": duration_minutes,
        "content": content,
    }


# ── Class Summary + Weak-student / Revision suggestions ──────────────────────

async def generate_class_summary(teacher, classroom, session_date=None) -> dict:
    _consume_token(teacher)

    if session_date is None:
        session_date = date.today()

    # Pull attendance and recent progress notes for context
    attendance_qs = StudentAttendance.objects.filter(
        classroom=classroom, date=session_date
    ).select_related("student")
    present = [a.student.full_name for a in attendance_qs if a.is_present]
    absent  = [a.student.full_name for a in attendance_qs if not a.is_present]

    notes_qs = StudentProgress.objects.filter(
        classroom=classroom
    ).order_by("-created_at")[:20].select_related("student")
    notes = [{"student": n.student.full_name, "note": n.note, "category": n.category} for n in notes_qs]

    system = (
        "You are a school assistant helping a teacher review their class. "
        "Based on attendance and recent teacher notes, produce:\n"
        "1. A 2-3 sentence class summary for today.\n"
        "2. A bullet list of students who may need extra support (weak students).\n"
        "3. A bullet list of topics that should be revised next class.\n"
        "Keep it concise and actionable."
    )
    user = (
        f"Date: {session_date}\nClass: {classroom.name}\n"
        f"Present ({len(present)}): {', '.join(present) or 'none'}\n"
        f"Absent ({len(absent)}): {', '.join(absent) or 'none'}\n"
        f"Recent notes:\n" + "\n".join(f"- {n['student']}: [{n['category']}] {n['note']}" for n in notes)
    )

    summary_text = await ask_gemini(system=system, user=user)

    # Parse weak students and revision topics (heuristic — look for bullet sections)
    lines = summary_text.splitlines()
    weak: list[str] = []
    revision: list[str] = []
    section = None
    for line in lines:
        low = line.lower()
        if "weak" in low or "extra support" in low:
            section = "weak"
        elif "revis" in low or "topics" in low:
            section = "revision"
        elif line.strip().startswith("-") or line.strip().startswith("•"):
            item = line.strip().lstrip("-•").strip()
            if section == "weak":
                weak.append(item)
            elif section == "revision":
                revision.append(item)

    summary = await ClassSummary.objects.acreate(
        school=teacher.school,
        teacher=teacher,
        classroom=classroom,
        date=session_date,
        summary_text=summary_text,
        weak_students=weak,
        revision_topics=revision,
    )
    return {
        "id": summary.pk,
        "date": str(session_date),
        "summary": summary_text,
        "weak_students": weak,
        "revision_topics": revision,
    }


# ── Voice Observation ─────────────────────────────────────────────────────────

async def log_voice_observation(teacher, transcript: str, student=None, classroom=None) -> dict:
    _consume_token(teacher)

    student_name = student.full_name if student else "the student"

    system = (
        "You are a school assistant. A teacher has just spoken a voice observation. "
        "Your job is to rewrite it as a clean, professional teacher note in 1-3 sentences. "
        "Also classify it with ONE of these categories: "
        "academic, participation, behavior, homework, milestone, concern."
        "Respond ONLY with JSON: {\"note\": \"...\", \"category\": \"...\"}"
    )
    user = f"Student: {student_name}\nTeacher said: \"{transcript}\""

    raw = await ask_gemini(system=system, user=user)

    import json
    try:
        parsed = json.loads(raw)
        structured_note = parsed.get("note", transcript)
        category        = parsed.get("category", "observation")
    except Exception:
        structured_note = transcript
        category        = "observation"

    obs = await TeacherVoiceObservation.objects.acreate(
        school=teacher.school,
        teacher=teacher,
        student=student,
        classroom=classroom,
        raw_transcript=transcript,
        structured_note=structured_note,
        category=category,
    )

    # Also save as a StudentProgress note so it appears in parent app
    if student:
        await StudentProgress.objects.acreate(
            school=teacher.school,
            student=student,
            classroom=classroom,
            teacher=teacher,
            category=category,
            note=structured_note,
        )

    return {
        "id": obs.pk,
        "structured_note": structured_note,
        "category": category,
        "student": student_name,
    }
