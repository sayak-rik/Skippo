import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
        ("tenancy", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── CallTokenBalance ─────────────────────────────────────────────────
        migrations.CreateModel(
            name="CallTokenBalance",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("balance", models.PositiveIntegerField(default=0)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
            ],
            options={
                "unique_together": {("school",)},
                "abstract": False,
            },
        ),

        # ── CallFAQ ──────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="CallFAQ",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("question", models.TextField()),
                ("answer", models.TextField()),
                ("category", models.CharField(default="General", max_length=64)),
                ("order", models.PositiveSmallIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"ordering": ["order"]},
        ),

        # ── CallCampaign ─────────────────────────────────────────────────────
        migrations.CreateModel(
            name="CallCampaign",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=255)),
                ("reason_text", models.TextField()),
                (
                    "objective",
                    models.CharField(
                        choices=[
                            ("guardian_meet", "Guardian Meeting"),
                            ("career_guidance", "Career Guidance"),
                            ("general_notification", "General Notification"),
                        ],
                        max_length=32,
                    ),
                ),
                (
                    "target_type",
                    models.CharField(
                        choices=[
                            ("class", "Specific Classes"),
                            ("grade", "Specific Grades"),
                            ("all", "All Parents"),
                        ],
                        max_length=16,
                    ),
                ),
                ("target_ids", models.JSONField(default=list)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("approved", "Approved"),
                            ("queued", "Queued"),
                            ("running", "Running"),
                            ("paused", "Paused"),
                            ("completed", "Completed"),
                            ("cancelled", "Cancelled"),
                        ],
                        default="draft",
                        max_length=16,
                    ),
                ),
                ("rate_limit_per_hour", models.PositiveIntegerField(default=20)),
                ("total_calls", models.PositiveIntegerField(default=0)),
                ("completed_calls", models.PositiveIntegerField(default=0)),
                ("failed_calls", models.PositiveIntegerField(default=0)),
                ("tokens_estimated", models.PositiveIntegerField(default=0)),
                ("tokens_used", models.PositiveIntegerField(default=0)),
                ("scheduled_at", models.DateTimeField(blank=True, null=True)),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
                "abstract": False,
            },
        ),

        # ── CallRequest ──────────────────────────────────────────────────────
        migrations.CreateModel(
            name="CallRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "reason_category",
                    models.CharField(
                        choices=[
                            ("academic", "Academic concern"),
                            ("behavioral", "Behavioural concern"),
                            ("transport", "Transport issue"),
                            ("fees", "Fees enquiry"),
                            ("general", "General enquiry"),
                        ],
                        max_length=32,
                    ),
                ),
                ("reason_text", models.TextField(blank=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                            ("calling", "Calling"),
                            ("completed", "Completed"),
                            ("cancelled", "Cancelled"),
                        ],
                        default="pending",
                        max_length=16,
                    ),
                ),
                ("call_uuid", models.CharField(blank=True, max_length=64)),
                ("approved_at", models.DateTimeField(blank=True, null=True)),
                ("dashboard_notes", models.TextField(blank=True)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
                (
                    "parent",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="call_requests",
                        to="accounts.parentprofile",
                    ),
                ),
                (
                    "approved_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
                "abstract": False,
            },
        ),

        # ── CallTokenTransaction ─────────────────────────────────────────────
        migrations.CreateModel(
            name="CallTokenTransaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("delta", models.IntegerField()),
                ("reason", models.CharField(max_length=64)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="token_transactions",
                        to="tenancy.school",
                    ),
                ),
                (
                    "call_request",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="calls.callrequest",
                    ),
                ),
                (
                    "campaign",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="calls.callcampaign",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
                "abstract": False,
            },
        ),

        # ── CampaignCall ─────────────────────────────────────────────────────
        migrations.CreateModel(
            name="CampaignCall",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("student_ids", models.JSONField(default=list)),
                ("call_uuid", models.CharField(blank=True, max_length=64)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("queued", "Queued"),
                            ("calling", "Calling"),
                            ("completed", "Completed"),
                            ("failed", "Failed"),
                            ("skipped", "Skipped"),
                        ],
                        default="queued",
                        max_length=16,
                    ),
                ),
                ("attempt_count", models.PositiveSmallIntegerField(default=0)),
                ("called_at", models.DateTimeField(blank=True, null=True)),
                ("outcome", models.CharField(blank=True, max_length=32)),
                (
                    "campaign",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="calls",
                        to="calls.callcampaign",
                    ),
                ),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
                (
                    "parent",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="accounts.parentprofile",
                    ),
                ),
            ],
            options={
                "ordering": ["created_at"],
                "unique_together": {("campaign", "parent")},
                "abstract": False,
            },
        ),
    ]
