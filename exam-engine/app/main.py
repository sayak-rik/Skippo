"""
Exam Engine — FastAPI application.

Responsibilities per pod:
  • Serve the exam-frontend (React static build) at GET /test/{access_token}
  • Initialise sessions via POST /api/session/init
  • Drive each test session over WebSocket /ws/test/{session_id}
  • Handle proctoring frames over WebSocket /ws/proctoring/{session_id}
  • Score MCQ answers, accumulate proctoring events, fire the Skippo webhook
  • Heartbeat the exam-loadbalancer so stale-cleanup doesn't destroy this pod

Maximum concurrent sessions per pod: 2  (enforced by session_manager)
"""

import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.websockets import WebSocketState

from app.config import settings
from app.core.models import Answer, ProctoringEvent, Question, TestSession
from app.core import session_manager
from app.services import config_fetcher, proctoring, webhook
from app.services import whisper_service

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

STATIC_DIR = Path(__file__).parent.parent / "static"


# ── Startup / Shutdown ─────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("exam-engine starting up machine_id=%s", settings.machine_id)

    if settings.enable_voice:
        log.info("initialising Whisper model=%s device=%s", settings.whisper_model, settings.whisper_device)
        whisper_service.init_whisper(settings.whisper_model, settings.whisper_device, settings.whisper_language)

    # Start background heartbeat task
    heartbeat_task = asyncio.create_task(_heartbeat_loop())

    yield

    heartbeat_task.cancel()
    log.info("exam-engine shutting down")


async def _heartbeat_loop():
    """Ping the loadbalancer every heartbeat_interval seconds."""
    while True:
        await asyncio.sleep(settings.heartbeat_interval)
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(
                    f"{settings.exam_lb_url}/heartbeat/",
                    json={"machine_id": settings.machine_id},
                    headers={"Authorization": f"Bearer {settings.exam_lb_secret}"},
                )
        except Exception as exc:
            log.warning("heartbeat failed: %s", exc)


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Skippo Exam Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if STATIC_DIR.exists() and any(STATIC_DIR.iterdir()):
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "machine_id": settings.machine_id,
        "active_sessions": session_manager.active_count(),
        "voice_enabled": settings.enable_voice,
    }


# ── Serve React frontend ───────────────────────────────────────────────────────

@app.get("/test/{access_token}")
@app.get("/test/{access_token}/")
@app.get("/test/{access_token}/{subpath:path}")
async def serve_test_page(access_token: str, subpath: str = ""):
    """Return the React SPA for any /test/* path.

    The catch-all covers client-side routes (/exam, /done) so a page refresh
    mid-test still loads the SPA and lets the WebSocket session resume.
    """
    index = STATIC_DIR / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return JSONResponse({"detail": "Frontend not built yet."}, status_code=503)


@app.get("/")
async def root():
    index = STATIC_DIR / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return {"status": "exam-engine running", "active_sessions": session_manager.active_count()}


# ── Session init ───────────────────────────────────────────────────────────────

class SessionInitRequest(BaseModel):
    access_token: str
    session_id: str
    test_id: str


@app.post("/api/session/init")
async def init_session(body: SessionInitRequest):
    """Create (or resume) a test session.

    Called by the React frontend immediately after the page loads.
    Fetches the test config from the loadbalancer, builds a TestSession, and
    returns the session metadata the frontend needs to start.
    """
    # Idempotency: return existing session if already created
    existing = session_manager.get_session(body.session_id)
    if existing:
        return _session_init_response(existing)

    # Fetch test config from loadbalancer
    config = await config_fetcher.fetch_test_config(body.test_id)
    if not config:
        raise HTTPException(status_code=503, detail="Could not load test configuration.")

    try:
        session_manager.add_session(
            TestSession(
                session_id=body.session_id,
                test_id=body.test_id,
                access_token=body.access_token,
                title=config.get("title", ""),
                instructions=config.get("instructions", ""),
                questions=[Question(**q) for q in config.get("questions", [])],
                start_time=datetime.now(tz=timezone.utc),
                duration_seconds=config.get("duration_minutes", 60) * 60,
                enable_proctoring=config.get("enable_proctoring", True),
            )
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    session = session_manager.get_session(body.session_id)
    return _session_init_response(session)


def _session_init_response(session: TestSession) -> dict:
    return {
        "session_id":       session.session_id,
        "title":            session.title,
        "instructions":     session.instructions,
        "questions_count":  len(session.questions),
        "duration_seconds": session.duration_seconds,
        "test_type":        _infer_test_type(session),
        "enable_proctoring": session.enable_proctoring,
        "is_completed":     session.is_completed,
    }


def _infer_test_type(session: TestSession) -> str:
    types = {q.question_type for q in session.questions}
    if "voice" in types and "mcq" in types:
        return "hybrid"
    if "voice" in types:
        return "voice"
    return "mcq"


# ── Complete test (shared between timer + manual submit) ───────────────────────

def _compute_grade(pct: float) -> str:
    if pct >= 90: return "A+"
    if pct >= 80: return "A"
    if pct >= 70: return "B+"
    if pct >= 60: return "B"
    if pct >= 50: return "C+"
    if pct >= 40: return "C"
    if pct >= 35: return "D"
    return "F"


async def _complete_test(session_id: str, reason: str) -> None:
    """Score, notify client, fire webhook, release loadbalancer session slot."""
    lock = session_manager.get_lock(session_id)
    async with lock:
        session = session_manager.get_session(session_id)
        if not session or session.is_completed:
            return

        score, max_score, pct = session.score_summary()
        grade = _compute_grade(pct)

        session.is_completed = True
        session.completion_reason = reason

        complete_msg = {
            "type":       "test_complete",
            "reason":     reason,
            "score":      score,
            "max_score":  max_score,
            "percentage": round(pct, 2),
            "grade":      grade,
        }

        ws = session.ws
        if ws and ws.client_state == WebSocketState.CONNECTED:
            try:
                await ws.send_json(complete_msg)
            except Exception:
                pass

        # Build and send the Skippo webhook payload
        now_iso = datetime.now(tz=timezone.utc).isoformat()
        elapsed = (datetime.now(tz=timezone.utc) - session.start_time).total_seconds()
        payload = {
            "session_id":            session.session_id,
            "test_id":               session.test_id,
            "access_token":          session.access_token,
            "completed_at":          now_iso,
            "completion_reason":     reason,
            "score":                 score,
            "max_score":             max_score,
            "percentage":            round(pct, 2),
            "time_taken_seconds":    int(elapsed),
            "answers":               session.answers_for_webhook(),
            "proctoring_events": [
                {"type": e.event_type, "severity": e.severity, "timestamp": e.timestamp}
                for e in session.proctoring_events
            ],
        }
        asyncio.create_task(webhook.send_results(payload))
        asyncio.create_task(_release_lb_session(session.session_id))

        log.info(
            "test complete session_id=%s reason=%s score=%.1f/%.1f (%.1f%%)",
            session_id, reason, score, max_score, pct,
        )


async def _release_lb_session(session_id: str) -> None:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(
                f"{settings.exam_lb_url}/release-session/",
                json={"session_id": session_id},
                headers={"Authorization": f"Bearer {settings.exam_lb_secret}"},
            )
    except Exception as exc:
        log.warning("release_lb_session failed session_id=%s error=%s", session_id, exc)


# ── Timer background task ──────────────────────────────────────────────────────

async def _run_timer(session_id: str) -> None:
    """Tick every TIMER_TICK_SECONDS, auto-submit when time runs out."""
    tick = settings.timer_tick_interval
    while True:
        await asyncio.sleep(tick)
        session = session_manager.get_session(session_id)
        if not session or session.is_completed:
            break

        remaining = session.time_remaining_seconds

        ws = session.ws
        if ws and ws.client_state == WebSocketState.CONNECTED:
            try:
                await ws.send_json({"type": "timer_tick", "time_remaining": remaining})
            except Exception:
                pass

        if remaining == 0:
            await _complete_test(session_id, "time_expired")
            break


# ── Main test WebSocket ────────────────────────────────────────────────────────

@app.websocket("/ws/test/{session_id}")
async def ws_test(websocket: WebSocket, session_id: str):
    await websocket.accept()

    session = session_manager.get_session(session_id)
    if not session:
        await websocket.close(code=4404, reason="Session not found. Call /api/session/init first.")
        return

    # Reject duplicate connections on an already-connected session
    if session.ws and session.ws.client_state == WebSocketState.CONNECTED:
        await websocket.close(code=4409, reason="Session already connected.")
        return

    # Register this WebSocket and start the server-side timer (once)
    session.ws = websocket
    if not session.timer_task or session.timer_task.done():
        session.timer_task = asyncio.create_task(_run_timer(session_id))

    log.info("ws_test: connected session_id=%s", session_id)

    try:
        while True:
            message = await websocket.receive()

            # ── Binary audio data (voice questions only) ──────────────────────
            if "bytes" in message:
                if settings.enable_voice:
                    session.audio_buffer += message["bytes"]
                continue

            # ── Control messages ───────────────────────────────────────────────
            if "text" not in message:
                continue

            try:
                msg = json.loads(message["text"])
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type")

            # ── ping → pong ────────────────────────────────────────────────────
            if msg_type == "ping":
                await websocket.send_json({"type": "pong", "timestamp": msg.get("timestamp")})
                continue

            # ── sync_request (reconnect resume) ──────────────────────────────
            if msg_type == "sync_request":
                await websocket.send_json(_build_sync_state(session))
                continue

            # ── submit_answer ─────────────────────────────────────────────────
            if msg_type == "submit_answer":
                q_id   = msg.get("question_id", "")
                answer = msg.get("answer", "")
                await _handle_answer(session, q_id, answer)
                await websocket.send_json({"type": "answer_ack", "question_id": q_id})
                continue

            # ── stop_recording (voice) ────────────────────────────────────────
            if msg_type == "stop_recording":
                q_id = msg.get("question_id", "")
                transcript = await _transcribe_buffer(session)
                session.audio_buffer = b""
                await websocket.send_json({"type": "transcript", "text": transcript, "question_id": q_id})
                continue

            # ── submit_test ───────────────────────────────────────────────────
            if msg_type == "submit_test":
                if not session.is_completed:
                    await _complete_test(session_id, "submitted")
                break

            log.warning("ws_test: unknown message type=%s session_id=%s", msg_type, session_id)

    except WebSocketDisconnect:
        log.info("ws_test: disconnected session_id=%s", session_id)
        session.ws = None

    except Exception as exc:
        log.error("ws_test: error session_id=%s error=%s", session_id, exc, exc_info=True)
        try:
            await websocket.send_json({"type": "error", "error": str(exc)})
        except Exception:
            pass


def _build_sync_state(session: TestSession) -> dict:
    return {
        "type":            "sync_state",
        "session_id":      session.session_id,
        "questions_count": len(session.questions),
        "current_index":   session.current_index,
        "time_remaining":  session.time_remaining_seconds,
        "duration_seconds": session.duration_seconds,
        "answers": {
            q_id: {"answer": a.answer, "points_earned": a.points_earned}
            for q_id, a in session.answers.items()
        },
        "is_completed":    session.is_completed,
        "completion_reason": session.completion_reason,
        "questions": [
            {
                "id":            q.id,
                "order":         q.order,
                "question_text": q.question_text,
                "question_type": q.question_type,
                "options":       q.options,
                "points":        q.points,
            }
            for q in session.questions
        ],
    }


async def _handle_answer(session: TestSession, question_id: str, raw_answer: str) -> None:
    lock = session_manager.get_lock(session.session_id)
    async with lock:
        question = next((q for q in session.questions if q.id == question_id), None)
        if not question:
            log.warning("submit_answer: unknown question_id=%s", question_id)
            return

        is_correct, points = session_manager.score_mcq_answer(question, raw_answer)
        session.answers[question_id] = Answer(
            question_id=question_id,
            answer=raw_answer,
            is_correct=is_correct,
            points_earned=points,
            submitted_at=datetime.now(tz=timezone.utc).isoformat(),
        )
        # Advance index to the next unanswered question
        answered_ids = set(session.answers.keys())
        for i, q in enumerate(session.questions):
            if q.id not in answered_ids:
                session.current_index = i
                break
        else:
            session.current_index = len(session.questions)


async def _transcribe_buffer(session: TestSession) -> str:
    if not settings.enable_voice or not session.audio_buffer:
        return ""
    loop = asyncio.get_event_loop()
    text = await loop.run_in_executor(
        None,
        whisper_service.transcribe_audio,
        session.audio_buffer,
        16000,
        settings.whisper_language,
    )
    return text or ""


# ── Proctoring WebSocket ───────────────────────────────────────────────────────

@app.websocket("/ws/proctoring/{session_id}")
async def ws_proctoring(websocket: WebSocket, session_id: str):
    await websocket.accept()

    session = session_manager.get_session(session_id)
    if not session:
        await websocket.close(code=4404, reason="Session not found.")
        return

    if not session.enable_proctoring:
        # Proctoring disabled for this test — accept but ignore frames
        try:
            while True:
                await websocket.receive()
        except WebSocketDisconnect:
            pass
        return

    log.info("ws_proctoring: connected session_id=%s", session_id)

    try:
        while True:
            message = await websocket.receive()
            if "text" not in message:
                continue

            try:
                data = json.loads(message["text"])
            except json.JSONDecodeError:
                continue

            base64_frame = data.get("base64", "")
            if not base64_frame:
                continue

            result = await proctoring.analyze_frame(base64_frame)
            severity = proctoring.classify_severity(result)

            # Record anomaly if noteworthy
            if severity in ("warning", "critical"):
                session.proctoring_events.append(ProctoringEvent(
                    event_type=_proctoring_event_type(result),
                    severity=severity,
                    timestamp=datetime.now(tz=timezone.utc).isoformat(),
                ))

            await websocket.send_json({
                "people_count":         result.get("people_count", 1),
                "looking_away":         result.get("looking_away", False),
                "communication_device": result.get("communication_device", False),
                "severity":             severity,
            })

    except WebSocketDisconnect:
        log.info("ws_proctoring: disconnected session_id=%s", session_id)

    except Exception as exc:
        log.error("ws_proctoring: error session_id=%s error=%s", session_id, exc)


def _proctoring_event_type(result: dict) -> str:
    if result.get("people_count", 1) > 1:
        return "multiple_people"
    if result.get("communication_device"):
        return "phone_detected"
    return "looking_away"
