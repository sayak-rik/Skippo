"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Lock, Plus, X, Pencil, Trash2, ShieldCheck,
  ChevronDown, ChevronRight, CheckSquare, Square,
} from "lucide-react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Permission { code: string; label: string; }

interface SchoolRole {
  id: number;
  name: string;
  permissions: string[];
  is_system: boolean;
  created_at: string;
}

// ── Permission groups for the UI ──────────────────────────────────────────────

const PERM_GROUPS: { label: string; codes: string[] }[] = [
  { label: "Students",               codes: ["manage_students", "view_students"] },
  { label: "Staff",                  codes: ["manage_staff", "view_staff"] },
  { label: "Finance",                codes: ["manage_fees", "collect_fees", "view_fees"] },
  { label: "Attendance",             codes: ["manage_attendance", "view_attendance"] },
  { label: "Academics & Exams",      codes: ["manage_timetable", "manage_exams", "enter_marks"] },
  { label: "Communications & Reports", codes: ["send_communications", "view_reports"] },
  { label: "Settings",               codes: ["manage_settings"] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
};

// ── Role Drawer ───────────────────────────────────────────────────────────────

function RoleDrawer({
  role, allPerms, onClose, onSaved,
}: {
  role: SchoolRole | null;
  allPerms: Permission[];
  onClose: () => void;
  onSaved: (r: SchoolRole) => void;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set(role?.permissions ?? []));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggle(code: string) {
    setSelected((p) => {
      const next = new Set(p);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  function toggleGroup(codes: string[]) {
    const allOn = codes.every((c) => selected.has(c));
    setSelected((p) => {
      const next = new Set(p);
      codes.forEach((c) => allOn ? next.delete(c) : next.add(c));
      return next;
    });
  }

  async function save() {
    if (!name.trim()) { setError("Role name is required."); return; }
    setLoading(true); setError("");
    try {
      const body = { name: name.trim(), permissions: [...selected] };
      const url = role ? `/api/auth/admin/roles/${role.id}/` : "/api/auth/admin/roles/";
      const data = await apiFetch<SchoolRole>(url, {
        method: role ? "PATCH" : "POST", body: JSON.stringify(body),
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}>
      <motion.aside initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 480, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 20, boxShadow: "var(--shadow-lg)", overflowY: "auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Administration</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{role ? "Edit role" : "New role"}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
        </div>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{error}</div>}

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Role name *</label>
          <input style={inputStyle} value={name} placeholder="e.g. Class Teacher, Accountant" onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)" }}>
              Permissions <span style={{ fontWeight: 400, color: "var(--ink-dim)" }}>({selected.size} selected)</span>
            </label>
            <button onClick={() => {
              if (selected.size === allPerms.length) setSelected(new Set());
              else setSelected(new Set(allPerms.map((p) => p.code)));
            }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--primary)" }}>
              {selected.size === allPerms.length ? "Deselect all" : "Select all"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PERM_GROUPS.map((group) => {
              const groupPerms = group.codes
                .map((c) => allPerms.find((p) => p.code === c))
                .filter(Boolean) as Permission[];
              if (!groupPerms.length) return null;
              const allOn = groupPerms.every((p) => selected.has(p.code));
              const someOn = groupPerms.some((p) => selected.has(p.code));
              return (
                <div key={group.label} style={{ background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 10, overflow: "hidden" }}>
                  <button onClick={() => toggleGroup(group.codes)}
                    style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                    {allOn ? <CheckSquare size={15} color="var(--primary)" /> : someOn ? <CheckSquare size={15} color="var(--ink-dim)" /> : <Square size={15} color="var(--ink-dim)" />}
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{group.label}</span>
                    <span style={{ fontSize: 11, color: "var(--ink-dim)", marginLeft: "auto" }}>
                      {groupPerms.filter((p) => selected.has(p.code)).length}/{groupPerms.length}
                    </span>
                  </button>
                  <div style={{ padding: "0 14px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
                    {groupPerms.map((p) => (
                      <label key={p.code} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "3px 0" }}>
                        <input
                          type="checkbox"
                          checked={selected.has(p.code)}
                          onChange={() => toggle(p.code)}
                          style={{ width: 14, height: 14, accentColor: "var(--primary)" }}
                        />
                        <span style={{ fontSize: 13, color: "var(--ink)" }}>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={save} disabled={loading}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading ? 0.5 : 1, marginTop: "auto", flexShrink: 0 }}>
          {loading ? "Saving…" : role ? "Save changes" : "Create role"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Role Card ─────────────────────────────────────────────────────────────────

function RoleCard({ role, allPerms, onEdit, onDelete }: {
  role: SchoolRole;
  allPerms: Permission[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const permLabels = role.permissions
    .map((c) => allPerms.find((p) => p.code === c)?.label ?? c)
    .filter(Boolean);

  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow-sm)",
    }}>
      <div onClick={() => setExpanded((p) => !p)}
        style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: role.is_system ? "#eff6ff" : "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Lock size={18} color={role.is_system ? "#2563eb" : "#7c3aed"} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{role.name}</p>
            {role.is_system && (
              <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 8px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                System
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
            {role.permissions.length === 0 ? "No permissions" : `${role.permissions.length} permission${role.permissions.length !== 1 ? "s" : ""}`}
            {role.permissions.includes("*") && " (all access)"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!role.is_system && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
                style={{ background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "var(--ink-soft)" }}>
                <Pencil size={13} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#dc2626" }}>
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
        {expanded ? <ChevronDown size={16} color="var(--ink-dim)" /> : <ChevronRight size={16} color="var(--ink-dim)" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            style={{ overflow: "hidden", borderTop: "1px solid var(--stroke)" }}>
            <div style={{ padding: "14px 20px 16px" }}>
              {role.permissions.includes("*") ? (
                <p style={{ fontSize: 13, color: "#2563eb", fontWeight: 600 }}>Superuser — all permissions granted</p>
              ) : permLabels.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--ink-dim)" }}>No permissions assigned to this role.</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {permLabels.map((l) => (
                    <span key={l} style={{ fontSize: 12, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", borderRadius: 6, padding: "3px 10px", fontWeight: 500 }}>
                      {l}
                    </span>
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

export default function RolesPage() {
  const [roles, setRoles] = useState<SchoolRole[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SchoolRole | null | "new">(null);

  function load() {
    setLoading(true);
    Promise.all([
      apiFetch<SchoolRole[]>("/api/auth/admin/roles/"),
      apiFetch<Permission[]>("/api/auth/admin/permissions/"),
    ])
      .then(([r, p]) => {
        setRoles(Array.isArray(r) ? r : []);
        setAllPerms(Array.isArray(p) ? p : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function deleteRole(id: number) {
    if (!confirm("Delete this role? Users assigned to it will lose these permissions.")) return;
    try {
      await apiFetch(`/api/auth/admin/roles/${id}/`, { method: "DELETE" });
      setRoles((p) => p.filter((r) => r.id !== id));
    } catch {}
  }

  function onSaved(r: SchoolRole) {
    setRoles((p) => {
      const exists = p.find((x) => x.id === r.id);
      return exists ? p.map((x) => x.id === r.id ? r : x) : [...p, r];
    });
  }

  const systemRoles  = roles.filter((r) => r.is_system);
  const customRoles  = roles.filter((r) => !r.is_system);

  return (
    <DashboardShell>
      <AnimatePresence>
        {editing !== null && (
          <RoleDrawer
            role={editing === "new" ? null : editing}
            allPerms={allPerms}
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
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Roles & Permissions</h1>
          </div>
          <button onClick={() => setEditing("new")}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Plus size={16} /> New Role
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total roles",      value: loading ? "—" : roles.length,         color: "#7c3aed", icon: Lock },
            { label: "Custom roles",     value: loading ? "—" : customRoles.length,    color: "#2563eb", icon: ShieldCheck },
            { label: "Permissions available", value: loading ? "—" : allPerms.length, color: "#0891b2", icon: CheckSquare },
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

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading roles…</div>
        ) : (
          <>
            {/* System roles */}
            {systemRoles.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                  System roles ({systemRoles.length})
                </p>
                <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {systemRoles.map((r) => (
                    <RoleCard key={r.id} role={r} allPerms={allPerms} onEdit={() => setEditing(r)} onDelete={() => deleteRole(r.id)} />
                  ))}
                </motion.div>
              </div>
            )}

            {/* Custom roles */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                Custom roles ({customRoles.length})
              </p>
              {customRoles.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", background: "var(--surface-raised)", borderRadius: 14, border: "1px dashed var(--stroke)" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🔐</div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No custom roles yet</p>
                  <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 18 }}>
                    Create roles like "Class Teacher" or "Accountant" with specific permissions.
                  </p>
                  <button onClick={() => setEditing("new")}
                    style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    Create first role
                  </button>
                </div>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {customRoles.map((r) => (
                    <RoleCard key={r.id} role={r} allPerms={allPerms} onEdit={() => setEditing(r)} onDelete={() => deleteRole(r.id)} />
                  ))}
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
