from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import WebSocket
from pydantic import BaseModel, Field
from typing_extensions import TypedDict


# ── Graph state ────────────────────────────────────────────────────────────────

class TeacherState(TypedDict):
    classroom_id: str
    subject: str
    instructions: str
    messages: List[Dict[str, Any]]   # conversation history
    question: Optional[str]          # current student question (None = proactive)
    questioner: Optional[str]        # student name who asked


# ── Runtime classroom data ─────────────────────────────────────────────────────

class StudentInfo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    joined_at: datetime = Field(default_factory=datetime.now)
    websocket: Any = Field(exclude=True)  # FastAPI WebSocket — not serialised

    class Config:
        arbitrary_types_allowed = True

    def dict_safe(self) -> dict:
        return {"id": self.id, "name": self.name}


class Message(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)


class ClassroomData(BaseModel):
    classroom_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject: str = ""
    instructions: str = ""
    created_at: datetime = Field(default_factory=datetime.now)

    # runtime (not persisted)
    students: Dict[str, StudentInfo] = Field(default_factory=dict)
    question_queue: List[str] = Field(default_factory=list)    # ordered student_ids
    active_questioner: Optional[str] = None                    # student_id with the floor
    conversation_history: List[Dict[str, Any]] = Field(default_factory=list)
    teacher_engine: Any = Field(default=None, exclude=True)

    class Config:
        arbitrary_types_allowed = True

    def get_state_dict(self) -> dict:
        return {
            "classroom_id": self.classroom_id,
            "subject": self.subject,
            "students": [s.dict_safe() for s in self.students.values()],
            "queue": [
                self.students[sid].dict_safe()
                for sid in self.question_queue
                if sid in self.students
            ],
            "active_questioner": (
                self.students[self.active_questioner].dict_safe()
                if self.active_questioner and self.active_questioner in self.students
                else None
            ),
        }


# ── HTTP request / response models ────────────────────────────────────────────

class CreateClassroomRequest(BaseModel):
    subject: str = Field(..., description="Topic being taught, e.g. 'Python Programming'")
    instructions: str = Field(
        ...,
        description="Instructions for the AI teacher: style, level, scope, etc.",
    )


class CreateClassroomResponse(BaseModel):
    classroom_id: str
    message: str


class ClassroomInfoResponse(BaseModel):
    classroom_id: str
    subject: str
    student_count: int
    queue_length: int


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
