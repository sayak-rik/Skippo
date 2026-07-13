import { useState } from "react";
import AudioRecorder from "./AudioRecorder";
import "./QuestionWindow.css";

/**
 * Modal window that appears when this student has the floor.
 * Supports text input and voice recording.
 */
export default function QuestionWindow({
  onSubmitText,
  onChunk,
  onStopRecording,
  onLowerHand,
  sttAvailable,
  submitting,
}) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("text"); // text | voice

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    onSubmitText(q);
    setText("");
  };

  return (
    <div className="qw-overlay">
      <div className="qw-modal">
        <div className="qw-header">
          <span className="qw-icon">✋</span>
          <div>
            <h2>Your Turn!</h2>
            <p>Ask your question — the whole class will hear the answer.</p>
          </div>
        </div>

        <div className="qw-tabs">
          <button
            className={mode === "text" ? "active" : ""}
            onClick={() => setMode("text")}
          >
            ✍️ Type
          </button>
          {sttAvailable && (
            <button
              className={mode === "voice" ? "active" : ""}
              onClick={() => setMode("voice")}
            >
              🎤 Voice
            </button>
          )}
        </div>

        {mode === "text" ? (
          <form onSubmit={handleSubmit} className="qw-form">
            <textarea
              autoFocus
              className="qw-textarea"
              placeholder="Type your question here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              disabled={submitting}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              className="qw-submit"
              disabled={!text.trim() || submitting}
            >
              {submitting ? "Submitting…" : "Ask Question →"}
            </button>
          </form>
        ) : (
          <div className="qw-voice">
            <p className="qw-voice-hint">
              Press Record, ask your question, then press Stop.
            </p>
            <AudioRecorder
              onChunk={onChunk}
              onStop={onStopRecording}
              disabled={submitting}
            />
            {submitting && <p className="qw-transcribing">Transcribing…</p>}
          </div>
        )}

        <button className="qw-cancel" onClick={onLowerHand} disabled={submitting}>
          Lower Hand
        </button>
      </div>
    </div>
  );
}
