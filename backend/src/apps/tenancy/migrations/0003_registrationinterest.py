from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenancy", "0002_tenantconfig_ai_tokens_per_teacher_per_day"),
    ]

    operations = [
        migrations.CreateModel(
            name="RegistrationInterest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("enquiry_type", models.CharField(blank=True, max_length=64)),
                ("name",         models.CharField(max_length=255)),
                ("email",        models.EmailField(max_length=254)),
                ("phone",        models.CharField(blank=True, max_length=30)),
                ("school_name",  models.CharField(blank=True, max_length=255)),
                ("message",      models.TextField(blank=True)),
                ("status",       models.CharField(
                    choices=[("pending", "Pending"), ("contacted", "Contacted"), ("onboarded", "Onboarded")],
                    default="pending", max_length=20,
                )),
                ("admin_notes",  models.TextField(blank=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
