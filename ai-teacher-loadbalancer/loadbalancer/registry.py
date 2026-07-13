"""
Redis-backed runtime state for the AI teacher loadbalancer.

Key schema:
    skippo_aitlb:class_config:{class_id}   → JSON  (class config blob from Skippo backend)
    skippo_aitlb:class_pod:{class_id}      → JSON  {machine_id, pod_url}
    skippo_aitlb:pod_heartbeat:{machine_id} → int  unix timestamp of last ping
"""

import json
import logging
import time
from typing import Any, Dict, Optional

import redis
from django.conf import settings

log = logging.getLogger(__name__)

_client: Optional[redis.Redis] = None


def _redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.REDIS_DSN, decode_responses=True)
    return _client


def _config_key(class_id: str) -> str:
    return f"skippo_aitlb:class_config:{class_id}"

def _class_pod_key(class_id: str) -> str:
    return f"skippo_aitlb:class_pod:{class_id}"

def _heartbeat_key(machine_id: str) -> str:
    return f"skippo_aitlb:pod_heartbeat:{machine_id}"


# ── Class config ───────────────────────────────────────────────────────────────

def store_class_config(class_id: str, config: dict, ttl_seconds: int = 86400 * 7) -> None:
    _redis().setex(_config_key(class_id), ttl_seconds, json.dumps(config))
    log.info("registry: stored config class_id=%s ttl=%s", class_id, ttl_seconds)


def get_class_config(class_id: str) -> Optional[dict]:
    raw = _redis().get(_config_key(class_id))
    return json.loads(raw) if raw else None


def delete_class_config(class_id: str) -> None:
    _redis().delete(_config_key(class_id))


# ── Pod mapping per class ──────────────────────────────────────────────────────

def set_class_pod(class_id: str, machine_id: str, pod_url: str) -> None:
    _redis().set(_class_pod_key(class_id), json.dumps({"machine_id": machine_id, "pod_url": pod_url}))
    log.info("registry: mapped class_id=%s → machine_id=%s", class_id, machine_id)


def get_class_pod(class_id: str) -> Optional[Dict[str, str]]:
    raw = _redis().get(_class_pod_key(class_id))
    return json.loads(raw) if raw else None


def delete_class_pod(class_id: str) -> None:
    _redis().delete(_class_pod_key(class_id))


# ── Heartbeats ─────────────────────────────────────────────────────────────────

def record_pod_heartbeat(machine_id: str) -> int:
    ts = int(time.time())
    _redis().set(_heartbeat_key(machine_id), ts)
    return ts


def get_pod_heartbeat(machine_id: str) -> Optional[int]:
    raw = _redis().get(_heartbeat_key(machine_id))
    return int(raw) if raw else None


def get_all_pod_heartbeats() -> Dict[str, int]:
    pattern = "skippo_aitlb:pod_heartbeat:*"
    prefix  = "skippo_aitlb:pod_heartbeat:"
    result: Dict[str, int] = {}
    cursor = 0
    while True:
        cursor, keys = _redis().scan(cursor, match=pattern, count=100)
        for key in keys:
            machine_id = key[len(prefix):]
            raw = _redis().get(key)
            if raw is not None:
                result[machine_id] = int(raw)
        if cursor == 0:
            break
    return result


def delete_pod_heartbeat(machine_id: str) -> None:
    _redis().delete(_heartbeat_key(machine_id))


# ── Cleanup helpers ────────────────────────────────────────────────────────────

def delete_all_pod_state(machine_id: str) -> None:
    _redis().delete(_heartbeat_key(machine_id))
    log.info("registry: deleted all state for machine_id=%s", machine_id)
