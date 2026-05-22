import json
import logging

import redis.asyncio as aioredis

import config

log = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None
_TTL_SECONDS = config.MEMORY_TTL_DAYS * 86400
_MAX_HISTORY = 50


async def _get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(config.REDIS_URL, decode_responses=True)
    return _redis


def _key(user_id: str) -> str:
    return f"llm:memory:{user_id}"


async def get_history(user_id: str) -> list[dict]:
    r = await _get_redis()
    raw = await r.get(_key(user_id))
    if not raw:
        return []
    return json.loads(raw)


async def append_history(user_id: str, role: str, message: str) -> None:
    r = await _get_redis()
    history = await get_history(user_id)
    history.append({"role": role, "message": message})
    history = history[-_MAX_HISTORY:]
    await r.setex(_key(user_id), _TTL_SECONDS, json.dumps(history))


async def clear_history(user_id: str) -> None:
    r = await _get_redis()
    await r.delete(_key(user_id))
