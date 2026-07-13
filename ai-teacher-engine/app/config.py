from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # LLM
    llm_provider: str = "anthropic"
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    model_name: str = "claude-haiku-4-5-20251001"
    temperature: float = 0.7

    # TTS
    tts_provider: str = "edge"
    tts_voice: str = "en-US-AriaNeural"

    # STT
    stt_provider: str = "faster_whisper"
    whisper_model: str = "tiny"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"
    whisper_language: Optional[str] = "en"

    # Server
    host: str = "0.0.0.0"
    port: int = 8080

    # Skippo integration — injected by ai-teacher-loadbalancer into Fly machine env
    skippo_class_id: str = ""
    skippo_webhook_url: str = ""
    skippo_webhook_secret: str = ""
    skippo_lb_url: str = ""
    skippo_lb_secret: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"
