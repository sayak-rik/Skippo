import os


class Settings:
    # Skippo backend webhook
    skippo_webhook_url:    str = os.environ.get("SKIPPO_WEBHOOK_URL", "")
    skippo_webhook_secret: str = os.environ.get("SKIPPO_WEBHOOK_SECRET", "")

    # Exam loadbalancer (for fetching test configs + heartbeating)
    exam_lb_url:    str = os.environ.get("EXAM_LB_URL", "http://exam-loadbalancer:8094")
    exam_lb_secret: str = os.environ.get("EXAM_LB_SECRET", "")

    # Machine identity (set by Fly.io at runtime)
    machine_id: str = os.environ.get("FLY_MACHINE_ID", "local")

    # LLM (Gemini) for proctoring + optional voice evaluation
    llm_api_key:  str = os.environ.get("LLM_API_KEY", "")
    llm_provider: str = os.environ.get("LLM_PROVIDER", "google")

    # Voice transcription
    enable_voice: bool = os.environ.get("ENABLE_VOICE", "false").lower() == "true"
    whisper_model:   str = os.environ.get("WHISPER_MODEL",   "base")
    whisper_device:  str = os.environ.get("WHISPER_DEVICE",  "cpu")
    whisper_language: str = os.environ.get("WHISPER_LANGUAGE", "en")

    # Server
    port:        int = int(os.environ.get("PORT", "8080"))
    cors_origins: list = os.environ.get("CORS_ORIGINS", "*").split(",")

    # Heartbeat interval in seconds
    heartbeat_interval: int = int(os.environ.get("HEARTBEAT_INTERVAL", "60"))

    # Timer tick interval — how often to push time_remaining to client
    timer_tick_interval: int = int(os.environ.get("TIMER_TICK_SECONDS", "10"))


settings = Settings()
