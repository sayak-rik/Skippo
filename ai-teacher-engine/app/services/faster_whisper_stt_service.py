"""
Faster-Whisper STT service — smallest model: 'tiny' (~75 MB).
Uses ffmpeg (via faster-whisper) to decode browser audio (webm/opus).
"""
import asyncio
import logging
import os
import tempfile
from typing import Optional

from app.services.base_stt_service import BaseSTTService

logger = logging.getLogger(__name__)


class FasterWhisperSTTService(BaseSTTService):
    def __init__(
        self,
        model_name: str = "tiny",
        device: str = "cpu",
        compute_type: str = "int8",
        language: Optional[str] = "en",
    ):
        from faster_whisper import WhisperModel
        self.model = WhisperModel(model_name, device=device, compute_type=compute_type)
        self.language = language
        logger.info(f"FasterWhisperSTT ready: model={model_name}, device={device}")

    async def transcribe(self, audio_bytes: bytes) -> str:
        return await asyncio.to_thread(self._transcribe_sync, audio_bytes)

    def _transcribe_sync(self, audio_bytes: bytes) -> str:
        suffix = ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(audio_bytes)
            path = f.name
        try:
            segments, _ = self.model.transcribe(
                path,
                language=self.language,
                beam_size=1,           # fastest setting
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 300},
            )
            text = " ".join(s.text.strip() for s in segments).strip()
            logger.debug(f"Transcribed: '{text[:80]}'")
            return text
        finally:
            os.unlink(path)
