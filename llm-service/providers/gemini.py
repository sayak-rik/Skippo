import asyncio
import json
import logging

import google.generativeai as genai

import config
from .base import BaseLLMProvider

log = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        genai.configure(api_key=config.GEMINI_API_KEY)
        self._model = genai.GenerativeModel(config.LLM_MODEL)

    async def generate(self, prompt: str, *, temperature: float = 0.3) -> str:
        response = await asyncio.to_thread(
            self._model.generate_content,
            prompt,
            generation_config=genai.GenerationConfig(temperature=temperature),
        )
        return response.text.strip()

    async def generate_json(self, prompt: str) -> dict:
        model = genai.GenerativeModel(
            config.LLM_MODEL,
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )
        response = await asyncio.to_thread(model.generate_content, prompt)
        return json.loads(response.text)
