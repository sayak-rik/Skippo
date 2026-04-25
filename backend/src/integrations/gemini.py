"""
Thin wrapper around google-generativeai for Skippo backend services.

Usage:
    from integrations.gemini import ask_gemini
    result = await ask_gemini(system="...", user="...")
"""
import os
import asyncio
import logging

import google.generativeai as genai

log = logging.getLogger("integrations.gemini")

_MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
_api_key    = os.getenv("GEMINI_API_KEY", "")

genai.configure(api_key=_api_key)
_model = genai.GenerativeModel(_MODEL_NAME)


async def ask_gemini(system: str, user: str, temperature: float = 0.3) -> str:
    """Send a single-turn prompt to Gemini and return the text response."""
    prompt = f"{system}\n\n{user}"
    try:
        response = await asyncio.to_thread(
            _model.generate_content,
            prompt,
            generation_config=genai.GenerationConfig(temperature=temperature),
        )
        return response.text.strip()
    except Exception as exc:
        log.error("Gemini call failed: %s", exc)
        raise
