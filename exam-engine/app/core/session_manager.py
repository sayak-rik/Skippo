"""
In-memory session store for the exam-engine pod.

Each pod handles a maximum of POD_CAPACITY sessions (default 2).
Per-session asyncio locks prevent race conditions between the timer task
and WebSocket message handler running concurrently on the same session.
"""
import asyncio
import logging
from typing import Dict, Optional

from .models import TestSession

log = logging.getLogger(__name__)

POD_CAPACITY = 2

_sessions: Dict[str, TestSession] = {}
_locks:    Dict[str, asyncio.Lock] = {}


# ── CRUD ──────────────────────────────────────────────────────────────────────

def add_session(session: TestSession) -> None:
    if len(_sessions) >= POD_CAPACITY:
        raise RuntimeError(f"Pod at capacity ({POD_CAPACITY} sessions max).")
    _sessions[session.session_id] = session
    _locks[session.session_id]    = asyncio.Lock()
    log.info("session_manager: added session_id=%s active=%s", session.session_id, len(_sessions))


def get_session(session_id: str) -> Optional[TestSession]:
    return _sessions.get(session_id)


def remove_session(session_id: str) -> None:
    session = _sessions.pop(session_id, None)
    _locks.pop(session_id, None)
    if session:
        log.info("session_manager: removed session_id=%s active=%s", session_id, len(_sessions))


def active_count() -> int:
    return len(_sessions)


# ── Locking ────────────────────────────────────────────────────────────────────

def get_lock(session_id: str) -> asyncio.Lock:
    if session_id not in _locks:
        _locks[session_id] = asyncio.Lock()
    return _locks[session_id]


# ── Scoring ────────────────────────────────────────────────────────────────────

def score_mcq_answer(question, raw_answer: str) -> tuple[bool, float]:
    """Return (is_correct, points_earned) for an MCQ or text answer."""
    if question.question_type == "mcq" and question.correct_answer:
        is_correct = raw_answer.strip().upper() == question.correct_answer.strip().upper()
        return is_correct, float(question.points) if is_correct else 0.0
    # short_answer / voice — manual grading, full points placeholder
    return None, 0.0
