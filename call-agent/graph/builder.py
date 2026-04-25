"""
Builds a single compiled LangGraph StateGraph that drives both objectives.

Flow (same shape for guardian_meet and career_guidance):

  greeting ──► wait_1 ──► confirm_identity
                               │
                    ┌──────────┴──────────┐
                  failed              main_content (wait_2 → handle_response)
                    │                      │
                  END              ┌───────┴──────────┐
                            loop back           closing (wait_3)
                          (re-scheduling /           │
                           unclear, ≤3 times)      END (complete)

The graph is compiled once at module import with a MemorySaver checkpointer.
Each outbound call gets its own thread_id = call_uuid, so state is isolated.
"""
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import MemorySaver

from .state import CallState, Phase
from .nodes import (
    greeting_node,
    wait_for_speech,
    confirm_identity_node,
    handle_response_node,
    closing_node,
)

_memory = MemorySaver()


def _route_after_confirm(state: CallState) -> str:
    if state["phase"] == Phase.MAIN_CONTENT:
        return "wait_2"
    return "failed_end"  # phase == FAILED or max retries on unclear


def _route_after_main(state: CallState) -> str:
    phase = state["phase"]
    if phase == Phase.CLOSING:
        return "wait_3"
    if phase == Phase.FAILED:
        return "failed_end"
    # still HANDLE_RESPONSE (re-schedule loop)
    return "wait_loop"


def _route_after_closing(state: CallState) -> str:
    return END


def _failed_end(state: CallState) -> dict:
    """Terminal no-op that lets conditional edges resolve to END."""
    return {}


def _build() -> object:
    g = StateGraph(CallState)

    # ── Nodes ──────────────────────────────────────────────────────────────
    g.add_node("greeting",          greeting_node)
    g.add_node("wait_1",            wait_for_speech)
    g.add_node("confirm_identity",  confirm_identity_node)
    g.add_node("wait_2",            wait_for_speech)
    g.add_node("handle_response",   handle_response_node)
    g.add_node("wait_3",            wait_for_speech)
    g.add_node("closing",           closing_node)
    g.add_node("wait_loop",         wait_for_speech)    # re-schedule attempt
    g.add_node("failed_end",        _failed_end)

    # ── Edges ──────────────────────────────────────────────────────────────
    g.set_entry_point("greeting")
    g.add_edge("greeting", "wait_1")
    g.add_edge("wait_1", "confirm_identity")

    g.add_conditional_edges(
        "confirm_identity",
        _route_after_confirm,
        {"wait_2": "wait_2", "failed_end": "failed_end"},
    )

    # Identity unclear → retry confirm_identity
    g.add_edge("wait_2", "handle_response")

    g.add_conditional_edges(
        "handle_response",
        _route_after_main,
        {
            "wait_3":   "wait_3",
            "wait_loop": "wait_loop",
            "failed_end": "failed_end",
        },
    )

    # Rescheduling loop feeds back into handle_response
    g.add_edge("wait_loop", "handle_response")

    g.add_edge("wait_3", "closing")
    g.add_edge("closing", END)
    g.add_edge("failed_end", END)

    return g.compile(checkpointer=_memory)


# One compiled graph shared across all calls
graph = _build()
