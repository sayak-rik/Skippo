"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  UserCog, Plus, X, Pencil, Trash2, CheckCircle2,
  CalendarOff, ChevronDown, ChevronRight, Phone, Mail,
} from "lucide-react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StaffMember {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  employee_code: string;
  status: "active" | "on_leave" | "inactive";
  joined_date: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STAFF_ROLES = [
  "Principal", "Vice Principal", "Librarian", "Lab Assistant",
  "Accountant", "Clerk", "Peon", "Security", "Counselor", "Nurse", "Other",
];

const DEPARTMENTS = [
  "Administration", "Finance", "Library", "Laboratory",
  "Security", "Maintenance", "Health", "Other",
];

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active:   { label: "Active",   color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  on_leave: { label: "On Leave", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  inactive: { label: "Inactive", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
};

// ── Staff Drawer ──────────────────────────────────────────────────────────────

function StaffDrawer({ member, onClose, onSaved }: {
  member: StaffMember | null;
  onClose: () => void;
  onSaved: (m: StaffMember) => void;
}) {
  const [form, setForm] = useState({
    name: member?.name ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    role: member?.role ?? STAFF_ROLES[0],
    department: member?.department ?? DEPARTMENTS[0],
    employee_code: member?.employee_code ?? "",
    status: member?.status ?? "active",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setLoading(true); setError("");
    try {
      const url = member ? `/api/auth/admin/staff/${member.id}/` : "/api/auth/admin/staff/";
      const data = await apiFetch<StaffMember>(url, {
        method: member ? "PATCH" : "POST",
        body: JSON.stringify({ ...form, name: form.name.trim(), email: form.email.trim() }),
      });
      onSaved(data);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to save.");
    } finally {
      setLoading(false);
    }
  }

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}>
      <motion.aside initial={{ x: 460 }} animate={{ x: 0 }} exit={{ x: 460 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 460, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 18, boxShadow: "var(--shadow-lg)", overflowY: "auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Administration</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{member ? "Edit staff member" : "Add staff member"}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
        </div>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Full name *</label>
            <input style={inputStyle} value={form.name} placeholder="e.g. Meena Sharma" onChange={f("name")} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Role</label>
            <select style={inputStyle} value={form.role} onChange={f("role")}>
              {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Department</label>
            <select style={inputStyle} value={form.department} onChange={f("department")}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Employee code</label>
            <input style={inputStyle} value={form.employee_code} placeholder="e.g. STAFF001" onChange={f("employee_code")} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Status</label>
            <select style={inputStyle} value={form.status} onChange={f("status")}>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Phone</label>
            <input style={inputStyle} value={form.phone} placeholder="+91 98765 43210" onChange={f("phone")} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Email</label>
            <input style={inputStyle} value={form.email} placeholder="staff@school.edu" onChange={f("email")} />
          </div>
        </div>

        <button onClick={save} disabled={loading}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading ? 0.5 : 1, marginTop: "auto", flexShrink: 0 }}>
          {loading ? "Saving…" : member ? "Save changes" : "Add staff member"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Staff Row ─────────────────────────────────────────────────────────────────

function StaffRow({ member, onEdit, onDelete }: {
  member: StaffMember; onEdit: () => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[member.status] ?? STATUS_META.active;
  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow-sm)",
    }}>
      <div onClick={() => setExpanded((p) => !p)}
        style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <UserCog size={18} color={meta.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{member.name}</p>
            <span style={{
              fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 8px",
              background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
            }}>{meta.label}</span>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
            <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{member.role}</span>
            <span style={{ fontSize: 12, color: "var(--ink-dim)" }}>·</span>
            <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{member.department}</span>
            {member.employee_code && (
              <>
                <span style={{ fontSize: 12, color: "var(--ink-dim)" }}>·</span>
                <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "monospace" }}>{member.employee_code}</span>
              </>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
            style={{ background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "var(--ink-soft)" }}>
            <Pencil size={13} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#dc2626" }}>
            <Trash2 size={13} />
          </button>
        </div>
        {expanded ? <ChevronDown size={16} color="var(--ink-dim)" /> : <ChevronRight size={16} color="var(--ink-dim)" />}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            style={{ overflow: "hidden", borderTop: "1px solid var(--stroke)" }}>
            <div style={{ padding: "12px 20px 14px", display: "flex", gap: 20, flexWrap: "wrap" }}>
              {member.phone && (
                <span style={{ fontSize: 12, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Phone size={12} /> {member.phone}
                </span>
              )}
              {member.email && (
                <span style={{ fontSize: 12, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Mail size={12} /> {member.email}
                </span>
              )}
              {member.joined_date && (
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  Joined {new Date(member.joined_date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<StaffMember | null | "new">(null);
  const [filter, setFilter] = useState<"all" | "active" | "on_leave">("all");
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    apiFetch<StaffMember[]>("/api/auth/admin/staff/")
      .then((d) => setStaff(Array.isArray(d) ? d : []))
      .catch(() => setStaff([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function deleteMember(id: number) {
    if (!confirm("Remove this staff member?")) return;
    try {
      await apiFetch(`/api/auth/admin/staff/${id}/`, { method: "DELETE" });
      setStaff((p) => p.filter((m) => m.id !== id));
    } catch {}
  }

  function onSaved(m: StaffMember) {
    setStaff((p) => {
      const exists = p.find((x) => x.id === m.id);
      return exists ? p.map((x) => x.id === m.id ? m : x) : [m, ...p];
    });
  }

  const filtered = staff.filter((m) => {
    if (filter === "active" && m.status !== "active") return false;
    if (filter === "on_leave" && m.status !== "on_leave") return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
        !m.role.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const active  = staff.filter((m) => m.status === "active").length;
  const onLeave = staff.filter((m) => m.status === "on_leave").length;

  return (
    <DashboardShell>
      <AnimatePresence>
        {editing !== null && (
          <StaffDrawer
            member={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={onSaved}
          />
        )}
      </AnimatePresence>

      <div style={{ padding: "24px 28px 48px", maxWidth: 860 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>Administration</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Staff</h1>
          </div>
          <button onClick={() => setEditing("new")}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Plus size={16} /> Add Staff
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total staff",  value: loading ? "—" : staff.length,  color: "#2563eb", icon: UserCog },
            { label: "Active",       value: loading ? "—" : active,         color: "#16a34a", icon: CheckCircle2 },
            { label: "On leave",     value: loading ? "—" : onLeave,        color: "#d97706", icon: CalendarOff },
          ].map((s) => (
            <motion.div key={s.label} variants={fade} style={{
              background: "var(--surface)", border: "1px solid var(--stroke)",
              borderTop: `3px solid ${s.color}`, borderRadius: 14, padding: "16px 18px",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <s.icon size={17} color={s.color} />
              </div>
              <p style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters + Search */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          {(["all", "active", "on_leave"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: "7px 16px", borderRadius: 8, border: "1px solid var(--stroke)",
                background: filter === f ? "var(--primary)" : "var(--surface)",
                color: filter === f ? "#fff" : "var(--ink-soft)",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}>
              {f === "all" ? "All" : f === "active" ? "Active" : "On Leave"}
            </button>
          ))}
          <input
            style={{ ...inputStyle, flex: 1, minWidth: 180 }}
            placeholder="Search by name or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading staff…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
              {search || filter !== "all" ? "No staff found" : "No staff members yet"}
            </p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
              {search || filter !== "all" ? "Try a different filter." : "Add non-teaching staff to manage their profiles and leaves."}
            </p>
            {!search && filter === "all" && (
              <button onClick={() => setEditing("new")}
                style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Add first staff member
              </button>
            )}
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((m) => (
              <StaffRow key={m.id} member={m} onEdit={() => setEditing(m)} onDelete={() => deleteMember(m.id)} />
            ))}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
