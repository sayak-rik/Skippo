"""
Local Docker pod provider for the AI teacher loadbalancer.

Selected with POD_PROVIDER=docker (see pod_provider.get_pod_client).  Instead of
calling the Fly.io Machines API, ai-teacher-engine pods are started as containers
on the local Docker daemon so a full class can run without any cloud account.

Requirements:
  • /var/run/docker.sock mounted into the loadbalancer + worker containers
  • the engine image built locally:  docker build -t skippo-ai-teacher:local ./ai-teacher-engine
  • containers join DOCKER_NETWORK so they can reach the LB + backend by name;
    port 8080 is published on a random host port so students' browsers can
    reach the pod at http://DOCKER_POD_HOST:<port>
"""

import logging
import uuid
from typing import Any, Dict, List, Optional

from django.conf import settings

from .exceptions import FlyMachineError

log = logging.getLogger(__name__)

POD_LABEL = "skippo-ai-teacher-pod"

_STATE_MAP = {
    "created": "starting",
    "restarting": "starting",
    "running": "started",
    "paused": "stopped",
    "removing": "stopping",
    "exited": "stopped",
    "dead": "stopped",
}


class DockerMachineClient:
    """Drop-in replacement for FlyMachineClient backed by the local Docker daemon."""

    def __init__(self):
        try:
            import docker  # lazy import so fly-only deployments don't need the SDK
        except ImportError as exc:
            raise FlyMachineError(
                "POD_PROVIDER=docker requires the 'docker' python package."
            ) from exc

        try:
            self._docker = docker.from_env()
            self._docker.ping()
        except Exception as exc:
            raise FlyMachineError(
                f"Cannot reach the Docker daemon (is /var/run/docker.sock mounted?): {exc}"
            ) from exc

        self.image = settings.LOCAL_ENGINE_IMAGE
        self.network = settings.DOCKER_NETWORK
        self.pod_host = settings.DOCKER_POD_HOST
        self.engine_env = dict(settings.AI_ENGINE_ENV)

    # ── Create ────────────────────────────────────────────────────────────────

    def create_machine(self, class_id: str, subject: str = "", instructions: str = "") -> Dict[str, Any]:
        name = f"skippo-ai-teacher-pod-{uuid.uuid4().hex[:8]}"
        env = {
            **self.engine_env,
            "SKIPPO_CLASS_ID": str(class_id),
            "CLASS_SUBJECT": subject,
            "CLASS_INSTRUCTIONS": instructions,
            "FLY_MACHINE_ID": name,
        }
        try:
            container = self._docker.containers.run(
                self.image,
                detach=True,
                name=name,
                environment=env,
                network=self.network,
                ports={"8080/tcp": None},  # random free host port
                labels={POD_LABEL: "1", "skippo-class-id": str(class_id)},
            )
            container.reload()
        except Exception as exc:
            raise FlyMachineError(f"Docker create failed: {exc}") from exc

        log.info("docker: created pod name=%s class_id=%s image=%s", name, class_id, self.image)
        return {"id": name, "host_status": "ok", "region": "local"}

    # ── Pod URL ───────────────────────────────────────────────────────────────

    def build_pod_url(self, machine_id: str) -> str:
        host_port = self._host_port(machine_id)
        if not host_port:
            raise FlyMachineError(f"No published port found for container {machine_id}.")
        return f"http://{self.pod_host}:{host_port}"

    def _host_port(self, machine_id: str) -> Optional[str]:
        try:
            container = self._docker.containers.get(machine_id)
            ports = container.attrs["NetworkSettings"]["Ports"] or {}
            bindings = ports.get("8080/tcp") or []
            return bindings[0]["HostPort"] if bindings else None
        except Exception as exc:
            log.warning("docker: host port lookup failed machine_id=%s error=%s", machine_id, exc)
            return None

    # ── Delete ────────────────────────────────────────────────────────────────

    def delete_machine(self, machine_id: str) -> Dict[str, Any]:
        try:
            container = self._docker.containers.get(machine_id)
        except Exception:
            return {"machine_id": machine_id, "is_deleted": True}  # already gone

        try:
            container.stop(timeout=5)
        except Exception:
            pass
        try:
            container.remove(force=True)
            log.info("docker: removed pod machine_id=%s", machine_id)
            return {"machine_id": machine_id, "is_deleted": True}
        except Exception as exc:
            log.warning("docker: remove failed machine_id=%s error=%s", machine_id, exc)
            return {"machine_id": machine_id, "is_deleted": False, "error": str(exc)}

    # ── State ─────────────────────────────────────────────────────────────────

    def get_machine_state(self, machine_id: str) -> Optional[str]:
        try:
            container = self._docker.containers.get(machine_id)
            return _STATE_MAP.get(container.status, "unknown")
        except Exception:
            return None

    # ── List ──────────────────────────────────────────────────────────────────

    def list_machines(self) -> List[Dict[str, Any]]:
        try:
            containers = self._docker.containers.list(all=True, filters={"label": POD_LABEL})
            return [{"id": c.name, "state": _STATE_MAP.get(c.status, "unknown")} for c in containers]
        except Exception as exc:
            log.warning("docker: list failed error=%s", exc)
            return []
