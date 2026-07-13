import logging
import time

from celery import shared_task
from django.conf import settings

from . import registry
from .models import AITeacherPodRegistry

log = logging.getLogger(__name__)


@shared_task(name="loadbalancer.tasks.destroy_class_pod")
def destroy_class_pod(machine_id: str, class_id: str) -> dict:
    """Destroy the pod (Fly machine or local Docker container) for an ended class."""
    from .exceptions import FlyMachineError
    from .pod_provider import get_pod_client

    log.info("destroy_class_pod: destroying machine_id=%s class_id=%s", machine_id, class_id)

    try:
        result = get_pod_client().delete_machine(machine_id)
    except FlyMachineError as exc:
        log.error("destroy_class_pod: pod delete failed machine_id=%s error=%s", machine_id, exc)
        result = {"is_deleted": False}

    try:
        db = AITeacherPodRegistry.objects.get(machine_id=machine_id)
        db.mark_ended()
        db.machine_state = AITeacherPodRegistry.MachineState.DESTROYED
        db.pod_status = AITeacherPodRegistry.PodStatus.DESTROYED
        db.save(update_fields=["machine_state", "pod_status", "ended_at", "updated_at"])
    except AITeacherPodRegistry.DoesNotExist:
        pass

    registry.delete_class_pod(class_id)
    registry.delete_all_pod_state(machine_id)
    registry.delete_class_config(class_id)

    log.info("destroy_class_pod: done machine_id=%s is_deleted=%s", machine_id, result.get("is_deleted"))
    return {"machine_id": machine_id, "class_id": class_id, "destroyed": result.get("is_deleted", False)}


@shared_task(name="loadbalancer.tasks.cleanup_stale_pods")
def cleanup_stale_pods() -> dict:
    """Sweep heartbeats and destroy machines silent for > POD_HEARTBEAT_TIMEOUT_SECONDS."""
    timeout = settings.POD_HEARTBEAT_TIMEOUT_SECONDS
    now = int(time.time())

    heartbeats = registry.get_all_pod_heartbeats()
    stale = []
    for machine_id, ts in heartbeats.items():
        if (now - ts) > timeout:
            stale.append(machine_id)

    for machine_id in stale:
        # Look up the class_id from the DB record
        try:
            db = AITeacherPodRegistry.objects.get(machine_id=machine_id)
            destroy_class_pod.delay(machine_id, db.class_id)
        except AITeacherPodRegistry.DoesNotExist:
            pass

    log.info("cleanup_stale_pods: %d stale pods scheduled for destruction", len(stale))
    return {"stale_found": len(stale)}
