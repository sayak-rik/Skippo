import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0002_student_parents_m2m"),
        ("accounts", "0001_initial"),
        ("tenancy", "0002_tenantconfig_ai_tokens_per_teacher_per_day"),
    ]

    operations = [
        migrations.CreateModel(
            name="TeacherAITokenUsage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("date", models.DateField()),
                ("tokens_used", models.PositiveSmallIntegerField(default=0)),
                (
                    "school",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="tenancy.school"),
                ),
                (
                    "teacher",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="accounts.teacherprofile"
                    ),
                ),
            ],
            options={"unique_together": {("teacher", "date")}},
        ),
        migrations.CreateModel(
            name="LessonPlan",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("subject", models.CharField(max_length=128)),
                ("topic", models.CharField(max_length=255)),
                ("duration_minutes", models.PositiveSmallIntegerField(default=45)),
                ("content", models.TextField()),
                (
                    "school",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="tenancy.school"),
                ),
                (
                    "teacher",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="accounts.teacherprofile"
                    ),
                ),
                (
                    "classroom",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="academics.classroom",
                    ),
                ),
            ],
            options={"abstract": False},
        ),
        migrations.CreateModel(
            name="ClassSummary",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("date", models.DateField()),
                ("summary_text", models.TextField()),
                ("weak_students", models.JSONField(default=list)),
                ("revision_topics", models.JSONField(default=list)),
                (
                    "school",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="tenancy.school"),
                ),
                (
                    "teacher",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="accounts.teacherprofile"
                    ),
                ),
                (
                    "classroom",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="academics.classroom",
                    ),
                ),
            ],
            options={"abstract": False},
        ),
        migrations.CreateModel(
            name="TeacherVoiceObservation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("raw_transcript", models.TextField()),
                ("structured_note", models.TextField()),
                ("category", models.CharField(default="observation", max_length=64)),
                (
                    "school",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="tenancy.school"),
                ),
                (
                    "teacher",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="accounts.teacherprofile"
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="academics.student",
                    ),
                ),
                (
                    "classroom",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="academics.classroom",
                    ),
                ),
            ],
            options={"abstract": False},
        ),
    ]
