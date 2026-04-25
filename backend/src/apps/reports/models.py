from django.db import models

from common.models import TimestampedModel


class WeeklyStudentDigest(TimestampedModel):
    """AI-generated weekly report card for a student, delivered to parents via the app."""

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    student = models.ForeignKey("academics.Student", on_delete=models.CASCADE, related_name="weekly_digests")
    week_start = models.DateField()

    # Attendance
    days_present = models.PositiveSmallIntegerField(default=0)
    days_absent = models.PositiveSmallIntegerField(default=0)
    attendance_pct = models.FloatField(default=0.0)

    # AI-generated narrative (Gemini)
    strengths_summary = models.TextField(blank=True)
    weaknesses_summary = models.TextField(blank=True)
    teacher_highlights = models.TextField(blank=True)
    overall_summary = models.TextField(blank=True)

    # Raw data snapshot used for generation
    raw_progress_notes = models.JSONField(default=list)

    notified_parents_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [("student", "week_start")]
        ordering = ["-week_start"]
