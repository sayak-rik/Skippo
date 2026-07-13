import logging

from celery import shared_task

log = logging.getLogger(__name__)


@shared_task
def notify_class_started(class_id: int) -> None:
    """Push notification to all linked parents when an AI class goes live."""
    from apps.ai_classes.models import AIClass, StudentClassToken
    from apps.notifications.push import notify_parents_of_students

    try:
        ai_class = AIClass.objects.select_related("school").get(id=class_id)
    except AIClass.DoesNotExist:
        return

    student_ids = list(ai_class.tokens.values_list("student_id", flat=True))
    if not student_ids:
        return

    notify_parents_of_students(
        student_ids=student_ids,
        title=f"AI Class Starting: {ai_class.title}",
        body=f"Your child's {ai_class.subject} AI class is live. Tap to join.",
        data={"type": "ai_class", "class_id": str(ai_class.id)},
    )
    log.info("notify_class_started: notified %d students class_id=%s", len(student_ids), class_id)


@shared_task
def notify_class_ended(class_id: int) -> None:
    """Notify parents that a class has ended and feedback is available."""
    from apps.ai_classes.models import AIClass
    from apps.notifications.push import notify_parents_of_students

    try:
        ai_class = AIClass.objects.get(id=class_id)
    except AIClass.DoesNotExist:
        return

    student_ids = list(ai_class.tokens.values_list("student_id", flat=True))
    if not student_ids:
        return

    notify_parents_of_students(
        student_ids=student_ids,
        title=f"Class Ended: {ai_class.title}",
        body=f"The {ai_class.subject} AI class has ended. Tap to leave feedback.",
        data={"type": "ai_class_ended", "class_id": str(ai_class.id)},
    )
