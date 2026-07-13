import uuid

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


class DigiLockerVerification(SchoolScopedModel):
    """One DigiLocker document-verification attempt for a driver.

    Real mode: an OAuth consent URL is issued; the driver approves in
    DigiLocker and the callback pulls the issued document (e.g. driving
    licence) to verify it.  Mock mode (no DIGILOCKER_* credentials
    configured) verifies instantly with a clearly-marked mock payload so the
    pipeline can be exercised in local/demo environments.
    """

    class DocType(models.TextChoices):
        DRIVING_LICENSE = "driving_license", "Driving License"
        AADHAAR         = "aadhaar",         "Aadhaar"

    class Status(models.TextChoices):
        PENDING     = "pending",     "Pending"
        IN_PROGRESS = "in_progress", "Awaiting DigiLocker consent"
        VERIFIED    = "verified",    "Verified"
        FAILED      = "failed",      "Failed"

    driver          = models.ForeignKey(
        "accounts.DriverProfile", on_delete=models.CASCADE,
        related_name="digilocker_verifications",
    )
    doc_type        = models.CharField(max_length=32, choices=DocType.choices,
                                       default=DocType.DRIVING_LICENSE)
    # Number the school claims for the driver (e.g. DL number); compared
    # against what DigiLocker returns.
    document_number = models.CharField(max_length=64, blank=True)
    status          = models.CharField(max_length=16, choices=Status.choices,
                                       default=Status.PENDING, db_index=True)
    # Opaque id used as the OAuth `state` param to match the callback
    request_id      = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    # "digilocker" for real verifications, "mock" when credentials are absent
    provider        = models.CharField(max_length=16, blank=True)
    # Raw document payload returned by DigiLocker (or the mock payload)
    provider_payload = models.JSONField(default=dict, blank=True)
    failure_reason  = models.TextField(blank=True)
    verified_at     = models.DateTimeField(null=True, blank=True)
    initiated_by    = models.ForeignKey(
        "accounts.PlatformUser", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="initiated_digilocker_verifications",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"DigiLocker {self.doc_type} — driver={self.driver_id} — {self.status}"
