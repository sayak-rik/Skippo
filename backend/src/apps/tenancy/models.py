from django.db import models
from django.utils.text import slugify

from common.models import TimestampedModel


class RegistrationInterest(TimestampedModel):
    STATUS_PENDING    = "pending"
    STATUS_CONTACTED  = "contacted"
    STATUS_ONBOARDED  = "onboarded"
    STATUS_CHOICES = [
        (STATUS_PENDING,   "Pending"),
        (STATUS_CONTACTED, "Contacted"),
        (STATUS_ONBOARDED, "Onboarded"),
    ]

    enquiry_type = models.CharField(max_length=64, blank=True)
    name         = models.CharField(max_length=255)
    email        = models.EmailField()
    phone        = models.CharField(max_length=30, blank=True)
    school_name  = models.CharField(max_length=255, blank=True)
    message      = models.TextField(blank=True)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    admin_notes  = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.email}) — {self.status}"


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
    ai_tokens_per_teacher_per_day = models.PositiveSmallIntegerField(default=5)
    logo_url = models.URLField(blank=True, default="")
    onboarding_complete = models.BooleanField(default=False)
