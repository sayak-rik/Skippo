import uuid

from django.conf import settings
from django.db import models

from common.models import SchoolScopedModel, TimestampedModel


def _compute_grade(percentage: float) -> str:
    if percentage >= 90: return "A+"
    if percentage >= 80: return "A"
    if percentage >= 70: return "B+"
    if percentage >= 60: return "B"
    if percentage >= 50: return "C+"
    if percentage >= 40: return "C"
    if percentage >= 35: return "D"
    return "F"


# ── Online Test ────────────────────────────────────────────────────────────────

class OnlineTest(SchoolScopedModel):
    class TestType(models.TextChoices):
        MCQ    = "mcq",    "MCQ"
        VOICE  = "voice",  "Voice"
        HYBRID = "hybrid", "Hybrid (MCQ + Voice)"

    class Status(models.TextChoices):
        DRAFT     = "draft",     "Draft"
        PUBLISHED = "published", "Published"
        CLOSED    = "closed",    "Closed"

    title              = models.CharField(max_length=255)
    subject            = models.ForeignKey(
        "academics.Subject", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="online_tests",
    )
    classrooms         = models.ManyToManyField("academics.Classroom", related_name="online_tests")
    academic_year      = models.ForeignKey(
        "academics.AcademicYear", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="online_tests",
    )
    test_type          = models.CharField(max_length=16, choices=TestType.choices, default=TestType.MCQ)
    duration_minutes   = models.PositiveIntegerField(default=60)
    passing_percentage = models.FloatField(default=35.0)
    enable_proctoring  = models.BooleanField(default=True)
    enable_voice_tts   = models.BooleanField(default=False)
    instructions       = models.TextField(blank=True)
    available_from     = models.DateTimeField()
    available_until    = models.DateTimeField()
    status             = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    created_by         = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="created_online_tests",
    )
    # Set by loadbalancer after registration (echoes back our test id as a string)
    lb_test_id         = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-available_from"]

    def __str__(self):
        return f"{self.title} ({self.school_id})"

    @property
    def total_points(self) -> int:
        return self.questions.aggregate(t=models.Sum("points"))["t"] or 0


# ── Questions ──────────────────────────────────────────────────────────────────

class TestQuestion(TimestampedModel):
    class QuestionType(models.TextChoices):
        MCQ          = "mcq",          "Multiple Choice"
        SHORT_ANSWER = "short_answer",  "Short Answer"
        VOICE        = "voice",         "Voice"

    test              = models.ForeignKey(OnlineTest, on_delete=models.CASCADE, related_name="questions")
    order             = models.PositiveIntegerField(default=0)
    question_text     = models.TextField()
    question_type     = models.CharField(max_length=16, choices=QuestionType.choices, default=QuestionType.MCQ)
    # [{"id": "A", "text": "..."}, ...]  — null for non-MCQ
    options           = models.JSONField(null=True, blank=True)
    # For MCQ auto-grading: "A", "B", "C", or "D"
    correct_answer    = models.CharField(max_length=8, blank=True)
    points            = models.PositiveSmallIntegerField(default=1)
    # Guidance hints for LLM voice-answer evaluation
    voice_grading_hint = models.TextField(blank=True)

    class Meta:
        ordering = ["order"]
        unique_together = [("test", "order")]

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:60]}"


# ── Per-student access tokens ──────────────────────────────────────────────────

class StudentTestToken(SchoolScopedModel):
    """One unique access token per student per test.

    The token UUID goes in the exam URL and is echoed back in the webhook
    so results can be matched back to this record without exposing internal IDs.
    """
    test       = models.ForeignKey(OnlineTest, on_delete=models.CASCADE, related_name="tokens")
    student    = models.ForeignKey("academics.Student", on_delete=models.CASCADE, related_name="test_tokens")
    token      = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    is_used    = models.BooleanField(default=False)
    used_at    = models.DateTimeField(null=True, blank=True)
    # Filled in when the parent requests access (allocate-pod call)
    pod_url    = models.URLField(blank=True)
    session_id = models.UUIDField(null=True, blank=True)

    class Meta:
        unique_together = [("test", "student")]

    def __str__(self):
        return f"Token {self.token} — {self.student_id}"


# ── Results (written via webhook from exam-engine) ─────────────────────────────

class TestResult(SchoolScopedModel):
    class CompletionReason(models.TextChoices):
        SUBMITTED    = "submitted",    "Submitted"
        TIME_EXPIRED = "time_expired", "Time Expired"
        DISCONNECTED = "disconnected", "Disconnected"

    test               = models.ForeignKey(OnlineTest, on_delete=models.CASCADE, related_name="results")
    student            = models.ForeignKey("academics.Student", on_delete=models.CASCADE, related_name="test_results")
    token              = models.OneToOneField(StudentTestToken, on_delete=models.CASCADE, related_name="result")
    score              = models.FloatField()
    max_score          = models.FloatField()
    percentage         = models.FloatField()
    grade              = models.CharField(max_length=4)
    time_taken_seconds = models.PositiveIntegerField()
    completion_reason  = models.CharField(max_length=16, choices=CompletionReason.choices)
    # Full per-question detail as received from the webhook
    answers            = models.JSONField(default=list)
    completed_at       = models.DateTimeField()
    is_published       = models.BooleanField(default=False)

    class Meta:
        unique_together = [("test", "student")]
        ordering = ["-completed_at"]

    def save(self, *args, **kwargs):
        if not self.grade:
            self.grade = _compute_grade(self.percentage)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student_id} — {self.test_id} — {self.percentage:.1f}%"


# ── Proctoring events (one per anomaly detected during the test) ───────────────

class ProctoringLog(TimestampedModel):
    class EventType(models.TextChoices):
        LOOKING_AWAY     = "looking_away",     "Looking Away"
        MULTIPLE_PEOPLE  = "multiple_people",  "Multiple People"
        PHONE_DETECTED   = "phone_detected",   "Phone Detected"
        TAB_SWITCH       = "tab_switch",       "Tab Switch"

    class Severity(models.TextChoices):
        INFO     = "info",     "Info"
        WARNING  = "warning",  "Warning"
        CRITICAL = "critical", "Critical"

    result      = models.ForeignKey(TestResult, on_delete=models.CASCADE, related_name="proctoring_events")
    event_type  = models.CharField(max_length=24, choices=EventType.choices)
    severity    = models.CharField(max_length=10, choices=Severity.choices, default=Severity.WARNING)
    occurred_at = models.DateTimeField()

    class Meta:
        ordering = ["occurred_at"]
