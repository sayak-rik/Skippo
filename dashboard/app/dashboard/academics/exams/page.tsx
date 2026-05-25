"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ClipboardList, Plus, Trash2, Pencil, X, ChevronDown, ChevronRight,
  Eye, EyeOff, CheckSquare, Hash, BookOpen, GraduationCap, Save,
} from "lucide-react";
import { DashboardShell } from "../../../../components/DashboardShell";
import { apiFetch } from "../../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AcademicYear { id: number; name: string; is_current: boolean; }
interface Classroom    { id: number; name: string; section: string; }
interface Subject      { id: number; name: string; }

interface ExamSchedule {
  id: number;
  exam: number;
  classroom: number;
  classroom_name: string;
  subject: number;
  subject_name: string;
  date: string;
  starts_at: string | null;
  ends_at: string | null;
  max_marks: number;
  passing_marks: number;
}

interface Exam {
  id: number;
  name: string;
  exam_type: "unit_test" | "midterm" | "final" | "practical" | "other";
  academic_year: number | null;
  start_date: string;
  end_date: string;
  is_published: boolean;
  schedules: ExamSchedule[];
}

interface Student {
  id: number;
  name: string;
  roll_number: string;
  classroom_id: number | null;
}

interface ExamResult {
  id: number;
  student: number;
  student_name: string;
  roll_number: string;
  marks_obtained: number | null;
  is_absent: boolean;
  grade: string;
}

// ── Lookups ───────────────────────────────────────────────────────────────────

const EXAM_TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  unit_test: { label: "Unit Test", color: "#2563eb", bg: "#eff6ff" },
  midterm:   { label: "Midterm",   color: "#7c3aed", bg: "#f5f3ff" },
  final:     { label: "Final",     color: "#dc2626", bg: "#fef2f2" },
  practical: { label: "Practical", color: "#059669", bg: "#f0fdf4" },
  other:     { label: "Other",     color: "#64748b", bg: "#f8fafc" },
};

const GRADE_COLOR: Record<string, string> = {
  "A+": "#059669", A: "#0891b2", B: "#2563eb", C: "#d97706", D: "#f97316", F: "#dc2626",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
};
const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

// ── Exam Drawer ───────────────────────────────────────────────────────────────

function ExamDrawer({ editing, years, onClose, onSaved }: {
  editing?: Exam; years: AcademicYear[];
  onClose: () => void; onSaved: (e: Exam) => void;
}) {
  const cur = years.find(y => y.is_current);
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    exam_type: editing?.exam_type ?? "other",
    academic_year: editing?.academic_year ?? cur?.id ?? (years[0]?.id ?? ""),
    start_date: editing?.start_date ?? "",
    end_date: editing?.end_date ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true); setError("");
    try {
      const url = editing ? `/api/academics/admin/exams/${editing.id}/` : "/api/academics/admin/exams/";
      const data = await apiFetch<Exam>(url, { method: editing ? "PATCH" : "POST", body: JSON.stringify(form) });
      onSaved(data); onClose();
    } catch (e: any) { setError(e.message ?? "Failed."); }
    finally { setLoading(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <motion.aside initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 440, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 18, overflowY: "auto", boxShadow: "var(--shadow-lg)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Academics</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{editing ? "Edit Exam" : "New Exam"}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
        </div>
        {error && <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)" }}>{error}</div>}

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 8 }}>Exam type</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {Object.entries(EXAM_TYPE_META).map(([k, v]) => (
              <button key={k} onClick={() => setForm(p => ({ ...p, exam_type: k as any }))}
                style={{ padding: "8px 0", borderRadius: 9, border: `1px solid ${form.exam_type === k ? v.color : "var(--stroke)"}`, background: form.exam_type === k ? v.bg : "var(--surface)", color: form.exam_type === k ? v.color : "var(--ink-soft)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Exam name *</label>
          <input style={inputStyle} value={form.name} placeholder="e.g. Unit Test 1 — Term 1" onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Academic year</label>
          <select value={form.academic_year} onChange={(e) => setForm(p => ({ ...p, academic_year: Number(e.target.value) }))} style={inputStyle}>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.is_current ? " (Current)" : ""}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Start date *</label>
            <input style={inputStyle} type="date" value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>End date *</label>
            <input style={inputStyle} type="date" value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))} />
          </div>
        </div>
        <button onClick={save} disabled={!form.name || !form.start_date || !form.end_date || loading}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: !form.name || loading ? 0.5 : 1, marginTop: "auto" }}>
          {loading ? "Saving…" : editing ? "Save changes" : "Create exam"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Schedule Drawer ───────────────────────────────────────────────────────────

function ScheduleDrawer({ examId, classrooms, subjects, onClose, onSaved }: {
  examId: number; classrooms: Classroom[]; subjects: Subject[];
  onClose: () => void; onSaved: (s: ExamSchedule) => void;
}) {
  const [form, setForm] = useState({ classroom: classrooms[0]?.id ?? "", subject: "", date: "", starts_at: "", ends_at: "", max_marks: 100, passing_marks: 35 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true); setError("");
    try {
      const data = await apiFetch<ExamSchedule>(`/api/academics/admin/exams/${examId}/schedules/`, {
        method: "POST",
        body: JSON.stringify({ ...form, classroom: Number(form.classroom), subject: Number(form.subject) || null, starts_at: form.starts_at || null, ends_at: form.ends_at || null }),
      });
      onSaved(data); onClose();
    } catch (e: any) { setError(e.message ?? "Failed."); }
    finally { setLoading(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 110, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <motion.aside initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 420, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", boxShadow: "var(--shadow-lg)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>Add Subject Schedule</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
        </div>
        {error && <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)" }}>{error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Classroom *</label>
            <select value={form.classroom} onChange={(e) => setForm(p => ({ ...p, classroom: e.target.value }))} style={inputStyle}>
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ""}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Subject *</label>
            <select value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} style={inputStyle}>
              <option value="">— Select —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Date *</label>
          <input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Start time</label>
            <input style={inputStyle} type="time" value={form.starts_at} onChange={(e) => setForm(p => ({ ...p, starts_at: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>End time</label>
            <input style={inputStyle} type="time" value={form.ends_at} onChange={(e) => setForm(p => ({ ...p, ends_at: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Max marks</label>
            <input style={inputStyle} type="number" value={form.max_marks} onChange={(e) => setForm(p => ({ ...p, max_marks: Number(e.target.value) }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Passing marks</label>
            <input style={inputStyle} type="number" value={form.passing_marks} onChange={(e) => setForm(p => ({ ...p, passing_marks: Number(e.target.value) }))} />
          </div>
        </div>
        <button onClick={save} disabled={!form.classroom || !form.subject || !form.date || loading}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: !form.subject || !form.date || loading ? 0.5 : 1, marginTop: "auto" }}>
          {loading ? "Saving…" : "Add schedule"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Marks Panel ───────────────────────────────────────────────────────────────

function MarksPanel({ schedule, onClose }: { schedule: ExamSchedule; onClose: () => void }) {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<number, { marks: string; absent: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<Student[]>(`/api/academics/admin/students/?classroom_id=${schedule.classroom}`),
      apiFetch<ExamResult[]>(`/api/academics/admin/exam-schedules/${schedule.id}/results/`),
    ]).then(([sts, res]) => {
      const stList = Array.isArray(sts) ? sts : (sts as any).results ?? [];
      setStudents(stList);
      const existing: Record<number, { marks: string; absent: boolean }> = {};
      if (Array.isArray(res)) {
        for (const r of res) {
          existing[r.student] = { marks: r.marks_obtained != null ? String(r.marks_obtained) : "", absent: r.is_absent };
        }
      }
      setMarks(existing);
    }).finally(() => setLoading(false));
  }, [schedule.id, schedule.classroom]);

  async function saveAll() {
    setSaving(true);
    const payload = students.map(s => ({
      student_id: s.id,
      marks_obtained: marks[s.id]?.absent ? null : Number(marks[s.id]?.marks ?? 0),
      is_absent: marks[s.id]?.absent ?? false,
    }));
    try {
      await apiFetch(`/api/academics/admin/exam-schedules/${schedule.id}/results/`, {
        method: "POST", body: JSON.stringify({ results: payload }),
      });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  const entered = Object.values(marks).filter(m => !m.absent && m.marks !== "").length;
  const absent  = Object.values(marks).filter(m => m.absent).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 120, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <motion.aside initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 500, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}
      >
        {/* Header */}
        <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--stroke)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Marks Entry</p>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{schedule.subject_name}</h3>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                {schedule.classroom_name} · {fmtDate(schedule.date)} · Max: {schedule.max_marks}
              </p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {[
              { label: `${entered} / ${students.length} entered`, color: "#2563eb" },
              { label: `${absent} absent`, color: "#dc2626" },
            ].map(p => (
              <span key={p.label} style={{ fontSize: 11, fontWeight: 600, color: p.color, background: p.color + "14", borderRadius: 6, padding: "3px 9px" }}>{p.label}</span>
            ))}
          </div>
        </div>

        {/* Student list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-dim)" }}>Loading students…</div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-dim)" }}>No students in this classroom.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {students.map((s) => {
                const m = marks[s.id] ?? { marks: "", absent: false };
                return (
                  <div key={s.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", background: m.absent ? "#fef2f2" : "var(--surface-raised)",
                    border: `1px solid ${m.absent ? "#fecaca" : "var(--stroke)"}`, borderRadius: 10,
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--surface)", border: "1px solid var(--stroke)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", flexShrink: 0 }}>
                      {s.roll_number || "—"}
                    </div>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: m.absent ? "#dc2626" : "var(--ink)" }}>{s.name}</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 11, color: "#dc2626", fontWeight: 600 }}>
                      <input type="checkbox" checked={m.absent} onChange={(e) => setMarks(prev => ({ ...prev, [s.id]: { marks: "", absent: e.target.checked } }))} />
                      Absent
                    </label>
                    <input
                      type="number" min={0} max={schedule.max_marks}
                      value={m.absent ? "" : m.marks}
                      disabled={m.absent}
                      placeholder="—"
                      onChange={(e) => setMarks(prev => ({ ...prev, [s.id]: { ...prev[s.id], marks: e.target.value } }))}
                      style={{ width: 70, padding: "6px 10px", background: m.absent ? "#fef2f2" : "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 8, fontSize: 13, textAlign: "center", outline: "none", color: "var(--ink)" }}
                    />
                    <span style={{ width: 28, fontSize: 11, fontWeight: 700, textAlign: "center", color: m.absent ? "#dc2626" : (GRADE_COLOR[m.marks ? (Number(m.marks) / schedule.max_marks >= 0.9 ? "A+" : Number(m.marks) / schedule.max_marks >= 0.75 ? "A" : Number(m.marks) / schedule.max_marks >= 0.6 ? "B" : Number(m.marks) / schedule.max_marks >= 0.45 ? "C" : Number(m.marks) / schedule.max_marks >= 0.35 ? "D" : "F") : ""] ?? "var(--ink-dim)") }}>
                      {m.absent ? "AB" : m.marks ? (Number(m.marks) / schedule.max_marks >= 0.9 ? "A+" : Number(m.marks) / schedule.max_marks >= 0.75 ? "A" : Number(m.marks) / schedule.max_marks >= 0.6 ? "B" : Number(m.marks) / schedule.max_marks >= 0.45 ? "C" : Number(m.marks) / schedule.max_marks >= 0.35 ? "D" : "F") : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--stroke)", display: "flex", gap: 10, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Saved</span>}
          <button onClick={saveAll} disabled={saving || students.length === 0}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: saving || students.length === 0 ? 0.6 : 1 }}>
            <Save size={15} /> {saving ? "Saving…" : "Save marks"}
          </button>
        </div>
      </motion.aside>
    </motion.div>
  );
}

// ── Exam Card ──────────────────────────────────────────────────────────────────

function ExamCard({ exam, classrooms, subjects, onEdit, onDelete, onPublishToggle, onScheduleAdded }: {
  exam: Exam; classrooms: Classroom[]; subjects: Subject[];
  onEdit: () => void; onDelete: () => void;
  onPublishToggle: (e: Exam) => void;
  onScheduleAdded: (s: ExamSchedule) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [scheduleDrawer, setScheduleDrawer] = useState(false);
  const [marksSchedule, setMarksSchedule] = useState<ExamSchedule | null>(null);
  const meta = EXAM_TYPE_META[exam.exam_type] ?? EXAM_TYPE_META.other;

  async function del() {
    if (!confirm(`Delete exam "${exam.name}"?`)) return;
    await apiFetch(`/api/academics/admin/exams/${exam.id}/`, { method: "DELETE" });
    onDelete();
  }

  async function togglePublish() {
    const updated = await apiFetch<Exam>(`/api/academics/admin/exams/${exam.id}/publish/`, { method: "POST" });
    onPublishToggle(updated);
  }

  return (
    <motion.div variants={fade} layout style={{
      background: "var(--surface)", border: `1px solid ${exam.is_published ? "#bbf7d0" : "var(--stroke)"}`,
      borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)",
    }}>
      <AnimatePresence>
        {scheduleDrawer && (
          <ScheduleDrawer examId={exam.id} classrooms={classrooms} subjects={subjects}
            onClose={() => setScheduleDrawer(false)}
            onSaved={(s) => { onScheduleAdded(s); setScheduleDrawer(false); }} />
        )}
        {marksSchedule && (
          <MarksPanel schedule={marksSchedule} onClose={() => setMarksSchedule(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => setExpanded(v => !v)}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ClipboardList size={20} color={meta.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{exam.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, background: meta.bg, borderRadius: 999, padding: "2px 8px" }}>{meta.label}</span>
            {exam.is_published && <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", borderRadius: 999, padding: "2px 8px" }}>Published</span>}
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            {fmtDate(exam.start_date)} – {fmtDate(exam.end_date)} · {exam.schedules.length} subject{exam.schedules.length !== 1 ? "s" : ""} scheduled
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={(e) => { e.stopPropagation(); togglePublish(); }}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 7, border: `1px solid ${exam.is_published ? "#fecaca" : "#bbf7d0"}`, background: exam.is_published ? "#fef2f2" : "#f0fdf4", color: exam.is_published ? "#dc2626" : "#16a34a", cursor: "pointer" }}>
            {exam.is_published ? <><EyeOff size={11} /> Unpublish</> : <><Eye size={11} /> Publish</>}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "var(--ink-soft)" }}><Pencil size={13} /></button>
          <button onClick={(e) => { e.stopPropagation(); del(); }} style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "var(--ink-dim)" }}><Trash2 size={13} /></button>
          {expanded ? <ChevronDown size={16} color="var(--ink-dim)" /> : <ChevronRight size={16} color="var(--ink-dim)" />}
        </div>
      </div>

      {/* Schedules */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 20px 16px", borderTop: "1px solid var(--stroke)", paddingTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Subject Schedules</p>
                <button onClick={() => setScheduleDrawer(true)}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--primary)", background: "var(--primary-soft)", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer", fontWeight: 600 }}>
                  <Plus size={12} /> Add schedule
                </button>
              </div>
              {exam.schedules.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--ink-dim)", fontStyle: "italic" }}>No subject schedules yet. Add classroom + subject + date entries.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {exam.schedules.map((sch) => (
                    <div key={sch.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "9px 12px", background: "var(--surface-raised)",
                      border: "1px solid var(--stroke)", borderRadius: 9,
                    }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{sch.subject_name}</span>
                        <span style={{ fontSize: 11, color: "var(--ink-soft)", marginLeft: 8 }}>{sch.classroom_name} · {fmtDate(sch.date)}</span>
                        {sch.starts_at && <span style={{ fontSize: 11, color: "var(--ink-dim)", marginLeft: 6 }}>{sch.starts_at.slice(0,5)}–{sch.ends_at?.slice(0,5)}</span>}
                      </div>
                      <span style={{ fontSize: 11, color: "var(--ink-soft)", background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 6, padding: "2px 8px" }}>
                        Max: {sch.max_marks} · Pass: {sch.passing_marks}
                      </span>
                      <button
                        onClick={() => setMarksSchedule(sch)}
                        style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 7, border: "1px solid var(--primary)", background: "var(--primary-soft)", color: "var(--primary)", cursor: "pointer" }}>
                        <Hash size={11} /> Enter marks
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<number | "">("");
  const [drawer, setDrawer] = useState<{ open: boolean; editing?: Exam }>({ open: false });

  function load() {
    setLoading(true);
    const params = filterYear ? `?academic_year_id=${filterYear}` : "";
    apiFetch<Exam[]>(`/api/academics/admin/exams/${params}`)
      .then((d) => setExams(Array.isArray(d) ? d : []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    Promise.all([
      apiFetch<AcademicYear[]>("/api/academics/admin/academic-years/"),
      apiFetch<Classroom[]>("/api/academics/admin/classrooms/"),
      apiFetch<Subject[]>("/api/academics/admin/subjects/"),
    ]).then(([y, c, s]) => {
      setYears(Array.isArray(y) ? y : []);
      setClassrooms(Array.isArray(c) ? c : []);
      setSubjects(Array.isArray(s) ? s : []);
      const cur = Array.isArray(y) ? y.find((yr: AcademicYear) => yr.is_current) : null;
      if (cur) setFilterYear(cur.id);
    });
  }, []);

  useEffect(() => { load(); }, [filterYear]);

  const published = exams.filter(e => e.is_published).length;

  return (
    <DashboardShell>
      <AnimatePresence>
        {drawer.open && (
          <ExamDrawer editing={drawer.editing} years={years}
            onClose={() => setDrawer({ open: false })}
            onSaved={(saved) => {
              setExams(p => drawer.editing
                ? p.map(x => x.id === saved.id ? { ...saved, schedules: x.schedules } : x)
                : [{ ...saved, schedules: [] }, ...p]);
            }} />
        )}
      </AnimatePresence>

      <div style={{ padding: "24px 28px 48px", maxWidth: 920 }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>Academics</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Exams</h1>
          </div>
          <button onClick={() => setDrawer({ open: true })}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Plus size={16} /> New Exam
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
          {Object.entries(EXAM_TYPE_META).map(([k, v]) => {
            const count = exams.filter(e => e.exam_type === k).length;
            return (
              <div key={k} style={{ background: v.bg, border: `1px solid ${v.color}22`, borderRadius: 12, padding: "12px 16px" }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: v.color }}>{count}</p>
                <p style={{ fontSize: 11, color: v.color, fontWeight: 600 }}>{v.label}</p>
              </div>
            );
          })}
        </motion.div>

        {/* Filter bar */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value ? Number(e.target.value) : "")}
            style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "var(--ink)", outline: "none", minWidth: 180 }}>
            <option value="">All years</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.is_current ? " (Current)" : ""}</option>)}
          </select>
          <span style={{ fontSize: 12, color: "var(--ink-dim)", marginLeft: "auto" }}>
            {published} of {exams.length} published
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading…</div>
        ) : exams.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No exams yet</p>
            <button onClick={() => setDrawer({ open: true })}
              style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: 12 }}>
              Create first exam
            </button>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} classrooms={classrooms} subjects={subjects}
                onEdit={() => setDrawer({ open: true, editing: exam })}
                onDelete={() => setExams(p => p.filter(x => x.id !== exam.id))}
                onPublishToggle={(updated) => setExams(p => p.map(x => x.id === updated.id ? { ...updated, schedules: x.schedules } : x))}
                onScheduleAdded={(s) => setExams(p => p.map(x => x.id === exam.id ? { ...x, schedules: [...x.schedules, s] } : x))}
              />
            ))}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
