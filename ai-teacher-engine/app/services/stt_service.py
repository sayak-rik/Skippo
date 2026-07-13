"""
STT factory — swap providers via STT_PROVIDER env var.
Supported: faster_whisper (default) | none
"""
import logging
from typing import Optional

from app.services.base_stt_service import BaseSTTService

logger = logging.getLogger(__name__)

_stt_instance: Optional[BaseSTTService] = None


def initialize_stt(provider: str, **kwargs) -> Optional[BaseSTTService]:
    global _stt_instance
    if provider == "faster_whisper":
        from app.services.faster_whisper_stt_service import FasterWhisperSTTService
        _stt_instance = FasterWhisperSTTService(
            model_name=kwargs.get("model_name", "tiny"),
            device=kwargs.get("device", "cpu"),
            compute_type=kwargs.get("compute_type", "int8"),
            language=kwargs.get("language", "en"),
        )
        logger.info("STT initialised: faster-whisper")
    elif provider == "none":
        _stt_instance = None
        logger.info("STT disabled — voice input unavailable")
    else:
        logger.warning(f"Unknown STT provider '{provider}' — STT disabled")
        _stt_instance = None
    return _stt_instance


def get_stt() -> Optional[BaseSTTService]:
    return _stt_instance
