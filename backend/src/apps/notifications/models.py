from django.db import models

from common.models import SchoolScopedModel, TimestampedModel


class DeviceToken(TimestampedModel):
    """Expo push token registered by a parent's device."""

    parent = models.ForeignKey(
        "accounts.ParentProfile",
        on_delete=models.CASCADE,
        related_name="device_tokens",
    )
    token = models.CharField(max_length=512, unique=True)
    platform = models.CharField(max_length=16, blank=True)

    class Meta:
        indexes = [models.Index(fields=["parent"])]


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
