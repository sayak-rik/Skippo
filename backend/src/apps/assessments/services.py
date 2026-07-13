"""
Exam loadbalancer client.

The loadbalancer runs as a separate service (exam-loadbalancer) inside the
Skippo Docker network, reachable at EXAM_LB_URL.  All calls are best-effort:
if the loadbalancer is unreachable we log and continue so that test creation
never fails silently for the teacher.
"""
import logging

import httpx
from django.conf import settings

log = logging.getLogger(__name__)

_LB_URL    = lambda: getattr(settings, "EXAM_LB_URL", "http://exam-loadbalancer:8094")
_LB_SECRET = lambda: getattr(settings, "EXAM_LB_SECRET", "")
_TIMEOUT   = 10


def _headers() -> dict:
    return {"Authorization": f"Bearer {_LB_SECRET()}", "Content-Type": "application/json"}


def register_test(test_id: str, test_config: dict, webhook_url: str, webhook_secret: str) -> dict:
    """Tell the loadbalancer about a newly published test.

    Returns the loadbalancer's response dict (which includes the lb_test_id
    echoed back) or an empty dict on failure.
    """
    try:
        resp = httpx.post(
            f"{_LB_URL()}/register-test/",
            json={
                "test_id": test_id,
                "test_config": test_config,
                "webhook_url": webhook_url,
                "webhook_secret": webhook_secret,
            },
            headers=_headers(),
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        log.warning("exam-loadbalancer register_test failed: %s", exc)
        return {}


def allocate_pod(test_id: str, student_id: int, access_token: str) -> dict:
    """Request a pod URL for a student about to start a test.

    Returns {"pod_url": str, "session_id": str} or {} on failure.
    """
    try:
        resp = httpx.post(
            f"{_LB_URL()}/allocate-pod/",
            json={
                "test_id": test_id,
                "student_id": str(student_id),
                "access_token": str(access_token),
            },
            headers=_headers(),
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        log.warning("exam-loadbalancer allocate_pod failed: %s", exc)
        return {}


def release_session(session_id: str) -> None:
    """Decrement the session counter on the pod so it can be recycled."""
    try:
        httpx.post(
            f"{_LB_URL()}/release-session/",
            json={"session_id": str(session_id)},
            headers=_headers(),
            timeout=_TIMEOUT,
        )
    except Exception as exc:
        log.warning("exam-loadbalancer release_session failed: %s", exc)


def build_test_config(test) -> dict:
    """Serialize an OnlineTest into the payload the exam-engine expects."""
    return {
        "test_id":           str(test.id),
        "title":             test.title,
        "test_type":         test.test_type,
        "duration_minutes":  test.duration_minutes,
        "passing_percentage": test.passing_percentage,
        "enable_proctoring": test.enable_proctoring,
        "enable_voice_tts":  test.enable_voice_tts,
        "instructions":      test.instructions,
        "questions": [
            {
                "id":               str(q.id),
                "order":            q.order,
                "question_text":    q.question_text,
                "question_type":    q.question_type,
                "options":          q.options,
                "correct_answer":   q.correct_answer,
                "points":           q.points,
                "voice_grading_hint": q.voice_grading_hint,
            }
            for q in test.questions.all().order_by("order")
        ],
    }
