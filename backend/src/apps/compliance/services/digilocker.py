"""
DigiLocker verification pipeline.

Real mode (DIGILOCKER_CLIENT_ID + DIGILOCKER_CLIENT_SECRET configured):
  1. `build_authorize_url(state)` — OAuth2 consent URL; the driver signs in to
     DigiLocker and approves document access.  `state` carries our request_id.
  2. DigiLocker redirects to DIGILOCKER_REDIRECT_URI with ?code=…&state=…
  3. `exchange_code(code)` — swaps the code for an access token.
  4. `fetch_document(access_token, doc_type)` — pulls the issued document
     (driving licence XML / Aadhaar e-KYC) from the DigiLocker Pull API.
  5. `numbers_match(claimed, returned)` — decides the verification outcome.

Mock mode (credentials absent): `mock_verify()` returns an instantly-verified
payload marked provider="mock" so local/demo environments can exercise the
full pipeline without a DigiLocker partner account.
"""

import logging
import re
from urllib.parse import urlencode

import httpx
from django.conf import settings

log = logging.getLogger(__name__)

_TIMEOUT = 20

# Issued-document URIs on the DigiLocker Pull API, per document type.
_DOC_ENDPOINTS = {
    "driving_license": "/public/oauth2/3/xml/drvlc",
    "aadhaar":         "/public/oauth2/3/xml/eaadhaar",
}


def is_configured() -> bool:
    return bool(settings.DIGILOCKER_CLIENT_ID and settings.DIGILOCKER_CLIENT_SECRET)


# ── OAuth ──────────────────────────────────────────────────────────────────────

def build_authorize_url(state: str) -> str:
    params = {
        "response_type": "code",
        "client_id": settings.DIGILOCKER_CLIENT_ID,
        "redirect_uri": settings.DIGILOCKER_REDIRECT_URI,
        "state": state,
    }
    return f"{settings.DIGILOCKER_BASE_URL}/public/oauth2/1/authorize?{urlencode(params)}"


def exchange_code(code: str) -> str:
    """Exchange the OAuth code for an access token. Raises on failure."""
    resp = httpx.post(
        f"{settings.DIGILOCKER_BASE_URL}/public/oauth2/1/token",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "client_id": settings.DIGILOCKER_CLIENT_ID,
            "client_secret": settings.DIGILOCKER_CLIENT_SECRET,
            "redirect_uri": settings.DIGILOCKER_REDIRECT_URI,
        },
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    token = resp.json().get("access_token")
    if not token:
        raise ValueError("DigiLocker token response had no access_token.")
    return token


# ── Document pull ──────────────────────────────────────────────────────────────

def fetch_document(access_token: str, doc_type: str) -> dict:
    """Pull the issued document and return a normalised payload.

    Returns {"raw_xml": str, "document_number": str, "expires_on": str|None}.
    """
    endpoint = _DOC_ENDPOINTS.get(doc_type)
    if not endpoint:
        raise ValueError(f"Unsupported doc_type: {doc_type}")

    resp = httpx.get(
        f"{settings.DIGILOCKER_BASE_URL}{endpoint}",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    xml = resp.text
    return {
        "raw_xml": xml,
        "document_number": _extract_first(xml, ("number", "uid", "dlNumber")),
        "expires_on": _extract_first(xml, ("validUpto", "expiryDate", "expires")),
    }


def _extract_first(xml: str, attr_names: tuple[str, ...]) -> str:
    """Pull the first matching attribute value out of DigiLocker XML."""
    for name in attr_names:
        m = re.search(rf'{name}="([^"]+)"', xml)
        if m:
            return m.group(1)
    return ""


def numbers_match(claimed: str, returned: str) -> bool:
    """Compare document numbers ignoring case, spaces, and dashes.

    If the school didn't record a number (claimed empty), the pull itself is
    treated as sufficient proof — the document exists in the driver's locker.
    """
    if not claimed:
        return True
    normalise = lambda s: re.sub(r"[\s\-]", "", s).upper()
    return normalise(claimed) == normalise(returned)


# ── Mock mode ──────────────────────────────────────────────────────────────────

def mock_verify(doc_type: str, document_number: str) -> dict:
    """Instant mock verification payload for unconfigured environments."""
    return {
        "provider": "mock",
        "document_number": document_number or "MOCK-0000-0000",
        "doc_type": doc_type,
        "expires_on": None,
        "note": (
            "DigiLocker credentials are not configured; this verification was "
            "auto-approved in mock mode. Set DIGILOCKER_CLIENT_ID / "
            "DIGILOCKER_CLIENT_SECRET / DIGILOCKER_REDIRECT_URI for real checks."
        ),
    }
