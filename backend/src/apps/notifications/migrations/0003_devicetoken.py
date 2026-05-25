import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_teacher_google_auth"),
        ("notifications", "0002_alter_emergencyevent_id_alter_notificationlog_id"),
    ]

    operations = [
        migrations.CreateModel(
            name="DeviceToken",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("token", models.CharField(max_length=512, unique=True)),
                ("platform", models.CharField(blank=True, max_length=16)),
                (
                    "parent",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="device_tokens",
                        to="accounts.parentprofile",
                    ),
                ),
            ],
            options={"abstract": False},
        ),
        migrations.AddIndex(
            model_name="devicetoken",
            index=models.Index(fields=["parent"], name="notif_devicetoken_parent_idx"),
        ),
    ]
