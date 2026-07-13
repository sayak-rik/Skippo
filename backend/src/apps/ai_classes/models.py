import uuid

from django.conf import settings
from django.db import models

from common.models import SchoolScopedModel, TimestampedModel


class AIClass(SchoolScopedModel):
    """An AI teacher class session created by a school admin from the dashboard."""

    class Status(models.TextChoices):
        DRAFT    = "draft",    "Draft"
        ACTIVE   = "active",   "Active"
        ENDED    = "ended",    "Ended"

    title        = models.CharField(max_length=255)
    subject      = models.CharField(max_length=255)
    instructions = models.TextField(
        help_text="Instructions for the AI teacher: style, level, topics to cover, etc."
    )
    classroom    = models.ForeignKey(
        "academics.Classroom",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="ai_classes",
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    status       = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    created_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="created_ai_classes",
    )
    # Set by loadbalancer when the class is activated
    pod_url      = models.URLField(blank=True)
    machine_id   = models.CharField(max_length=255, blank=True)
    ended_at     = models.DateTimeField(null=True, blank=True)
    # Summary payload from the engine webhook after class ends
    class_summary = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.school_id})"


class StudentClassToken(SchoolScopedModel):
    """One unique token per student per AI class.

    The token goes in the join URL shared with parents.
    """
    ai_class   = models.ForeignKey(AIClass, on_delete=models.CASCADE, related_name="tokens")
    student    = models.ForeignKey("academics.Student", on_delete=models.CASCADE, related_name="ai_class_tokens")
    token      = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    student_name = models.CharField(max_length=120, blank=True)

    class Meta:
        unique_together = [("ai_class", "student")]

    def __str__(self):
        return f"Token {self.token} — {self.student_id}"

    def build_join_url(self, pod_url: str) -> str:
        """URL that the parent app opens in a WebView to join the class.

        The pod URL may already carry a query string (e.g. ?fly_machine_id=…
        for Fly.io machine routing), so parameters are merged, not appended.
        """
        from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

        parts = urlsplit(pod_url)
        query = parse_qsl(parts.query, keep_blank_values=True)
        query += [
            ("class_id", str(self.ai_class_id)),
            ("student_name", self.student_name or str(self.student_id)),
            ("token", str(self.token)),
        ]
        return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), ""))


class ClassFeedback(TimestampedModel):
    """Post-class feedback submitted by a student via the AI teacher frontend."""

    ai_class     = models.ForeignKey(AIClass, on_delete=models.CASCADE, related_name="feedback")
    student      = models.ForeignKey(
        "academics.Student",
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="ai_class_feedback",
    )
    student_name = models.CharField(max_length=120, blank=True)
    rating       = models.PositiveSmallIntegerField()  # 1-5
    comment      = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Feedback {self.rating}★ — {self.ai_class_id}"
