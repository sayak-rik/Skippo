from decimal import Decimal

from django.db import models

from common.models import SchoolScopedModel, TimestampedModel


class RazorpayLinkedAccount(SchoolScopedModel):
    """Razorpay Route linked account — one per school (sub-merchant)."""

    class Status(models.TextChoices):
        CREATED    = "created",    "Created"
        ACTIVATED  = "activated",  "Activated"
        SUSPENDED  = "suspended",  "Suspended"

    account_id = models.CharField(max_length=64, unique=True)
    name       = models.CharField(max_length=255)
    email      = models.EmailField()
    status     = models.CharField(max_length=16, choices=Status.choices, default=Status.CREATED)
    details    = models.JSONField(default=dict)

    class Meta:
        unique_together = [("school",)]

    def __str__(self):
        return f"{self.school.name} — {self.account_id} [{self.status}]"


class FeeCategory(SchoolScopedModel):
    """Admin-defined fee type, e.g. Tuition, Transport, Lab Fee."""

    name        = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    is_active   = models.BooleanField(default=True)

    class Meta:
        unique_together = [("school", "name")]
        ordering        = ["name"]

    def __str__(self):
        return self.name


class FeeStructure(SchoolScopedModel):
    """
    Defines how much a student (optionally per classroom) owes for a
    given fee category, at a given frequency.  Invoices are generated
    from this template by the Celery task or manually by the admin.
    """

    class Frequency(models.TextChoices):
        MONTHLY   = "monthly",   "Monthly"
        QUARTERLY = "quarterly", "Quarterly"
        ANNUAL    = "annual",    "Annual"
        ONE_TIME  = "one_time",  "One-time"

    category      = models.ForeignKey(FeeCategory, on_delete=models.CASCADE, related_name="structures")
    classroom     = models.ForeignKey(
        "academics.Classroom", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="fee_structures",
    )
    amount        = models.DecimalField(max_digits=10, decimal_places=2)
    frequency     = models.CharField(max_length=16, choices=Frequency.choices, default=Frequency.MONTHLY)
    due_day       = models.PositiveSmallIntegerField(default=10)  # day-of-month payment is due
    academic_year = models.CharField(max_length=9, default="2025-26")
    is_active     = models.BooleanField(default=True)

    class Meta:
        ordering = ["category__name", "classroom__name"]

    def __str__(self):
        cls = self.classroom.name if self.classroom_id else "All classes"
        return f"{self.category.name} — {cls} — ₹{self.amount} ({self.frequency})"


class FeeInvoice(SchoolScopedModel):
    """Per-student invoice.  One row per billing period per student per category."""

    class Status(models.TextChoices):
        PENDING   = "pending",   "Pending"
        PAID      = "paid",      "Paid"
        OVERDUE   = "overdue",   "Overdue"
        CANCELLED = "cancelled", "Cancelled"

    student           = models.ForeignKey(
        "academics.Student", on_delete=models.CASCADE, related_name="fee_invoices",
    )
    fee_structure     = models.ForeignKey(
        FeeStructure, null=True, blank=True, on_delete=models.SET_NULL, related_name="invoices",
    )
    category_name     = models.CharField(max_length=128)   # snapshot — survives category rename
    amount            = models.DecimalField(max_digits=10, decimal_places=2)
    due_date          = models.DateField()
    status            = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    razorpay_order_id = models.CharField(max_length=64, blank=True)
    paid_at           = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-due_date"]

    def __str__(self):
        return f"Invoice #{self.pk} — {self.student.full_name} — ₹{self.amount} [{self.status}]"


class PaymentTransaction(TimestampedModel):
    """Immutable record of every captured Razorpay payment + Route transfer details."""

    class Status(models.TextChoices):
        CAPTURED = "captured", "Captured"
        REFUNDED = "refunded", "Refunded"

    invoice             = models.ForeignKey(FeeInvoice, on_delete=models.PROTECT, related_name="transactions")
    school              = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="payment_transactions")
    parent              = models.ForeignKey("accounts.ParentProfile", on_delete=models.CASCADE, related_name="payment_transactions")
    razorpay_payment_id = models.CharField(max_length=64, unique=True)
    razorpay_order_id   = models.CharField(max_length=64)
    razorpay_signature  = models.CharField(max_length=256)
    amount              = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee        = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    school_amount       = models.DecimalField(max_digits=10, decimal_places=2)
    transfer_id         = models.CharField(max_length=64, blank=True)  # Razorpay Route transfer ID
    status              = models.CharField(max_length=16, choices=Status.choices, default=Status.CAPTURED)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Txn {self.razorpay_payment_id} — ₹{self.amount}"
