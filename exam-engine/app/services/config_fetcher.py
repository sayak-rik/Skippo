"""Fetch test config from the exam-loadbalancer and cache it in-process."""
import logging
from typing import Dict, Optional

import httpx
from app.config import settings

log = logging.getLogger(__name__)

_cache: Dict[str, dict] = {}


async def fetch_test_config(test_id: str) -> Optional[dict]:
    if test_id in _cache:
        return _cache[test_id]

    url = f"{settings.exam_lb_url}/fetch-config/{test_id}/"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                url,
                headers={"Authorization": f"Bearer {settings.exam_lb_secret}"},
            )
            resp.raise_for_status()
            config = resp.json()
            _cache[test_id] = config
            log.info("config_fetcher: loaded test_id=%s questions=%s", test_id, len(config.get("questions", [])))
            return config
    except Exception as exc:
        log.error("config_fetcher: failed to fetch test_id=%s error=%s", test_id, exc)
        return None
