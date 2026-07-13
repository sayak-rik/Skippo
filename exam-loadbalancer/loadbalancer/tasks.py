import logging
import time

from celery import shared_task
from django.conf import settings

from . import registry
from .models import ExamPodRegistry

log = logging.getLogger(__name__)


@shared_task(name="loadbalancer.tasks.destroy_idle_pod")
def destroy_idle_pod(machine_id: str) -> dict:
    """Destroy a Fly machine once it has been idle (0 sessions) for the grace period.

    Safe to call if sessions have since resumed — checks count before destroying.
    """
    from .exceptions import FlyMachineError
    from .pod_provider import get_pod_client

    count = registry.get_pod_session_count(machine_id)
    if count > 0:
        log.info("destroy_idle_pod: pod still has sessions machine_id=%s count=%s — skipping", machine_id, count)
        return {"machine_id": machine_id, "destroyed": False, "reason": "still_active"}

    log.info("destroy_idle_pod: destroying idle pod machine_id=%s", machine_id)

    try:
        result = get_pod_client().delete_machine(machine_id)
    except FlyMachineError as exc:
        log.error("destroy_idle_pod: pod delete failed machine_id=%s error=%s", machine_id, exc)
        result = {"is_deleted": False}

    try:
        db_record = ExamPodRegistry.objects.get(machine_id=machine_id)
        db_record.soft_delete()
        db_record.machine_state = ExamPodRegistry.MachineState.DESTROYED
        db_record.save(update_fields=["machine_state", "deleted_at", "allocation_status", "updated_at"])
        # Remove from test pod list
        registry.remove_pod_from_test(db_record.test_id, machine_id)
    except ExamPodRegistry.DoesNotExist:
        pass

    registry.delete_all_pod_state(machine_id)

    log.info(
        "destroy_idle_pod: completed machine_id=%s is_deleted=%s",
        machine_id, result.get("is_deleted"),
    )
    return {"machine_id": machine_id, "destroyed": result.get("is_deleted", False)}


@shared_task(name="loadbalancer.tasks.cleanup_stale_pods")
def cleanup_stale_pods() -> dict:
    """Sweep all heartbeats and destroy machines silent for > POD_HEARTBEAT_TIMEOUT_SECONDS.

    Runs every 5 minutes via Celery beat.  Acts as a safety net in case
    destroy_idle_pod was never called (e.g. pod crashed before calling release-session).
    """
    timeout = settings.POD_HEARTBEAT_TIMEOUT_SECONDS
    now = int(time.time())

    heartbeats = registry.get_all_pod_heartbeats()
    stale = []
    for machine_id, ts in heartbeats.items():
        age = now - ts
        if age > timeout:
            stale.append(machine_id)
            log.info("cleanup_stale_pods: stale pod machine_id=%s age=%ss", machine_id, age)

    for machine_id in stale:
        destroy_idle_pod.delay(machine_id)

    log.info("cleanup_stale_pods: found %d stale pods", len(stale))
    return {"stale_found": len(stale), "machine_ids": stale}
