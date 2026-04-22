"""Thin wrapper around the sms-service microservice.

All SMS sends in the Django monolith go through this module so the provider
can be swapped by changing SMS_SERVICE_URL in settings without touching callers.
"""

import logging

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)


def send_sms(to: str, message: str) -> bool:
    """Send an SMS via the sms-service microservice.

    Returns True when the service accepted the request, False otherwise.
    Never raises — callers should treat failure as a non-fatal degradation.
    """
    url = getattr(settings, "SMS_SERVICE_URL", "http://sms-service:8090") + "/send"
    try:
        resp = httpx.post(url, json={"to": to, "message": message}, timeout=5.0)
        resp.raise_for_status()
        return True
    except Exception as exc:
        logger.warning("SMS send failed to %s: %s", to, exc)
        return False
