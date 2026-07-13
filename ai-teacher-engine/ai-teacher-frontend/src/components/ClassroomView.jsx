import { useCallback, useEffect, useRef, useState } from "react";
import useAudioPlayback from "../hooks/useAudioPlayback";
import useClassroomWebSocket from "../hooks/useClassroomWebSocket";
import QuestionWindow from "./QuestionWindow";
import StudentList from "./StudentList";
import TeacherPanel from "./TeacherPanel";
import "./ClassroomView.css";

/**
 * STUDENT STATES
 * idle       – watching
 * in_queue   – raised hand, waiting
 * asking     – has the floor (QuestionWindow open)
 * submitting – question sent, waiting for teacher
 */

export default function ClassroomView({
  classroomId,
  studentId: initialStudentId,
  studentName,
  subject,
  sttAvailable: initialSttAvailable,
  onClassEnded,
}) {
  // ── Local state ──────────────────────────────────────────────────────────────
  const [myId, setMyId] = useState(initialStudentId);
  const [sttAvailable, setSttAvailable] = useState(initialSttAvailable);
  const [studentState, setStudentState] = useState("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [chatLog, setChatLog] = useState([]); // [{role, name, text}]
  const [classroomState, setClassroomState] = useState({ students: [], queue: [], active_questioner: null });
  const [lastQuestion, setLastQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [classroomIdDisplay] = useState(classroomId);

  const streamBufferRef = useRef("");
  const accAudioRef = useRef(""); // accumulate audio b64 until response_complete

  // ── Audio playback ────────────────────────────────────────────────────────────
  const onPlaybackComplete = useCallback(() => {
    setIsSpeaking(false);
  }, []);
  const { play: playAudio } = useAudioPlayback(onPlaybackComplete);

  // ── Message handler ───────────────────────────────────────────────────────────
  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case "welcome":
        setMyId(msg.student_id);
        setSttAvailable(msg.stt_available ?? true);
        setClassroomState(msg.classroom_state || { students: [], queue: [], active_questioner: null });
        break;

      case "classroom_state":
        setClassroomState({
          students: msg.students || [],
          queue: msg.queue || [],
          active_questioner: msg.active_questioner || null,
        });
        // If I no longer have the floor, go back to idle
        if (msg.active_questioner?.id !== myId && studentState === "asking") {
          setStudentState("idle");
        }
        break;

      case "question_received":
        setLastQuestion(msg.question || "");
        setChatLog((prev) => [
          ...prev,
          { role: "student", name: msg.student_name, text: msg.question },
        ]);
        setSubmitting(false);
        setStudentState("idle");
        break;

      case "teacher_start":
        setIsSpeaking(true);
        setStreamingText("");
        streamBufferRef.current = "";
        accAudioRef.current = "";
        break;

      case "teacher_text_chunk":
        streamBufferRef.current += msg.chunk || "";
        setStreamingText(streamBufferRef.current);
        break;

      case "teacher_audio":
        // Play immediately when audio arrives
        if (msg.audio) {
          playAudio(msg.audio, msg.format || "mp3");
        }
        break;

      case "teacher_response_complete": {
        const finalText = streamBufferRef.current;
        if (finalText) {
          setChatLog((prev) => [...prev, { role: "teacher", name: "AI Teacher", text: finalText }]);
        }
        streamBufferRef.current = "";
        setStreamingText("");
        setLastQuestion("");
        break;
      }

      case "turn_granted":
        setStudentState("asking");
        setSubmitting(false);
        break;

      case "class_ended":
        onClassEnded?.();
        break;

      case "error":
        console.error("Server error:", msg.error);
        setSubmitting(false);
        if (studentState === "submitting") setStudentState("asking");
        break;

      default:
        break;
    }
  }, [myId, studentState, playAudio]);

  // ── WebSocket ─────────────────────────────────────────────────────────────────
  const { connected, send, sendBinary } = useClassroomWebSocket({
    classroomId,
    studentName,
    onMessage: handleMessage,
  });

  // ── Actions ───────────────────────────────────────────────────────────────────
  const raiseHand = useCallback(() => {
    if (studentState !== "idle") return;
    send({ type: "raise_hand" });
    setStudentState("in_queue");
  }, [studentState, send]);

  const lowerHand = useCallback(() => {
    send({ type: "lower_hand" });
    setStudentState("idle");
  }, [send]);

  const submitTextQuestion = useCallback((text) => {
    send({ type: "submit_question", text });
    setSubmitting(true);
    setStudentState("submitting");
  }, [send]);

  const onAudioChunk = useCallback(async (blob) => {
    const buf = await blob.arrayBuffer();
    sendBinary(buf);
  }, [sendBinary]);

  const onStopRecording = useCallback(() => {
    send({ type: "stop_recording" });
    setSubmitting(true);
    setStudentState("submitting");
  }, [send]);

  // Copy classroom ID to clipboard
  const copyId = useCallback(() => {
    navigator.clipboard.writeText(classroomIdDisplay).catch(() => {});
  }, [classroomIdDisplay]);

  const isMyTurn = studentState === "asking";
  const inQueue = studentState === "in_queue";

  return (
    <div className="classroom">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="classroom-header">
        <div className="header-left">
          <span className="header-logo">🎓</span>
          <div>
            <h1 className="header-title">{subject || "AI Classroom"}</h1>
            <button className="header-id" onClick={copyId} title="Click to copy">
              ID: {classroomIdDisplay.slice(0, 8)}… 📋
            </button>
          </div>
        </div>
        <div className="header-right">
          <span className={`conn-dot ${connected ? "on" : "off"}`} />
          <span className="conn-label">{connected ? "Connected" : "Reconnecting…"}</span>
          <span className="header-you">{studentName}</span>
        </div>
      </header>

      {/* ── Main layout ────────────────────────────────────────── */}
      <div className="classroom-body">
        {/* Left: teacher */}
        <TeacherPanel
          subject={subject}
          isSpeaking={isSpeaking}
          streamingText={isSpeaking ? streamingText : ""}
          lastQuestion={lastQuestion}
        />

        {/* Centre: chat log */}
        <div className="classroom-chat">
          <div className="chat-messages">
            {chatLog.length === 0 && (
              <div className="chat-empty">
                <p>The lesson will begin once you join.</p>
                <p>Raise your hand to ask a question.</p>
              </div>
            )}
            {chatLog.map((entry, i) => (
              <div key={i} className={`chat-bubble ${entry.role}`}>
                <span className="bubble-name">{entry.name}</span>
                <p className="bubble-text">{entry.text}</p>
              </div>
            ))}
            {/* Streaming preview */}
            {isSpeaking && streamingText && (
              <div className="chat-bubble teacher streaming">
                <span className="bubble-name">AI Teacher</span>
                <p className="bubble-text">{streamingText}<span className="cursor" /></p>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="classroom-controls">
            {studentState === "idle" && (
              <button className="ctrl-btn raise" onClick={raiseHand} disabled={!connected}>
                ✋ Raise Hand
              </button>
            )}
            {inQueue && (
              <button className="ctrl-btn lower" onClick={lowerHand}>
                🤚 Lower Hand (waiting…)
              </button>
            )}
            {(studentState === "submitting") && (
              <div className="ctrl-status">⏳ Sending question…</div>
            )}
          </div>
        </div>

        {/* Right: students */}
        <StudentList
          students={classroomState.students}
          queue={classroomState.queue}
          activeQuestioner={classroomState.active_questioner}
          myId={myId}
        />
      </div>

      {/* ── Question Window (modal) ─────────────────────────────── */}
      {isMyTurn && (
        <QuestionWindow
          onSubmitText={submitTextQuestion}
          onChunk={onAudioChunk}
          onStopRecording={onStopRecording}
          onLowerHand={lowerHand}
          sttAvailable={sttAvailable}
          submitting={submitting}
        />
      )}
    </div>
  );
}
