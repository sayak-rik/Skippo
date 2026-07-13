"""
TTS factory — swap providers via TTS_PROVIDER env var.
Supported: edge (default) | none
"""
import logging
from typing import Optional

from app.services.base_tts_service import BaseTTSService

logger = logging.getLogger(__name__)

_tts_instance: Optional[BaseTTSService] = None


def initialize_tts(provider: str, **kwargs) -> Optional[BaseTTSService]:
    global _tts_instance
    if provider == "edge":
        from app.services.edge_tts_service import EdgeTTSService
        _tts_instance = EdgeTTSService(voice=kwargs.get("voice", "en-US-AriaNeural"))
        logger.info("TTS initialised: edge-tts")
    elif provider == "none":
        _tts_instance = None
        logger.info("TTS disabled")
    else:
        logger.warning(f"Unknown TTS provider '{provider}' — TTS disabled")
        _tts_instance = None
    return _tts_instance


def get_tts() -> Optional[BaseTTSService]:
    return _tts_instance
