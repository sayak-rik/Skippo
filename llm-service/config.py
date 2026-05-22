import os

LLM_PROVIDER   = os.getenv("LLM_PROVIDER", "gemini")
LLM_MODEL      = os.getenv("LLM_MODEL", "gemini-2.5-flash")

GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY", "AIzaSyCrNQYb1k-ZZjLiwqsjDgFnavCwF9V9bds")
OPENAI_API_KEY    = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

REDIS_URL        = os.getenv("REDIS_URL", "redis://redis:6379/0")
MEMORY_TTL_DAYS  = int(os.getenv("MEMORY_TTL_DAYS", "30"))

MAX_FILE_SIZE    = 50 * 1024 * 1024   # 50 MB
EXTRACTION_CHUNK = 200                 # max rows sent to LLM per call
