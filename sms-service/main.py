"""Skippo SMS microservice.

Single responsibility: accept an SMS send request and dispatch it via MSG91.

POST /send
    { "to": "+919876543210", "message": "Your OTP is 123456" }

Environment variables:
    MSG91_AUTH_KEY    – MSG91 authentication key (required in production)
    MSG91_SENDER_ID   – 6-char sender ID shown on the recipient's phone (default: SKIPPO)
    MSG91_TEMPLATE_ID – registered DLT template ID (required for India)
    SMS_DRY_RUN       – set to "true" to log instead of sending (useful in dev/test)
"""

import logging
import os

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("sms-service")

app = FastAPI(title="Skippo SMS Service", version="1.0.0")

MSG91_AUTH_KEY = os.getenv("MSG91_AUTH_KEY", "")
MSG91_SENDER_ID = os.getenv("MSG91_SENDER_ID", "SKIPPO")
MSG91_TEMPLATE_ID = os.getenv("MSG91_TEMPLATE_ID", "")
SMS_DRY_RUN = os.getenv("SMS_DRY_RUN", "false").lower() == "true"

MSG91_API_URL = "https://api.msg91.com/api/v5/flow/"


class SMSRequest(BaseModel):
    to: str
    message: str
    sender_id: str | None = None


class SMSResponse(BaseModel):
    ok: bool
    detail: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "sms-service"}


@app.post("/send", response_model=SMSResponse)
async def send_sms(payload: SMSRequest):
    to = payload.to.strip()
    message = payload.message.strip()
    sender_id = (payload.sender_id or MSG91_SENDER_ID).strip()

    if not to or not message:
        raise HTTPException(status_code=400, detail="to and message are required.")

    if SMS_DRY_RUN or not MSG91_AUTH_KEY:
        reason = "DRY_RUN" if SMS_DRY_RUN else "NO_API_KEY"
        print(f"[SMS {reason}] to={to!r}  message={message!r}", flush=True)
        logger.info("[SMS %s] to=%s: %s", reason, to, message)
        return SMSResponse(ok=True, detail="dry_run")

    # MSG91 Flow API — works with DLT-registered templates
    body = {
        "template_id": MSG91_TEMPLATE_ID,
        "sender": sender_id,
        "short_url": "0",
        "mobiles": to.lstrip("+"),  # MSG91 expects numbers without leading +
        "VAR1": message,            # template variable; adjust to your DLT template schema
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                MSG91_API_URL,
                json=body,
                headers={
                    "authkey": MSG91_AUTH_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            logger.info("MSG91 response for %s: %s", to, data)
            return SMSResponse(ok=True, detail=str(data.get("message", "sent")))
    except httpx.HTTPStatusError as exc:
        logger.error("MSG91 HTTP error for %s: %s – %s", to, exc.response.status_code, exc.response.text)
        raise HTTPException(status_code=502, detail="SMS provider returned an error.")
    except Exception as exc:
        logger.error("MSG91 request failed for %s: %s", to, exc)
        raise HTTPException(status_code=502, detail="Failed to reach SMS provider.")
