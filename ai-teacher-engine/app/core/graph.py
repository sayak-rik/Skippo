"""
TeacherEngine — direct LangChain calls, no LangGraph overhead.

Usage:
    engine = TeacherEngine(settings)
    async for chunk in engine.stream_response(state):
        ...
"""
import logging
from typing import Any, AsyncIterator, Dict

from app.config import Settings

logger = logging.getLogger(__name__)


def _build_llm(settings: Settings):
    if settings.llm_provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=settings.model_name,
            api_key=settings.anthropic_api_key,
            temperature=settings.temperature,
        )
    elif settings.llm_provider == "google":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=settings.model_name,
            google_api_key=settings.gemini_api_key,
            temperature=settings.temperature,
        )
    else:
        raise ValueError(f"Unknown llm_provider: {settings.llm_provider}")


class TeacherEngine:
    def __init__(self, settings: Settings):
        self.llm = _build_llm(settings)
        logger.info(
            f"TeacherEngine ready: provider={settings.llm_provider}, model={settings.model_name}"
        )

    async def stream_response(self, state: Dict[str, Any]) -> AsyncIterator[dict]:
        from app.agents.teacher import TeacherAgent
        agent = TeacherAgent(self.llm)
        async for chunk in agent.stream_response(state):
            yield chunk
