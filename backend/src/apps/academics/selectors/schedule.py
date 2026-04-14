from datetime import datetime

from django.db.models import BooleanField, Case, Prefetch, Value, When
from django.utils import timezone

from apps.academics.models import ClassSession, Classroom, Student, StudentDailyReport, StudentProgress


def teacher_schedule_queryset(*, teacher_id):
    now = timezone.localtime()
    current_weekday = now.isoweekday()
    current_time = now.time()
    return (
        ClassSession.objects.select_related("classroom", "teacher")
        .filter(teacher_id=teacher_id, is_active=True)
        .annotate(
            is_current=Case(
                When(
                    weekday=current_weekday,
                    starts_at__lte=current_time,
                    ends_at__gte=current_time,
                    then=Value(True),
                ),
                default=Value(False),
                output_field=BooleanField(),
            )
        )
        .order_by("-is_current", "weekday", "starts_at", "sequence")
    )


def classroom_roster_queryset(*, classroom_id):
    return Student.objects.filter(classroom_id=classroom_id).order_by("roll_number", "full_name")


def unread_parent_comments_queryset(*, student_id):
    return StudentProgress.objects.filter(student_id=student_id, is_read_by_parent=False).order_by("-created_at")


def daily_reports_queryset(*, student_id):
    return StudentDailyReport.objects.filter(student_id=student_id).order_by("-date")
