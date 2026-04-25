import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("reports", "0001_initial"),
        ("academics", "0003_ai_teaching_assistant"),
        ("tenancy", "0002_tenantconfig_ai_tokens_per_teacher_per_day"),
    ]

    operations = [
        migrations.CreateModel(
            name="WeeklyStudentDigest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("week_start", models.DateField()),
                ("days_present", models.PositiveSmallIntegerField(default=0)),
                ("days_absent", models.PositiveSmallIntegerField(default=0)),
                ("attendance_pct", models.FloatField(default=0.0)),
                ("strengths_summary", models.TextField(blank=True)),
                ("weaknesses_summary", models.TextField(blank=True)),
                ("teacher_highlights", models.TextField(blank=True)),
                ("overall_summary", models.TextField(blank=True)),
                ("raw_progress_notes", models.JSONField(default=list)),
                ("notified_parents_at", models.DateTimeField(blank=True, null=True)),
                (
                    "school",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="tenancy.school"),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="weekly_digests",
                        to="academics.student",
                    ),
                ),
            ],
            options={
                "ordering": ["-week_start"],
                "unique_together": {("student", "week_start")},
            },
        ),
    ]
