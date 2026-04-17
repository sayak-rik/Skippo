from django.db import models

from common.models import SchoolScopedModel, TimestampedModel


class Vehicle(SchoolScopedModel):
    registration_number = models.CharField(max_length=32, unique=True)
    vehicle_type = models.CharField(max_length=32, default="bus")
    capacity = models.PositiveIntegerField(default=0)


class Route(SchoolScopedModel):
    name = models.CharField(max_length=255)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True)


class Stop(SchoolScopedModel):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="stops")
    name = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    sequence = models.PositiveIntegerField(default=0)


class DriverVehicleAssignment(TimestampedModel):
    """Links a driver to a vehicle. A driver (identified by aadhar) may have
    multiple assignments, each for a different vehicle with its own contact phone.
    """

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    driver = models.ForeignKey("accounts.DriverProfile", on_delete=models.CASCADE)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    # Phone number shown to parents for *this specific vehicle assignment*.
    # The driver may operate different buses on different shifts; each bus
    # can have a different contact number so parents always reach the right phone.
    contact_phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)


class Trip(TimestampedModel):
    """Permanent record of every completed trip (req 2).

    One record is written at the end of each trip run.  In production, this
    serves as the audit trail for billing, safety reviews, and parent queries.
    """

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    route = models.ForeignKey(Route, null=True, blank=True, on_delete=models.SET_NULL)
    vehicle = models.ForeignKey(Vehicle, null=True, blank=True, on_delete=models.SET_NULL)
    driver = models.ForeignKey(
        "accounts.DriverProfile", null=True, blank=True, on_delete=models.SET_NULL
    )
    shift = models.CharField(max_length=32, default="morning")
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.SCHEDULED)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    boarded_count = models.PositiveIntegerField(default=0)
    total_count = models.PositiveIntegerField(default=0)
    # JSON list of student names who were not dropped before trip ended (req 9)
    missed_drops = models.JSONField(default=list, blank=True)


class TripLocationPing(TimestampedModel):
    """One GPS ping from the driver app, stored every ~1 minute during an active
    trip (req 1).  The parent LiveTrackScreen polls for the latest ping.
    """

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="location_pings")
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    speed = models.FloatField(default=0)
    heading = models.FloatField(default=0)
    accuracy = models.FloatField(default=0)


class StudentStopOverride(TimestampedModel):
    """A parent-customised pick-up / drop-off stop for their ward (req 7 & 8).

    When a parent changes their child's stop the driver app immediately shows
    the new location on the RosterScreen.  A confirmed_by_driver flag tracks
    whether the driver has acknowledged the change.
    """

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    student = models.ForeignKey("academics.Student", on_delete=models.CASCADE, related_name="stop_overrides")
    stop_name = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    # True once the parent explicitly confirmed this location (req 8)
    confirmed_by_parent = models.BooleanField(default=False)
    # True once the driver acknowledged the new stop on their roster screen (req 7)
    confirmed_by_driver = models.BooleanField(default=False)
    # First-trip auto-assign flag: True when the stop was set by the system
    # from the first board event rather than a manual parent edit.
    is_auto_assigned = models.BooleanField(default=False)
