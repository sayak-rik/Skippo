"""POST test results back to the Skippo backend."""
import logging

import httpx
from app.config import settings

log = logging.getLogger(__name__)


async def send_results(payload: dict) -> bool:
    if not settings.skippo_webhook_url:
        log.warning("webhook: SKIPPO_WEBHOOK_URL not configured — results not sent")
        return False

    for attempt in range(1, 4):
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    settings.skippo_webhook_url,
                    json=payload,
                    headers={"X-Webhook-Secret": settings.skippo_webhook_secret},
                )
                resp.raise_for_status()
                log.info(
                    "webhook: results sent access_token=%s status=%s",
                    payload.get("access_token", "?")[:8], resp.status_code,
                )
                return True
        except Exception as exc:
            log.warning("webhook: attempt %s failed error=%s", attempt, exc)

    log.error("webhook: all retries exhausted for access_token=%s", payload.get("access_token", "?")[:8])
    return False
