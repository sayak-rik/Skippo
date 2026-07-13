from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Question(BaseModel):
    id: str
    order: int
    question_text: str
    question_type: str          # mcq | short_answer | voice
    options: Optional[List[Dict[str, str]]] = None  # [{id, text}, ...]
    correct_answer: Optional[str] = None            # option id for MCQ auto-grading
    points: int = 1
    voice_grading_hint: str = ""


class Answer(BaseModel):
    question_id: str
    answer: str                  # option id (MCQ) or free text
    is_correct: Optional[bool] = None
    points_earned: float = 0.0
    submitted_at: Optional[str] = None


class ProctoringEvent(BaseModel):
    event_type: str              # looking_away | multiple_people | phone_detected | tab_switch
    severity: str                # info | warning | critical
    timestamp: str               # ISO8601


class TestSession(BaseModel):
    session_id: str
    test_id: str
    access_token: str
    title: str = ""
    instructions: str = ""
    questions: List[Question]
    answers: Dict[str, Answer] = Field(default_factory=dict)
    current_index: int = 0
    start_time: datetime
    duration_seconds: int
    is_completed: bool = False
    completion_reason: str = ""  # submitted | time_expired | disconnected
    proctoring_events: List[ProctoringEvent] = Field(default_factory=list)
    enable_proctoring: bool = True
    # Transient fields — not serialised to JSON
    ws: Optional[Any] = None             # active WebSocket
    timer_task: Optional[Any] = None     # asyncio.Task
    audio_buffer: bytes = b""            # accumulated PCM for current voice question

    class Config:
        arbitrary_types_allowed = True

    @property
    def time_remaining_seconds(self) -> int:
        # start_time is timezone-aware (datetime.now(tz=timezone.utc)), so the
        # comparison clock must be aware too or the subtraction raises TypeError.
        elapsed = (datetime.now(tz=timezone.utc) - self.start_time).total_seconds()
        return max(0, int(self.duration_seconds - elapsed))

    @property
    def is_expired(self) -> bool:
        return self.time_remaining_seconds == 0 and not self.is_completed

    def score_summary(self):
        """Return (score, max_score, percentage)."""
        score     = sum(a.points_earned for a in self.answers.values())
        max_score = sum(q.points for q in self.questions)
        pct       = (score / max_score * 100) if max_score else 0.0
        return score, max_score, pct

    def answers_for_webhook(self) -> List[dict]:
        result = []
        for q in self.questions:
            a = self.answers.get(q.id)
            if a:
                result.append({
                    "question_id":   q.id,
                    "answer":        a.answer,
                    "is_correct":    a.is_correct,
                    "points":        q.points,
                    "points_earned": a.points_earned,
                })
            else:
                result.append({
                    "question_id":   q.id,
                    "answer":        "",
                    "is_correct":    False,
                    "points":        q.points,
                    "points_earned": 0,
                })
        return result
