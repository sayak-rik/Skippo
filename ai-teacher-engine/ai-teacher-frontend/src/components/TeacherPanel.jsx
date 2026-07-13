import "./TeacherPanel.css";

export default function TeacherPanel({ subject, isSpeaking, streamingText, lastQuestion }) {
  return (
    <div className="teacher-panel">
      <div className={`teacher-avatar ${isSpeaking ? "speaking" : ""}`}>
        <span className="teacher-emoji">🤖</span>
        {isSpeaking && (
          <div className="speaking-rings">
            <span /><span /><span />
          </div>
        )}
      </div>

      <div className="teacher-label">
        <span className="teacher-name">AI Teacher</span>
        {subject && <span className="teacher-subject">{subject}</span>}
        <span className={`teacher-status ${isSpeaking ? "online" : "idle"}`}>
          {isSpeaking ? "Speaking…" : "Listening"}
        </span>
      </div>

      {lastQuestion && (
        <div className="teacher-question-banner">
          <span className="question-label">Answering:</span>
          <span className="question-text">"{lastQuestion}"</span>
        </div>
      )}

      <div className="teacher-speech-area">
        {streamingText ? (
          <p className="teacher-speech">{streamingText}</p>
        ) : (
          <p className="teacher-speech placeholder">
            {isSpeaking ? "…" : "The teacher is waiting for questions."}
          </p>
        )}
      </div>
    </div>
  );
}
