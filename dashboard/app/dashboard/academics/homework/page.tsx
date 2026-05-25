"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  PencilLine, Plus, Trash2, X, AlertTriangle, CheckCircle2,
  Clock, Search, BookOpen, GraduationCap,
} from "lucide-react";
import { DashboardShell } from "../../../../components/DashboardShell";
import { apiFetch } from "../../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Classroom { id: number; name: string; section: string; }
interface Subject    { id: number; name: string; }

interface Homework {
  id: number;
  classroom: number;
  classroom_name: string;
  subject: number | null;
  subject_name: string;
  teacher: number | null;
  teacher_name: string;
  title: string;
  description: string;
  assigned_date: string;
  due_date: string;
  is_active: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);

function dueMeta(due: string): { label: string; color: string; bg: string; icon: React.ElementType } {
  const diff = Math.ceil((new Date(due).getTime() - Date.now()) / 86400000);
  if (diff < 0)  return { label: "Overdue",   color: "#dc2626", bg: "#fef2f2", icon: AlertTriangle };
  if (diff === 0) return { label: "Due today", color: "#d97706", bg: "#fffbeb", icon: Clock };
  if (diff <= 2)  return { label: `${diff}d left`, color: "#f59e0b", bg: "#fffbeb", icon: Clock };
  return { label: `${diff}d left`, color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle2 };
}

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function subjectColor(name: string) {
  const palette = ["#4f46e5","#0891b2","#059669","#d97706","#dc2626","#7c3aed","#0d9488","#db2777"];
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

// ── Drawer ────────────────────────────────────────────────────────────────────

function HomeworkDrawer({ editing, classrooms, subjects, onClose, onSaved }: {
  editing?: Homework;
  classrooms: Classroom[];
  subjects: Subject[];
  onClose: () => void;
  onSaved: (h: Homework) => void;
}) {
  const [form, setForm] = useState({
    title:         editing?.title ?? "",
    description:   editing?.description ?? "",
    classroom:     editing?.classroom ?? (classrooms[0]?.id ?? ""),
    subject:       editing?.subject ?? "",
    assigned_date: editing?.assigned_date ?? today(),
    due_date:      editing?.due_date ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true); setError("");
    try {
      const url = editing ? `/api/academics/admin/homework/${editing.id}/` : "/api/academics/admin/homework/";
      const data = await apiFetch<Homework>(url, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({ ...form, subject: form.subject || null }),
      });
      onSaved(data); onClose();
    } catch (e: any) { setError(e.message ?? "Failed to save."); }
    finally { setLoading(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <motion.aside initial={{ x: 460 }} animate={{ x: 0 }} exit={{ x: 460 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 460, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 18, overflowY: "auto", boxShadow: "var(--shadow-lg)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Academics</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{editing ? "Edit Homework" : "Assign Homework"}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
        </div>
        {error && <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)" }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Classroom *</label>
            <select value={form.classroom} onChange={(e) => setForm(p => ({ ...p, classroom: Number(e.target.value) }))} style={inputStyle}>
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ""}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Subject</label>
            <select value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} style={inputStyle}>
              <option value="">— None —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Title *</label>
          <input style={inputStyle} value={form.title} placeholder="e.g. Chapter 5 exercises Q1–10" onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Instructions <span style={{ fontWeight: 400, color: "var(--ink-dim)" }}>(optional)</span></label>
          <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Detailed instructions for students…" style={{ ...inputStyle, resize: "none" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Assigned date</label>
            <input style={inputStyle} type="date" value={form.assigned_date} onChange={(e) => setForm(p => ({ ...p, assigned_date: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Due date *</label>
            <input style={inputStyle} type="date" value={form.due_date} onChange={(e) => setForm(p => ({ ...p, due_date: e.target.value }))} />
          </div>
        </div>

        <button onClick={save} disabled={!form.title || !form.due_date || !form.classroom || loading}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: !form.title || !form.due_date || loading ? 0.5 : 1, marginTop: "auto" }}>
          {loading ? "Saving…" : editing ? "Save changes" : "Assign homework"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Homework Card ──────────────────────────────────────────────────────────────

function HomeworkCard({ hw, onEdit, onDelete }: {
  hw: Homework; onEdit: () => void; onDelete: () => void;
}) {
  const dm = dueMeta(hw.due_date);
  const color = hw.subject_name ? subjectColor(hw.subject_name) : "var(--ink-dim)";
  const [deleting, setDeleting] = useState(false);

  async function del() {
    if (!confirm(`Delete "${hw.title}"?`)) return;
    setDeleting(true);
    try { await apiFetch(`/api/academics/admin/homework/${hw.id}/`, { method: "DELETE" }); onDelete(); }
    finally { setDeleting(false); }
  }

  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderLeft: `4px solid ${color}`, borderRadius: "0 12px 12px 0",
      padding: "14px 18px", boxShadow: "var(--shadow-sm)",
      display: "flex", alignItems: "flex-start", gap: 14,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <BookOpen size={18} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hw.title}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 6, padding: "2px 8px" }}>
                <GraduationCap size={10} /> {hw.classroom_name}
              </span>
              {hw.subject_name && (
                <span style={{ fontSize: 11, fontWeight: 600, color, background: color + "18", borderRadius: 6, padding: "2px 8px" }}>
                  {hw.subject_name}
                </span>
              )}
              {hw.description && (
                <span style={{ fontSize: 12, color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{hw.description}</span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: dm.color, background: dm.bg, borderRadius: 999, padding: "3px 10px" }}>
              <dm.icon size={11} /> {dm.label}
            </span>
            <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>Due {fmtDate(hw.due_date)}</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button onClick={onEdit} style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "var(--ink-soft)" }}><PencilLine size={13} /></button>
        <button onClick={del} disabled={deleting} style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "var(--ink-dim)" }}><Trash2 size={13} /></button>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomeworkPage() {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState<number | "">("");
  const [filterSubject, setFilterSubject] = useState<number | "">("");
  const [filterStatus, setFilterStatus] = useState<"all" | "overdue" | "upcoming">("all");
  const [drawer, setDrawer] = useState<{ open: boolean; editing?: Homework }>({ open: false });

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterClass) params.set("classroom_id", String(filterClass));
    if (filterSubject) params.set("subject_id", String(filterSubject));
    apiFetch<Homework[]>(`/api/academics/admin/homework/?${params}`)
      .then((d) => setHomework(Array.isArray(d) ? d : []))
      .catch(() => setHomework([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    Promise.all([
      apiFetch<Classroom[]>("/api/academics/admin/classrooms/"),
      apiFetch<Subject[]>("/api/academics/admin/subjects/"),
    ]).then(([c, s]) => {
      setClassrooms(Array.isArray(c) ? c : []);
      setSubjects(Array.isArray(s) ? s : []);
    });
  }, []);

  useEffect(() => { load(); }, [filterClass, filterSubject]);

  const filtered = homework
    .filter((h) => filterStatus === "all" || (filterStatus === "overdue" ? new Date(h.due_date) < new Date(today()) : new Date(h.due_date) >= new Date(today())))
    .filter((h) => !search || h.title.toLowerCase().includes(search.toLowerCase()) || h.classroom_name.toLowerCase().includes(search.toLowerCase()));

  const overdue = homework.filter((h) => new Date(h.due_date) < new Date(today())).length;

  return (
    <DashboardShell>
      <AnimatePresence>
        {drawer.open && (
          <HomeworkDrawer
            editing={drawer.editing}
            classrooms={classrooms}
            subjects={subjects}
            onClose={() => setDrawer({ open: false })}
            onSaved={(h) => {
              setHomework((p) => drawer.editing ? p.map((x) => x.id === h.id ? h : x) : [h, ...p]);
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ padding: "24px 28px 48px", maxWidth: 920 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>Academics</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Homework</h1>
          </div>
          <button onClick={() => setDrawer({ open: true })}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Plus size={16} /> Assign Homework
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Total assigned", value: loading ? "—" : homework.length, color: "#2563eb", icon: PencilLine },
            { label: "Overdue",        value: loading ? "—" : overdue, color: overdue > 0 ? "#dc2626" : "#94a3b8", icon: AlertTriangle },
            { label: "Upcoming",       value: loading ? "—" : homework.length - overdue, color: "#16a34a", icon: CheckCircle2 },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderTop: `3px solid ${s.color}`, borderRadius: 14, padding: "14px 18px" }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <s.icon size={15} color={s.color} />
              </div>
              <p style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-dim)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or class…"
              style={{ ...inputStyle, paddingLeft: 36 }} />
          </div>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value ? Number(e.target.value) : "")}
            style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "var(--ink)", outline: "none", minWidth: 150 }}>
            <option value="">All classes</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` ${c.section}` : ""}</option>)}
          </select>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value ? Number(e.target.value) : "")}
            style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "var(--ink)", outline: "none", minWidth: 140 }}>
            <option value="">All subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {(["all", "overdue", "upcoming"] as const).map((f) => (
            <button key={f} onClick={() => setFilterStatus(f)}
              style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${filterStatus === f ? (f === "overdue" ? "#fecaca" : "var(--primary)") : "var(--stroke)"}`, background: filterStatus === f ? (f === "overdue" ? "#fef2f2" : "var(--primary-soft)") : "var(--surface)", color: filterStatus === f ? (f === "overdue" ? "#dc2626" : "var(--primary)") : "var(--ink-soft)", fontSize: 13, fontWeight: filterStatus === f ? 700 : 400, cursor: "pointer", textTransform: "capitalize" }}>
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
              {homework.length === 0 ? "No homework assigned yet" : "No homework matches your filters"}
            </p>
            {homework.length === 0 && (
              <button onClick={() => setDrawer({ open: true })}
                style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: 12 }}>
                Assign first homework
              </button>
            )}
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((h) => (
              <HomeworkCard key={h.id} hw={h}
                onEdit={() => setDrawer({ open: true, editing: h })}
                onDelete={() => setHomework((p) => p.filter((x) => x.id !== h.id))}
              />
            ))}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
