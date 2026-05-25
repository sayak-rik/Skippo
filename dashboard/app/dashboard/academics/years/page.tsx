"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  CalendarRange, Plus, CheckCircle2, ChevronDown, ChevronRight,
  Pencil, Trash2, Star, X,
} from "lucide-react";
import { DashboardShell } from "../../../../components/DashboardShell";
import { apiFetch } from "../../../../lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface AcademicSession {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  sessions: AcademicSession[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const fade = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
};

// ── Year Drawer ───────────────────────────────────────────────────────────────

function YearDrawer({
  editing, onClose, onSaved,
}: {
  editing?: AcademicYear;
  onClose: () => void;
  onSaved: (y: AcademicYear) => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    start_date: editing?.start_date ?? "",
    end_date: editing?.end_date ?? "",
    is_current: editing?.is_current ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true);
    setError("");
    try {
      const url = editing
        ? `/api/academics/admin/academic-years/${editing.id}/`
        : "/api/academics/admin/academic-years/";
      const data = await apiFetch<AcademicYear>(url, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      onSaved(data);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to save.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 440, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", boxShadow: "var(--shadow-lg)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>School Setup</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{editing ? "Edit Year" : "New Academic Year"}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ink-dim)", fontSize: 20, cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <Field label="Year name">
          <input style={inputStyle} value={form.name} placeholder="e.g. 2025–26" onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
        </Field>
        <Field label="Start date">
          <input style={inputStyle} type="date" value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))} />
        </Field>
        <Field label="End date">
          <input style={inputStyle} type="date" value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))} />
        </Field>

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={form.is_current} onChange={(e) => setForm(p => ({ ...p, is_current: e.target.checked }))} />
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Mark as current academic year</span>
        </label>

        <button
          onClick={save}
          disabled={!form.name || !form.start_date || !form.end_date || loading}
          style={{
            background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12,
            padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer",
            opacity: !form.name || loading ? 0.5 : 1, marginTop: "auto",
          }}
        >
          {loading ? "Saving…" : editing ? "Save changes" : "Create year"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Session Row ───────────────────────────────────────────────────────────────

function SessionRow({
  session, yearId, onDelete, onSetCurrent,
}: {
  session: AcademicSession;
  yearId: number;
  onDelete: () => void;
  onSetCurrent: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function del() {
    if (!confirm(`Delete session "${session.name}"?`)) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/academics/admin/academic-years/${yearId}/sessions/${session.id}/`, { method: "DELETE" });
      onDelete();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px", background: "var(--surface)",
      border: "1px solid var(--stroke)", borderRadius: 10,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{session.name}</span>
          {session.is_current && (
            <span style={{ fontSize: 10, fontWeight: 700, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 999, padding: "1px 7px" }}>
              Current
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>
          {fmt(session.start_date)} – {fmt(session.end_date)}
        </span>
      </div>
      {!session.is_current && (
        <button
          onClick={onSetCurrent}
          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--stroke)", background: "var(--surface-raised)", color: "var(--ink-soft)", cursor: "pointer" }}
        >
          Set current
        </button>
      )}
      <button onClick={del} disabled={deleting} style={{ background: "none", border: "none", color: "var(--ink-dim)", cursor: "pointer", padding: 4 }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Add Session Inline ────────────────────────────────────────────────────────

function AddSessionForm({ yearId, onAdded }: { yearId: number; onAdded: (s: AcademicSession) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "" });
  const [loading, setLoading] = useState(false);

  async function add() {
    setLoading(true);
    try {
      const s = await apiFetch<AcademicSession>(`/api/academics/admin/academic-years/${yearId}/sessions/`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      onAdded(s);
      setForm({ name: "", start_date: "", end_date: "" });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--primary)", background: "none", border: "1px dashed var(--stroke)", borderRadius: 8, padding: "7px 12px", cursor: "pointer", width: "100%" }}
      >
        <Plus size={13} /> Add session
      </button>
    );
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--primary)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <input style={{ ...inputStyle, fontSize: 12 }} placeholder="Session name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
        <input style={{ ...inputStyle, fontSize: 12 }} type="date" value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))} />
        <input style={{ ...inputStyle, fontSize: 12 }} type="date" value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={add} disabled={!form.name || loading} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {loading ? "Saving…" : "Add"}
        </button>
        <button onClick={() => setOpen(false)} style={{ background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer", color: "var(--ink-soft)" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Year Card ────────────────────────────────────────────────────────────────

function YearCard({
  year, onEdit, onDelete, onSetCurrent, onSessionsChange,
}: {
  year: AcademicYear;
  onEdit: () => void;
  onDelete: () => void;
  onSetCurrent: () => void;
  onSessionsChange: (sessions: AcademicSession[]) => void;
}) {
  const [expanded, setExpanded] = useState(year.is_current);
  const [deleting, setDeleting] = useState(false);

  async function del() {
    if (!confirm(`Delete "${year.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/academics/admin/academic-years/${year.id}/`, { method: "DELETE" });
      onDelete();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <motion.div variants={fade} layout style={{
      background: "var(--surface)", border: `1px solid ${year.is_current ? "var(--primary)" : "var(--stroke)"}`,
      borderRadius: 16, overflow: "hidden",
      boxShadow: year.is_current ? "0 0 0 3px var(--primary-soft)" : "var(--shadow-sm)",
    }}>
      {/* Header */}
      <div
        style={{ padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: year.is_current ? "var(--primary-soft)" : "var(--surface-raised)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <CalendarRange size={20} color={year.is_current ? "var(--primary)" : "var(--ink-dim)"} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{year.name}</span>
            {year.is_current && (
              <span style={{ fontSize: 10, fontWeight: 700, background: "var(--primary)", color: "#fff", borderRadius: 999, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={10} /> Current
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "2px 0 0" }}>
            {fmt(year.start_date)} – {fmt(year.end_date)} · {year.sessions.length} session{year.sessions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!year.is_current && (
            <button onClick={(e) => { e.stopPropagation(); onSetCurrent(); }} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 7, border: "1px solid var(--stroke)", background: "var(--surface-raised)", color: "var(--ink-soft)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Star size={11} /> Set current
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 7, padding: "5px 8px", color: "var(--ink-soft)", cursor: "pointer" }}>
            <Pencil size={13} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); del(); }} disabled={deleting} style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 7, padding: "5px 8px", color: "var(--ink-dim)", cursor: "pointer" }}>
            <Trash2 size={13} />
          </button>
          {expanded ? <ChevronDown size={16} color="var(--ink-dim)" /> : <ChevronRight size={16} color="var(--ink-dim)" />}
        </div>
      </div>

      {/* Sessions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 20px 18px", borderTop: "1px solid var(--stroke)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Sessions</p>
              {year.sessions.length === 0 && (
                <p style={{ fontSize: 12, color: "var(--ink-dim)", fontStyle: "italic" }}>No sessions yet.</p>
              )}
              {year.sessions.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  yearId={year.id}
                  onDelete={() => onSessionsChange(year.sessions.filter((x) => x.id !== s.id))}
                  onSetCurrent={async () => {
                    await apiFetch(`/api/academics/admin/academic-years/${year.id}/sessions/${s.id}/`, {
                      method: "PATCH", body: JSON.stringify({ is_current: true }),
                    });
                    onSessionsChange(year.sessions.map((x) => ({ ...x, is_current: x.id === s.id })));
                  }}
                />
              ))}
              <AddSessionForm
                yearId={year.id}
                onAdded={(s) => onSessionsChange([...year.sessions, s])}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState<{ open: boolean; editing?: AcademicYear }>({ open: false });

  function load() {
    setLoading(true);
    apiFetch<AcademicYear[]>("/api/academics/admin/academic-years/")
      .then((d) => setYears(Array.isArray(d) ? d : []))
      .catch(() => setYears([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const currentYear = years.find((y) => y.is_current);
  const totalSessions = years.reduce((n, y) => n + y.sessions.length, 0);

  async function setCurrent(yearId: number) {
    await apiFetch(`/api/academics/admin/academic-years/${yearId}/set-current/`, { method: "POST" });
    setYears((prev) => prev.map((y) => ({ ...y, is_current: y.id === yearId })));
  }

  return (
    <DashboardShell>
      <AnimatePresence>
        {drawer.open && (
          <YearDrawer
            editing={drawer.editing}
            onClose={() => setDrawer({ open: false })}
            onSaved={(saved) => {
              if (drawer.editing) {
                setYears((prev) => prev.map((y) => y.id === saved.id ? { ...saved, sessions: y.sessions } : y));
                if (saved.is_current) setYears((prev) => prev.map((y) => ({ ...y, is_current: y.id === saved.id })));
              } else {
                setYears((prev) => [...prev, { ...saved, sessions: [] }]);
              }
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ padding: "24px 28px 48px", maxWidth: 860 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>School Setup</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Academic Years</h1>
          </div>
          <button
            onClick={() => setDrawer({ open: true })}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            <Plus size={16} /> New Year
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}
        >
          {[
            { label: "Total years", value: loading ? "—" : years.length, icon: CalendarRange, color: "#2563eb" },
            { label: "Current year", value: loading ? "—" : (currentYear?.name ?? "None"), icon: CheckCircle2, color: "#16a34a" },
            { label: "Total sessions", value: loading ? "—" : totalSessions, icon: CalendarRange, color: "#7c3aed" },
          ].map((s) => (
            <motion.div key={s.label} variants={fade} style={{
              background: "var(--surface)", border: "1px solid var(--stroke)",
              borderTop: `3px solid ${s.color}`, borderRadius: 16, padding: "16px 20px",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <s.icon size={17} color={s.color} />
              </div>
              <p style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 3 }}>{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Year list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading…</div>
        ) : years.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No academic years yet</p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>Create your first year to get started with timetables, exams, and report cards.</p>
            <button onClick={() => setDrawer({ open: true })} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Create first year
            </button>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {years.map((year) => (
              <YearCard
                key={year.id}
                year={year}
                onEdit={() => setDrawer({ open: true, editing: year })}
                onDelete={() => setYears((prev) => prev.filter((y) => y.id !== year.id))}
                onSetCurrent={() => setCurrent(year.id)}
                onSessionsChange={(sessions) => setYears((prev) => prev.map((y) => y.id === year.id ? { ...y, sessions } : y))}
              />
            ))}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
