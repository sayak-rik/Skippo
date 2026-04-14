from django.db import models

from common.models import SchoolScopedModel, TimestampedModel


class ComplianceDocument(SchoolScopedModel):
    owner_type = models.CharField(max_length=32)
    owner_id = models.PositiveBigIntegerField()
    document_type = models.CharField(max_length=64)
    expires_on = models.DateField(null=True, blank=True)
    file_key = models.CharField(max_length=255, blank=True)


class RenewalReminder(TimestampedModel):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE)
    document = models.ForeignKey(ComplianceDocument, on_delete=models.CASCADE)
    remind_on = models.DateField()
    sent = models.BooleanField(default=False)
