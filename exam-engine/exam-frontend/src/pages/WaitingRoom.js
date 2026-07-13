import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Camera, Mic, Clock, BookOpen, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import { SkippoHeader } from "../components/SkippoHeader";
import { useTestStore } from "../store/useTestStore";
import styles from "./WaitingRoom.module.css";
export default function WaitingRoom() {
    const { accessToken } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get("sid") ?? "";
    const testId = searchParams.get("tid") ?? "";
    const { setIdentity, setStatus, setError } = useTestStore.getState();
    const { durationSeconds, enableProctoring, testType, questions } = useTestStore();
    const [initialising, setInitialising] = useState(true);
    const [testTitle, setTestTitle] = useState("Online Test");
    const [instructions, setInstructions] = useState("");
    const [camPerm, setCamPerm] = useState("idle");
    const [micPerm, setMicPerm] = useState("idle");
    const [confirmStart, setConfirmStart] = useState(false);
    // ── Init session with exam-engine ────────────────────────────────
    useEffect(() => {
        if (!accessToken || !sessionId || !testId) {
            setError("Invalid test link. Please check your notification and try again.");
            navigate("/error");
            return;
        }
        setIdentity(sessionId, accessToken, testId);
        fetch("/api/session/init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: accessToken, session_id: sessionId, test_id: testId }),
        })
            .then((r) => {
            if (!r.ok)
                throw new Error(`Init failed: ${r.status}`);
            return r.json();
        })
            .then((data) => {
            if (data.is_completed) {
                navigate(`/test/${accessToken}/done?sid=${sessionId}&tid=${testId}`);
                return;
            }
            setStatus("waiting_room");
            setInitialising(false);
        })
            .catch((err) => {
            setError(err.message ?? "Failed to load test. Please try again.");
            navigate("/error");
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    // ── Permission checks ────────────────────────────────────────────
    const requestPermissions = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            setCamPerm("granted");
        }
        catch {
            setCamPerm("denied");
        }
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setMicPerm("granted");
        }
        catch {
            setMicPerm("denied");
        }
    };
    const canStart = !enableProctoring || camPerm === "granted";
    const handleStart = () => {
        if (!canStart)
            return;
        navigate(`/test/${accessToken}/exam?sid=${sessionId}&tid=${testId}`);
    };
    // ── Render ───────────────────────────────────────────────────────
    if (initialising) {
        return (_jsxs("div", { className: styles.centerFill, children: [_jsx(SkippoHeader, {}), _jsx("div", { className: styles.spinner, children: _jsx("div", { className: "spinner" }) }), _jsx("p", { className: styles.loadingText, children: "Loading your test\u2026" })] }));
    }
    const durationMin = Math.round(durationSeconds / 60);
    return (_jsxs("div", { className: styles.page, children: [_jsx(SkippoHeader, { testTitle: testTitle }), _jsx("main", { className: styles.main, children: _jsxs("div", { className: styles.card, children: [_jsxs("div", { className: styles.metaRow, children: [_jsxs("span", { className: styles.metaItem, children: [_jsx(Clock, { size: 14 }), durationMin, " min"] }), _jsxs("span", { className: styles.metaItem, children: [_jsx(BookOpen, { size: 14 }), questions.length, " questions"] }), _jsx("span", { className: "tag-primary", style: { textTransform: "capitalize" }, children: testType })] }), instructions && (_jsxs("div", { className: styles.instructions, children: [_jsx("p", { className: styles.sectionLabel, children: "Instructions" }), _jsx("p", { className: styles.instructionText, children: instructions })] })), _jsxs("div", { className: styles.rules, children: [_jsx("p", { className: styles.sectionLabel, children: "Rules" }), _jsxs("ul", { className: styles.ruleList, children: [_jsx("li", { children: "Do not switch tabs or minimise this window." }), _jsx("li", { children: "Submit before time runs out \u2014 answers auto-save as you go." }), enableProctoring && _jsx("li", { children: "Your camera will be active throughout the test." }), testType === "voice" && _jsx("li", { children: "Speak clearly into your microphone to answer voice questions." }), _jsx("li", { children: "Once submitted, answers cannot be changed." })] })] }), enableProctoring && (_jsxs("div", { className: styles.perms, children: [_jsx("p", { className: styles.sectionLabel, children: "Required Permissions" }), _jsxs("div", { className: styles.permRow, children: [_jsx(PermItem, { label: "Camera", state: camPerm, icon: _jsx(Camera, { size: 16 }) }), _jsx(PermItem, { label: "Microphone", state: micPerm, icon: _jsx(Mic, { size: 16 }) })] }), (camPerm === "idle" || micPerm === "idle") && (_jsx("button", { className: "btn-outline", style: { marginTop: 12 }, onClick: requestPermissions, children: "Allow camera & microphone" })), camPerm === "denied" && (_jsx("p", { className: styles.permDenied, children: "Camera access was denied. Please allow camera access in your browser settings and reload." }))] })), !confirmStart ? (_jsxs("button", { className: `btn-primary ${styles.startBtn}`, onClick: () => setConfirmStart(true), disabled: !canStart, children: ["Start Test", _jsx(ChevronRight, { size: 16 })] })) : (_jsxs("div", { className: styles.confirm, children: [_jsx("p", { children: "Once you start, the timer begins. Are you ready?" }), _jsxs("div", { className: styles.confirmBtns, children: [_jsx("button", { className: "btn-outline", onClick: () => setConfirmStart(false), children: "Not yet" }), _jsx("button", { className: "btn-primary", onClick: handleStart, children: "Yes, begin" })] })] }))] }) })] }));
}
function PermItem({ label, state, icon }) {
    return (_jsxs("div", { className: styles.permItem, children: [_jsx("span", { className: styles.permIcon, children: icon }), _jsx("span", { className: styles.permLabel, children: label }), state === "idle" && _jsx("span", { className: "tag-primary", style: { marginLeft: "auto" }, children: "Required" }), state === "granted" && _jsx(CheckCircle, { size: 16, style: { marginLeft: "auto", color: "var(--success)" } }), state === "denied" && _jsx(AlertCircle, { size: 16, style: { marginLeft: "auto", color: "var(--danger)" } })] }));
}
