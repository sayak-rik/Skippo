from django.conf import settings
from django.db import models

from common.models import SchoolScopedModel, TimestampedModel


# ── Token system ──────────────────────────────────────────────────────────────

class CallTokenBalance(SchoolScopedModel):
    """One row per school — atomic balance counter."""
    balance = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = [("school",)]

    def __str__(self):
        return f"{self.school} — {self.balance} tokens"


class CallTokenTransaction(TimestampedModel):
    """Immutable ledger entry: +N (top-up / grant) or -1 (per call)."""
    school       = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="token_transactions")
    delta        = models.IntegerField()            # positive = credit, negative = debit
    reason       = models.CharField(max_length=64)  # 'admin_grant' | 'call_request' | 'campaign'
    call_request = models.ForeignKey("CallRequest", null=True, blank=True, on_delete=models.SET_NULL)
    campaign     = models.ForeignKey("CallCampaign", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["-created_at"]


# ── FAQ ───────────────────────────────────────────────────────────────────────

class CallFAQ(models.Model):
    """Global FAQ entries shown in the parent app Support tab."""
    question  = models.TextField()
    answer    = models.TextField()
    category  = models.CharField(max_length=64, default="General")
    order     = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.question[:60]


# ── Parent-initiated call requests ────────────────────────────────────────────

class CallRequest(SchoolScopedModel):
    class Status(models.TextChoices):
        PENDING   = "pending",   "Pending"
        APPROVED  = "approved",  "Approved"
        REJECTED  = "rejected",  "Rejected"
        CALLING   = "calling",   "Calling"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class ReasonCategory(models.TextChoices):
        ACADEMIC    = "academic",    "Academic concern"
        BEHAVIORAL  = "behavioral",  "Behavioural concern"
        TRANSPORT   = "transport",   "Transport issue"
        FEES        = "fees",        "Fees enquiry"
        GENERAL     = "general",     "General enquiry"

    parent          = models.ForeignKey("accounts.ParentProfile", on_delete=models.CASCADE, related_name="call_requests")
    reason_category = models.CharField(max_length=32, choices=ReasonCategory.choices)
    reason_text     = models.TextField(blank=True)
    status          = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    call_uuid       = models.CharField(max_length=64, blank=True)
    approved_by     = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    approved_at     = models.DateTimeField(null=True, blank=True)
    dashboard_notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Request #{self.pk} — {self.parent} [{self.status}]"


# ── School-initiated mass campaigns ───────────────────────────────────────────

class CallCampaign(SchoolScopedModel):
    class Status(models.TextChoices):
        DRAFT     = "draft",     "Draft"
        APPROVED  = "approved",  "Approved"
        QUEUED    = "queued",    "Queued"
        RUNNING   = "running",   "Running"
        PAUSED    = "paused",    "Paused"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class Objective(models.TextChoices):
        GUARDIAN_MEET        = "guardian_meet",        "Guardian Meeting"
        CAREER_GUIDANCE      = "career_guidance",      "Career Guidance"
        GENERAL_NOTIFICATION = "general_notification", "General Notification"

    class TargetType(models.TextChoices):
        CLASS = "class", "Specific Classes"
        GRADE = "grade", "Specific Grades"
        ALL   = "all",   "All Parents"

    name                = models.CharField(max_length=255)
    # The reason / message context — entered manually by dashboard user; fed to LLM.
    reason_text         = models.TextField()
    objective           = models.CharField(max_length=32, choices=Objective.choices)
    target_type         = models.CharField(max_length=16, choices=TargetType.choices)
    target_ids          = models.JSONField(default=list)  # classroom IDs or grade strings
    status              = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    rate_limit_per_hour = models.PositiveIntegerField(default=20)
    total_calls         = models.PositiveIntegerField(default=0)
    completed_calls     = models.PositiveIntegerField(default=0)
    failed_calls        = models.PositiveIntegerField(default=0)
    tokens_estimated    = models.PositiveIntegerField(default=0)
    tokens_used         = models.PositiveIntegerField(default=0)
    created_by          = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    scheduled_at        = models.DateTimeField(null=True, blank=True)
    started_at          = models.DateTimeField(null=True, blank=True)
    completed_at        = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Campaign '{self.name}' [{self.status}]"


# ── Individual call within a campaign ─────────────────────────────────────────

class CampaignCall(TimestampedModel):
    """
    One record per unique parent in the campaign.
    student_ids holds ALL students of that parent who are in the target group
    so the LLM can reference them all in one call — no duplicate calls.
    """
    class Status(models.TextChoices):
        QUEUED    = "queued",    "Queued"
        CALLING   = "calling",   "Calling"
        COMPLETED = "completed", "Completed"
        FAILED    = "failed",    "Failed"
        SKIPPED   = "skipped",   "Skipped"

    campaign      = models.ForeignKey(CallCampaign, on_delete=models.CASCADE, related_name="calls")
    school        = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    parent        = models.ForeignKey("accounts.ParentProfile", on_delete=models.CASCADE)
    student_ids   = models.JSONField(default=list)
    call_uuid     = models.CharField(max_length=64, blank=True)
    status        = models.CharField(max_length=16, choices=Status.choices, default=Status.QUEUED)
    attempt_count = models.PositiveSmallIntegerField(default=0)
    called_at     = models.DateTimeField(null=True, blank=True)
    outcome       = models.CharField(max_length=32, blank=True)

    class Meta:
        unique_together = [("campaign", "parent")]
        ordering = ["created_at"]
