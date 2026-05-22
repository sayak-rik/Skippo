import json
import logging

from openai import AsyncOpenAI

import config
from .base import BaseLLMProvider

log = logging.getLogger(__name__)


class OpenAIProvider(BaseLLMProvider):
    def __init__(self):
        self._client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)

    async def generate(self, prompt: str, *, temperature: float = 0.3) -> str:
        resp = await self._client.chat.completions.create(
            model=config.LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
        )
        return resp.choices[0].message.content.strip()

    async def generate_json(self, prompt: str) -> dict:
        resp = await self._client.chat.completions.create(
            model=config.LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        return json.loads(resp.choices[0].message.content)
