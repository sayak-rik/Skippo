"""Skippo Email microservice.

Single responsibility: accept an email send request and dispatch it via SMTP.

POST /send
    {
        "to":       "contact@skippo.co.in",
        "subject":  "New school enquiry — Greenfield Academy",
        "html":     "<h1>...</h1>",
        "reply_to": "principal@greenfield.edu"   # optional
    }

Environment variables:
    SMTP_HOST        – SMTP server hostname  (e.g. smtp.gmail.com)
    SMTP_PORT        – SMTP port             (default: 587)
    SMTP_USER        – SMTP username / sender address (e.g. noreply@skippo.co.in)
    SMTP_PASSWORD    – SMTP password or app-password
    SMTP_FROM_NAME   – Display name for the From header (default: Skippo)
    INTERNAL_API_KEY – API key that internal callers must pass in X-Api-Key header
    EMAIL_DRY_RUN    – set to "true" to log emails instead of sending (dev mode)
"""

import email.utils
import logging
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, EmailStr

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("email-service")

app = FastAPI(title="Skippo Email Service", version="1.0.0")

# ── Config ────────────────────────────────────────────────────────────────────

SMTP_HOST      = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT      = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER      = os.getenv("SMTP_USER", "")
SMTP_PASSWORD  = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Skippo")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "dev-key-change-in-production")
EMAIL_DRY_RUN  = os.getenv("EMAIL_DRY_RUN", "false").lower() == "true"

FROM_HEADER = email.utils.formataddr((SMTP_FROM_NAME, SMTP_USER or "noreply@skippo.co.in"))


# ── Models ────────────────────────────────────────────────────────────────────

class EmailRequest(BaseModel):
    to:       EmailStr
    subject:  str
    html:     str
    reply_to: EmailStr | None = None


class EmailResponse(BaseModel):
    ok:     bool
    detail: str


# ── Auth helper ───────────────────────────────────────────────────────────────

def _require_api_key(x_api_key: str | None):
    if not INTERNAL_API_KEY or x_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Api-Key.")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "email-service", "dry_run": EMAIL_DRY_RUN}


@app.post("/send", response_model=EmailResponse)
async def send_email(
    payload: EmailRequest,
    x_api_key: str | None = Header(default=None),
):
    _require_api_key(x_api_key)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = payload.subject
    msg["From"]    = FROM_HEADER
    msg["To"]      = payload.to
    if payload.reply_to:
        msg["Reply-To"] = payload.reply_to

    msg.attach(MIMEText(payload.html, "html", "utf-8"))

    if EMAIL_DRY_RUN or not SMTP_USER or not SMTP_PASSWORD:
        logger.info(
            "[DRY RUN] Email → %s | Subject: %s | Reply-To: %s",
            payload.to, payload.subject, payload.reply_to or "—",
        )
        return EmailResponse(ok=True, detail="dry_run")

    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info("Email sent → %s | Subject: %s", payload.to, payload.subject)
        return EmailResponse(ok=True, detail="sent")
    except aiosmtplib.SMTPException as exc:
        logger.error("SMTP error → %s: %s", payload.to, exc)
        raise HTTPException(status_code=502, detail=f"SMTP error: {exc}")
    except Exception as exc:
        logger.error("Unexpected error sending email → %s: %s", payload.to, exc)
        raise HTTPException(status_code=502, detail="Failed to send email.")
