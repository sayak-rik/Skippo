import logging
import uuid

from django.conf import settings
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from . import registry
from .exceptions import FlyMachineError, TestNotRegistered
from .models import ExamPodRegistry
from .pod_provider import get_pod_client

log = logging.getLogger(__name__)


# ── Health ─────────────────────────────────────────────────────────────────────

class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok", "service": "exam-loadbalancer"})


# ── Register Test ──────────────────────────────────────────────────────────────

class RegisterTestView(APIView):
    """Called by Skippo backend when a test is published.

    Stores the full test config in Redis so exam-engine pods can fetch it.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        test_id      = request.data.get("test_id")
        test_config  = request.data.get("test_config")
        webhook_url  = request.data.get("webhook_url", "")
        webhook_secret = request.data.get("webhook_secret", "")

        if not test_id or not test_config:
            return Response({"detail": "test_id and test_config are required."}, status=400)

        # Enrich config with webhook routing
        test_config["webhook_url"]    = webhook_url
        test_config["webhook_secret"] = webhook_secret

        # TTL based on available_until or default 7 days
        available_until = test_config.get("available_until")
        if available_until:
            try:
                from django.utils.dateparse import parse_datetime
                dt = parse_datetime(str(available_until))
                if dt:
                    ttl = int((dt - timezone.now()).total_seconds()) + 3600  # 1h buffer
                    ttl = max(ttl, 3600)
                else:
                    ttl = 86400 * 7
            except Exception:
                ttl = 86400 * 7
        else:
            ttl = 86400 * 7

        registry.store_test_config(test_id, test_config, ttl_seconds=ttl)

        log.info("register_test: test_id=%s webhook_url=%s ttl=%s", test_id, webhook_url, ttl)
        return Response({"lb_test_id": test_id, "detail": "registered"})


# ── Allocate Pod ───────────────────────────────────────────────────────────────

class AllocatePodView(APIView):
    """Find an available pod for this test or spin a new one.

    Returns {pod_url, session_id}.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        test_id      = request.data.get("test_id")
        student_id   = request.data.get("student_id")
        access_token = request.data.get("access_token")

        if not test_id or not access_token:
            return Response({"detail": "test_id and access_token are required."}, status=400)

        # Verify test is registered
        config = registry.get_test_config(test_id)
        if config is None:
            log.warning("allocate_pod: test not registered test_id=%s", test_id)
            return Response({"detail": "Test not registered. Publish it first."}, status=404)

        capacity = settings.POD_SESSION_CAPACITY  # 2

        # Find a pod with capacity remaining.  The slot is claimed atomically:
        # INCR first, then verify — so two concurrent allocations can never
        # both land on the last free slot of the same pod.
        chosen_machine_id = None
        chosen_pod_url    = None
        new_count         = None

        for pod_info in registry.get_test_pods(test_id):
            machine_id = pod_info["machine_id"]
            pod_url    = pod_info["pod_url"]
            # Check DB record is still active before claiming a slot
            try:
                db_record = ExamPodRegistry.objects.get(machine_id=machine_id)
                if not db_record.is_active:
                    continue
            except ExamPodRegistry.DoesNotExist:
                continue
            claimed = registry.increment_pod_sessions(machine_id)
            if claimed > capacity:
                registry.decrement_pod_sessions(machine_id)
                continue
            chosen_machine_id = machine_id
            chosen_pod_url    = pod_url
            new_count         = claimed
            break

        # No available pod — create one
        if chosen_machine_id is None:
            log.info("allocate_pod: no available pod for test_id=%s, creating new", test_id)
            try:
                pods = get_pod_client()
                machine = pods.create_machine(test_id)
            except FlyMachineError as exc:
                log.error("allocate_pod: pod create failed test_id=%s error=%s", test_id, exc)
                return Response({"detail": f"Failed to start exam server: {exc}"}, status=503)

            chosen_machine_id = machine["id"]
            try:
                chosen_pod_url = pods.build_pod_url(chosen_machine_id)
            except FlyMachineError:
                chosen_pod_url = ""

            ExamPodRegistry.objects.create(
                machine_id=chosen_machine_id,
                test_id=test_id,
                pod_url=chosen_pod_url,
                machine_state=ExamPodRegistry.MachineState.STARTING,
                machine_created_at=timezone.now(),
                region=machine.get("region", ""),
                metadata={"host_status": machine.get("host_status")},
            )
            registry.add_pod_to_test(test_id, chosen_machine_id, chosen_pod_url)
            registry.record_pod_heartbeat(chosen_machine_id)
            new_count = registry.increment_pod_sessions(chosen_machine_id)

            log.info(
                "allocate_pod: new pod created machine_id=%s pod_url=%s test_id=%s",
                chosen_machine_id, chosen_pod_url, test_id,
            )

        # Map the claimed session slot
        session_id = str(uuid.uuid4())
        registry.map_session_to_pod(session_id, chosen_machine_id)

        # Sync session count to DB
        ExamPodRegistry.objects.filter(machine_id=chosen_machine_id).update(
            active_sessions=new_count,
            machine_state=ExamPodRegistry.MachineState.STARTED,
        )

        log.info(
            "allocate_pod: allocated session_id=%s machine_id=%s count=%s test_id=%s student_id=%s",
            session_id, chosen_machine_id, new_count, test_id, student_id,
        )
        return Response({"pod_url": chosen_pod_url, "session_id": session_id})


# ── Release Session ────────────────────────────────────────────────────────────

class ReleaseSessionView(APIView):
    """Called by exam-engine when a test session ends.

    Decrements the session counter.  When it hits 0, schedules pod destruction.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        session_id = request.data.get("session_id")
        if not session_id:
            return Response({"detail": "session_id is required."}, status=400)

        machine_id = registry.get_pod_for_session(session_id)
        if not machine_id:
            log.warning("release_session: session not found session_id=%s", session_id)
            return Response({"detail": "Session not found."}, status=404)

        remaining = registry.decrement_pod_sessions(machine_id)
        registry.delete_session_mapping(session_id)

        ExamPodRegistry.objects.filter(machine_id=machine_id).update(active_sessions=remaining)

        log.info(
            "release_session: session_id=%s machine_id=%s remaining=%s",
            session_id, machine_id, remaining,
        )

        if remaining == 0:
            # Schedule pod destruction after grace period
            from .tasks import destroy_idle_pod
            grace = settings.POD_GRACE_PERIOD_SECONDS
            destroy_idle_pod.apply_async(args=[machine_id], countdown=grace)
            log.info(
                "release_session: scheduled destroy machine_id=%s in %ss", machine_id, grace
            )

        return Response({"session_id": session_id, "machine_id": machine_id, "remaining": remaining})


# ── Pod Heartbeat (called by exam-engine) ──────────────────────────────────────

class PodHeartbeatView(APIView):
    """Exam-engine pods call this periodically to prevent stale cleanup."""
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        machine_id = request.data.get("machine_id")
        if not machine_id:
            return Response({"detail": "machine_id is required."}, status=400)

        ts = registry.record_pod_heartbeat(machine_id)
        ExamPodRegistry.objects.filter(machine_id=machine_id).update(
            machine_state=ExamPodRegistry.MachineState.STARTED
        )
        return Response({"machine_id": machine_id, "heartbeat_ts": ts})


# ── Fetch Config (called by exam-engine pod) ───────────────────────────────────

class FetchTestConfigView(APIView):
    """Exam-engine pods fetch test config from here on WebSocket connect."""
    authentication_classes = []
    permission_classes = []

    def get(self, request, test_id):
        config = registry.get_test_config(test_id)
        if config is None:
            return Response({"detail": "Test config not found."}, status=404)
        return Response(config)


# ── Pod Snapshot (admin debug) ─────────────────────────────────────────────────

class PodSnapshotView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        pods = ExamPodRegistry.objects.order_by("-created_at")[:100]
        rows = [
            {
                "machine_id":    p.machine_id,
                "test_id":       p.test_id,
                "pod_url":       p.pod_url,
                "machine_state": p.machine_state,
                "active_sessions": registry.get_pod_session_count(p.machine_id),
                "heartbeat_ts":  registry.get_pod_heartbeat(p.machine_id),
                "is_active":     p.is_active,
                "created_at":    p.created_at.isoformat(),
            }
            for p in pods
        ]
        return Response({"pods": rows, "total": len(rows)})
