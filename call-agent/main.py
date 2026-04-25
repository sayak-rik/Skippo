"""
Skippo Call Agent — FastAPI service
====================================
Endpoints
---------
POST /call/initiate          Django → trigger an outbound call
POST /call/answer/{uuid}     Plivo → call answered, return greeting PHML
POST /call/recording/{uuid}  Plivo → recording ready, transcribe + next PHML
POST /call/hangup/{uuid}     Plivo → call ended, persist logs

Objectives supported (pass as `objective` in /call/initiate body):
  guardian_meet    — confirm parent identity, propose/reschedule meeting, save appointment
  career_guidance  — gather career interests, provide LLM guidance, optional counselor session
"""
import logging
import uuid as _uuid
from contextlib import asynccontextmanager

import plivo
from fastapi import FastAPI, Form, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from langgraph.types import Command

import db
from config import settings
from graph import CallState, Phase, graph
from plivo_xml import silence_and_hangup, speak_and_hangup, speak_and_record
from stt import transcribe_plivo_recording

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("call-agent")

# ── Plivo SDK client ──────────────────────────────────────────────────────────
_plivo = plivo.RestClient(settings.plivo_auth_id, settings.plivo_auth_token)


# ── Lifecycle ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(_: FastAPI):
    log.info("Call-agent started. Base URL: %s", settings.base_url)
    yield


app = FastAPI(title="Skippo Call Agent", lifespan=lifespan)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _thread(call_uuid: str) -> dict:
    """LangGraph config dict for a given call thread."""
    return {"configurable": {"thread_id": call_uuid}}


def _current_state(call_uuid: str) -> CallState | None:
    snap = graph.get_state(_thread(call_uuid))
    return snap.values if snap else None


def _phml_for_state(call_uuid: str, state: CallState) -> str:
    """Convert state output fields → Plivo PHML."""
    text   = state.get("next_speak", "")
    action = state.get("next_action", "hangup")

    if action == "record":
        record_url = f"{settings.base_url}/call/recording/{call_uuid}"
        return speak_and_record(text, record_url)
    else:
        return speak_and_hangup(text)


# ── 1. Initiate outbound call ─────────────────────────────────────────────────

@app.post("/call/initiate")
async def initiate_call(request: Request) -> JSONResponse:
    """
    Body (JSON):
      objective     : "guardian_meet" | "career_guidance"
      contact_type  : "parent" | "teacher"
      contact_id    : int
      extra         : dict  (optional extra metadata)
    """
    body = await request.json()

    objective    = body["objective"]
    contact_type = body["contact_type"]
    contact_id   = int(body["contact_id"])

    # ── Fetch contact from DB ──────────────────────────────────────────────
    if contact_type == "parent":
        contact = await db.get_parent_contact(contact_id)
    else:
        contact = await db.get_teacher_contact(contact_id)

    if not contact:
        return JSONResponse({"error": "contact not found"}, status_code=404)

    phone      = contact["phone"]
    name       = contact["name"]
    school_id  = contact.get("school_id")
    school_name = await db.get_school_name(school_id) if school_id else "the school"

    student_name = ""
    student_id   = None
    if contact_type == "parent":
        student = await db.get_student_for_parent(contact_id)
        if student:
            student_name = student["name"]
            student_id   = student["id"]

    # Generate our own UUID to embed in webhook URLs so we can look up state
    # before Plivo's CallUUID is known (it only arrives in webhooks).
    call_uuid = str(_uuid.uuid4())

    # ── Make Plivo outbound call ───────────────────────────────────────────
    _plivo.calls.create(
        from_=settings.plivo_from_number,
        to_=phone,
        answer_url=f"{settings.base_url}/call/answer/{call_uuid}",
        answer_method="POST",
        hangup_url=f"{settings.base_url}/call/hangup/{call_uuid}",
        hangup_method="POST",
    )

    # ── Seed LangGraph state via first invoke (runs greeting_node, then interrupts) ──
    initial_state: CallState = {
        "call_uuid":            call_uuid,
        "objective":            objective,
        "contact_type":         contact_type,
        "contact_id":           contact_id,
        "contact_name":         name,
        "contact_phone":        phone,
        "student_name":         student_name,
        "student_id":           student_id,
        "school_name":          school_name,
        "phase":                Phase.GREETING,
        "attempts":             0,
        "last_transcription":   "",
        "collected_data":       {},
        "conversation_history": [],
        "next_speak":           "",
        "next_action":          "record",
    }

    # Store initial state in checkpointer so the answer webhook can resume.
    # We prime the graph by running greeting; it will interrupt at wait_1.
    graph.invoke(initial_state, config=_thread(call_uuid))

    log.info("Initiated call %s → %s (%s / %s)", call_uuid, phone, objective, contact_type)
    return JSONResponse({"call_uuid": call_uuid, "to": phone})


# ── 2. Answer webhook ─────────────────────────────────────────────────────────

@app.post("/call/answer/{call_uuid}", response_class=PlainTextResponse)
async def call_answered(call_uuid: str) -> PlainTextResponse:
    """
    Plivo fires this when the callee picks up.
    The graph has already run greeting_node and is interrupted at wait_1.
    We read the state and return the greeting PHML.
    """
    state = _current_state(call_uuid)
    if state is None:
        log.warning("No state for %s in answer webhook", call_uuid)
        return PlainTextResponse(silence_and_hangup(), media_type="application/xml")

    phml = _phml_for_state(call_uuid, state)
    log.info("[%s] answered → speak '%s...'", call_uuid, state.get("next_speak", "")[:40])
    return PlainTextResponse(phml, media_type="application/xml")


# ── 3. Recording webhook ──────────────────────────────────────────────────────

@app.post("/call/recording/{call_uuid}", response_class=PlainTextResponse)
async def call_recording(
    call_uuid: str,
    RecordUrl: str = Form(...),
    RecordingDuration: str = Form(default="0"),
) -> PlainTextResponse:
    """
    Plivo fires this after each recording segment.
    We transcribe with Whisper, feed the text back into the graph, and
    return the next PHML instructions for the live call.
    """
    log.info("[%s] recording received (%ss): %s", call_uuid, RecordingDuration, RecordUrl)

    # ── STT ───────────────────────────────────────────────────────────────
    try:
        transcription = await transcribe_plivo_recording(
            RecordUrl, settings.plivo_auth_id, settings.plivo_auth_token
        )
    except Exception as exc:
        log.error("[%s] STT failed: %s", call_uuid, exc)
        transcription = ""

    log.info("[%s] transcript: '%s'", call_uuid, transcription)

    # ── Resume LangGraph with transcription ───────────────────────────────
    try:
        graph.invoke(Command(resume=transcription), config=_thread(call_uuid))
    except Exception as exc:
        log.error("[%s] graph error: %s", call_uuid, exc)
        return PlainTextResponse(
            speak_and_hangup("I'm sorry, there was a technical issue. We'll call you back. Goodbye."),
            media_type="application/xml",
        )

    # ── Read updated state ────────────────────────────────────────────────
    state = _current_state(call_uuid)
    if state is None:
        return PlainTextResponse(silence_and_hangup(), media_type="application/xml")

    phml = _phml_for_state(call_uuid, state)

    # Persist appointment / log if conversation reached a terminal phase
    phase = state.get("phase")
    if phase in (Phase.COMPLETE, Phase.FAILED):
        try:
            collected = state.get("collected_data", {})
            if phase == Phase.COMPLETE and collected.get("appointment_time"):
                await db.save_appointment(call_uuid, {
                    "contact_type":     state["contact_type"],
                    "contact_id":       state["contact_id"],
                    "student_id":       state.get("student_id"),
                    "objective":        state["objective"],
                    "appointment_time": collected.get("appointment_time"),
                    "notes":            collected,
                })
            await db.log_call(call_uuid, {
                "objective":            state["objective"],
                "contact_type":         state["contact_type"],
                "contact_id":           state["contact_id"],
                "outcome":              phase,
                "conversation_history": state.get("conversation_history", []),
            })
        except Exception as exc:
            log.error("[%s] DB persist failed: %s", call_uuid, exc)

    log.info("[%s] phase=%s → next_action=%s", call_uuid, phase, state.get("next_action"))
    return PlainTextResponse(phml, media_type="application/xml")


# ── 4. Hangup webhook ─────────────────────────────────────────────────────────

@app.post("/call/hangup/{call_uuid}")
async def call_hangup(
    call_uuid: str,
    HangupCause: str = Form(default=""),
    Duration: str = Form(default="0"),
) -> JSONResponse:
    log.info("[%s] hangup cause=%s duration=%ss", call_uuid, HangupCause, Duration)
    state = _current_state(call_uuid)
    if state and state.get("phase") not in (Phase.COMPLETE, Phase.FAILED):
        # Call dropped mid-conversation; log it
        try:
            await db.log_call(call_uuid, {
                "objective":            state.get("objective"),
                "contact_type":         state.get("contact_type"),
                "contact_id":           state.get("contact_id"),
                "outcome":              f"dropped:{HangupCause}",
                "conversation_history": state.get("conversation_history", []),
            })
        except Exception as exc:
            log.error("[%s] hangup log failed: %s", call_uuid, exc)
    return JSONResponse({"status": "ok"})


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse({"status": "ok", "service": "call-agent"})
