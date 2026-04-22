import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
        ("tenancy", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="OTPRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("contact", models.CharField(max_length=255)),
                (
                    "channel",
                    models.CharField(
                        choices=[("sms", "SMS"), ("email", "Email")],
                        max_length=8,
                    ),
                ),
                (
                    "role",
                    models.CharField(
                        choices=[("parent", "Parent"), ("driver", "Driver")],
                        max_length=16,
                    ),
                ),
                (
                    "purpose",
                    models.CharField(
                        choices=[("login", "Login"), ("confirm_action", "Confirm Action")],
                        default="login",
                        max_length=20,
                    ),
                ),
                ("code_hash", models.CharField(max_length=64)),
                ("expires_at", models.DateTimeField()),
                ("is_used", models.BooleanField(default=False)),
                ("attempts", models.PositiveSmallIntegerField(default=0)),
                ("context", models.JSONField(blank=True, default=dict)),
                (
                    "school",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="tenancy.school",
                    ),
                ),
            ],
            options={"abstract": False},
        ),
    ]
