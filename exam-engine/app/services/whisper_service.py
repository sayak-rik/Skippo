"""
Optional voice transcription using faster-whisper.

Only initialised when ENABLE_VOICE=true.  All other exam types (MCQ, short answer)
never touch this module.

Usage:
    transcribe_audio(pcm_bytes, sample_rate=16000) -> str
"""
import logging
from typing import Optional

log = logging.getLogger(__name__)

_model = None   # faster_whisper.WhisperModel — loaded lazily


def init_whisper(model_name: str = "base", device: str = "cpu", language: str = "en") -> None:
    global _model
    try:
        from faster_whisper import WhisperModel
        _model = WhisperModel(model_name, device=device, compute_type="int8")
        log.info("whisper: loaded model=%s device=%s language=%s", model_name, device, language)
    except Exception as exc:
        log.error("whisper: failed to load model error=%s", exc)


def transcribe_audio(pcm_bytes: bytes, sample_rate: int = 16000, language: str = "en") -> Optional[str]:
    """Synchronously transcribe raw PCM bytes. Returns plain text or None on failure."""
    if _model is None:
        log.warning("whisper: model not initialised — returning empty transcript")
        return ""

    import io
    import wave
    import tempfile
    import os

    try:
        # Write to a temp WAV so faster-whisper can read it
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name
            with wave.open(tmp_path, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)  # 16-bit PCM
                wf.setframerate(sample_rate)
                wf.writeframes(pcm_bytes)

        segments, _ = _model.transcribe(tmp_path, language=language, beam_size=5)
        text = " ".join(seg.text.strip() for seg in segments)
        return text
    except Exception as exc:
        log.error("whisper: transcription failed error=%s", exc)
        return ""
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
