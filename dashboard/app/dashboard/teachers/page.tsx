"use client";

import { Users, CalendarOff, Building2, UserCheck, Sparkles, X, ChevronDown, Check, AlertCircle, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";
import { useIsMobile } from "../../../lib/useIsMobile";
import { formatNum } from "../../../lib/format";

type LeaveStatus = "active" | "on_leave";

interface Classroom {
  id: number;
  name: string;
  section: string;
  teacher_id: number | null;
}

interface SubstituteSuggestion {
  teacher_id: number;
  teacher_name: string;
  subjects: string[];
  reason: string;
}

interface SubstituteResult {
  suggestion: SubstituteSuggestion;
  available_count: number;
  all_available: Array<{ id: number; name: string; subjects: string[] }>;
}

interface ActiveLeave {
  id: number;
  start_date: string;
  end_date: string;
  leave_type: string;
  status: string;
}

interface Teacher {
  id: number;
  name: string;
  employee_code: string;
  email: string;
  classroom_id: number | null;
  classroom_name: string | null;
  leave_status: LeaveStatus;
  active_leave: ActiveLeave | null;
}

interface LeaveItem {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  admin_note?: string;
}

const fade   = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

const STATUS_STYLE: Record<LeaveStatus, { color: string; bg: string; border: string; label: string }> = {
  active:   { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Active" },
  on_leave: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "On Leave" },
};

const LEAVE_STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  pending:  { color: "#d97706", bg: "#fffbeb" },
  approved: { color: "#16a34a", bg: "#f0fdf4" },
  rejected: { color: "#dc2626", bg: "#fef2f2" },
};

function initials(n: string) {
  return n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const cols = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#7c3aed"];
  const c = cols[name.charCodeAt(0) % cols.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: c + "18", border: `1.5px solid ${c}33`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontWeight: 700, fontSize: size * 0.33, color: c,
    }}>
      {initials(name)}
    </div>
  );
}

function StatusPill({ status }: { status: LeaveStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function StatCard({ label, value, sub, accent, icon: Icon }: {
  label: string; value: string | number; sub?: string;
  accent: string; icon: React.ElementType;
}) {
  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderTop: `3px solid ${accent}`, borderRadius: 16,
      padding: "18px 20px", boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, background: `${accent}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={accent} />
        </div>
        {sub && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-dim)", background: "var(--surface-raised)", padding: "2px 8px", borderRadius: 20 }}>
            {sub}
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>{typeof value === "number" ? formatNum(value) : value}</p>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink-soft)", fontWeight: 500 }}>{label}</p>
    </motion.div>
  );
}

function TeacherRow({ t, classrooms, onResend, onSubstitute, isMobile }: {
  t: Teacher;
  classrooms: Classroom[];
  onResend: (id: number) => void;
  onSubstitute: (teacher: Teacher) => void;
  isMobile: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [leavesLoaded, setLeavesLoaded] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [assignClassName, setAssignClassName] = useState("");
  const [assignClassId, setAssignClassId] = useState<number | "">("");
  const [assigning, setAssigning] = useState(false);
  const [assignDone, setAssignDone] = useState(false);

  const classNames = Array.from(new Set(classrooms.map(c => c.name)));
  const sectionsForName = classrooms.filter(c => c.name === assignClassName)
    .sort((a, b) => (a.section || "").localeCompare(b.section || ""));

  async function assignClassroom() {
    if (!assignClassId) return;
    setAssigning(true);
    try {
      await apiFetch(`/api/academics/admin/classrooms/${assignClassId}/`, {
        method: "PATCH",
        body: JSON.stringify({ teacher_id: t.id }),
      });
      setAssignDone(true);
      setTimeout(() => setAssignDone(false), 2500);
    } finally {
      setAssigning(false);
    }
  }

  async function loadLeaves() {
    if (leavesLoaded) return;
    try {
      const data = await apiFetch<LeaveItem[]>(`/api/auth/admin/teachers/${t.id}/leaves`);
      setLeaves(data);
      setLeavesLoaded(true);
    } catch {
      setLeavesLoaded(true);
    }
  }

  async function approveLeave(leaveId: number, action: "approved" | "rejected") {
    setApprovingId(leaveId);
    try {
      const updated = await apiFetch<LeaveItem>(`/api/auth/admin/teachers/${t.id}/leaves/${leaveId}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: action }),
      });
      setLeaves((prev) => prev.map((l) => l.id === leaveId ? updated : l));
    } finally {
      setApprovingId(null);
    }
  }

  function handleExpand() {
    setOpen((v) => !v);
    if (!open) loadLeaves();
  }

  return (
    <motion.div variants={fade} transition={{ duration: 0.25 }} layout>
      <div
        onClick={handleExpand}
        style={{
          background: "var(--surface)", border: "1px solid var(--stroke)",
          borderRadius: open ? "var(--radius-md) var(--radius-md) 0 0" : "var(--radius-md)",
          padding: "14px 20px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 16,
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: open ? "var(--shadow-md)" : "var(--shadow-sm)",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--stroke-strong)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = open ? "var(--stroke-strong)" : "var(--stroke)"; }}
      >
        <Avatar name={t.name} size={isMobile ? 34 : 40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 2 }}>{t.name}</div>
          {!isMobile && <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{t.email || "—"}</div>}
        </div>
        {!isMobile && t.classroom_name && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ink-soft)", background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 6, padding: "2px 8px" }}>
            <Building2 size={11} />{t.classroom_name}
          </span>
        )}
        {!isMobile && t.employee_code && (
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--ink-soft)", background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 6, padding: "2px 8px" }}>
            {t.employee_code}
          </span>
        )}
        <StatusPill status={t.leave_status} />
        <span style={{ color: "var(--ink-dim)", fontSize: 13, marginLeft: 4 }}>{open ? "▲" : "▼"}</span>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              background: "var(--surface-raised)", border: "1px solid var(--stroke)",
              borderTop: "none", borderRadius: "0 0 var(--radius-md) var(--radius-md)",
              padding: "16px 20px",
            }}>
              {/* Active leave banner */}
              {t.active_leave && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <CalendarOff size={14} color="#dc2626" />
                  <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
                    On {t.active_leave.leave_type} leave until {new Date(t.active_leave.end_date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 24, alignItems: "flex-start" }}>
                {/* Contact + classroom assignment */}
                <div style={{ flex: 1, width: isMobile ? "100%" : undefined }}>
                  <p style={{ fontSize: 10, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, fontWeight: 600 }}>Contact</p>
                  {t.email && <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 2 }}>✉️ {t.email}</p>}
                  {t.classroom_name && <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>🏫 Class Teacher — {t.classroom_name}</p>}

                  {/* Assign classroom */}
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 10, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 600 }}>Assign as Class Teacher</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <select value={assignClassName}
                        onChange={(e) => { setAssignClassName(e.target.value); setAssignClassId(""); }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 7, padding: "7px 10px", fontSize: 12, color: "var(--ink)", outline: "none" }}>
                        <option value="">Select class…</option>
                        {classNames.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      {assignClassName && (
                        <select value={assignClassId}
                          onChange={(e) => setAssignClassId(Number(e.target.value) || "")}
                          onClick={(e) => e.stopPropagation()}
                          style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 7, padding: "7px 10px", fontSize: 12, color: "var(--ink)", outline: "none" }}>
                          <option value="">Select section…</option>
                          {sectionsForName.map(c => (
                            <option key={c.id} value={c.id}>{c.section || "(no section)"}</option>
                          ))}
                        </select>
                      )}
                      {assignClassId && (
                        <button
                          onClick={(e) => { e.stopPropagation(); assignClassroom(); }}
                          disabled={assigning}
                          style={{ padding: "6px 12px", borderRadius: 7, border: "none", background: assignDone ? "#16a34a" : "var(--primary)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, width: "fit-content" }}>
                          {assignDone ? <><Check size={11} /> Assigned!</> : assigning ? "Saving…" : "Assign Classroom"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Find Substitute button */}
                  {t.leave_status === "on_leave" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSubstitute(t); }}
                      style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 7, background: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#7c3aed", cursor: "pointer" }}>
                      <Sparkles size={13} /> Find AI Substitute
                    </button>
                  )}
                </div>

                {/* Leave history */}
                <div style={{ flex: 2, minWidth: 0 }}>
                  <p style={{ fontSize: 10, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 600 }}>Leave History</p>
                  {!leavesLoaded ? (
                    <p style={{ fontSize: 12, color: "var(--ink-dim)" }}>Loading…</p>
                  ) : leaves.length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--ink-dim)" }}>No leave records.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {leaves.map((lv) => (
                        <div key={lv.id} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          background: "var(--surface)", border: "1px solid var(--stroke)",
                          borderRadius: 8, padding: "8px 12px",
                        }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", textTransform: "capitalize" }}>
                              {lv.leave_type}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--ink-soft)", marginLeft: 8 }}>
                              {new Date(lv.start_date).toLocaleDateString("en-IN", { dateStyle: "short" })} – {new Date(lv.end_date).toLocaleDateString("en-IN", { dateStyle: "short" })}
                            </span>
                            {lv.reason && <p style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2, marginBottom: 0 }}>{lv.reason}</p>}
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                            background: LEAVE_STATUS_STYLE[lv.status]?.bg ?? "#f1f5f9",
                            color: LEAVE_STATUS_STYLE[lv.status]?.color ?? "#64748b",
                            textTransform: "capitalize",
                          }}>
                            {lv.status}
                          </span>
                          {lv.status === "pending" && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                disabled={approvingId === lv.id}
                                onClick={(e) => { e.stopPropagation(); approveLeave(lv.id, "approved"); }}
                                style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#16a34a", cursor: "pointer" }}
                              >Approve</button>
                              <button
                                disabled={approvingId === lv.id}
                                onClick={(e) => { e.stopPropagation(); approveLeave(lv.id, "rejected"); }}
                                style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}
                              >Reject</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AutoSubstitutePanel({ teacher, classrooms, onClose, isMobile }: {
  teacher: Teacher;
  classrooms: Classroom[];
  onClose: () => void;
  isMobile?: boolean;
}) {
  const [selectedClassName, setSelectedClassName] = useState("");
  const [classroomId, setClassroomId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubstituteResult | null>(null);
  const [error, setError] = useState("");

  const classNames = Array.from(new Set(classrooms.map(c => c.name)));
  const sectionsForName = classrooms.filter(c => c.name === selectedClassName)
    .sort((a, b) => (a.section || "").localeCompare(b.section || ""));

  async function findSubstitute() {
    if (!classroomId) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await apiFetch<SubstituteResult>("/api/academics/admin/substitute/suggest/", {
        method: "POST",
        body: JSON.stringify({ classroom_id: classroomId, absent_teacher_id: teacher.id }),
      });
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to get suggestion. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--surface-raised)", border: "1px solid var(--stroke)",
    borderRadius: 9, padding: "9px 12px", fontSize: 13, color: "var(--ink)",
    outline: "none", width: "100%", boxSizing: "border-box" as const,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: isMobile ? "100%" : 480 }} animate={{ x: 0 }} exit={{ x: isMobile ? "100%" : 480 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: isMobile ? "100%" : 460, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}
      >
        {/* Header */}
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--stroke)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={15} color="#7c3aed" />
              </div>
              <p style={{ fontSize: 11, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.13em", fontWeight: 600 }}>AI Substitute Finder</p>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>Find Best Substitute</h2>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>
              {teacher.name} is on leave — find a suitable replacement
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)", padding: 6, borderRadius: 8 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {/* Absent teacher info */}
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
            <CalendarOff size={14} color="#dc2626" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>{teacher.name}</p>
              {teacher.active_leave && (
                <p style={{ fontSize: 11, color: "#dc2626" }}>
                  {teacher.active_leave.leave_type} · until {new Date(teacher.active_leave.end_date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </p>
              )}
            </div>
          </div>

          {/* Classroom selection */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 8 }}>Select vacant classroom *</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <select value={selectedClassName}
                onChange={(e) => { setSelectedClassName(e.target.value); setClassroomId(""); setResult(null); }}
                style={inputStyle}>
                <option value="">Select class name…</option>
                {classNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              {selectedClassName && (
                <select value={classroomId}
                  onChange={(e) => { setClassroomId(Number(e.target.value) || ""); setResult(null); }}
                  style={inputStyle}>
                  <option value="">Select section���</option>
                  {sectionsForName.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.section || "(no section)"}{c.teacher_id === teacher.id ? " — this teacher's class" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <button
            onClick={findSubstitute}
            disabled={!classroomId || loading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "#fff",
              border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14,
              cursor: !classroomId || loading ? "default" : "pointer",
              opacity: !classroomId || loading ? 0.6 : 1, marginBottom: 20,
            }}>
            <Sparkles size={15} />
            {loading ? "Asking AI…" : "Find Best Substitute"}
          </button>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
              <AlertCircle size={14} color="#dc2626" />
              <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {/* AI Suggestion */}
              <div style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "1px solid #c4b5fd", borderRadius: 12, padding: "18px 20px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <Sparkles size={13} color="#7c3aed" />
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.1em" }}>AI Recommendation</p>
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#4c1d95", marginBottom: 6 }}>
                  {result.suggestion.teacher_name}
                </p>
                {result.suggestion.subjects.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                    {result.suggestion.subjects.map(s => (
                      <span key={s} style={{ fontSize: 10, fontWeight: 600, background: "#7c3aed22", color: "#7c3aed", borderRadius: 6, padding: "2px 7px", border: "1px solid #c4b5fd" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 13, color: "#5b21b6", lineHeight: 1.6, fontStyle: "italic" }}>
                  "{result.suggestion.reason}"
                </p>
              </div>

              {/* All available teachers */}
              {result.all_available.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                    All Available ({result.available_count})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {result.all_available.map(at => (
                      <div key={at.id} style={{
                        background: at.id === result.suggestion.teacher_id ? "#f5f3ff" : "var(--surface-raised)",
                        border: `1px solid ${at.id === result.suggestion.teacher_id ? "#c4b5fd" : "var(--stroke)"}`,
                        borderRadius: 9, padding: "10px 14px",
                        display: "flex", alignItems: "center", gap: 10,
                      }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{at.name}</p>
                          {at.subjects.length > 0 && (
                            <p style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>
                              {at.subjects.slice(0, 3).join(", ")}{at.subjects.length > 3 ? "…" : ""}
                            </p>
                          )}
                        </div>
                        {at.id === result.suggestion.teacher_id && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", background: "#ede9fe", borderRadius: 6, padding: "2px 7px" }}>
                            Recommended
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div style={{ padding: "16px 28px", borderTop: "1px solid var(--stroke)" }}>
          <button onClick={onClose} style={{ width: "100%", padding: "11px", borderRadius: 10, border: "1px solid var(--stroke)", background: "var(--surface-raised)", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "var(--ink-soft)" }}>
            Close
          </button>
        </div>
      </motion.aside>
    </motion.div>
  );
}

const COUNTRY_CODES = [
  { code: "+91",  flag: "🇮🇳", name: "India" },
  { code: "+1",   flag: "🇺🇸", name: "USA / Canada" },
  { code: "+44",  flag: "🇬🇧", name: "UK" },
  { code: "+61",  flag: "🇦🇺", name: "Australia" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+65",  flag: "🇸🇬", name: "Singapore" },
  { code: "+60",  flag: "🇲🇾", name: "Malaysia" },
  { code: "+94",  flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+92",  flag: "🇵🇰", name: "Pakistan" },
  { code: "+49",  flag: "🇩🇪", name: "Germany" },
  { code: "+33",  flag: "🇫🇷", name: "France" },
  { code: "+81",  flag: "🇯🇵", name: "Japan" },
  { code: "+86",  flag: "🇨🇳", name: "China" },
  { code: "+55",  flag: "🇧🇷", name: "Brazil" },
  { code: "+27",  flag: "🇿🇦", name: "South Africa" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
];

function InvitePanel({ onClose, onSuccess, isMobile }: { onClose: () => void; onSuccess: () => void; isMobile?: boolean }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [dialCode, setDialCode] = useState("+91");
  const [step, setStep] = useState<"form" | "sent">("form");
  const [signupUrl, setSignupUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fullPhone = form.phone ? `${dialCode}${form.phone.replace(/^0+/, "")}` : "";

  async function send() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ signup_url: string; email: string }>("/api/auth/admin/teachers/invite/", {
        method: "POST",
        body: JSON.stringify({ email: form.email, phone: fullPhone, name: form.name }),
      });
      setSignupUrl(data.signup_url);
      setStep("sent");
      onSuccess();
    } catch (err: any) {
      setError(err.message ?? "Failed to send invite.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
    borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
    boxSizing: "border-box",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: isMobile ? "100%" : 420 }}
        animate={{ x: 0 }}
        exit={{ x: isMobile ? "100%" : 420 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isMobile ? "100%" : 440, background: "var(--surface)", borderLeft: "1px solid var(--stroke)",
          padding: isMobile ? 20 : 32, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>New Teacher</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>Send Invite</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ink-dim)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        {step === "sent" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, background: "var(--success-soft)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✅</div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: "var(--success)", marginBottom: 8 }}>Invite sent!</p>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.7 }}>
                Invitation created for <strong style={{ color: "var(--ink)" }}>{form.email}</strong>.
              </p>
            </div>
            <div style={{ background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 10, padding: 14, width: "100%" }}>
              <p style={{ fontSize: 10, color: "var(--ink-dim)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Signup link</p>
              <p style={{ fontFamily: "monospace", fontSize: 11, color: "var(--primary)", wordBreak: "break-all" }}>{signupUrl}</p>
            </div>
            <button onClick={onClose} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" }}>Done</button>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)" }}>
                {error}
              </div>
            )}

            {/* Full name */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Full name</label>
              <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Mr. Rajesh Kumar" style={inputStyle} />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Email address *</label>
              <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="teacher@school.edu" style={inputStyle} />
            </div>

            {/* Phone with country code */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Phone number</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={dialCode}
                  onChange={(e) => setDialCode(e.target.value)}
                  style={{
                    background: "var(--surface-raised)", border: "1px solid var(--stroke)",
                    borderRadius: 10, padding: "10px 8px", fontSize: 13, color: "var(--ink)",
                    outline: "none", cursor: "pointer", flexShrink: 0, width: 110,
                  }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="9XXXXXXXXX"
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              {form.phone && (
                <p style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 5 }}>
                  Will be sent as: <span style={{ fontFamily: "monospace", color: "var(--ink-soft)" }}>{fullPhone}</span>
                </p>
              )}
            </div>

            <div style={{ background: "var(--primary-soft)", border: "1px solid var(--stroke)", borderRadius: 10, padding: 12 }}>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.7 }}>
                The teacher will receive a unique signup link. They set their own PIN on first login via the Skippo Teacher app.
              </p>
            </div>
            <button
              onClick={send}
              disabled={!form.email || loading}
              style={{
                background: "var(--primary)", color: "#fff", border: "none",
                borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15,
                cursor: "pointer", opacity: !form.email || loading ? 0.5 : 1,
                transition: "opacity 0.2s", marginTop: "auto",
              }}
            >
              {loading ? "Sending…" : "Send invite"}
            </button>
          </>
        )}
      </motion.aside>
    </motion.div>
  );
}

export default function TeachersPage() {
  const isMobile = useIsMobile();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | LeaveStatus>("all");
  const [showInvite, setShowInvite] = useState(false);
  const [substituteFor, setSubstituteFor] = useState<Teacher | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      apiFetch<Teacher[]>("/api/auth/admin/teachers/"),
      apiFetch<{ results: Classroom[] }>("/api/academics/admin/classrooms/"),
    ]).then(([t, c]) => {
      setTeachers(Array.isArray(t) ? t : []);
      const clsArr = Array.isArray(c) ? c : (c?.results ?? []);
      setClassrooms(clsArr);
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const active   = teachers.filter((t) => t.leave_status === "active").length;
  const onLeave  = teachers.filter((t) => t.leave_status === "on_leave").length;

  const filtered = teachers
    .filter((t) => filter === "all" || t.leave_status === filter)
    .filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase()) || (t.email ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardShell>
      <AnimatePresence>
        {showInvite && (
          <InvitePanel onClose={() => setShowInvite(false)} onSuccess={load} isMobile={isMobile} />
        )}
        {substituteFor && (
          <AutoSubstitutePanel teacher={substituteFor} classrooms={classrooms} onClose={() => setSubstituteFor(null)} isMobile={isMobile} />
        )}
      </AnimatePresence>

      <div style={{ padding: isMobile ? "16px 14px 40px" : "24px 28px 48px" }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>Academics</p>
            <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Teachers</h1>
          </div>
          <button onClick={() => setShowInvite(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: isMobile ? "10px 12px" : "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", flexShrink: 0 }}>
            <UserPlus size={15} />
            {!isMobile && "Invite Teacher"}
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: isMobile ? 10 : 14, marginBottom: 28 }}>
          <StatCard label="Total Teachers" value={loading ? "—" : teachers.length} sub={loading ? undefined : `${formatNum(active)} active`} accent="#2563eb" icon={Users} />
          <StatCard label="Active"         value={loading ? "—" : active}                                                                      accent="#16a34a" icon={UserCheck} />
          <StatCard label="On Leave"       value={loading ? "—" : onLeave} sub={onLeave > 0 ? "Today" : undefined}                             accent={onLeave > 0 ? "#dc2626" : "#94a3b8"} icon={CalendarOff} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: isMobile ? "100%" : 0, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-dim)", fontSize: 14 }}>🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
              style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 10, padding: "10px 14px 10px 36px", fontSize: 13, color: "var(--ink)", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {([
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "on_leave", label: isMobile ? "Leave" : "On Leave" },
            ] as const).map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: isMobile ? "8px 10px" : "10px 16px", borderRadius: 10, border: `1px solid ${filter === f.key ? "var(--primary)" : "var(--stroke)"}`, background: filter === f.key ? "var(--primary-soft)" : "var(--surface)", color: filter === f.key ? "var(--primary)" : "var(--ink-soft)", fontSize: 13, fontWeight: filter === f.key ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap" }}>
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>
            <p style={{ fontSize: 14 }}>Loading teachers…</p>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>👩‍🏫</p>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  {teachers.length === 0 ? "No teachers yet" : "No teachers match your search"}
                </p>
                {teachers.length === 0 && (
                  <p style={{ fontSize: 13 }}>Invite your first teacher to get started.</p>
                )}
              </div>
            ) : (
              filtered.map((t) => (
                <TeacherRow
                  key={t.id}
                  t={t}
                  classrooms={classrooms}
                  onResend={(id) => console.log("Resend for", id)}
                  onSubstitute={(teacher) => setSubstituteFor(teacher)}
                  isMobile={isMobile}
                />
              ))
            )}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
