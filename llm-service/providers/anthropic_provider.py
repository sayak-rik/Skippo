import json
import logging
import re

import anthropic as sdk

import config
from .base import BaseLLMProvider

log = logging.getLogger(__name__)


class AnthropicProvider(BaseLLMProvider):
    def __init__(self):
        self._client = sdk.AsyncAnthropic(api_key=config.ANTHROPIC_API_KEY)

    async def generate(self, prompt: str, *, temperature: float = 0.3) -> str:
        msg = await self._client.messages.create(
            model=config.LLM_MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
        )
        return msg.content[0].text.strip()

    async def generate_json(self, prompt: str) -> dict:
        raw = await self.generate(
            prompt + "\n\nReturn ONLY valid JSON. No markdown.",
            temperature=0.1,
        )
        raw = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
        return json.loads(raw)
