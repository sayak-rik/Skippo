"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  School, Plus, X, Trash2, Edit2, Users, GraduationCap,
  Check, AlertCircle, Layers,
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

const SECTIONS = ["A", "B", "C", "D", "E", "F"];

const BULK_CLASSES = [
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fade    = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
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

function ClassroomDrawer({ editing, teachers, classrooms, onSaved, onClose, isMobile }: {
  editing: Classroom | null;
  teachers: Teacher[];
  classrooms: Classroom[];
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

  const resolvedName    = name === "__custom__" ? customName : name;
  const resolvedSection = section === "__custom__" ? customSection : section;

  // Sections already used for this class name (excluding the classroom being edited)
  const usedSections = classrooms
    .filter(c => c.name === resolvedName && c.id !== editing?.id)
    .map(c => c.section)
    .filter(Boolean) as string[];
  const availableSections = SECTIONS.filter(s => !usedSections.includes(s));

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

          {/* Class name */}
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

          {/* Section — filtered to only available ones */}
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
                {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
                {usedSections.length > 0 && (
                  <option value="__custom__">Custom…</option>
                )}
                {!usedSections.length && (
                  <option value="__custom__">Custom…</option>
                )}
              </select>
              {usedSections.length > 0 && (
                <p style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 5 }}>
                  Already created: {usedSections.join(", ")}
                </p>
              )}
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

// ── Bulk Create Modal ─────────────────────────────────────────────────────────

function BulkCreateModal({ classrooms, onDone, onClose }: {
  classrooms: Classroom[];
  onDone: () => void;
  onClose: () => void;
}) {
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set(BULK_CLASSES));
  const [numSections, setNumSections] = useState(6);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const sectionsToUse = SECTIONS.slice(0, numSections);
  const existingSet   = new Set(classrooms.map(c => `${c.name}::${c.section}`));

  const toCreate = BULK_CLASSES.flatMap(cls => {
    if (!selectedClasses.has(cls)) return [];
    return sectionsToUse
      .filter(sec => !existingSet.has(`${cls}::${sec}`))
      .map(sec => ({ name: cls, section: sec }));
  });

  function toggleClass(cls: string) {
    setSelectedClasses(prev => {
      const next = new Set(prev);
      if (next.has(cls)) next.delete(cls); else next.add(cls);
      return next;
    });
  }

  function toggleAll() {
    if (selectedClasses.size === BULK_CLASSES.length) {
      setSelectedClasses(new Set());
    } else {
      setSelectedClasses(new Set(BULK_CLASSES));
    }
  }

  async function createAll() {
    if (toCreate.length === 0) return;
    setCreating(true);
    setError("");
    setProgress({ done: 0, total: toCreate.length });
    let failed = 0;
    for (let i = 0; i < toCreate.length; i++) {
      try {
        await apiFetch("/api/academics/admin/classrooms/", {
          method: "POST",
          body: JSON.stringify({ name: toCreate[i].name, section: toCreate[i].section, teacher_id: null }),
        });
      } catch {
        failed++;
      }
      setProgress({ done: i + 1, total: toCreate.length });
    }
    setCreating(false);
    if (failed > 0) {
      setError(`${failed} classroom${failed !== 1 ? "s" : ""} failed to create.`);
    }
    setDone(true);
    onDone();
  }

  const skippedCount = BULK_CLASSES.flatMap(cls =>
    !selectedClasses.has(cls) ? [] :
      sectionsToUse.filter(sec => existingSet.has(`${cls}::${sec}`))
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}
      >
        {/* Header */}
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--stroke)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Layers size={15} color="#2563eb" />
              </div>
              <p style={{ fontSize: 11, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.13em", fontWeight: 600 }}>Batch Setup</p>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>Bulk Create Classrooms</h2>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>Create multiple sections across classes at once. Already-existing sections are skipped.</p>
          </div>
          <button onClick={onClose} disabled={creating} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)", padding: 6, borderRadius: 8 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

          {/* Sections count */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 10 }}>Number of sections per class</p>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <button key={n} onClick={() => setNumSections(n)}
                  style={{
                    width: 44, height: 44, borderRadius: 10,
                    border: `1.5px solid ${numSections === n ? "#2563eb" : "var(--stroke)"}`,
                    background: numSections === n ? "#eff6ff" : "var(--surface-raised)",
                    color: numSections === n ? "#2563eb" : "var(--ink-soft)",
                    fontWeight: numSections === n ? 700 : 400, fontSize: 14,
                    cursor: "pointer", flexShrink: 0,
                  }}>
                  {n}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 8 }}>
              Sections: {sectionsToUse.join(", ")}
            </p>
          </div>

          {/* Class selection */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)" }}>Select classes</p>
              <button onClick={toggleAll}
                style={{ fontSize: 11, fontWeight: 600, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
                {selectedClasses.size === BULK_CLASSES.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {BULK_CLASSES.map(cls => {
                const selected = selectedClasses.has(cls);
                const color    = colorFor(cls);
                return (
                  <button key={cls} onClick={() => toggleClass(cls)}
                    style={{
                      padding: "8px 6px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${selected ? color + "60" : "var(--stroke)"}`,
                      background: selected ? color + "10" : "var(--surface-raised)",
                      color: selected ? color : "var(--ink-soft)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    }}>
                    {selected && <Check size={11} />}
                    {cls.replace("Class ", "")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview summary */}
          <div style={{ background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                  {toCreate.length} classroom{toCreate.length !== 1 ? "s" : ""} will be created
                </p>
                {skippedCount > 0 && (
                  <p style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 2 }}>
                    {skippedCount} already exist and will be skipped
                  </p>
                )}
              </div>
              {toCreate.length === 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "3px 10px" }}>
                  All exist
                </span>
              )}
            </div>
          </div>

          {/* Progress bar while creating */}
          {creating && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)" }}>Creating classrooms…</p>
                <p style={{ fontSize: 12, color: "var(--ink-dim)" }}>{progress.done}/{progress.total}</p>
              </div>
              <div style={{ height: 6, background: "var(--stroke)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: "var(--primary)", borderRadius: 999,
                  width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`,
                  transition: "width 0.2s",
                }} />
              </div>
            </div>
          )}

          {done && !creating && (
            <div style={{ marginTop: 16, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 8, alignItems: "center" }}>
              <Check size={14} color="#16a34a" />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>
                {progress.done - (error ? parseInt(error) : 0)} classrooms created successfully!
              </p>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
              <AlertCircle size={14} color="#dc2626" />
              <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid var(--stroke)", display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={creating}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid var(--stroke)", background: "var(--surface-raised)", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "var(--ink-soft)", opacity: creating ? 0.5 : 1 }}>
            {done ? "Close" : "Cancel"}
          </button>
          {!done && (
            <button
              onClick={createAll}
              disabled={creating || toCreate.length === 0}
              style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: (creating || toCreate.length === 0) ? 0.6 : 1 }}>
              {creating ? `Creating… (${progress.done}/${progress.total})` : `Create ${toCreate.length} Classroom${toCreate.length !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ cls, deleting, onConfirm, onCancel }: {
  cls: Classroom;
  deleting: boolean;
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
          <button onClick={onCancel} disabled={deleting}
            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid var(--stroke)", background: "var(--surface-raised)", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "var(--ink-soft)", opacity: deleting ? 0.5 : 1 }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: deleting ? 0.6 : 1 }}>
            {deleting ? "Deleting…" : "Delete"}
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
  const [deletingCls, setDeletingCls] = useState<Classroom | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [showBulkCreate, setShowBulkCreate] = useState(false);

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
    setDeleteInProgress(true);
    try {
      await apiFetch(`/api/academics/admin/classrooms/${cls.id}/`, { method: "DELETE" });
      // Optimistic remove + backend reload
      setClassrooms(prev => prev.filter(c => c.id !== cls.id));
      setDeletingCls(null);
      load();
    } catch {
      /* keep dialog open */
    } finally {
      setDeleteInProgress(false);
    }
  }

  // Group by class name, preserving CLASS_NAMES order
  const grouped: Record<string, Classroom[]> = {};
  for (const cls of classrooms) {
    if (!grouped[cls.name]) grouped[cls.name] = [];
    grouped[cls.name].push(cls);
  }
  const groupOrder = [
    ...CLASS_NAMES.filter(n => grouped[n]),
    ...Object.keys(grouped).filter(n => !CLASS_NAMES.includes(n)),
  ];

  const totalStudents    = classrooms.reduce((s, c) => s + c.student_count, 0);
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
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={() => setShowBulkCreate(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", color: "var(--ink-soft)", border: "1px solid var(--stroke)", borderRadius: 10, padding: isMobile ? "10px 12px" : "11px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              <Layers size={15} />{!isMobile && "Bulk Create"}
            </button>
            <button onClick={() => setDrawer("add")}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: isMobile ? "10px 12px" : "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              <Plus size={16} />{!isMobile && " Add Classroom"}
            </button>
          </div>
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
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setShowBulkCreate(true)}
                style={{ background: "var(--surface)", color: "var(--ink-soft)", border: "1px solid var(--stroke)", borderRadius: 10, padding: "10px 22px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Layers size={15} /> Bulk Create
              </button>
              <button onClick={() => setDrawer("add")}
                style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Add First Classroom
              </button>
            </div>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {groupOrder.map(groupName => {
              const rooms = grouped[groupName];
              return (
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
                          onDelete={(c) => setDeletingCls(c)}
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
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {deletingCls && (
          <DeleteConfirm
            cls={deletingCls}
            deleting={deleteInProgress}
            onConfirm={() => handleDelete(deletingCls)}
            onCancel={() => setDeletingCls(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkCreate && (
          <BulkCreateModal
            classrooms={classrooms}
            onDone={() => { load(); }}
            onClose={() => setShowBulkCreate(false)}
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
              classrooms={classrooms}
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
