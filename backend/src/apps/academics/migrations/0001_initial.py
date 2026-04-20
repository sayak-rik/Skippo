import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
        ("tenancy", "0001_initial"),
    ]

    operations = [
        # ── Classroom ────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="Classroom",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=128)),
                ("section", models.CharField(blank=True, max_length=32)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
                (
                    "teacher",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="accounts.teacherprofile",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── Student ──────────────────────────────────────────────────────────
        migrations.CreateModel(
            name="Student",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("full_name", models.CharField(max_length=255)),
                ("roll_number", models.CharField(blank=True, max_length=32)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
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
                (
                    "parent",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="accounts.parentprofile",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── ClassSession ─────────────────────────────────────────────────────
        migrations.CreateModel(
            name="ClassSession",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=128)),
                ("weekday", models.PositiveSmallIntegerField(default=1)),
                ("starts_at", models.TimeField()),
                ("ends_at", models.TimeField()),
                ("sequence", models.PositiveSmallIntegerField(default=1)),
                (
                    "attendance_boundary",
                    models.CharField(
                        choices=[
                            ("none", "None"),
                            ("school_entry", "School Entry"),
                            ("school_exit", "School Exit"),
                        ],
                        default="none",
                        max_length=32,
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
                (
                    "classroom",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sessions",
                        to="academics.classroom",
                    ),
                ),
                (
                    "teacher",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="accounts.teacherprofile",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── StudentAttendance ────────────────────────────────────────────────
        migrations.CreateModel(
            name="StudentAttendance",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("date", models.DateField()),
                ("is_present", models.BooleanField(default=False)),
                (
                    "event_type",
                    models.CharField(
                        choices=[
                            ("present", "Present"),
                            ("absent", "Absent"),
                            ("school_entry", "School Entry"),
                            ("school_exit", "School Exit"),
                        ],
                        default="present",
                        max_length=32,
                    ),
                ),
                ("marked_at", models.DateTimeField(auto_now_add=True)),
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
                (
                    "session",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="academics.classsession",
                    ),
                ),
                (
                    "teacher",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="accounts.teacherprofile",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── StudentProgress ──────────────────────────────────────────────────
        migrations.CreateModel(
            name="StudentProgress",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("category", models.CharField(default="general", max_length=64)),
                ("note", models.TextField()),
                ("is_read_by_parent", models.BooleanField(default=False)),
                ("parent_read_at", models.DateTimeField(blank=True, null=True)),
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
                (
                    "session",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="academics.classsession",
                    ),
                ),
                (
                    "teacher",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="accounts.teacherprofile",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── StudentDailyReport ───────────────────────────────────────────────
        migrations.CreateModel(
            name="StudentDailyReport",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("date", models.DateField()),
                ("attendance_summary", models.CharField(blank=True, max_length=255)),
                ("teacher_comment_summary", models.TextField(blank=True)),
                ("unread_comment_count", models.PositiveIntegerField(default=0)),
                ("parent_notified_at", models.DateTimeField(blank=True, null=True)),
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
                        to="academics.student",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── ClassBroadcast ───────────────────────────────────────────────────
        migrations.CreateModel(
            name="ClassBroadcast",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("message", models.TextField()),
                (
                    "school",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="tenancy.school",
                    ),
                ),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="broadcasts",
                        to="academics.classsession",
                    ),
                ),
                (
                    "classroom",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="broadcasts",
                        to="academics.classroom",
                    ),
                ),
                (
                    "teacher",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="accounts.teacherprofile",
                    ),
                ),
            ],
            options={"abstract": False},
        ),

        # ── AssistRequest ────────────────────────────────────────────────────
        migrations.CreateModel(
            name="AssistRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("question", models.TextField()),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("resolved", "Resolved")],
                        default="pending",
                        max_length=32,
                    ),
                ),
                ("teacher_reply", models.TextField(blank=True)),
                ("resolved_at", models.DateTimeField(blank=True, null=True)),
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
                        related_name="assist_requests",
                        to="academics.student",
                    ),
                ),
                (
                    "session",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="assist_requests",
                        to="academics.classsession",
                    ),
                ),
                (
                    "classroom",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="assist_requests",
                        to="academics.classroom",
                    ),
                ),
                (
                    "resolved_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="accounts.teacherprofile",
                    ),
                ),
            ],
            options={"abstract": False},
        ),
    ]
