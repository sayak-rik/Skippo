import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Camera, Mic, Clock, BookOpen, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import { SkippoHeader } from "../components/SkippoHeader";
import { useTestStore } from "../store/useTestStore";
import styles from "./WaitingRoom.module.css";

type PermState = "idle" | "granted" | "denied";

export default function WaitingRoom() {
  const { accessToken } = useParams<{ accessToken: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = searchParams.get("sid") ?? "";
  const testId    = searchParams.get("tid") ?? "";

  const { setIdentity, setStatus, setError } = useTestStore.getState();
  const { durationSeconds, enableProctoring, testType, questionsCount } = useTestStore();

  const [initialising, setInitialising] = useState(true);
  const [testTitle, setTestTitle] = useState("Online Test");
  const [instructions, setInstructions] = useState("");
  const [camPerm, setCamPerm] = useState<PermState>("idle");
  const [micPerm, setMicPerm] = useState<PermState>("idle");
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
        if (!r.ok) throw new Error(`Init failed: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.is_completed) {
          navigate(`/test/${accessToken}/done?sid=${sessionId}&tid=${testId}`);
          return;
        }
        if (data.title) setTestTitle(data.title);
        if (data.instructions) setInstructions(data.instructions);
        useTestStore.setState({
          durationSeconds: data.duration_seconds ?? 0,
          timeRemaining: data.duration_seconds ?? 0,
          questionsCount: data.questions_count ?? 0,
          enableProctoring: Boolean(data.enable_proctoring),
          testType: data.test_type ?? "mcq",
        });
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
    } catch {
      setCamPerm("denied");
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setMicPerm("granted");
    } catch {
      setMicPerm("denied");
    }
  };

  const canStart = !enableProctoring || camPerm === "granted";

  const handleStart = () => {
    if (!canStart) return;
    navigate(`/test/${accessToken}/exam?sid=${sessionId}&tid=${testId}`);
  };

  // ── Render ───────────────────────────────────────────────────────
  if (initialising) {
    return (
      <div className={styles.centerFill}>
        <SkippoHeader />
        <div className={styles.spinner}><div className="spinner" /></div>
        <p className={styles.loadingText}>Loading your test…</p>
      </div>
    );
  }

  const durationMin = Math.round(durationSeconds / 60);

  return (
    <div className={styles.page}>
      <SkippoHeader testTitle={testTitle} />

      <main className={styles.main}>
        <div className={styles.card}>
          {/* Test meta */}
          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <Clock size={14} />
              {durationMin} min
            </span>
            <span className={styles.metaItem}>
              <BookOpen size={14} />
              {questionsCount} questions
            </span>
            <span className="tag-primary" style={{ textTransform: "capitalize" }}>{testType}</span>
          </div>

          {/* Instructions */}
          {instructions && (
            <div className={styles.instructions}>
              <p className={styles.sectionLabel}>Instructions</p>
              <p className={styles.instructionText}>{instructions}</p>
            </div>
          )}

          {/* Rules */}
          <div className={styles.rules}>
            <p className={styles.sectionLabel}>Rules</p>
            <ul className={styles.ruleList}>
              <li>Do not switch tabs or minimise this window.</li>
              <li>Submit before time runs out — answers auto-save as you go.</li>
              {enableProctoring && <li>Your camera will be active throughout the test.</li>}
              {testType === "voice" && <li>Speak clearly into your microphone to answer voice questions.</li>}
              <li>Once submitted, answers cannot be changed.</li>
            </ul>
          </div>

          {/* Permission checks */}
          {enableProctoring && (
            <div className={styles.perms}>
              <p className={styles.sectionLabel}>Required Permissions</p>
              <div className={styles.permRow}>
                <PermItem label="Camera" state={camPerm} icon={<Camera size={16} />} />
                <PermItem label="Microphone" state={micPerm} icon={<Mic size={16} />} />
              </div>
              {(camPerm === "idle" || micPerm === "idle") && (
                <button className="btn-outline" style={{ marginTop: 12 }} onClick={requestPermissions}>
                  Allow camera &amp; microphone
                </button>
              )}
              {camPerm === "denied" && (
                <p className={styles.permDenied}>
                  Camera access was denied. Please allow camera access in your browser settings and reload.
                </p>
              )}
            </div>
          )}

          {/* Start CTA */}
          {!confirmStart ? (
            <button
              className={`btn-primary ${styles.startBtn}`}
              onClick={() => setConfirmStart(true)}
              disabled={!canStart}
            >
              Start Test
              <ChevronRight size={16} />
            </button>
          ) : (
            <div className={styles.confirm}>
              <p>Once you start, the timer begins. Are you ready?</p>
              <div className={styles.confirmBtns}>
                <button className="btn-outline" onClick={() => setConfirmStart(false)}>
                  Not yet
                </button>
                <button className="btn-primary" onClick={handleStart}>
                  Yes, begin
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function PermItem({ label, state, icon }: { label: string; state: PermState; icon: React.ReactNode }) {
  return (
    <div className={styles.permItem}>
      <span className={styles.permIcon}>{icon}</span>
      <span className={styles.permLabel}>{label}</span>
      {state === "idle"    && <span className="tag-primary" style={{ marginLeft: "auto" }}>Required</span>}
      {state === "granted" && <CheckCircle size={16} style={{ marginLeft: "auto", color: "var(--success)" }} />}
      {state === "denied"  && <AlertCircle size={16} style={{ marginLeft: "auto", color: "var(--danger)" }} />}
    </div>
  );
}
