-- Call-agent tables
-- Run once on first `docker compose up`. Safe to re-run (CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS call_agent_appointment (
    id               SERIAL PRIMARY KEY,
    call_uuid        TEXT        NOT NULL UNIQUE,
    contact_type     TEXT        NOT NULL,   -- 'parent' | 'teacher'
    contact_id       INTEGER     NOT NULL,
    student_id       INTEGER,
    objective        TEXT        NOT NULL,   -- 'guardian_meet' | 'career_guidance'
    appointment_time TEXT,                   -- natural-language time extracted by LLM
    notes            JSONB       NOT NULL DEFAULT '{}',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_agent_log (
    id                SERIAL PRIMARY KEY,
    call_uuid         TEXT        NOT NULL UNIQUE,
    objective         TEXT,
    contact_type      TEXT,
    contact_id        INTEGER,
    outcome           TEXT,                  -- 'complete' | 'failed' | 'dropped:...'
    conversation_json JSONB       NOT NULL DEFAULT '[]',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cal_appt_contact  ON call_agent_appointment (contact_type, contact_id);
CREATE INDEX IF NOT EXISTS idx_cal_log_contact   ON call_agent_log (contact_type, contact_id);
