"""
AI Teacher loadbalancer client.

Calls ai-teacher-loadbalancer (AITLB_URL) for class lifecycle management.
All calls are best-effort — if the loadbalancer is unreachable the caller
should log and continue without crashing.
"""
import logging

import httpx
from django.conf import settings

log = logging.getLogger(__name__)

_LB_URL    = lambda: getattr(settings, "AITLB_URL", "http://ai-teacher-loadbalancer:8095")
_LB_SECRET = lambda: getattr(settings, "AITLB_SECRET", "")
_TIMEOUT   = 15


def _headers() -> dict:
    return {"Authorization": f"Bearer {_LB_SECRET()}", "Content-Type": "application/json"}


def register_class(class_id: str, class_config: dict) -> dict:
    """Register a class config with the loadbalancer so pods can fetch it."""
    try:
        resp = httpx.post(
            f"{_LB_URL()}/register-class/",
            json={"class_id": class_id, "class_config": class_config},
            headers=_headers(),
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        log.warning("ai-teacher-lb register_class failed: %s", exc)
        return {}


def allocate_pod(class_id: str) -> dict:
    """Spin up (or return existing) a pod for a class. Returns {pod_url, machine_id}."""
    try:
        resp = httpx.post(
            f"{_LB_URL()}/allocate-pod/",
            json={"class_id": str(class_id)},
            headers=_headers(),
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        log.warning("ai-teacher-lb allocate_pod failed: %s", exc)
        return {}


def end_class(class_id: str) -> None:
    """Tell the loadbalancer to shut down the pod for this class."""
    try:
        httpx.post(
            f"{_LB_URL()}/end-class/",
            json={"class_id": str(class_id)},
            headers=_headers(),
            timeout=_TIMEOUT,
        )
    except Exception as exc:
        log.warning("ai-teacher-lb end_class failed: %s", exc)


def build_class_config(ai_class) -> dict:
    """Serialize an AIClass into the payload the engine pod expects."""
    return {
        "class_id":    str(ai_class.id),
        "title":       ai_class.title,
        "subject":     ai_class.subject,
        "instructions": ai_class.instructions,
        "school_id":   str(ai_class.school_id),
    }
