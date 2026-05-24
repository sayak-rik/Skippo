from celery import shared_task
from django.utils import timezone
from datetime import timedelta


@shared_task
def expire_old_pickup_intents() -> int:
    """Auto-expire pickup intents older than 3 hours.

    Marks lingering 'pending' and 'notified' intents as completed so the
    queue stays clean.  Returns the number of intents expired.
    """
    from apps.dismissal.models import DismissalIntent
    cutoff = timezone.now() - timedelta(hours=3)
    expired = DismissalIntent.objects.filter(
        status__in=["pending", "notified"],
        created_at__lt=cutoff,
    ).update(status="completed", completed_at=timezone.now())
    return expired
