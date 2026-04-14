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
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    driver = models.ForeignKey("accounts.DriverProfile", on_delete=models.CASCADE)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
