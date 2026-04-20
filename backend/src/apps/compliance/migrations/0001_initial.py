import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("tenancy", "0001_initial"),
    ]

    operations = [
        # ── ComplianceDocument ────────────────────────────────────────────────
        migrations.CreateModel(
            name="ComplianceDocument",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("owner_type", models.CharField(max_length=32)),
                ("owner_id", models.PositiveBigIntegerField()),
                ("document_type", models.CharField(max_length=64)),
                ("expires_on", models.DateField(blank=True, null=True)),
                ("file_key", models.CharField(blank=True, max_length=255)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── RenewalReminder ───────────────────────────────────────────────────
        migrations.CreateModel(
            name="RenewalReminder",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("remind_on", models.DateField()),
                ("sent", models.BooleanField(default=False)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
                (
                    "document",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="compliance.compliancedocument",
                    ),
                ),
            ],
            options={"abstract": False},
        ),
    ]
