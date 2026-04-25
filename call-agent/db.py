"""
Thin async DB layer over the shared PostgreSQL instance.
Table names mirror Django's default pattern: <app>_<model>.
Adjust to your actual schema if they differ.
"""
import json
import asyncpg
from config import settings


async def _conn() -> asyncpg.Connection:
    return await asyncpg.connect(settings.database_url)


async def get_parent_contact(parent_id: int) -> dict | None:
    conn = await _conn()
    try:
        row = await conn.fetchrow(
            "SELECT id, name, phone, school_id FROM core_parent WHERE id = $1",
            parent_id,
        )
        return dict(row) if row else None
    finally:
        await conn.close()


async def get_teacher_contact(teacher_id: int) -> dict | None:
    conn = await _conn()
    try:
        row = await conn.fetchrow(
            "SELECT id, name, phone, school_id FROM core_teacher WHERE id = $1",
            teacher_id,
        )
        return dict(row) if row else None
    finally:
        await conn.close()


async def get_student_for_parent(parent_id: int) -> dict | None:
    conn = await _conn()
    try:
        row = await conn.fetchrow(
            """
            SELECT s.id, s.name, s.grade
            FROM core_student s
            JOIN core_studentparent sp ON sp.student_id = s.id
            WHERE sp.parent_id = $1
            LIMIT 1
            """,
            parent_id,
        )
        return dict(row) if row else None
    finally:
        await conn.close()


async def get_school_name(school_id: int) -> str:
    conn = await _conn()
    try:
        row = await conn.fetchrow(
            "SELECT name FROM core_school WHERE id = $1", school_id
        )
        return row["name"] if row else "the school"
    finally:
        await conn.close()


async def save_appointment(call_uuid: str, data: dict) -> None:
    conn = await _conn()
    try:
        await conn.execute(
            """
            INSERT INTO call_agent_appointment
                (call_uuid, contact_type, contact_id, student_id,
                 objective, appointment_time, notes, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (call_uuid) DO UPDATE SET
                appointment_time = EXCLUDED.appointment_time,
                notes            = EXCLUDED.notes
            """,
            call_uuid,
            data.get("contact_type"),
            data.get("contact_id"),
            data.get("student_id"),
            data.get("objective"),
            data.get("appointment_time"),
            json.dumps(data.get("notes", {})),
        )
    finally:
        await conn.close()


async def log_call(call_uuid: str, data: dict) -> None:
    conn = await _conn()
    try:
        await conn.execute(
            """
            INSERT INTO call_agent_log
                (call_uuid, objective, contact_type, contact_id,
                 outcome, conversation_json, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (call_uuid) DO UPDATE SET
                outcome           = EXCLUDED.outcome,
                conversation_json = EXCLUDED.conversation_json
            """,
            call_uuid,
            data.get("objective"),
            data.get("contact_type"),
            data.get("contact_id"),
            data.get("outcome", "unknown"),
            json.dumps(data.get("conversation_history", [])),
        )
    finally:
        await conn.close()
