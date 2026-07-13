"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  MonitorPlay, Plus, Trash2, Pencil, X, ChevronDown, ChevronRight,
  ListChecks, ShieldCheck, ShieldOff, Send, Lock, Clock3,
  CheckCircle2, AlertTriangle, Eye, RefreshCw,
} from "lucide-react";
import { DashboardShell } from "../../../../components/DashboardShell";
import { apiFetch } from "../../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Classroom { id: number; name: string; section: string; }
interface Subject   { id: number; name: string; }

interface TestQuestion {
  id: number;
  order: number;
  question_text: string;
  question_type: "mcq" | "short_answer" | "voice";
  options: { id: string; text: string }[] | null;
  correct_answer: string;
  points: number;
  voice_grading_hint: string;
}

interface OnlineTestListItem {
  id: number;
  title: string;
  subject_name: string | null;
  test_type: "mcq" | "voice" | "hybrid";
  status: "draft" | "published" | "closed";
  duration_minutes: number;
  available_from: string;
  available_until: string;
  enable_proctoring: boolean;
  question_count: number;
  total_points: number;
}

interface OnlineTestDetail extends OnlineTestListItem {
  classroom_ids: number[];
  passing_percentage: number;
  enable_voice_tts: boolean;
  instructions: string;
  questions: TestQuestion[];
}

interface ProctoringEvent { id: number; event_type: string; severity: string; occurred_at: string; }

interface TestResult {
  id: number;
  student_name: string;
  score: number;
  max_score: number;
  percentage: number;
  grade: string;
  time_taken_seconds: number;
  completion_reason: string;
  is_published: boolean;
  completed_at: string;
  proctoring_events: ProctoringEvent[];
}

// ── Lookups ───────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  mcq:    { label: "MCQ",    color: "#2563eb", bg: "#eff6ff" },
  voice:  { label: "Voice",  color: "#7c3aed", bg: "#f5f3ff" },
  hybrid: { label: "Hybrid", color: "#059669", bg: "#f0fdf4" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: "Draft",     color: "#64748b", bg: "#f8fafc" },
  published: { label: "Published", color: "#059669", bg: "#f0fdf4" },
  closed:    { label: "Closed",    color: "#dc2626", bg: "#fef2f2" },
};

const GRADE_COLOR: Record<string, string> = {
  "A+": "#059669", A: "#0891b2", "B+": "#2563eb", B: "#2563eb",
  "C+": "#d97706", C: "#d97706", D: "#f97316", F: "#dc2626",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const fmtDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  return m > 0 ? `${m}m ${secs % 60}s` : `${secs}s`;
};

// datetime-local inputs need "YYYY-MM-DDTHH:MM" in local time
const toLocalInput = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6,
};
const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

// ── Test Drawer (create / edit) ───────────────────────────────────────────────

function TestDrawer({ editing, classrooms, subjects, onClose, onSaved }: {
  editing?: OnlineTestDetail; classrooms: Classroom[]; subjects: Subject[];
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: editing?.title ?? "",
    subject: editing ? "" : "",
    classroom_ids: editing?.classroom_ids ?? ([] as number[]),
    test_type: editing?.test_type ?? "mcq",
    duration_minutes: editing?.duration_minutes ?? 30,
    passing_percentage: editing?.passing_percentage ?? 35,
    enable_proctoring: editing?.enable_proctoring ?? true,
    enable_voice_tts: editing?.enable_voice_tts ?? false,
    instructions: editing?.instructions ?? "",
    available_from: editing ? toLocalInput(editing.available_from) : "",
    available_until: editing ? toLocalInput(editing.available_until) : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleClassroom = (id: number) =>
    setForm((p) => ({
      ...p,
      classroom_ids: p.classroom_ids.includes(id)
        ? p.classroom_ids.filter((c) => c !== id)
        : [...p.classroom_ids, id],
    }));

  const save = async () => {
    if (!form.title || !form.available_from || !form.available_until) {
      setError("Title and availability window are required.");
      return;
    }
    if (form.classroom_ids.length === 0) {
      setError("Select at least one classroom.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        classroom_ids: form.classroom_ids,
        test_type: form.test_type,
        duration_minutes: Number(form.duration_minutes),
        passing_percentage: Number(form.passing_percentage),
        enable_proctoring: form.enable_proctoring,
        enable_voice_tts: form.enable_voice_tts,
        instructions: form.instructions,
        available_from: new Date(form.available_from).toISOString(),
        available_until: new Date(form.available_until).toISOString(),
      };
      if (form.subject) payload.subject = Number(form.subject);
      const url = editing ? `/api/assessments/admin/tests/${editing.id}/` : "/api/assessments/admin/tests/";
      await apiFetch(url, { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error)?.message || "Failed to save test.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 60, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <motion.aside initial={{ x: 460 }} animate={{ x: 0 }} exit={{ x: 460 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 460, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", boxShadow: "var(--shadow-lg)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>
            {editing ? "Edit Online Test" : "New Online Test"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
        </div>

        {error && <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)" }}>{error}</div>}

        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} value={form.title} placeholder="e.g. Science Unit Test — Chapter 4"
            onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Subject</label>
            <select style={inputStyle} value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))}>
              <option value="">— None —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Test type</label>
            <select style={inputStyle} value={form.test_type} onChange={(e) => setForm(p => ({ ...p, test_type: e.target.value as typeof form.test_type }))}>
              <option value="mcq">MCQ</option>
              <option value="voice">Voice</option>
              <option value="hybrid">Hybrid (MCQ + Voice)</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Classrooms *</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {classrooms.map(c => {
              const active = form.classroom_ids.includes(c.id);
              return (
                <button key={c.id} onClick={() => toggleClassroom(c.id)}
                  style={{
                    padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${active ? "var(--brand)" : "var(--stroke)"}`,
                    background: active ? "var(--brand-soft, #eff6ff)" : "var(--surface-raised)",
                    color: active ? "var(--brand)" : "var(--ink-soft)",
                  }}>
                  {c.name}{c.section ? ` ${c.section}` : ""}
                </button>
              );
            })}
            {classrooms.length === 0 && <span style={{ fontSize: 12, color: "var(--ink-dim)" }}>No classrooms yet — create them under Classrooms.</span>}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Duration (minutes) *</label>
            <input type="number" min={5} style={inputStyle} value={form.duration_minutes}
              onChange={(e) => setForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))} />
          </div>
          <div>
            <label style={labelStyle}>Passing %</label>
            <input type="number" min={0} max={100} style={inputStyle} value={form.passing_percentage}
              onChange={(e) => setForm(p => ({ ...p, passing_percentage: Number(e.target.value) }))} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Available from *</label>
            <input type="datetime-local" style={inputStyle} value={form.available_from}
              onChange={(e) => setForm(p => ({ ...p, available_from: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Available until *</label>
            <input type="datetime-local" style={inputStyle} value={form.available_until}
              onChange={(e) => setForm(p => ({ ...p, available_until: e.target.value }))} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 18 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)", cursor: "pointer" }}>
            <input type="checkbox" checked={form.enable_proctoring}
              onChange={(e) => setForm(p => ({ ...p, enable_proctoring: e.target.checked }))} />
            Camera proctoring
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink)", cursor: "pointer" }}>
            <input type="checkbox" checked={form.enable_voice_tts}
              onChange={(e) => setForm(p => ({ ...p, enable_voice_tts: e.target.checked }))} />
            Read questions aloud (TTS)
          </label>
        </div>

        <div>
          <label style={labelStyle}>Instructions for students</label>
          <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.instructions}
            placeholder="Shown in the waiting room before the test starts."
            onChange={(e) => setForm(p => ({ ...p, instructions: e.target.value }))} />
        </div>

        <button onClick={save} disabled={loading}
          style={{ marginTop: 4, background: "var(--brand)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
          {loading ? "Saving…" : editing ? "Save changes" : "Create draft test"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Question Drawer ───────────────────────────────────────────────────────────

const OPTION_IDS = ["A", "B", "C", "D"];

function QuestionDrawer({ testId, editing, onClose, onSaved }: {
  testId: number; editing?: TestQuestion;
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    question_text: editing?.question_text ?? "",
    question_type: editing?.question_type ?? "mcq",
    options: OPTION_IDS.map((id) => editing?.options?.find(o => o.id === id)?.text ?? ""),
    correct_answer: editing?.correct_answer ?? "A",
    points: editing?.points ?? 1,
    voice_grading_hint: editing?.voice_grading_hint ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!form.question_text.trim()) { setError("Question text is required."); return; }
    if (form.question_type === "mcq" && form.options.filter(o => o.trim()).length < 2) {
      setError("MCQ questions need at least two options."); return;
    }
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        question_text: form.question_text,
        question_type: form.question_type,
        points: Number(form.points),
        voice_grading_hint: form.voice_grading_hint,
      };
      if (form.question_type === "mcq") {
        payload.options = OPTION_IDS
          .map((id, i) => ({ id, text: form.options[i] }))
          .filter(o => o.text.trim());
        payload.correct_answer = form.correct_answer;
      } else {
        payload.options = null;
        payload.correct_answer = "";
      }
      const url = editing
        ? `/api/assessments/admin/tests/${testId}/questions/${editing.id}/`
        : `/api/assessments/admin/tests/${testId}/questions/`;
      await apiFetch(url, { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error)?.message || "Failed to save question.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 60, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <motion.aside initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 440, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", boxShadow: "var(--shadow-lg)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>
            {editing ? "Edit Question" : "Add Question"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
        </div>

        {error && <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)" }}>{error}</div>}

        <div>
          <label style={labelStyle}>Question *</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.question_text}
            onChange={(e) => setForm(p => ({ ...p, question_text: e.target.value }))} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={form.question_type}
              onChange={(e) => setForm(p => ({ ...p, question_type: e.target.value as typeof form.question_type }))}>
              <option value="mcq">Multiple choice</option>
              <option value="short_answer">Short answer</option>
              <option value="voice">Voice answer</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Points</label>
            <input type="number" min={1} style={inputStyle} value={form.points}
              onChange={(e) => setForm(p => ({ ...p, points: Number(e.target.value) }))} />
          </div>
        </div>

        {form.question_type === "mcq" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={labelStyle}>Options (leave blank to skip)</label>
              {OPTION_IDS.map((id, i) => (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--surface-raised)", border: "1px solid var(--stroke)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>{id}</span>
                  <input style={{ ...inputStyle, flex: 1 }} value={form.options[i]} placeholder={`Option ${id}`}
                    onChange={(e) => setForm(p => {
                      const options = [...p.options]; options[i] = e.target.value;
                      return { ...p, options };
                    })} />
                </div>
              ))}
            </div>
            <div>
              <label style={labelStyle}>Correct answer</label>
              <select style={inputStyle} value={form.correct_answer}
                onChange={(e) => setForm(p => ({ ...p, correct_answer: e.target.value }))}>
                {OPTION_IDS.filter((_, i) => form.options[i].trim()).map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {(form.question_type === "voice" || form.question_type === "short_answer") && (
          <div>
            <label style={labelStyle}>Grading hint (for AI / manual review)</label>
            <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.voice_grading_hint}
              placeholder="What a good answer should mention."
              onChange={(e) => setForm(p => ({ ...p, voice_grading_hint: e.target.value }))} />
          </div>
        )}

        <button onClick={save} disabled={loading}
          style={{ marginTop: 4, background: "var(--brand)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
          {loading ? "Saving…" : editing ? "Save question" : "Add question"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Results panel ─────────────────────────────────────────────────────────────

function ResultsPanel({ testId }: { testId: number }) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<TestResult[]>(`/api/assessments/admin/tests/${testId}/results/`);
      setResults(data);
    } catch { /* keep previous */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [testId]); // eslint-disable-line react-hooks/exhaustive-deps

  const publishResult = async (id: number) => {
    setPublishing(id);
    try {
      await apiFetch(`/api/assessments/admin/results/${id}/publish/`, { method: "POST" });
      setResults(rs => rs.map(r => r.id === id ? { ...r, is_published: true } : r));
    } catch (e) {
      alert((e as Error)?.message || "Failed to publish result.");
    } finally {
      setPublishing(null);
    }
  };

  if (loading) return <p style={{ fontSize: 13, color: "var(--ink-dim)", padding: "12px 0" }}>Loading results…</p>;
  if (results.length === 0) {
    return <p style={{ fontSize: 13, color: "var(--ink-dim)", fontStyle: "italic", padding: "12px 0" }}>No submissions yet. Results appear here as students finish.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid var(--stroke)", borderRadius: 8, padding: "5px 10px", fontSize: 12, color: "var(--ink-soft)", cursor: "pointer" }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
      {results.map(r => {
        const critical = r.proctoring_events.filter(e => e.severity === "critical").length;
        return (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{r.student_name}</p>
              <p style={{ fontSize: 11, color: "var(--ink-dim)" }}>
                {fmtDateTime(r.completed_at)} · {fmtDuration(r.time_taken_seconds)} · {r.completion_reason.replace("_", " ")}
                {r.proctoring_events.length > 0 && (
                  <span style={{ marginLeft: 8, color: critical ? "var(--danger)" : "#d97706" }}>
                    <AlertTriangle size={11} style={{ display: "inline", verticalAlign: "-1px" }} /> {r.proctoring_events.length} proctoring event{r.proctoring_events.length > 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{r.score}/{r.max_score}</span>
            <span style={{ fontSize: 12, color: "var(--ink-soft)", width: 52, textAlign: "right" }}>{r.percentage.toFixed(1)}%</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: GRADE_COLOR[r.grade] ?? "var(--ink)", width: 26, textAlign: "center" }}>{r.grade}</span>
            {r.is_published ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#059669" }}>
                <CheckCircle2 size={13} /> Sent
              </span>
            ) : (
              <button onClick={() => publishResult(r.id)} disabled={publishing === r.id}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--brand)", color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: publishing === r.id ? 0.6 : 1 }}>
                <Send size={11} /> Publish
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Test Card ─────────────────────────────────────────────────────────────────

function TestCard({ test, classrooms, subjects, onChanged }: {
  test: OnlineTestListItem; classrooms: Classroom[]; subjects: Subject[];
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"questions" | "results">("questions");
  const [detail, setDetail] = useState<OnlineTestDetail | null>(null);
  const [editDrawer, setEditDrawer] = useState(false);
  const [questionDrawer, setQuestionDrawer] = useState<{ open: boolean; editing?: TestQuestion }>({ open: false });
  const [busy, setBusy] = useState(false);

  const typeMeta = TYPE_META[test.test_type] ?? TYPE_META.mcq;
  const statusMeta = STATUS_META[test.status] ?? STATUS_META.draft;
  const isDraft = test.status === "draft";

  const loadDetail = async () => {
    try {
      const d = await apiFetch<OnlineTestDetail>(`/api/assessments/admin/tests/${test.id}/`);
      setDetail(d);
    } catch { /* ignore */ }
  };

  useEffect(() => { if (expanded) loadDetail(); }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const publish = async () => {
    if (!confirm("Publish this test? Access tokens are generated for every student in the selected classrooms and parents are notified.")) return;
    setBusy(true);
    try {
      await apiFetch(`/api/assessments/admin/tests/${test.id}/publish/`, { method: "POST" });
      onChanged();
    } catch (e) {
      alert((e as Error)?.message || "Failed to publish.");
    } finally { setBusy(false); }
  };

  const close = async () => {
    if (!confirm("Close this test? Students will no longer be able to start it.")) return;
    setBusy(true);
    try {
      await apiFetch(`/api/assessments/admin/tests/${test.id}/close/`, { method: "POST" });
      onChanged();
    } catch (e) {
      alert((e as Error)?.message || "Failed to close.");
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!confirm("Delete this draft test and all its questions?")) return;
    setBusy(true);
    try {
      await apiFetch(`/api/assessments/admin/tests/${test.id}/`, { method: "DELETE" });
      onChanged();
    } catch (e) {
      alert((e as Error)?.message || "Failed to delete.");
    } finally { setBusy(false); }
  };

  const deleteQuestion = async (q: TestQuestion) => {
    if (!confirm("Delete this question?")) return;
    try {
      await apiFetch(`/api/assessments/admin/tests/${test.id}/questions/${q.id}/`, { method: "DELETE" });
      loadDetail();
      onChanged();
    } catch (e) {
      alert((e as Error)?.message || "Failed to delete question.");
    }
  };

  return (
    <motion.div variants={fade}
      style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 14, overflow: "hidden" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer" }}
        onClick={() => setExpanded(e => !e)}>
        {expanded ? <ChevronDown size={16} color="var(--ink-dim)" /> : <ChevronRight size={16} color="var(--ink-dim)" />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{test.title}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: typeMeta.color, background: typeMeta.bg, borderRadius: 999, padding: "2px 9px" }}>{typeMeta.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: statusMeta.color, background: statusMeta.bg, borderRadius: 999, padding: "2px 9px" }}>{statusMeta.label}</span>
            {test.enable_proctoring
              ? <span title="Proctoring on"><ShieldCheck size={14} color="#059669" /></span>
              : <span title="Proctoring off"><ShieldOff size={14} color="var(--ink-dim)" /></span>}
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 3 }}>
            {test.subject_name ?? "No subject"} · {test.question_count} question{test.question_count !== 1 ? "s" : ""} · {test.total_points} pts · {test.duration_minutes} min
            <span style={{ marginLeft: 8 }}><Clock3 size={11} style={{ display: "inline", verticalAlign: "-1px" }} /> {fmtDateTime(test.available_from)} → {fmtDateTime(test.available_until)}</span>
          </p>
        </div>

        <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
          {isDraft && (
            <>
              <button onClick={publish} disabled={busy || test.question_count === 0}
                title={test.question_count === 0 ? "Add at least one question first" : "Publish to students"}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--brand)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: busy || test.question_count === 0 ? 0.5 : 1 }}>
                <Send size={12} /> Publish
              </button>
              <button onClick={() => { setExpanded(true); loadDetail().then(() => setEditDrawer(true)); }}
                style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 8, padding: 6, cursor: "pointer", color: "var(--ink-soft)" }}>
                <Pencil size={13} />
              </button>
              <button onClick={remove} disabled={busy}
                style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 8, padding: 6, cursor: "pointer", color: "var(--danger)" }}>
                <Trash2 size={13} />
              </button>
            </>
          )}
          {test.status === "published" && (
            <button onClick={close} disabled={busy}
              style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid var(--stroke)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--danger)" }}>
              <Lock size={12} /> Close test
            </button>
          )}
        </div>
      </div>

      {/* Expanded body */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", borderTop: "1px solid var(--stroke)" }}>
            <div style={{ padding: "12px 18px 18px" }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {(["questions", "results"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      border: "none", background: tab === t ? "var(--brand-soft, #eff6ff)" : "transparent",
                      color: tab === t ? "var(--brand)" : "var(--ink-dim)",
                    }}>
                    {t === "questions" ? <ListChecks size={13} /> : <Eye size={13} />}
                    {t === "questions" ? `Questions (${detail?.questions.length ?? test.question_count})` : "Results"}
                  </button>
                ))}
              </div>

              {tab === "questions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(detail?.questions ?? []).map(q => (
                    <div key={q.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 10, padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-dim)", marginTop: 2 }}>Q{q.order}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{q.question_text}</p>
                        <p style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>
                          {q.question_type === "mcq"
                            ? `MCQ · ${(q.options ?? []).length} options · correct: ${q.correct_answer}`
                            : q.question_type === "voice" ? "Voice answer" : "Short answer"} · {q.points} pt{q.points !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {isDraft && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => setQuestionDrawer({ open: true, editing: q })}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)", padding: 4 }}><Pencil size={13} /></button>
                          <button onClick={() => deleteQuestion(q)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: 4 }}><Trash2 size={13} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                  {detail && detail.questions.length === 0 && (
                    <p style={{ fontSize: 13, color: "var(--ink-dim)", fontStyle: "italic" }}>No questions yet — add at least one before publishing.</p>
                  )}
                  {isDraft && (
                    <button onClick={() => setQuestionDrawer({ open: true })}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "1px dashed var(--stroke)", background: "none", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "var(--brand)", cursor: "pointer" }}>
                      <Plus size={14} /> Add question
                    </button>
                  )}
                  {!isDraft && (
                    <p style={{ fontSize: 11, color: "var(--ink-dim)" }}>Questions are locked once a test is published.</p>
                  )}
                </div>
              )}

              {tab === "results" && <ResultsPanel testId={test.id} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawers */}
      <AnimatePresence>
        {editDrawer && detail && (
          <TestDrawer editing={detail} classrooms={classrooms} subjects={subjects}
            onClose={() => setEditDrawer(false)} onSaved={() => { loadDetail(); onChanged(); }} />
        )}
        {questionDrawer.open && (
          <QuestionDrawer testId={test.id} editing={questionDrawer.editing}
            onClose={() => setQuestionDrawer({ open: false })}
            onSaved={() => { loadDetail(); onChanged(); }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OnlineTestsPage() {
  const [tests, setTests] = useState<OnlineTestListItem[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "published" | "closed">("all");
  const [createDrawer, setCreateDrawer] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const data = await apiFetch<OnlineTestListItem[]>(`/api/assessments/admin/tests/${params}`);
      setTests(data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Promise.all([
      apiFetch<Classroom[]>("/api/academics/admin/classrooms/").catch(() => [] as Classroom[]),
      apiFetch<Subject[]>("/api/academics/admin/subjects/").catch(() => [] as Subject[]),
    ]).then(([c, s]) => { setClassrooms(c); setSubjects(s); });
  }, []);

  const stats = {
    total: tests.length,
    published: tests.filter(t => t.status === "published").length,
    draft: tests.filter(t => t.status === "draft").length,
  };

  return (
    <DashboardShell>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: 10 }}>
              <MonitorPlay size={24} color="var(--brand)" />
              Online Tests
            </h1>
            <p style={{ fontSize: 13, color: "var(--ink-dim)", marginTop: 4 }}>
              Proctored online exams — each student gets a private test link on their parent's app
            </p>
          </div>
          <button onClick={() => setCreateDrawer(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--brand)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={15} /> New Test
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Total tests", value: stats.total },
            { label: "Published", value: stats.published },
            { label: "Drafts", value: stats.draft },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 12, padding: "14px 18px" }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "var(--ink-dim)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "draft", "published", "closed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
                border: `1px solid ${filter === f ? "var(--brand)" : "var(--stroke)"}`,
                background: filter === f ? "var(--brand-soft, #eff6ff)" : "var(--surface)",
                color: filter === f ? "var(--brand)" : "var(--ink-soft)",
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Test list */}
        {loading ? (
          <p style={{ fontSize: 13, color: "var(--ink-dim)", textAlign: "center", padding: "40px 0" }}>Loading…</p>
        ) : tests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 0", background: "var(--surface)", border: "1px dashed var(--stroke)", borderRadius: 14 }}>
            <MonitorPlay size={36} color="var(--ink-dim)" style={{ opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginTop: 10 }}>No online tests yet</p>
            <p style={{ fontSize: 13, color: "var(--ink-dim)", marginTop: 4 }}>Create a draft, add questions, then publish to notify parents.</p>
            <button onClick={() => setCreateDrawer(true)}
              style={{ marginTop: 14, background: "var(--brand)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Create your first test
            </button>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tests.map(t => (
              <TestCard key={t.id} test={t} classrooms={classrooms} subjects={subjects} onChanged={load} />
            ))}
          </motion.div>
        )}
      </div>

      {/* Create drawer */}
      <AnimatePresence>
        {createDrawer && (
          <TestDrawer classrooms={classrooms} subjects={subjects}
            onClose={() => setCreateDrawer(false)} onSaved={load} />
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
