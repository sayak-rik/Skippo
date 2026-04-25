from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Plivo
    plivo_auth_id: str
    plivo_auth_token: str
    plivo_from_number: str

    # OpenAI (Whisper STT + GPT-4o for NLU/NLG)
    openai_api_key: str

    # Postgres (same DB as Django backend)
    database_url: str = "postgresql://skippo:skippo@postgres:5432/skippo"

    # Redis (for LangGraph MemorySaver key-value persistence)
    redis_url: str = "redis://redis:6379/3"

    # Public base URL of this service so Plivo can reach our webhooks.
    # In production set this to your ngrok / Oracle FQDN.
    base_url: str = "http://localhost:8091"

    class Config:
        env_file = ".env"


settings = Settings()
