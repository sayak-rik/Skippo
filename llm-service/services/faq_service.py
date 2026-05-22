import logging
from pathlib import Path

from providers.base import BaseLLMProvider
from services.memory_service import append_history, get_history

log = logging.getLogger(__name__)

_SYSTEM = (Path(__file__).parent.parent / "prompts" / "faq.txt").read_text()


async def answer_faq(
    user_id: str,
    question: str,
    app_context: str,
    provider: BaseLLMProvider,
) -> str:
    history = await get_history(user_id)

    history_block = ""
    if history:
        lines = [f"{h['role'].upper()}: {h['message']}" for h in history[-10:]]
        history_block = "\n\nConversation history:\n" + "\n".join(lines)

    prompt = (
        f"{_SYSTEM}\n\n"
        f"App context: {app_context}"
        f"{history_block}\n\n"
        f"User: {question}\n\n"
        f"Assistant:"
    )

    answer = await provider.generate(prompt)

    await append_history(user_id, "user", question)
    await append_history(user_id, "assistant", answer)

    return answer
