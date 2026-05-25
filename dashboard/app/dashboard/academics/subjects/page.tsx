"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, BookOpen, ToggleLeft, ToggleRight, X, Search } from "lucide-react";
import { DashboardShell } from "../../../../components/DashboardShell";
import { apiFetch } from "../../../../lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface Subject {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

// ── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = [
  "#4f46e5", "#0891b2", "#059669", "#d97706",
  "#dc2626", "#7c3aed", "#0d9488", "#db2777",
  "#2563eb", "#65a30d", "#ea580c", "#4338ca",
];

function subjectColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fade = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
};

// ── Drawer ───────────────────────────────────────────────────────────────────

function SubjectDrawer({
  editing, onClose, onSaved,
}: {
  editing?: Subject;
  onClose: () => void;
  onSaved: (s: Subject) => void;
}) {
  const [form, setForm] = useState({ name: editing?.name ?? "", code: editing?.code ?? "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true);
    setError("");
    try {
      const url = editing ? `/api/academics/admin/subjects/${editing.id}/` : "/api/academics/admin/subjects/";
      const data = await apiFetch<Subject>(url, {
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
        initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 420, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 20, boxShadow: "var(--shadow-lg)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>School Setup</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{editing ? "Edit Subject" : "New Subject"}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Color preview */}
        <div style={{
          height: 6, borderRadius: 99, marginBottom: 4,
          background: form.name ? subjectColor(form.name) : "var(--stroke)",
          transition: "background 0.3s",
        }} />

        {error && (
          <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Subject name *</label>
          <input style={inputStyle} value={form.name} placeholder="e.g. Mathematics" onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Subject code <span style={{ fontWeight: 400, color: "var(--ink-dim)" }}>(optional)</span></label>
          <input style={inputStyle} value={form.code} placeholder="e.g. MATH101" onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} />
        </div>

        <button
          onClick={save}
          disabled={!form.name || loading}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: !form.name || loading ? 0.5 : 1, marginTop: "auto" }}
        >
          {loading ? "Saving…" : editing ? "Save changes" : "Add subject"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Subject Card ─────────────────────────────────────────────────────────────

function SubjectCard({
  subject, onEdit, onDelete, onToggle,
}: {
  subject: Subject;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const color = subjectColor(subject.name);
  const [deleting, setDeleting] = useState(false);

  async function del() {
    if (!confirm(`Delete "${subject.name}"?`)) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/academics/admin/subjects/${subject.id}/`, { method: "DELETE" });
      onDelete();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderRadius: 16, overflow: "hidden",
      boxShadow: "var(--shadow-sm)", opacity: subject.is_active ? 1 : 0.6,
    }}>
      {/* Color strip */}
      <div style={{ height: 5, background: color }} />

      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: color + "18", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BookOpen size={18} color={color} />
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={onEdit} style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 7, padding: "4px 7px", cursor: "pointer", color: "var(--ink-soft)" }}>
              <Pencil size={12} />
            </button>
            <button onClick={del} disabled={deleting} style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 7, padding: "4px 7px", cursor: "pointer", color: "var(--ink-dim)" }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>{subject.name}</p>
        {subject.code && (
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--ink-dim)", background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 5, padding: "1px 7px" }}>
            {subject.code}
          </span>
        )}

        {/* Toggle */}
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: subject.is_active ? "#16a34a" : "var(--ink-dim)", fontWeight: 600 }}>
            {subject.is_active ? "Active" : "Inactive"}
          </span>
          <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", color: subject.is_active ? "#16a34a" : "var(--ink-dim)", padding: 0 }}>
            {subject.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [drawer, setDrawer] = useState<{ open: boolean; editing?: Subject }>({ open: false });

  function load() {
    setLoading(true);
    apiFetch<Subject[]>("/api/academics/admin/subjects/")
      .then((d) => setSubjects(Array.isArray(d) ? d : []))
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggle(s: Subject) {
    const updated = await apiFetch<Subject>(`/api/academics/admin/subjects/${s.id}/`, {
      method: "PATCH", body: JSON.stringify({ is_active: !s.is_active }),
    });
    setSubjects((prev) => prev.map((x) => x.id === s.id ? updated : x));
  }

  const active = subjects.filter((s) => s.is_active).length;

  const filtered = subjects
    .filter((s) => filter === "all" || (filter === "active" ? s.is_active : !s.is_active))
    .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code?.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardShell>
      <AnimatePresence>
        {drawer.open && (
          <SubjectDrawer
            editing={drawer.editing}
            onClose={() => setDrawer({ open: false })}
            onSaved={(saved) => {
              setSubjects((prev) =>
                drawer.editing
                  ? prev.map((x) => x.id === saved.id ? saved : x)
                  : [...prev, saved]
              );
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ padding: "24px 28px 48px" }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>School Setup</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Subjects</h1>
          </div>
          <button
            onClick={() => setDrawer({ open: true })}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            <Plus size={16} /> New Subject
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total subjects", value: loading ? "—" : subjects.length, color: "#2563eb" },
            { label: "Active", value: loading ? "—" : active, color: "#16a34a" },
            { label: "Inactive", value: loading ? "—" : subjects.length - active, color: "#94a3b8" },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderTop: `3px solid ${s.color}`, borderRadius: 14, padding: "14px 18px" }}>
              <p style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-dim)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects…"
              style={{ ...inputStyle, paddingLeft: 36 }}
            />
          </div>
          {(["all", "active", "inactive"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${filter === f ? "var(--primary)" : "var(--stroke)"}`, background: filter === f ? "var(--primary-soft)" : "var(--surface)", color: filter === f ? "var(--primary)" : "var(--ink-soft)", fontSize: 13, fontWeight: filter === f ? 700 : 400, cursor: "pointer", textTransform: "capitalize" }}>
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
              {subjects.length === 0 ? "No subjects yet" : "No subjects match your search"}
            </p>
            {subjects.length === 0 && (
              <button onClick={() => setDrawer({ open: true })} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 12 }}>
                Add first subject
              </button>
            )}
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {filtered.map((s) => (
              <SubjectCard
                key={s.id}
                subject={s}
                onEdit={() => setDrawer({ open: true, editing: s })}
                onDelete={() => setSubjects((prev) => prev.filter((x) => x.id !== s.id))}
                onToggle={() => toggle(s)}
              />
            ))}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
