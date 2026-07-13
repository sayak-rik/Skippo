"""
TeacherAgent — streams LLM responses for the AI classroom.
"""
import logging
from typing import Any, AsyncIterator, Dict, List

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.prompts.teacher import build_system_prompt

logger = logging.getLogger(__name__)


class TeacherAgent:
    def __init__(self, llm):
        self.llm = llm

    def _build_messages(self, state: Dict[str, Any]) -> List:
        subject = state.get("subject", "")
        instructions = state.get("instructions", "Be a helpful teacher.")
        system_prompt = build_system_prompt(subject, instructions)

        messages = [SystemMessage(content=system_prompt)]

        for msg in state.get("messages", []):
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))

        question = state.get("question")
        questioner = state.get("questioner", "A student")
        if question:
            messages.append(HumanMessage(content=f"{questioner} asks: {question}"))
        else:
            messages.append(
                HumanMessage(content="Please introduce the topic and begin the lesson.")
            )

        return messages

    async def stream_response(self, state: Dict[str, Any]) -> AsyncIterator[dict]:
        messages = self._build_messages(state)
        logger.debug(f"TeacherAgent streaming with {len(messages)} messages")

        full_response = ""
        try:
            async for chunk in self.llm.astream(messages):
                content = getattr(chunk, "content", "") or ""
                if content:
                    full_response += content
                    yield {"type": "text_chunk", "content": content}
        except Exception as e:
            logger.error(f"TeacherAgent stream error: {e}", exc_info=True)
            yield {"type": "error", "error": str(e)}
            return

        yield {"type": "response_complete", "response": full_response}
