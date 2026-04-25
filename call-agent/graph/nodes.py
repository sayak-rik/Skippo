"""
LangGraph node functions.
Each node receives the full CallState and returns a partial dict of updates.
Nodes that need a speech response set `next_speak` + `next_action`.
The interrupt() call suspends the graph; it resumes when the recording
webhook feeds back the transcription via Command(resume=...).
"""
import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.types import interrupt

from .state import CallState, Phase

_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _turn(role: str, text: str) -> dict:
    return {"role": role, "content": text}


async def _ask_llm(system: str, human: str) -> str:
    resp = await _llm.ainvoke([SystemMessage(content=system), HumanMessage(content=human)])
    return resp.content.strip()


# ─────────────────────────────────────────────────────────────────────────────
# Shared wait node  (suspend until recording webhook resumes with transcription)
# ─────────────────────────────────────────────────────────────────────────────

def wait_for_speech(state: CallState) -> dict:
    """Pause graph execution; resumes when caller's speech is transcribed."""
    transcription: str = interrupt("waiting_for_speech")
    return {
        "last_transcription": transcription,
        "conversation_history": [_turn("user", transcription)],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Greeting
# ─────────────────────────────────────────────────────────────────────────────

async def greeting_node(state: CallState) -> dict:
    obj       = state["objective"]
    name      = state["contact_name"]
    student   = state["student_name"] or "your child"
    school    = state["school_name"]

    if obj == "guardian_meet":
        text = (
            f"Hello, this is an automated call from {school}. "
            f"I'm calling about {student}. "
            f"Am I speaking with {name} or a guardian of {student}? "
            f"Please say yes, or no."
        )
    else:  # career_guidance
        text = (
            f"Hello, this is {school} calling regarding {student}'s career planning. "
            f"Am I speaking with {name} or a guardian? "
            f"Please say yes, or no."
        )

    return {
        "phase": Phase.CONFIRM_IDENTITY,
        "next_speak": text,
        "next_action": "record",
        "conversation_history": [_turn("assistant", text)],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Identity confirmation
# ─────────────────────────────────────────────────────────────────────────────

async def confirm_identity_node(state: CallState) -> dict:
    transcript = state["last_transcription"]

    answer = await _ask_llm(
        system=(
            "You are classifying a phone response. "
            "The caller was asked if they are the parent/guardian of a student. "
            'Reply with exactly one word: "yes", "no", or "unclear".'
        ),
        human=f'Caller said: "{transcript}"',
    )
    answer = answer.lower()

    if "yes" in answer:
        obj    = state["objective"]
        student = state["student_name"] or "your child"
        school  = state["school_name"]

        if obj == "guardian_meet":
            speak = (
                f"Thank you. We would like to arrange a guardian meeting at {school} "
                f"to discuss {student}'s progress. "
                f"Could you suggest a date and time that works for you? "
                f"For example, this coming Saturday morning, or a weekday afternoon."
            )
        else:  # career_guidance
            speak = (
                f"Thank you. We'd like to talk about {student}'s career interests "
                f"and how we can support them. "
                f"Could you briefly tell me what fields or subjects {student} is most interested in?"
            )

        return {
            "phase": Phase.MAIN_CONTENT,
            "next_speak": speak,
            "next_action": "record",
            "conversation_history": [_turn("assistant", speak)],
        }

    elif "no" in answer:
        speak = (
            "I'm sorry to bother you. We'll try to reach the parent or guardian "
            "at another time. Thank you, and have a good day."
        )
        return {
            "phase": Phase.FAILED,
            "next_speak": speak,
            "next_action": "hangup",
            "conversation_history": [_turn("assistant", speak)],
        }

    else:  # unclear — one retry then give up
        attempts = state.get("attempts", 0) + 1
        if attempts >= 2:
            speak = (
                "I'm having difficulty understanding. "
                "We'll try to reach you again at a better time. Goodbye."
            )
            return {
                "phase": Phase.FAILED,
                "attempts": attempts,
                "next_speak": speak,
                "next_action": "hangup",
                "conversation_history": [_turn("assistant", speak)],
            }
        speak = "I'm sorry, I didn't catch that. Are you the parent or guardian? Please say yes or no."
        return {
            "phase": Phase.CONFIRM_IDENTITY,
            "attempts": attempts,
            "next_speak": speak,
            "next_action": "record",
            "conversation_history": [_turn("assistant", speak)],
        }


# ─────────────────────────────────────────────────────────────────────────────
# Main content / first substantive response
# ─────────────────────────────────────────────────────────────────────────────

async def handle_response_node(state: CallState) -> dict:
    """
    Interprets the caller's reply to the main content question.
    guardian_meet  → parse proposed meeting time / rejection
    career_guidance → parse career interests and provide guidance
    """
    obj        = state["objective"]
    transcript = state["last_transcription"]
    student    = state["student_name"] or "the student"
    school     = state["school_name"]
    attempts   = state.get("attempts", 0)
    collected  = dict(state.get("collected_data", {}))

    if obj == "guardian_meet":
        classification = await _ask_llm(
            system=(
                "You are extracting a meeting time from a caller's response. "
                "If a specific time or date is mentioned, extract it and reply with JSON: "
                '{"accepted": true, "time": "<extracted time>"}. '
                "If the caller declines or says they can't come, reply with JSON: "
                '{"accepted": false, "time": null}. '
                'If unclear, reply {"accepted": null, "time": null}.'
            ),
            human=f'Caller said: "{transcript}"',
        )
        try:
            parsed = json.loads(classification)
        except Exception:
            parsed = {"accepted": None, "time": None}

        if parsed.get("accepted") is True:
            apt_time = parsed.get("time", transcript)
            collected["appointment_time"] = apt_time
            speak = (
                f"Wonderful! I've noted a meeting at {school} on {apt_time}. "
                f"You will receive an SMS confirmation shortly. "
                f"Is there anything else you'd like us to know before the meeting?"
            )
            return {
                "phase": Phase.CLOSING,
                "next_speak": speak,
                "next_action": "record",
                "collected_data": collected,
                "conversation_history": [_turn("assistant", speak)],
            }

        elif parsed.get("accepted") is False:
            if attempts >= 2:
                speak = (
                    "I understand. We'll reach out again to find a more suitable time. "
                    "Thank you for your time. Goodbye."
                )
                return {
                    "phase": Phase.FAILED,
                    "next_speak": speak,
                    "next_action": "hangup",
                    "conversation_history": [_turn("assistant", speak)],
                }
            speak = (
                "I understand that time doesn't work. "
                "Could you suggest another day or time that would be more convenient for you?"
            )
            return {
                "phase": Phase.HANDLE_RESPONSE,
                "attempts": attempts + 1,
                "next_speak": speak,
                "next_action": "record",
                "conversation_history": [_turn("assistant", speak)],
            }

        else:  # unclear
            speak = (
                "I'm sorry, I didn't quite get that. "
                "Could you tell me a day and time that works for you to come to the school?"
            )
            return {
                "phase": Phase.HANDLE_RESPONSE,
                "attempts": attempts + 1,
                "next_speak": speak,
                "next_action": "record",
                "conversation_history": [_turn("assistant", speak)],
            }

    else:  # career_guidance
        # Build conversation context
        history_text = "\n".join(
            f"{t['role'].title()}: {t['content']}"
            for t in state.get("conversation_history", [])
            if t["role"] != "system"
        )

        guidance = await _ask_llm(
            system=(
                f"You are a helpful school counselor at {school} speaking with a parent on the phone. "
                f"The student's name is {student}. "
                "Based on the parent's response about their child's interests, provide 2-3 specific, "
                "actionable career guidance suggestions in simple, warm language (max 60 words). "
                "Then ask if they'd like to schedule a 30-minute counselor session."
            ),
            human=f"Conversation so far:\n{history_text}\n\nParent just said: \"{transcript}\"",
        )
        collected["career_interests"] = transcript

        return {
            "phase": Phase.CLOSING,
            "next_speak": guidance,
            "next_action": "record",
            "collected_data": collected,
            "conversation_history": [_turn("assistant", guidance)],
        }


# ─────────────────────────────────────────────────────────────────────────────
# Closing — handle final note / counselor session confirmation
# ─────────────────────────────────────────────────────────────────────────────

async def closing_node(state: CallState) -> dict:
    transcript = state["last_transcription"]
    obj        = state["objective"]
    school     = state["school_name"]
    collected  = dict(state.get("collected_data", {}))

    if obj == "career_guidance":
        wants_session = await _ask_llm(
            system='Reply with exactly one word: "yes" or "no".',
            human=f'Caller said: "{transcript}". Do they want to schedule a counselor session?',
        )
        if "yes" in wants_session.lower():
            collected["counselor_session_requested"] = True
            speak = (
                "Excellent! We'll schedule a 30-minute career counseling session "
                f"for {state['student_name']} and send you the details via SMS. "
                "Thank you for your time, and have a great day!"
            )
        else:
            speak = (
                "Understood. We're always here if you need guidance. "
                f"Thank you for taking the time to talk with us about {state['student_name']}. "
                "Have a wonderful day!"
            )
    else:
        # guardian_meet — capture any final notes
        collected["final_notes"] = transcript
        speak = (
            f"Thank you. We look forward to seeing you at {school}. "
            "You'll receive an SMS confirmation with all the details. "
            "Have a great day!"
        )

    return {
        "phase": Phase.COMPLETE,
        "next_speak": speak,
        "next_action": "hangup",
        "collected_data": collected,
        "conversation_history": [_turn("assistant", speak)],
    }
