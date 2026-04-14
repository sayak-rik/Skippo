from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models

from common.models import SchoolScopedModel, TimestampedModel


class PlatformUser(AbstractUser):
    phone = models.CharField(max_length=20, blank=True)
    is_phone_verified = models.BooleanField(default=False)
    default_school = models.ForeignKey(
        "tenancy.School",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="default_users",
    )


class DeviceSession(TimestampedModel):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    device_id = models.CharField(max_length=128)
    platform = models.CharField(max_length=32)
    is_active = models.BooleanField(default=True)


class ParentProfile(SchoolScopedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    phone = models.CharField(max_length=20)


class TeacherProfile(SchoolScopedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    employee_code = models.CharField(max_length=64, blank=True)


class DriverProfile(SchoolScopedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    phone = models.CharField(max_length=20)
    otp_multi_device_limit = models.PositiveSmallIntegerField(default=2)
