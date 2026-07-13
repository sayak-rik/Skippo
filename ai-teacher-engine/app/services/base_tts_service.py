from abc import ABC, abstractmethod


class BaseTTSService(ABC):
    @abstractmethod
    async def generate(self, text: str) -> str:
        """Return base64-encoded MP3 audio for the given text."""

    @property
    @abstractmethod
    def audio_format(self) -> str:
        """Audio format string sent to the frontend (e.g. 'mp3')."""
