"""
STT via OpenAI Whisper API.
Downloads the Plivo recording (auth required) then transcribes it.
"""
import io
import httpx
import openai
from config import settings

_client = openai.AsyncOpenAI(api_key=settings.openai_api_key)


async def transcribe_plivo_recording(
    recording_url: str,
    plivo_auth_id: str,
    plivo_auth_token: str,
) -> str:
    """Fetch the MP3 from Plivo and return Whisper transcript text."""
    async with httpx.AsyncClient(timeout=30.0) as http:
        resp = await http.get(
            recording_url,
            auth=(plivo_auth_id, plivo_auth_token),
        )
        resp.raise_for_status()
        audio_bytes = resp.content

    buf = io.BytesIO(audio_bytes)
    buf.name = "recording.mp3"

    result = await _client.audio.transcriptions.create(
        model="whisper-1",
        file=buf,
        language="en",
    )
    return result.text.strip()
