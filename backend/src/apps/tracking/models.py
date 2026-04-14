from django.db import models

from common.models import SchoolScopedModel, TimestampedModel


class Trip(SchoolScopedModel):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"

    route = models.ForeignKey("transport.Route", on_delete=models.CASCADE)
    vehicle = models.ForeignKey("transport.Vehicle", on_delete=models.CASCADE)
    driver = models.ForeignKey("accounts.DriverProfile", on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)


class LiveLocation(TimestampedModel):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="locations")
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    speed = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    heading = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    accuracy = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    provider = models.CharField(max_length=32, default="google_maps")

    class Meta:
        ordering = ["-created_at"]
