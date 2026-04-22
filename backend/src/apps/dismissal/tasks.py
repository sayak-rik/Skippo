from celery import shared_task

from common.demo_state import STATE


@shared_task
def expire_old_pickup_intents() -> int:
    """Auto-expire pickup intents older than 3 hours.

    In the demo this marks lingering 'pending' intents as completed so the
    queue stays clean across restarts.  In production this would hit the DB.
    Returns the number of intents expired.
    """
    # Demo timestamp cutoff — intents created before 14:00 today are expired.
    cutoff_prefix = "2026-04-22T14:00"
    expired = 0
    for intent in STATE["pickupIntents"]:
        if (
            intent["status"] == "pending"
            and intent["created_at"] < cutoff_prefix
        ):
            intent["status"] = "completed"
            intent["completed_at"] = "2026-04-22T17:00:00+05:30"
            expired += 1
    return expired
