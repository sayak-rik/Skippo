import json
import re
from abc import ABC, abstractmethod


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, *, temperature: float = 0.3) -> str:
        pass

    async def generate_json(self, prompt: str) -> dict:
        raw = await self.generate(
            prompt + "\n\nReturn ONLY valid JSON. No markdown. No explanation.",
            temperature=0.1,
        )
        # Strip markdown fences if the model adds them anyway
        raw = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
        return json.loads(raw)
