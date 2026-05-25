"use client";

import { Users, CheckCircle2, Clock, CalendarOff, Building2, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";

type LeaveStatus = "active" | "on_leave";

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
      <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink-soft)", fontWeight: 500 }}>{label}</p>
    </motion.div>
  );
}

function TeacherRow({ t, onResend }: { t: Teacher; onResend: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [leavesLoaded, setLeavesLoaded] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

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
        <Avatar name={t.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 2 }}>{t.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{t.email || "—"}</div>
        </div>
        {t.classroom_name && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, color: "var(--ink-soft)", background: "var(--surface-raised)",
            border: "1px solid var(--stroke)", borderRadius: 6, padding: "2px 8px",
          }}>
            <Building2 size={11} />
            {t.classroom_name}
          </span>
        )}
        {t.employee_code && (
          <span style={{
            fontFamily: "monospace", fontSize: 11, color: "var(--ink-soft)",
            background: "var(--surface-raised)", border: "1px solid var(--stroke)",
            borderRadius: 6, padding: "2px 8px",
          }}>
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

              <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                {/* Contact */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, fontWeight: 600 }}>Contact</p>
                  {t.email && <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 2 }}>✉️ {t.email}</p>}
                  {t.classroom_name && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>🏫 Class Teacher — {t.classroom_name}</p>}
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

function InvitePanel({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [step, setStep] = useState<"form" | "sent">("form");
  const [signupUrl, setSignupUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ signup_url: string; email: string }>("/api/auth/admin/teachers/invite/", {
        method: "POST",
        body: JSON.stringify({ email: form.email, phone: form.phone, name: form.name }),
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440, background: "var(--surface)", borderLeft: "1px solid var(--stroke)",
          padding: 32, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto",
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
            {[
              { label: "Full name", key: "name", ph: "e.g. Mr. Rajesh Kumar", type: "text" },
              { label: "Email address *", key: "email", ph: "teacher@school.edu", type: "email" },
              { label: "Phone number", key: "phone", ph: "+91 9XXXXXXXXX", type: "tel" },
            ].map((f) => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.ph}
                  style={{
                    width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
                    borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
                  }}
                />
              </div>
            ))}
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
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | LeaveStatus>("all");
  const [showInvite, setShowInvite] = useState(false);

  function load() {
    setLoading(true);
    apiFetch<Teacher[]>("/api/auth/admin/teachers/")
      .then((d) => setTeachers(Array.isArray(d) ? d : []))
      .catch(() => setTeachers([]))
      .finally(() => setLoading(false));
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
          <InvitePanel
            onClose={() => setShowInvite(false)}
            onSuccess={load}
          />
        )}
      </AnimatePresence>

      <div style={{ padding: "24px 28px 48px" }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}
        >
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>
              Academics
            </p>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Teachers</h1>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            + Invite Teacher
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}
        >
          <StatCard label="Total Teachers" value={loading ? "—" : teachers.length} sub={loading ? undefined : `${active} active`} accent="#2563eb" icon={Users} />
          <StatCard label="Active"          value={loading ? "—" : active}                                                            accent="#16a34a" icon={UserCheck} />
          <StatCard label="On Leave"        value={loading ? "—" : onLeave}           sub={onLeave > 0 ? "Today" : undefined}        accent={onLeave > 0 ? "#dc2626" : "#94a3b8"} icon={CalendarOff} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-dim)", fontSize: 14 }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 10, padding: "10px 14px 10px 36px", fontSize: 13, color: "var(--ink)", outline: "none" }}
            />
          </div>
          {([
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "on_leave", label: "On Leave" },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "10px 16px", borderRadius: 10,
                border: `1px solid ${filter === f.key ? "var(--primary)" : "var(--stroke)"}`,
                background: filter === f.key ? "var(--primary-soft)" : "var(--surface)",
                color: filter === f.key ? "var(--primary)" : "var(--ink-soft)",
                fontSize: 13, fontWeight: filter === f.key ? 700 : 400, cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
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
                  onResend={(id) => console.log("Resend for", id)}
                />
              ))
            )}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
