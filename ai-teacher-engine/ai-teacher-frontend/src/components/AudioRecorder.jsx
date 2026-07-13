import { useCallback, useEffect, useRef, useState } from "react";
import "./AudioRecorder.css";

export default function AudioRecorder({ onChunk, onStop, disabled }) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);

  const startRecording = useCallback(async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) onChunk?.(e.data);
      };

      recorder.start(200); // 200ms chunks
      setRecording(true);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  }, [recording, onChunk]);

  const stopRecording = useCallback(() => {
    if (!recording) return;
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    streamRef.current = null;
    setRecording(false);
    onStop?.();
  }, [recording, onStop]);

  // Cleanup on unmount
  useEffect(() => () => {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return (
    <div className="audio-recorder">
      {recording ? (
        <button className="rec-btn stop" onClick={stopRecording} title="Stop recording">
          <span className="rec-dot pulsing" />
          Stop
        </button>
      ) : (
        <button
          className="rec-btn start"
          onClick={startRecording}
          disabled={disabled}
          title="Record your question"
        >
          🎤 Record
        </button>
      )}
    </div>
  );
}
