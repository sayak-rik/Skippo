"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  School, Plus, X, Trash2, Edit2, Users, GraduationCap,
  ChevronDown, Check, AlertCircle,
} from "lucide-react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";
import { useIsMobile } from "../../../lib/useIsMobile";
import { formatNum } from "../../../lib/format";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Classroom {
  id: number;
  name: string;
  section: string;
  teacher: string | null;
  teacher_id: number | null;
  student_count: number;
}

interface Teacher {
  id: number;
  name: string;
  employee_code?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CLASS_NAMES = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11", "Class 12",
];

const SECTIONS = ["A", "B", "C", "D", "E"];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fade   = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

const CLASS_COLORS: Record<string, string> = {
  "Nursery": "#ec4899", "LKG": "#f97316", "UKG": "#eab308",
  "Class 1": "#2563eb", "Class 2": "#2563eb",
  "Class 3": "#7c3aed", "Class 4": "#7c3aed",
  "Class 5": "#0891b2", "Class 6": "#0891b2",
  "Class 7": "#16a34a", "Class 8": "#16a34a",
  "Class 9": "#d97706", "Class 10": "#d97706",
  "Class 11": "#dc2626", "Class 12": "#dc2626",
};

function colorFor(name: string) {
  return CLASS_COLORS[name] ?? "#64748b";
}

const inputStyle: React.CSSProperties = {
  background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 9, padding: "9px 12px", fontSize: 14, color: "var(--ink)",
  outline: "none", width: "100%", boxSizing: "border-box",
};

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderTop: `3px solid ${accent}`, borderRadius: 14, padding: "16px 18px",
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <Icon size={17} color={accent} />
      </div>
      <p style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>{typeof value === "number" ? formatNum(value) : value}</p>
      <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>{sub}</p>}
    </motion.div>
  );
}

// ── Classroom Card ────────────────────────────────────────────────────────────

function ClassroomCard({ cls, onEdit, onDelete }: {
  cls: Classroom;
  onEdit: (c: Classroom) => void;
  onDelete: (c: Classroom) => void;
}) {
  const color = colorFor(cls.name);
  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ height: 4, background: color }} />
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              {cls.name}{cls.section ? ` — ${cls.section}` : ""}
            </p>
            <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 3 }}>
              {cls.teacher ?? <span style={{ color: "var(--ink-dim)", fontStyle: "italic" }}>No class teacher</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onEdit(cls)} style={{ background: "none", border: "none", cursor: "pointer", padding: 5, color: "var(--ink-dim)", borderRadius: 7 }}>
              <Edit2 size={14} />
            </button>
            <button onClick={() => onDelete(cls)} style={{ background: "none", border: "none", cursor: "pointer", padding: 5, color: "#dc2626", borderRadius: 7 }}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={13} color={color} />
          </div>
          <p style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
            {formatNum(cls.student_count)} <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>student{cls.student_count !== 1 ? "s" : ""}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Classroom Drawer ──────────────────────────────────────────────────────────

function ClassroomDrawer({ editing, teachers, onSaved, onClose, isMobile }: {
  editing: Classroom | null;
  teachers: Teacher[];
  onSaved: () => void;
  onClose: () => void;
  isMobile?: boolean;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [section, setSection] = useState(editing?.section ?? "");
  const [teacherId, setTeacherId] = useState<string>(editing?.teacher_id ? String(editing.teacher_id) : "");
  const [customName, setCustomName] = useState(!CLASS_NAMES.includes(editing?.name ?? "") ? editing?.name ?? "" : "");
  const [customSection, setCustomSection] = useState(!SECTIONS.includes(editing?.section ?? "") ? editing?.section ?? "" : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resolvedName = name === "__custom__" ? customName : name;
  const resolvedSection = section === "__custom__" ? customSection : section;

  async function save() {
    if (!resolvedName.trim()) { setError("Class name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const body = {
        name: resolvedName.trim(),
        section: resolvedSection.trim(),
        teacher_id: teacherId ? Number(teacherId) : null,
      };
      if (editing) {
        await apiFetch(`/api/academics/admin/classrooms/${editing.id}/`, {
          method: "PATCH", body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/academics/admin/classrooms/", {
          method: "POST", body: JSON.stringify(body),
        });
      }
      onSaved();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const color = colorFor(resolvedName || "");

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: isMobile ? "100%" : 440,
        background: "var(--surface)", borderLeft: isMobile ? "none" : "1px solid var(--stroke)",
        zIndex: 300, display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 24px 18px", borderBottom: "1px solid var(--stroke)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.13em", fontWeight: 600, marginBottom: 4 }}>Academics</p>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
            {editing ? "Edit Classroom" : "Add Classroom"}
          </h2>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)", padding: 6, borderRadius: 8 }}>
          <X size={20} />
        </button>
      </div>

      {/* Preview badge */}
      {resolvedName && (
        <div style={{ padding: "16px 24px 0" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: color + "12", border: `1px solid ${color}40`, borderRadius: 10, padding: "8px 14px" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
            <span style={{ fontSize: 14, fontWeight: 700, color }}>
              {resolvedName}{resolvedSection ? ` — ${resolvedSection}` : ""}
            </span>
          </div>
        </div>
      )}

      {/* Form */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Class name — cascading first level */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>Class Name *</label>
            <select
              value={CLASS_NAMES.includes(name) ? name : name ? "__custom__" : ""}
              onChange={(e) => {
                if (e.target.value === "__custom__") { setName("__custom__"); setSection(""); }
                else { setName(e.target.value); setSection(""); }
              }}
              style={inputStyle}
            >
              <option value="">— Select class —</option>
              {CLASS_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
              <option value="__custom__">Custom…</option>
            </select>
            {name === "__custom__" && (
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Pre-Primary"
                style={{ ...inputStyle, marginTop: 8 }}
              />
            )}
          </div>

          {/* Section — cascading second level, shown only after name is picked */}
          {(name || customName) && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>Section</label>
              <select
                value={SECTIONS.includes(section) ? section : section ? "__custom__" : section}
                onChange={(e) => {
                  if (e.target.value === "__custom__") setSection("__custom__");
                  else setSection(e.target.value);
                }}
                style={inputStyle}
              >
                <option value="">— Select section —</option>
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="__custom__">Custom…</option>
              </select>
              {section === "__custom__" && (
                <input
                  value={customSection}
                  onChange={(e) => setCustomSection(e.target.value)}
                  placeholder="e.g. Honors"
                  style={{ ...inputStyle, marginTop: 8 }}
                />
              )}
            </div>
          )}

          {/* Class teacher */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>Class Teacher (optional)</label>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} style={inputStyle}>
              <option value="">— No class teacher —</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}{t.employee_code ? ` (${t.employee_code})` : ""}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
              <AlertCircle size={14} color="#dc2626" />
              <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--stroke)", display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid var(--stroke)", background: "var(--surface-raised)", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "var(--ink-soft)" }}>
          Cancel
        </button>
        <button onClick={save} disabled={saving || !resolvedName.trim()} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: (saving || !resolvedName.trim()) ? 0.6 : 1 }}>
          {saving ? "Saving…" : editing ? "Save Changes" : "Add Classroom"}
        </button>
      </div>
    </motion.div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ cls, onConfirm, onCancel }: {
  cls: Classroom;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface)", borderRadius: 16, padding: "28px 32px", width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
      >
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <Trash2 size={22} color="#dc2626" />
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Delete {cls.name}{cls.section ? ` — ${cls.section}` : ""}?</h3>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 24 }}>
          This will permanently delete the classroom. {cls.student_count > 0 ? `${cls.student_count} student${cls.student_count !== 1 ? "s" : ""} will become unassigned.` : "No students are currently assigned."}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid var(--stroke)", background: "var(--surface-raised)", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "var(--ink-soft)" }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClassroomsPage() {
  const isMobile = useIsMobile();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers]     = useState<Teacher[]>([]);
  const [loading, setLoading]       = useState(true);
  const [drawer, setDrawer]         = useState<"add" | Classroom | null>(null);
  const [deleting, setDeleting]     = useState<Classroom | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [clsData, tData] = await Promise.all([
        apiFetch<{ results: Classroom[] }>("/api/academics/admin/classrooms/"),
        apiFetch<Teacher[]>("/api/auth/admin/teachers/"),
      ]);
      setClassrooms(Array.isArray(clsData) ? clsData : (clsData?.results ?? []));
      setTeachers(Array.isArray(tData) ? tData : []);
    } catch {
      /* keep empty state */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(cls: Classroom) {
    try {
      await apiFetch(`/api/academics/admin/classrooms/${cls.id}/`, { method: "DELETE" });
      setDeleting(null);
      load();
    } catch { /* ignore */ }
  }

  // Group by class name
  const grouped = classrooms.reduce<Record<string, Classroom[]>>((acc, c) => {
    const key = c.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const totalStudents   = classrooms.reduce((s, c) => s + c.student_count, 0);
  const assignedTeachers = classrooms.filter(c => c.teacher_id).length;

  return (
    <DashboardShell>
      <div style={{ padding: isMobile ? "16px 14px 40px" : "24px 28px 48px", maxWidth: 1100 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>Academics</p>
            <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Classrooms</h1>
            {!isMobile && <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6 }}>Manage classrooms, sections, and class teachers</p>}
          </div>
          <button onClick={() => setDrawer("add")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: isMobile ? "10px 12px" : "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>
            <Plus size={16} />{!isMobile && " Add Classroom"}
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: isMobile ? 10 : 14, marginBottom: 28 }}>
          <StatCard label="Classrooms"     value={loading ? "—" : classrooms.length}  icon={School}        accent="#2563eb" />
          <StatCard label="Total Students" value={loading ? "—" : totalStudents}       icon={GraduationCap} accent="#7c3aed" sub={loading ? undefined : `${formatNum(classrooms.length)} rooms`} />
          {!isMobile && <StatCard label="Class Teachers" value={loading ? "—" : assignedTeachers} icon={Users} accent="#16a34a" sub={loading ? undefined : `${classrooms.length - assignedTeachers} unassigned`} />}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--ink-dim)" }}>Loading classrooms…</div>
        ) : classrooms.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--surface-raised)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <School size={32} color="var(--ink-dim)" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>No classrooms yet</p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>Add your first classroom to get started with timetables, students, and exams.</p>
            <button onClick={() => setDrawer("add")}
              style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Add First Classroom
            </button>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {Object.entries(grouped).map(([groupName, rooms]) => (
              <div key={groupName}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: colorFor(groupName), flexShrink: 0 }} />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{groupName}</h2>
                  <span style={{ fontSize: 12, color: "var(--ink-dim)", background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 999, padding: "2px 8px" }}>
                    {rooms.length} section{rooms.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <motion.div variants={stagger} initial="hidden" animate="show"
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                  {rooms
                    .sort((a, b) => (a.section || "").localeCompare(b.section || ""))
                    .map(cls => (
                      <ClassroomCard
                        key={cls.id}
                        cls={cls}
                        onEdit={(c) => setDrawer(c)}
                        onDelete={(c) => setDeleting(c)}
                      />
                    ))}
                  <motion.button variants={fade} onClick={() => setDrawer("add")}
                    style={{
                      background: "none", border: "2px dashed var(--stroke)", borderRadius: 14,
                      padding: "24px", cursor: "pointer", display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 8, color: "var(--ink-dim)",
                      minHeight: 100,
                    }}>
                    <Plus size={18} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Add section</span>
                  </motion.button>
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {deleting && (
          <DeleteConfirm
            cls={deleting}
            onConfirm={() => handleDelete(deleting)}
            onCancel={() => setDeleting(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawer !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "#000", zIndex: 299 }}
              onClick={() => setDrawer(null)}
            />
            <ClassroomDrawer
              editing={drawer === "add" ? null : drawer}
              teachers={teachers}
              onSaved={() => { setDrawer(null); load(); }}
              onClose={() => setDrawer(null)}
              isMobile={isMobile}
            />
          </>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
