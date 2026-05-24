from django.db import models
from common.models import TimestampedModel


class DismissalIntent(TimestampedModel):
    class Status(models.TextChoices):
        PENDING   = "pending",   "Pending"
        NOTIFIED  = "notified",  "Notified"
        COMPLETED = "completed", "Completed"

    school   = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    student  = models.ForeignKey("academics.Student", on_delete=models.CASCADE, related_name="dismissal_intents")
    parent   = models.ForeignKey("accounts.ParentProfile", null=True, blank=True, on_delete=models.SET_NULL)
    eta_minutes  = models.PositiveSmallIntegerField(default=5)
    status       = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    notified_at  = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
