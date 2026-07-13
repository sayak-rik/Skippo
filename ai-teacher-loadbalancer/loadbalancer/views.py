import logging

from django.conf import settings
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from . import registry
from .exceptions import FlyMachineError
from .models import AITeacherPodRegistry
from .pod_provider import get_pod_client

log = logging.getLogger(__name__)


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok", "service": "ai-teacher-loadbalancer"})


class RegisterClassView(APIView):
    """Called by Skippo backend when an AI class is published/activated.

    Stores the class config in Redis so the engine pod can fetch it.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        class_id     = request.data.get("class_id")
        class_config = request.data.get("class_config")

        if not class_id or not class_config:
            return Response({"detail": "class_id and class_config are required."}, status=400)

        registry.store_class_config(class_id, class_config, ttl_seconds=86400 * 3)
        log.info("register_class: class_id=%s", class_id)
        return Response({"class_id": class_id, "detail": "registered"})


class AllocatePodView(APIView):
    """Find or create the pod for this class and return its URL.

    Each class has exactly one pod. Subsequent calls return the same pod URL.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        class_id = request.data.get("class_id")

        if not class_id:
            return Response({"detail": "class_id is required."}, status=400)

        config = registry.get_class_config(class_id)
        if config is None:
            return Response({"detail": "Class not registered. Activate it first."}, status=404)

        # Return existing pod if already running
        existing = registry.get_class_pod(class_id)
        if existing:
            try:
                db = AITeacherPodRegistry.objects.get(machine_id=existing["machine_id"])
                if db.is_active:
                    log.info("allocate_pod: returning existing pod class_id=%s machine_id=%s", class_id, existing["machine_id"])
                    return Response({"pod_url": existing["pod_url"], "machine_id": existing["machine_id"]})
            except AITeacherPodRegistry.DoesNotExist:
                pass

        # Spin a new pod
        log.info("allocate_pod: creating new pod class_id=%s", class_id)
        try:
            pods = get_pod_client()
            machine = pods.create_machine(
                class_id=class_id,
                subject=config.get("subject", ""),
                instructions=config.get("instructions", ""),
            )
        except FlyMachineError as exc:
            log.error("allocate_pod: pod create failed class_id=%s error=%s", class_id, exc)
            return Response({"detail": f"Failed to start class server: {exc}"}, status=503)

        machine_id = machine["id"]
        try:
            pod_url = pods.build_pod_url(machine_id)
        except FlyMachineError:
            pod_url = ""

        AITeacherPodRegistry.objects.create(
            machine_id=machine_id,
            class_id=class_id,
            pod_url=pod_url,
            machine_state=AITeacherPodRegistry.MachineState.STARTING,
            machine_created_at=timezone.now(),
            region=machine.get("region", ""),
            metadata={"host_status": machine.get("host_status")},
        )
        registry.set_class_pod(class_id, machine_id, pod_url)
        registry.record_pod_heartbeat(machine_id)

        log.info("allocate_pod: pod created machine_id=%s pod_url=%s class_id=%s", machine_id, pod_url, class_id)
        return Response({"pod_url": pod_url, "machine_id": machine_id})


class EndClassView(APIView):
    """Called by Skippo backend when the dashboard closes a class.

    Tells the engine pod to end the class (it broadcasts class_ended to the
    students, fires the summary webhook back to Skippo, and shows the feedback
    screen), then schedules pod destruction after a grace period so students
    have time to submit feedback.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        class_id = request.data.get("class_id")
        if not class_id:
            return Response({"detail": "class_id is required."}, status=400)

        pod_info = registry.get_class_pod(class_id)
        if not pod_info:
            return Response({"detail": "No active pod for this class."}, status=404)

        machine_id = pod_info["machine_id"]
        pod_url    = pod_info.get("pod_url", "")

        # Best-effort: tell the engine to close the classroom + fire its webhook.
        # pod_url may carry a query string (?fly_machine_id=…), so merge the path.
        if pod_url:
            import httpx
            from urllib.parse import urlsplit, urlunsplit

            parts = urlsplit(pod_url)
            end_url = urlunsplit((
                parts.scheme, parts.netloc,
                parts.path.rstrip("/") + f"/end-class/{class_id}",
                parts.query, "",
            ))
            try:
                httpx.post(end_url, timeout=10)
                log.info("end_class: engine notified class_id=%s", class_id)
            except Exception as exc:
                log.warning("end_class: engine notify failed class_id=%s error=%s", class_id, exc)

        from .tasks import destroy_class_pod
        grace = settings.END_CLASS_GRACE_SECONDS
        destroy_class_pod.apply_async(args=[machine_id, class_id], countdown=grace)
        log.info("end_class: scheduled destroy machine_id=%s class_id=%s in %ss", machine_id, class_id, grace)

        return Response({"detail": "Class ending", "machine_id": machine_id, "grace_seconds": grace})


class PodHeartbeatView(APIView):
    """AI teacher pods call this every 60 s to stay alive."""
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        machine_id = request.data.get("machine_id")
        if not machine_id:
            return Response({"detail": "machine_id is required."}, status=400)

        ts = registry.record_pod_heartbeat(machine_id)
        AITeacherPodRegistry.objects.filter(machine_id=machine_id).update(
            machine_state=AITeacherPodRegistry.MachineState.STARTED
        )
        return Response({"machine_id": machine_id, "heartbeat_ts": ts})


class FetchClassConfigView(APIView):
    """AI teacher pods fetch class config from here on startup."""
    authentication_classes = []
    permission_classes = []

    def get(self, request, class_id):
        config = registry.get_class_config(class_id)
        if config is None:
            return Response({"detail": "Class config not found."}, status=404)
        return Response(config)


class PodSnapshotView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        pods = AITeacherPodRegistry.objects.order_by("-created_at")[:100]
        rows = [
            {
                "machine_id":    p.machine_id,
                "class_id":      p.class_id,
                "pod_url":       p.pod_url,
                "machine_state": p.machine_state,
                "pod_status":    p.pod_status,
                "heartbeat_ts":  registry.get_pod_heartbeat(p.machine_id),
                "is_active":     p.is_active,
                "created_at":    p.created_at.isoformat(),
            }
            for p in pods
        ]
        return Response({"pods": rows, "total": len(rows)})
