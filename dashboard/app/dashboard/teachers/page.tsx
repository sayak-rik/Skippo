"use client";

import { Users, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";

type TeacherStatus = "active" | "invited";

interface Teacher {
  id: number | string;
  name: string;
  code: string;
  phone: string;
  email: string;
  status: TeacherStatus;
  join_date: string;
}

function StatCard({ label, value, sub, accent, icon: Icon }: {
  label: string; value: string | number; sub?: string;
  accent: string; icon: React.ElementType;
}) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} style={{
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

const fade   = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

const STATUS_STYLE: Record<TeacherStatus, { color: string; bg: string; border: string }> = {
  active:  { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  invited: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
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

function StatusPill({ status }: { status: TeacherStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600, textTransform: "capitalize",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {status}
    </span>
  );
}

function TeacherRow({ t, onResend }: { t: Teacher; onResend: (id: number | string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div variants={fade} transition={{ duration: 0.25 }} layout>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "var(--surface)", border: "1px solid var(--stroke)",
          borderRadius: "var(--radius-md)", padding: "14px 20px", cursor: "pointer",
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
        {t.code && (
          <span style={{
            fontFamily: "monospace", fontSize: 11, color: "var(--ink-soft)",
            background: "var(--surface-raised)", border: "1px solid var(--stroke)",
            borderRadius: 6, padding: "2px 8px",
          }}>
            {t.code}
          </span>
        )}
        <div style={{ textAlign: "right", minWidth: 90 }}>
          <StatusPill status={t.status} />
          {t.phone && <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>{t.phone}</div>}
        </div>
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
              padding: "16px 20px", display: "flex", gap: 24, alignItems: "flex-start",
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Contact</p>
                {t.phone && <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 2 }}>📱 {t.phone}</p>}
                {t.email && <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>✉️ {t.email}</p>}
                {t.join_date && (
                  <p style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 6 }}>
                    Joined {new Date(t.join_date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {t.status === "invited" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onResend(t.id); }}
                    style={{
                      background: "var(--warning-soft)", color: "var(--warning)",
                      border: "1px solid var(--warning-border)", borderRadius: 8,
                      padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Resend invite
                  </button>
                )}
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
      const data = await apiFetch<{ signup_url: string; email: string }>("/api/auth/admin/teachers/invite", {
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
  const [filter, setFilter] = useState<"all" | TeacherStatus>("all");
  const [showInvite, setShowInvite] = useState(false);

  function load() {
    setLoading(true);
    apiFetch<{ results: Teacher[] }>("/api/auth/admin/teachers")
      .then((d) => setTeachers(d.results))
      .catch(() => setTeachers([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const active  = teachers.filter((t) => t.status === "active").length;
  const invited = teachers.filter((t) => t.status === "invited").length;

  const filtered = teachers
    .filter((t) => filter === "all" || t.status === filter)
    .filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()));

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
              School Management
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
          <StatCard label="Total Teachers"  value={loading ? "—" : teachers.length} sub={loading ? undefined : `${active} active`} accent="#2563eb" icon={Users} />
          <StatCard label="Active"          value={loading ? "—" : active}                                                          accent="#16a34a" icon={CheckCircle2} />
          <StatCard label="Invites Pending" value={loading ? "—" : invited}          sub={invited > 0 ? "Action needed" : undefined} accent={invited > 0 ? "#f59e0b" : "#94a3b8"} icon={Clock} />
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
          {(["all", "active", "invited"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "10px 16px", borderRadius: 10,
                border: `1px solid ${filter === f ? "var(--primary)" : "var(--stroke)"}`,
                background: filter === f ? "var(--primary-soft)" : "var(--surface)",
                color: filter === f ? "var(--primary)" : "var(--ink-soft)",
                fontSize: 13, fontWeight: filter === f ? 700 : 400, cursor: "pointer", textTransform: "capitalize",
              }}
            >
              {f}
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
                  key={String(t.id)}
                  t={t}
                  onResend={(id) => alert(`Invite resent for teacher #${id}`)}
                />
              ))
            )}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
