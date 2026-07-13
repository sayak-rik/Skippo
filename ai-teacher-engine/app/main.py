"""
AI Teacher Engine — FastAPI backend (Skippo-integrated)

Runs as a Fly.io machine per AI class session.
One classroom per pod (injected via SKIPPO_CLASS_ID env var).
"""

import asyncio
import json
import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Dict, List, Optional

import httpx
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.websockets import WebSocketState

from app.config import Settings
from app.core.graph import TeacherEngine
from app.core.models import (
    ClassroomData,
    ClassroomInfoResponse,
    CreateClassroomRequest,
    CreateClassroomResponse,
    ErrorResponse,
    StudentInfo,
)
from app.services.stt_service import get_stt, initialize_stt
from app.services.tts_service import get_tts, initialize_tts

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

settings: Optional[Settings] = None
classrooms: Dict[str, ClassroomData] = {}


# ── Skippo integration helpers ─────────────────────────────────────────────────

async def _post_skippo_webhook(payload: dict) -> None:
    if not settings or not settings.skippo_webhook_url:
        return
    headers = {"Content-Type": "application/json"}
    if settings.skippo_webhook_secret:
        headers["X-Webhook-Secret"] = settings.skippo_webhook_secret
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(settings.skippo_webhook_url, json=payload, headers=headers)
        logger.info("skippo webhook posted: type=%s", payload.get("type"))
    except Exception as exc:
        logger.warning("skippo webhook failed: %s", exc)


async def _heartbeat_loop(machine_id: str) -> None:
    """Ping the AI teacher loadbalancer every 60 s so stale-pod sweep keeps it alive."""
    if not settings or not settings.skippo_lb_url:
        return
    headers = {}
    if settings.skippo_lb_secret:
        headers["Authorization"] = f"Bearer {settings.skippo_lb_secret}"
    while True:
        await asyncio.sleep(60)
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(
                    f"{settings.skippo_lb_url}/heartbeat/",
                    json={"machine_id": machine_id},
                    headers=headers,
                )
        except Exception:
            pass


_heartbeat_task: Optional[asyncio.Task] = None
_machine_id: str = ""


@asynccontextmanager
async def lifespan(app: FastAPI):
    global settings, _heartbeat_task, _machine_id
    settings = Settings()

    try:
        initialize_tts(settings.tts_provider, voice=settings.tts_voice)
    except Exception as e:
        logger.warning("TTS init failed (%s) — continuing without audio", e)

    try:
        initialize_stt(
            settings.stt_provider,
            model_name=settings.whisper_model,
            device=settings.whisper_device,
            compute_type=settings.whisper_compute_type,
            language=settings.whisper_language,
        )
    except Exception as e:
        logger.warning("STT init failed (%s) — continuing without voice input", e)

    # Pre-create the classroom from Skippo class config if injected
    if settings.skippo_class_id:
        import os
        _machine_id = os.environ.get("FLY_MACHINE_ID", str(uuid.uuid4()))
        subject = os.environ.get("CLASS_SUBJECT", "General")
        instructions = os.environ.get("CLASS_INSTRUCTIONS", "")
        engine = TeacherEngine(settings)
        classroom = ClassroomData(
            classroom_id=settings.skippo_class_id,
            subject=subject,
            instructions=instructions,
            teacher_engine=engine,
        )
        classrooms[settings.skippo_class_id] = classroom
        logger.info("Pre-created classroom for class_id=%s subject=%r", settings.skippo_class_id, subject)
        _heartbeat_task = asyncio.create_task(_heartbeat_loop(_machine_id))

    logger.info("AI Teacher Engine ready")
    yield

    if _heartbeat_task:
        _heartbeat_task.cancel()
    classrooms.clear()
    logger.info("Shutdown complete")


app = FastAPI(title="AI Teacher Engine", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _send_safe(websocket: WebSocket, payload: dict) -> bool:
    try:
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.send_json(payload)
            return True
    except Exception:
        pass
    return False


async def broadcast(classroom: ClassroomData, payload: dict) -> None:
    dead: list[str] = []
    for sid, student in list(classroom.students.items()):
        ok = await _send_safe(student.websocket, payload)
        if not ok:
            dead.append(sid)
    for sid in dead:
        classroom.students.pop(sid, None)


async def broadcast_state(classroom: ClassroomData) -> None:
    await broadcast(classroom, {"type": "classroom_state", **classroom.get_state_dict()})


async def try_grant_next_turn(classroom: ClassroomData) -> None:
    if classroom.active_questioner is not None:
        return
    while classroom.question_queue:
        next_id = classroom.question_queue[0]
        if next_id in classroom.students:
            break
        classroom.question_queue.pop(0)
    else:
        return

    classroom.question_queue.pop(0)
    classroom.active_questioner = next_id
    student = classroom.students[next_id]
    await broadcast_state(classroom)
    await _send_safe(student.websocket, {"type": "turn_granted"})


async def process_question(classroom: ClassroomData, questioner_id: str, question: str) -> None:
    student = classroom.students.get(questioner_id)
    student_name = student.name if student else "A student"

    await broadcast(classroom, {
        "type": "question_received",
        "student_name": student_name,
        "question": question,
    })

    state = {
        "classroom_id": classroom.classroom_id,
        "subject": classroom.subject,
        "instructions": classroom.instructions,
        "messages": list(classroom.conversation_history),
        "question": question,
        "questioner": student_name,
    }

    await broadcast(classroom, {"type": "teacher_start"})
    full_response = ""
    async for chunk in classroom.teacher_engine.stream_response(state):
        if chunk["type"] == "text_chunk":
            full_response += chunk["content"]
            await broadcast(classroom, {"type": "teacher_text_chunk", "chunk": chunk["content"]})
        elif chunk["type"] == "error":
            await broadcast(classroom, {"type": "error", "error": chunk["error"]})
            break

    tts = get_tts()
    if tts and full_response:
        try:
            audio_b64 = await tts.generate(full_response)
            await broadcast(classroom, {"type": "teacher_audio", "audio": audio_b64, "format": tts.audio_format})
        except Exception as e:
            logger.warning("TTS error: %s", e)

    classroom.conversation_history.append({"role": "user", "content": f"[{student_name}]: {question}"})
    if full_response:
        classroom.conversation_history.append({"role": "assistant", "content": full_response})

    await broadcast(classroom, {"type": "teacher_response_complete"})
    classroom.active_questioner = None
    await broadcast_state(classroom)
    await try_grant_next_turn(classroom)


async def send_intro(classroom: ClassroomData) -> None:
    state = {
        "classroom_id": classroom.classroom_id,
        "subject": classroom.subject,
        "instructions": classroom.instructions,
        "messages": [],
        "question": None,
        "questioner": None,
    }

    await broadcast(classroom, {"type": "teacher_start"})
    full_response = ""
    async for chunk in classroom.teacher_engine.stream_response(state):
        if chunk["type"] == "text_chunk":
            full_response += chunk["content"]
            await broadcast(classroom, {"type": "teacher_text_chunk", "chunk": chunk["content"]})

    tts = get_tts()
    if tts and full_response:
        try:
            audio_b64 = await tts.generate(full_response)
            await broadcast(classroom, {"type": "teacher_audio", "audio": audio_b64, "format": tts.audio_format})
        except Exception as e:
            logger.warning("Intro TTS error: %s", e)

    classroom.conversation_history.append({"role": "assistant", "content": full_response})
    await broadcast(classroom, {"type": "teacher_response_complete"})


# ── HTTP endpoints ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "class_id": settings.skippo_class_id if settings else "",
        "tts": get_tts().__class__.__name__ if get_tts() else "disabled",
        "stt": get_stt().__class__.__name__ if get_stt() else "disabled",
        "classrooms": len(classrooms),
    }


@app.post("/classroom", response_model=CreateClassroomResponse, status_code=status.HTTP_201_CREATED)
async def create_classroom(req: CreateClassroomRequest):
    engine = TeacherEngine(settings)
    classroom = ClassroomData(
        subject=req.subject,
        instructions=req.instructions,
        teacher_engine=engine,
    )
    classrooms[classroom.classroom_id] = classroom
    return CreateClassroomResponse(
        classroom_id=classroom.classroom_id,
        message="Classroom created.",
    )


@app.get("/classroom/{classroom_id}", response_model=ClassroomInfoResponse)
async def get_classroom(classroom_id: str):
    classroom = classrooms.get(classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return ClassroomInfoResponse(
        classroom_id=classroom.classroom_id,
        subject=classroom.subject,
        student_count=len(classroom.students),
        queue_length=len(classroom.question_queue),
    )


@app.post("/end-class/{classroom_id}")
async def end_class(classroom_id: str):
    """Called by dashboard or timeout to close the class and fire the Skippo webhook."""
    classroom = classrooms.get(classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    await broadcast(classroom, {"type": "class_ended", "message": "The class has ended. Thank you!"})

    summary = {
        "type": "class_ended",
        "class_id": classroom_id,
        "skippo_class_id": settings.skippo_class_id if settings else classroom_id,
        "subject": classroom.subject,
        "student_count": len(classroom.students),
        "conversation_turns": len(classroom.conversation_history),
        "ended_at": datetime.now(timezone.utc).isoformat(),
        "conversation_log": classroom.conversation_history,
    }
    await _post_skippo_webhook(summary)

    classrooms.pop(classroom_id, None)
    return {"detail": "Class ended", "class_id": classroom_id}


@app.post("/feedback")
async def submit_feedback(payload: dict):
    """
    Receives per-student feedback and forwards it to the Skippo webhook.
    Expected: {class_id, student_name, rating (1-5), comment}
    """
    if not payload.get("class_id"):
        raise HTTPException(status_code=400, detail="class_id is required")

    feedback_payload = {
        "type": "student_feedback",
        "skippo_class_id": settings.skippo_class_id if settings else payload["class_id"],
        **payload,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    await _post_skippo_webhook(feedback_payload)
    return {"detail": "Feedback submitted"}


# ── Serve React frontend ───────────────────────────────────────────────────────

import os
_static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.isdir(_static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(_static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        index = os.path.join(_static_dir, "index.html")
        if os.path.isfile(index):
            with open(index) as f:
                return HTMLResponse(f.read())
        return JSONResponse({"detail": "Frontend not built"}, status_code=404)


# ── WebSocket endpoint ─────────────────────────────────────────────────────────

@app.websocket("/ws/classroom/{classroom_id}")
async def ws_classroom(websocket: WebSocket, classroom_id: str):
    classroom = classrooms.get(classroom_id)
    if not classroom:
        await websocket.close(code=4004, reason="Classroom not found")
        return

    await websocket.accept()
    student_id: Optional[str] = None
    audio_buffer = bytearray()
    intro_task: Optional[asyncio.Task] = None
    is_first_student = len(classroom.students) == 0

    try:
        raw = await asyncio.wait_for(websocket.receive(), timeout=15)
        if "text" not in raw:
            await websocket.close(code=4000, reason="Expected join message")
            return

        data = json.loads(raw["text"])
        if data.get("type") != "join":
            await websocket.close(code=4000, reason="First message must be join")
            return

        name = (data.get("name") or "Anonymous").strip()[:50]
        student_id = str(uuid.uuid4())
        student = StudentInfo(id=student_id, name=name, websocket=websocket)
        classroom.students[student_id] = student

        await _send_safe(websocket, {
            "type": "welcome",
            "student_id": student_id,
            "classroom_state": classroom.get_state_dict(),
            "stt_available": get_stt() is not None,
        })
        await broadcast_state(classroom)

        if is_first_student:
            intro_task = asyncio.create_task(send_intro(classroom))

        while True:
            message = await websocket.receive()

            if "bytes" in message:
                if classroom.active_questioner == student_id:
                    audio_buffer.extend(message["bytes"])
                continue

            if "text" not in message:
                continue

            data = json.loads(message["text"])
            msg_type = data.get("type")

            if msg_type == "raise_hand":
                if (
                    student_id not in classroom.question_queue
                    and classroom.active_questioner != student_id
                ):
                    classroom.question_queue.append(student_id)
                    await broadcast_state(classroom)
                    await try_grant_next_turn(classroom)

            elif msg_type == "lower_hand":
                if student_id in classroom.question_queue:
                    classroom.question_queue.remove(student_id)
                    await broadcast_state(classroom)

            elif msg_type == "submit_question":
                if classroom.active_questioner == student_id:
                    question = (data.get("text") or "").strip()
                    if question:
                        audio_buffer.clear()
                        await process_question(classroom, student_id, question)

            elif msg_type == "stop_recording":
                if classroom.active_questioner == student_id and audio_buffer:
                    stt = get_stt()
                    if stt:
                        try:
                            transcript = await stt.transcribe(bytes(audio_buffer))
                        except Exception as e:
                            logger.error("STT error: %s", e)
                            transcript = ""
                        audio_buffer.clear()
                        if transcript:
                            await process_question(classroom, student_id, transcript)
                        else:
                            await _send_safe(websocket, {
                                "type": "error",
                                "error": "Could not transcribe audio. Please try typing.",
                            })
                    else:
                        audio_buffer.clear()
                        await _send_safe(websocket, {
                            "type": "error",
                            "error": "Voice input is not available. Please type your question.",
                        })

            elif msg_type == "ping":
                await _send_safe(websocket, {"type": "pong"})

    except asyncio.TimeoutError:
        logger.warning("[%s] Student did not send join in time", classroom_id)
    except WebSocketDisconnect:
        logger.info("[%s] %s disconnected", classroom_id, student_id)
    except Exception as e:
        logger.error("[%s] WS error: %s", classroom_id, e, exc_info=True)
    finally:
        if intro_task and not intro_task.done():
            intro_task.cancel()
        if student_id and student_id in classroom.students:
            del classroom.students[student_id]
        if student_id and student_id in classroom.question_queue:
            classroom.question_queue.remove(student_id)
        if classroom.active_questioner == student_id:
            classroom.active_questioner = None
            await broadcast_state(classroom)
            await try_grant_next_turn(classroom)
        else:
            await broadcast_state(classroom)


@app.exception_handler(HTTPException)
async def http_exc(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(Exception)
async def generic_exc(request, exc):
    logger.error("Unhandled: %s", exc, exc_info=True)
    return JSONResponse(status_code=500, content={"error": "Internal server error"})
