from django.db import models

from common.models import TimestampedModel


class School(TimestampedModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)


class SchoolDomain(TimestampedModel):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="domains")
    domain = models.CharField(max_length=255, unique=True)
    is_primary = models.BooleanField(default=False)


class TenantConfig(TimestampedModel):
    school = models.OneToOneField(School, on_delete=models.CASCADE, related_name="config")
    brand_name = models.CharField(max_length=255, blank=True)
    timezone = models.CharField(max_length=64, default="Asia/Kolkata")
    feature_flags = models.JSONField(default=dict, blank=True)
