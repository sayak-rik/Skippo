"""
Redis-backed runtime state for the exam loadbalancer.

Key schema:
    skippo_exam:test_config:{test_id}          → JSON  (test config blob from Skippo backend)
    skippo_exam:test_pods:{test_id}            → JSON  list of {machine_id, pod_url}
    skippo_exam:pod_sessions:{machine_id}      → int   active session count (0-2)
    skippo_exam:pod_heartbeat:{machine_id}     → int   unix timestamp of last ping
    skippo_exam:session_pod:{session_id}       → str   machine_id that owns this session
"""

import json
import logging
import time
from typing import Any, Dict, List, Optional

import redis
from django.conf import settings

log = logging.getLogger(__name__)

_client: Optional[redis.Redis] = None


def _redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.REDIS_DSN, decode_responses=True)
    return _client


# ── Key helpers ────────────────────────────────────────────────────────────────

def _test_config_key(test_id: str) -> str:
    return f"skippo_exam:test_config:{test_id}"

def _test_pods_key(test_id: str) -> str:
    return f"skippo_exam:test_pods:{test_id}"

def _pod_sessions_key(machine_id: str) -> str:
    return f"skippo_exam:pod_sessions:{machine_id}"

def _pod_heartbeat_key(machine_id: str) -> str:
    return f"skippo_exam:pod_heartbeat:{machine_id}"

def _session_pod_key(session_id: str) -> str:
    return f"skippo_exam:session_pod:{session_id}"


# ── Test config ────────────────────────────────────────────────────────────────

def store_test_config(test_id: str, config: dict, ttl_seconds: int = 86400 * 7) -> None:
    """Persist the test config so exam-engine pods can fetch it on demand."""
    _redis().setex(_test_config_key(test_id), ttl_seconds, json.dumps(config))
    log.info("registry: stored test_config test_id=%s ttl=%s", test_id, ttl_seconds)


def get_test_config(test_id: str) -> Optional[dict]:
    raw = _redis().get(_test_config_key(test_id))
    if raw is None:
        return None
    return json.loads(raw)


def delete_test_config(test_id: str) -> None:
    _redis().delete(_test_config_key(test_id))


# ── Pod list per test ──────────────────────────────────────────────────────────

def get_test_pods(test_id: str) -> List[Dict[str, str]]:
    """Return [{machine_id, pod_url}, ...] for a given test."""
    raw = _redis().get(_test_pods_key(test_id))
    if raw is None:
        return []
    return json.loads(raw)


def add_pod_to_test(test_id: str, machine_id: str, pod_url: str) -> None:
    pods = get_test_pods(test_id)
    pods.append({"machine_id": machine_id, "pod_url": pod_url})
    _redis().set(_test_pods_key(test_id), json.dumps(pods))
    log.info("registry: added pod machine_id=%s to test_id=%s", machine_id, test_id)


def remove_pod_from_test(test_id: str, machine_id: str) -> None:
    pods = [p for p in get_test_pods(test_id) if p["machine_id"] != machine_id]
    _redis().set(_test_pods_key(test_id), json.dumps(pods))


# ── Session counters per pod ───────────────────────────────────────────────────

def get_pod_session_count(machine_id: str) -> int:
    raw = _redis().get(_pod_sessions_key(machine_id))
    return int(raw) if raw is not None else 0


def increment_pod_sessions(machine_id: str) -> int:
    count = _redis().incr(_pod_sessions_key(machine_id))
    log.info("registry: sessions++ machine_id=%s count=%s", machine_id, count)
    return count


def decrement_pod_sessions(machine_id: str) -> int:
    key = _pod_sessions_key(machine_id)
    count = _redis().decr(key)
    if count < 0:
        _redis().set(key, 0)
        count = 0
    log.info("registry: sessions-- machine_id=%s count=%s", machine_id, count)
    return count


def delete_pod_sessions(machine_id: str) -> None:
    _redis().delete(_pod_sessions_key(machine_id))


# ── Heartbeats ─────────────────────────────────────────────────────────────────

def record_pod_heartbeat(machine_id: str) -> int:
    ts = int(time.time())
    _redis().set(_pod_heartbeat_key(machine_id), ts)
    return ts


def get_pod_heartbeat(machine_id: str) -> Optional[int]:
    raw = _redis().get(_pod_heartbeat_key(machine_id))
    return int(raw) if raw is not None else None


def get_all_pod_heartbeats() -> Dict[str, int]:
    pattern = "skippo_exam:pod_heartbeat:*"
    prefix  = "skippo_exam:pod_heartbeat:"
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
    _redis().delete(_pod_heartbeat_key(machine_id))


# ── Session → pod mapping ──────────────────────────────────────────────────────

def map_session_to_pod(session_id: str, machine_id: str, ttl_seconds: int = 86400) -> None:
    _redis().setex(_session_pod_key(session_id), ttl_seconds, machine_id)
    log.info("registry: mapped session_id=%s to machine_id=%s", session_id, machine_id)


def get_pod_for_session(session_id: str) -> Optional[str]:
    return _redis().get(_session_pod_key(session_id))


def delete_session_mapping(session_id: str) -> None:
    _redis().delete(_session_pod_key(session_id))


# ── Cleanup helpers ────────────────────────────────────────────────────────────

def delete_all_pod_state(machine_id: str) -> None:
    """Remove all Redis keys for a destroyed pod."""
    _redis().delete(
        _pod_sessions_key(machine_id),
        _pod_heartbeat_key(machine_id),
    )
    log.info("registry: deleted all state for machine_id=%s", machine_id)
