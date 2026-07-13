"""
Edge TTS service — Microsoft cloud TTS, no local model required.
Voice list: https://speech.microsoft.com/portal/voicegallery
Default: en-US-AriaNeural (friendly, natural female voice).
"""
import base64
import io
import logging

import edge_tts

from app.services.base_tts_service import BaseTTSService

logger = logging.getLogger(__name__)


class EdgeTTSService(BaseTTSService):
    def __init__(self, voice: str = "en-US-AriaNeural"):
        self.voice = voice
        logger.info(f"EdgeTTSService ready: voice={voice}")

    @property
    def audio_format(self) -> str:
        return "mp3"

    async def generate(self, text: str) -> str:
        communicate = edge_tts.Communicate(text, self.voice)
        buf = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buf.write(chunk["data"])
        audio_bytes = buf.getvalue()
        if not audio_bytes:
            raise RuntimeError("EdgeTTS returned empty audio")
        return base64.b64encode(audio_bytes).decode()
