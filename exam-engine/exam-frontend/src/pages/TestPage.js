import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    const { accessToken } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get("sid") ?? "";
    const testId = searchParams.get("tid") ?? "";
    const { questions, currentIndex, answers, timeRemaining, durationSeconds, enableProctoring, status, setCurrentIndex, setAnswer, setCompleted, } = useTestStore();
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
    const { isRecording, transcript, startRecording, stopRecording: stopVoice, setTranscript } = useVoiceRecorder({
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
    const handleMCQSelect = (optionId) => {
        if (!question)
            return;
        setAnswer(question.id, optionId);
        submitAnswer(question.id, optionId);
    };
    const handleTextChange = (text) => {
        if (!question)
            return;
        setAnswer(question.id, text);
    };
    const handleTextBlur = () => {
        if (!question)
            return;
        const val = answers[question.id] ?? "";
        if (val.trim())
            submitAnswer(question.id, val);
    };
    const handleVoiceAnswerSubmit = () => {
        if (!question)
            return;
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
        return (_jsxs("div", { className: styles.page, children: [_jsx(SkippoHeader, {}), _jsx("div", { className: styles.empty, children: _jsx("p", { children: "No questions found. Please contact your teacher." }) })] }));
    }
    return (_jsxs("div", { className: styles.page, children: [_jsx(SkippoHeader, {}), _jsx(ReconnectBanner, {}), _jsx(TimerBar, { timeRemaining: timeRemaining, durationSeconds: durationSeconds }), _jsxs("div", { className: styles.progress, children: [_jsxs("span", { className: styles.progressText, children: ["Question ", currentIndex + 1, " of ", questions.length] }), _jsxs("span", { className: styles.progressText, style: { color: "var(--ink-dim)" }, children: [answeredCount, " answered"] })] }), _jsx("div", { className: styles.dotsRow, children: questions.map((q, i) => (_jsx("button", { className: [
                        styles.dot,
                        i === currentIndex ? styles.dotActive : "",
                        answers[q.id] ? styles.dotAnswered : "",
                    ].filter(Boolean).join(" "), onClick: () => setCurrentIndex(i), "aria-label": `Go to question ${i + 1}` }, q.id))) }), _jsx("main", { className: styles.main, children: _jsxs("div", { className: styles.questionCard, children: [_jsxs("div", { className: styles.questionMeta, children: [_jsxs("span", { className: "tag-primary", children: ["Q", question.order] }), _jsxs("span", { className: styles.points, children: [question.points, " ", question.points === 1 ? "pt" : "pts"] })] }), _jsx("p", { className: styles.questionText, children: question.question_text }), question.question_type === "mcq" && question.options && (_jsx("div", { className: styles.options, children: question.options.map((opt) => (_jsxs("button", { className: [
                                    styles.option,
                                    answers[question.id] === opt.id ? styles.optionSelected : "",
                                ].filter(Boolean).join(" "), onClick: () => handleMCQSelect(opt.id), children: [_jsx("span", { className: styles.optionBadge, children: opt.id }), _jsx("span", { className: styles.optionText, children: opt.text })] }, opt.id))) })), question.question_type === "short_answer" && (_jsx("textarea", { className: styles.textarea, placeholder: "Type your answer here\u2026", value: answers[question.id] ?? "", onChange: (e) => handleTextChange(e.target.value), onBlur: handleTextBlur, rows: 5 })), question.question_type === "voice" && (_jsxs("div", { className: styles.voiceArea, children: [transcript && (_jsxs("div", { className: styles.transcriptBox, children: [_jsx("p", { className: styles.transcriptLabel, children: "Transcript" }), _jsx("p", { className: styles.transcriptText, children: transcript }), _jsx("button", { className: "btn-outline", style: { marginTop: 8, fontSize: 12 }, onClick: () => {
                                                setTranscript("");
                                                setAnswer(question.id, "");
                                            }, children: "Clear" })] })), !answers[question.id] && (_jsx("button", { className: [styles.voiceBtn, isRecording ? styles.voiceBtnRecording : ""].filter(Boolean).join(" "), onClick: isRecording
                                        ? () => stopVoice()
                                        : () => startRecording(question.id), children: isRecording ? (_jsxs(_Fragment, { children: [_jsx(Square, { size: 16 }), " Stop recording"] })) : (_jsxs(_Fragment, { children: [_jsx(Mic, { size: 16 }), " Tap to record"] })) })), transcript && !answers[question.id] && (_jsxs("button", { className: "btn-primary", style: { marginTop: 12 }, onClick: handleVoiceAnswerSubmit, children: [_jsx(Send, { size: 14 }), " Submit answer"] })), answers[question.id] && (_jsxs("div", { className: styles.answeredVoice, children: [_jsx(MicOff, { size: 14 }), _jsx("span", { children: "Answer recorded" })] }))] }))] }) }), _jsxs("footer", { className: styles.footer, children: [_jsxs("button", { className: "btn-outline", onClick: prev, disabled: currentIndex === 0, children: [_jsx(ChevronLeft, { size: 16 }), " Prev"] }), currentIndex < questions.length - 1 ? (_jsxs("button", { className: "btn-primary", onClick: next, children: ["Next ", _jsx(ChevronRight, { size: 16 })] })) : (_jsxs("button", { className: "btn-primary", onClick: () => setShowSubmitDialog(true), children: ["Submit Test ", _jsx(Send, { size: 14 })] }))] }), showSubmitDialog && (_jsx("div", { className: styles.dialogBackdrop, children: _jsxs("div", { className: styles.dialog, children: [_jsx("p", { className: styles.dialogTitle, children: "Submit test?" }), _jsxs("p", { className: styles.dialogBody, children: ["You have answered ", answeredCount, " of ", questions.length, " questions.", answeredCount < questions.length && " Unanswered questions will receive 0 marks.", " ", "This action cannot be undone."] }), _jsxs("div", { className: styles.dialogBtns, children: [_jsx("button", { className: "btn-outline", onClick: () => setShowSubmitDialog(false), children: "Keep reviewing" }), _jsx("button", { className: "btn-primary", onClick: handleFinalSubmit, children: "Yes, submit" })] })] }) })), _jsx(ProctoringOverlay, {})] }));
}
