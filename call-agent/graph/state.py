from typing import TypedDict, Annotated
import operator


class CallState(TypedDict):
    # ── Identity (set at call start, never mutated) ──────────────────────
    call_uuid: str
    objective: str          # "guardian_meet" | "career_guidance" | "general_notification"
    contact_type: str       # "parent" | "teacher"
    contact_id: int
    contact_name: str
    contact_phone: str
    student_name: str
    student_id: int | None
    school_name: str

    # ── Campaign / request context (optional, from scheduler) ────────────
    # Populated for both individual call requests and mass campaigns.
    # The LLM uses reason_text + student_names to craft the call script.
    campaign_context: dict  # keys: reason_text, campaign_id, campaign_call_id,
                            #       call_request_id, student_names, campaign_name

    # ── Mutable conversation state ────────────────────────────────────────
    phase: str              # current phase label (see PHASES below)
    attempts: int           # rescheduling / unclear-response retry counter
    last_transcription: str
    collected_data: dict    # appointment_time, counselor_notes, etc.

    # ── Accumulated turn history (append-only) ────────────────────────────
    conversation_history: Annotated[list[dict], operator.add]

    # ── Output for the webhook handler ────────────────────────────────────
    next_speak: str         # text for Plivo <Speak>
    next_action: str        # "record" | "hangup"


# Phase labels used across both objectives
class Phase:
    GREETING         = "greeting"
    CONFIRM_IDENTITY = "confirm_identity"
    MAIN_CONTENT     = "main_content"
    HANDLE_RESPONSE  = "handle_response"
    CLOSING          = "closing"
    FAILED           = "failed"
    COMPLETE         = "complete"
