from abc import ABC, abstractmethod


class BaseSTTService(ABC):
    @abstractmethod
    async def transcribe(self, audio_bytes: bytes) -> str:
        """Transcribe raw audio bytes (webm/wav/ogg) to text."""
