import config
from .base import BaseLLMProvider
from .gemini import GeminiProvider
from .openai_provider import OpenAIProvider
from .anthropic_provider import AnthropicProvider

_REGISTRY = {
    "gemini":    GeminiProvider,
    "openai":    OpenAIProvider,
    "anthropic": AnthropicProvider,
}


def get_provider() -> BaseLLMProvider:
    name = config.LLM_PROVIDER.lower()
    cls = _REGISTRY.get(name)
    if not cls:
        raise ValueError(f"Unknown LLM_PROVIDER '{name}'. Choose from: {list(_REGISTRY)}")
    return cls()
