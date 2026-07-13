"""
Webcam frame analysis using Gemini Vision API.

Receives base64 JPEG frames and returns structured anomaly data.
Falls back silently if LLM_API_KEY is not configured.
"""
import json
import logging
from typing import Dict

import httpx
from app.config import settings

log = logging.getLogger(__name__)

_PROMPT = (
    "Analyze this webcam still and respond with a single JSON object only — no markdown:\n"
    '{"people_count": <int>, "looking_away": <bool>, "communication_device": <bool>}\n'
    "people_count = number of people visible. looking_away = true if the person is not looking "
    "toward the screen. communication_device = true if a phone or headset is visible."
)

_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)

_FALLBACK = {"people_count": 1, "looking_away": False, "communication_device": False}


async def analyze_frame(base64_frame: str) -> Dict:
    if not settings.llm_api_key:
        return _FALLBACK

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.post(
                _GEMINI_URL,
                params={"key": settings.llm_api_key},
                json={
                    "contents": [{
                        "parts": [
                            {"text": _PROMPT},
                            {"inline_data": {"mime_type": "image/jpeg", "data": base64_frame}},
                        ]
                    }],
                    "generationConfig": {"response_mime_type": "application/json"},
                },
            )
            resp.raise_for_status()
            text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
    except Exception as exc:
        log.warning("proctoring: analysis failed: %s", exc)
        return _FALLBACK


def classify_severity(result: Dict) -> str:
    if result.get("people_count", 1) > 1:
        return "critical"
    if result.get("communication_device"):
        return "critical"
    if result.get("looking_away"):
        return "warning"
    return "info"
