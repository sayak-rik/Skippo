from django.db import models

from common.models import SchoolScopedModel, TimestampedModel


class NotificationLog(SchoolScopedModel):
    channel = models.CharField(max_length=32)
    recipient = models.CharField(max_length=255)
    event_type = models.CharField(max_length=64)
    payload = models.JSONField(default=dict, blank=True)


class EmergencyEvent(TimestampedModel):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    trip = models.ForeignKey("tracking.Trip", null=True, blank=True, on_delete=models.SET_NULL)
    triggered_by = models.ForeignKey("accounts.DriverProfile", null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=32, default="open")
