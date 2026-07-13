import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Send, Mic, MicOff, Square } from "lucide-react";
import { SkippoHeader } from "../components/SkippoHeader";
import { TimerBar } from "../components/TimerBar";
import { ReconnectBanner } from "../components/ReconnectBanner";
import { ProctoringOverlay } from "../components/ProctoringOverlay";
import { useTestStore } from "../store/useTestStore";
import { useTestWebSocket } from "../hooks/useTestWebSocket";
import { useProctoringWS } from "../hooks/useProctoringWS";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import styles from "./TestPage.module.css";

export default function TestPage() {
  const { accessToken } = useParams<{ accessToken: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = searchParams.get("sid") ?? "";
  const testId    = searchParams.get("tid") ?? "";

  const {
    questions, currentIndex, answers, timeRemaining, durationSeconds,
    enableProctoring, status, setCurrentIndex, setAnswer,
  } = useTestStore();

  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // WebSocket
  const { submitAnswer, submitTest, sendBinary, stopRecording } = useTestWebSocket({
    sessionId,
    onReady: () => {
      // sync_request is sent automatically by the hook on connect
    },
  });

  // Proctoring
  useProctoringWS(sessionId, enableProctoring);

  // Voice recorder
  const { isRecording, transcript, startRecording, stopRecording: stopVoice, setTranscript } =
    useVoiceRecorder({
      onAudioChunk: sendBinary,
      onStop: (qId) => stopRecording(qId),
    });

  // Redirect to results when complete
  if (status === "completed") {
    navigate(`/test/${accessToken}/done?sid=${sessionId}&tid=${testId}`, { replace: true });
    return null;
  }

  // ── Navigation ────────────────────────────────────────────────────
  const question = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const prev = () => setCurrentIndex(Math.max(0, currentIndex - 1));
  const next = () => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1));

  // ── Answer handlers ───────────────────────────────────────────────
  const handleMCQSelect = (optionId: string) => {
    if (!question) return;
    setAnswer(question.id, optionId);
    submitAnswer(question.id, optionId);
  };

  const handleTextChange = (text: string) => {
    if (!question) return;
    setAnswer(question.id, text);
  };

  const handleTextBlur = () => {
    if (!question) return;
    const val = answers[question.id] ?? "";
    if (val.trim()) submitAnswer(question.id, val);
  };

  const handleVoiceAnswerSubmit = () => {
    if (!question) return;
    const val = transcript.trim();
    if (val) {
      setAnswer(question.id, val);
      submitAnswer(question.id, val);
    }
  };

  // ── Final submit ──────────────────────────────────────────────────
  const handleFinalSubmit = () => {
    setShowSubmitDialog(false);
    submitTest();
  };

  if (!question) {
    return (
      <div className={styles.page}>
        <SkippoHeader />
        <div className={styles.empty}>
          <p>No questions found. Please contact your teacher.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SkippoHeader />
      <ReconnectBanner />
      <TimerBar timeRemaining={timeRemaining} durationSeconds={durationSeconds} />

      {/* Progress row */}
      <div className={styles.progress}>
        <span className={styles.progressText}>
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className={styles.progressText} style={{ color: "var(--ink-dim)" }}>
          {answeredCount} answered
        </span>
      </div>

      {/* Question dots nav */}
      <div className={styles.dotsRow}>
        {questions.map((q, i) => (
          <button
            key={q.id}
            className={[
              styles.dot,
              i === currentIndex ? styles.dotActive : "",
              answers[q.id] ? styles.dotAnswered : "",
            ].filter(Boolean).join(" ")}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to question ${i + 1}`}
          />
        ))}
      </div>

      {/* Question card */}
      <main className={styles.main}>
        <div className={styles.questionCard}>
          <div className={styles.questionMeta}>
            <span className="tag-primary">Q{question.order}</span>
            <span className={styles.points}>{question.points} {question.points === 1 ? "pt" : "pts"}</span>
          </div>
          <p className={styles.questionText}>{question.question_text}</p>

          {/* MCQ options */}
          {question.question_type === "mcq" && question.options && (
            <div className={styles.options}>
              {question.options.map((opt) => (
                <button
                  key={opt.id}
                  className={[
                    styles.option,
                    answers[question.id] === opt.id ? styles.optionSelected : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => handleMCQSelect(opt.id)}
                >
                  <span className={styles.optionBadge}>{opt.id}</span>
                  <span className={styles.optionText}>{opt.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Short answer */}
          {question.question_type === "short_answer" && (
            <textarea
              className={styles.textarea}
              placeholder="Type your answer here…"
              value={answers[question.id] ?? ""}
              onChange={(e) => handleTextChange(e.target.value)}
              onBlur={handleTextBlur}
              rows={5}
            />
          )}

          {/* Voice answer */}
          {question.question_type === "voice" && (
            <div className={styles.voiceArea}>
              {transcript && (
                <div className={styles.transcriptBox}>
                  <p className={styles.transcriptLabel}>Transcript</p>
                  <p className={styles.transcriptText}>{transcript}</p>
                  <button
                    className="btn-outline"
                    style={{ marginTop: 8, fontSize: 12 }}
                    onClick={() => {
                      setTranscript("");
                      setAnswer(question.id, "");
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}

              {!answers[question.id] && (
                <button
                  className={[styles.voiceBtn, isRecording ? styles.voiceBtnRecording : ""].filter(Boolean).join(" ")}
                  onClick={isRecording
                    ? () => stopVoice()
                    : () => startRecording(question.id)}
                >
                  {isRecording ? (
                    <><Square size={16} /> Stop recording</>
                  ) : (
                    <><Mic size={16} /> Tap to record</>
                  )}
                </button>
              )}

              {transcript && !answers[question.id] && (
                <button className="btn-primary" style={{ marginTop: 12 }} onClick={handleVoiceAnswerSubmit}>
                  <Send size={14} /> Submit answer
                </button>
              )}

              {answers[question.id] && (
                <div className={styles.answeredVoice}>
                  <MicOff size={14} />
                  <span>Answer recorded</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <footer className={styles.footer}>
        <button className="btn-outline" onClick={prev} disabled={currentIndex === 0}>
          <ChevronLeft size={16} /> Prev
        </button>

        {currentIndex < questions.length - 1 ? (
          <button className="btn-primary" onClick={next}>
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button className="btn-primary" onClick={() => setShowSubmitDialog(true)}>
            Submit Test <Send size={14} />
          </button>
        )}
      </footer>

      {/* Submit confirmation dialog */}
      {showSubmitDialog && (
        <div className={styles.dialogBackdrop}>
          <div className={styles.dialog}>
            <p className={styles.dialogTitle}>Submit test?</p>
            <p className={styles.dialogBody}>
              You have answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length && " Unanswered questions will receive 0 marks."}
              {" "}This action cannot be undone.
            </p>
            <div className={styles.dialogBtns}>
              <button className="btn-outline" onClick={() => setShowSubmitDialog(false)}>
                Keep reviewing
              </button>
              <button className="btn-primary" onClick={handleFinalSubmit}>
                Yes, submit
              </button>
            </div>
          </div>
        </div>
      )}

      <ProctoringOverlay />
    </div>
  );
}
