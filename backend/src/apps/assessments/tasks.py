import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

log = logging.getLogger(__name__)


@shared_task(name="assessments.close_expired_tests")
def close_expired_tests() -> None:
    """Mark published tests as closed once available_until has passed.

    Intended to run every 5 minutes via Celery beat.
    """
    from apps.assessments.models import OnlineTest

    expired = OnlineTest.objects.filter(
        status=OnlineTest.Status.PUBLISHED,
        available_until__lte=timezone.now(),
    )
    count = expired.update(status=OnlineTest.Status.CLOSED)
    if count:
        log.info("Closed %d expired online tests.", count)


@shared_task(name="assessments.notify_result_published")
def notify_result_published(result_id: int) -> None:
    """Push a notification to the parent when a teacher publishes a result."""
    from apps.assessments.models import TestResult
    from apps.notifications.push import notify_parents_of_students

    try:
        result = TestResult.objects.select_related("test", "student").get(id=result_id)
    except TestResult.DoesNotExist:
        return

    notify_parents_of_students(
        student_ids=[result.student_id],
        title=f"Test Result: {result.test.title}",
        body=f"{result.student.full_name} scored {result.percentage:.0f}% ({result.grade}).",
        data={"type": "test_result", "test_id": str(result.test_id), "result_id": str(result.id)},
    )


@shared_task(name="assessments.notify_teacher_result_received")
def notify_teacher_result_received(result_id: int) -> None:
    """Log when a student result is recorded.

    Full teacher push notifications will be wired in once the teacher app
    registers device tokens (DeviceToken model is currently parent-only).
    """
    from apps.assessments.models import TestResult

    try:
        result = TestResult.objects.select_related("test", "student").get(id=result_id)
    except TestResult.DoesNotExist:
        return

    log.info(
        "Test result recorded: test=%s student=%s score=%.1f%%",
        result.test_id, result.student_id, result.percentage,
    )
