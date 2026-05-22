import decimal

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("tenancy",   "0005_tenantconfig_logo_url_and_more"),
        ("academics", "0005_student_pending_parent"),
        ("accounts",  "0005_otprequest_purpose_password_reset"),
    ]

    operations = [
        # ── RazorpayLinkedAccount ────────────────────────────────────────────
        migrations.CreateModel(
            name="RazorpayLinkedAccount",
            fields=[
                ("id",         models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("account_id", models.CharField(max_length=64, unique=True)),
                ("name",       models.CharField(max_length=255)),
                ("email",      models.EmailField(max_length=254)),
                ("status",     models.CharField(
                    choices=[("created", "Created"), ("activated", "Activated"), ("suspended", "Suspended")],
                    default="created", max_length=16,
                )),
                ("details",    models.JSONField(default=dict)),
                ("school",     models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="tenancy.school")),
            ],
            options={"abstract": False},
        ),
        migrations.AlterUniqueTogether(
            name="razorpaylinkedaccount",
            unique_together={("school",)},
        ),

        # ── FeeCategory ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name="FeeCategory",
            fields=[
                ("id",          models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at",  models.DateTimeField(auto_now_add=True)),
                ("updated_at",  models.DateTimeField(auto_now=True)),
                ("name",        models.CharField(max_length=128)),
                ("description", models.TextField(blank=True)),
                ("is_active",   models.BooleanField(default=True)),
                ("school",      models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="tenancy.school")),
            ],
            options={"ordering": ["name"], "abstract": False},
        ),
        migrations.AlterUniqueTogether(
            name="feecategory",
            unique_together={("school", "name")},
        ),

        # ── FeeStructure ─────────────────────────────────────────────────────
        migrations.CreateModel(
            name="FeeStructure",
            fields=[
                ("id",            models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at",    models.DateTimeField(auto_now_add=True)),
                ("updated_at",    models.DateTimeField(auto_now=True)),
                ("amount",        models.DecimalField(decimal_places=2, max_digits=10)),
                ("frequency",     models.CharField(
                    choices=[
                        ("monthly",   "Monthly"),
                        ("quarterly", "Quarterly"),
                        ("annual",    "Annual"),
                        ("one_time",  "One-time"),
                    ],
                    default="monthly", max_length=16,
                )),
                ("due_day",       models.PositiveSmallIntegerField(default=10)),
                ("academic_year", models.CharField(default="2025-26", max_length=9)),
                ("is_active",     models.BooleanField(default=True)),
                ("category",      models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="structures", to="payments.feecategory",
                )),
                ("classroom",     models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="fee_structures", to="academics.classroom",
                )),
                ("school",        models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="tenancy.school")),
            ],
            options={"ordering": ["category__name", "classroom__name"], "abstract": False},
        ),

        # ── FeeInvoice ───────────────────────────────────────────────────────
        migrations.CreateModel(
            name="FeeInvoice",
            fields=[
                ("id",                 models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at",         models.DateTimeField(auto_now_add=True)),
                ("updated_at",         models.DateTimeField(auto_now=True)),
                ("category_name",      models.CharField(max_length=128)),
                ("amount",             models.DecimalField(decimal_places=2, max_digits=10)),
                ("due_date",           models.DateField()),
                ("status",             models.CharField(
                    choices=[
                        ("pending",   "Pending"),
                        ("paid",      "Paid"),
                        ("overdue",   "Overdue"),
                        ("cancelled", "Cancelled"),
                    ],
                    default="pending", max_length=16,
                )),
                ("razorpay_order_id",  models.CharField(blank=True, max_length=64)),
                ("paid_at",            models.DateTimeField(blank=True, null=True)),
                ("fee_structure",      models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="invoices", to="payments.feestructure",
                )),
                ("school",             models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="tenancy.school")),
                ("student",            models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="fee_invoices", to="academics.student",
                )),
            ],
            options={"ordering": ["-due_date"], "abstract": False},
        ),

        # ── PaymentTransaction ───────────────────────────────────────────────
        migrations.CreateModel(
            name="PaymentTransaction",
            fields=[
                ("id",                  models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at",          models.DateTimeField(auto_now_add=True)),
                ("updated_at",          models.DateTimeField(auto_now=True)),
                ("razorpay_payment_id", models.CharField(max_length=64, unique=True)),
                ("razorpay_order_id",   models.CharField(max_length=64)),
                ("razorpay_signature",  models.CharField(max_length=256)),
                ("amount",              models.DecimalField(decimal_places=2, max_digits=10)),
                ("platform_fee",        models.DecimalField(decimal_places=2, default=decimal.Decimal("0"), max_digits=10)),
                ("school_amount",       models.DecimalField(decimal_places=2, max_digits=10)),
                ("transfer_id",         models.CharField(blank=True, max_length=64)),
                ("status",              models.CharField(
                    choices=[("captured", "Captured"), ("refunded", "Refunded")],
                    default="captured", max_length=16,
                )),
                ("invoice",             models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="transactions", to="payments.feeinvoice",
                )),
                ("parent",              models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="payment_transactions", to="accounts.parentprofile",
                )),
                ("school",              models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="payment_transactions", to="tenancy.school",
                )),
            ],
            options={"ordering": ["-created_at"], "abstract": False},
        ),
    ]
