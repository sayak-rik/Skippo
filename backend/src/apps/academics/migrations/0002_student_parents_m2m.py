import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0001_initial"),
        ("accounts", "0001_initial"),
        ("tenancy", "0001_initial"),
    ]

    operations = [
        # Remove the old single-parent FK from Student
        migrations.RemoveField(
            model_name="student",
            name="parent",
        ),

        # Add the StudentParentLink through table
        migrations.CreateModel(
            name="StudentParentLink",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_primary", models.BooleanField(default=True)),
                (
                    "source",
                    models.CharField(
                        choices=[
                            ("admin", "Admin"),
                            ("qr_scan", "QR Scan"),
                            ("direct", "Direct"),
                        ],
                        default="admin",
                        max_length=16,
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
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="parent_links",
                        to="academics.student",
                    ),
                ),
                (
                    "parent",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="student_links",
                        to="accounts.parentprofile",
                    ),
                ),
            ],
            options={
                "abstract": False,
                "unique_together": {("student", "parent")},
            },
        ),

        # Wire up the M2M on Student (uses the through table)
        migrations.AddField(
            model_name="student",
            name="parents",
            field=models.ManyToManyField(
                blank=True,
                related_name="students",
                through="academics.studentparentlink",
                to="accounts.parentprofile",
            ),
        ),
    ]
