"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Bus, Plus, X, Pencil, Trash2, CheckCircle2, Clock,
  ChevronDown, ChevronRight, Send, AlertCircle, Users, Phone, ShieldCheck,
} from "lucide-react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface VehicleRef { id: number; registration_number: string; vehicle_type: string; capacity: number; }
interface RouteRef   { id: number; name: string; }

interface Driver {
  id: number;
  name: string;
  phone: string;
  aadhar: string;
  is_approved: boolean;
  is_kyc_verified?: boolean;
  kyc_verified_at?: string | null;
  vehicle: VehicleRef | null;
  route: RouteRef | null;
  created_at: string;
}

interface SignupRequest {
  id: number;
  name: string;
  phone: string;
  aadhar: string;
  vehicle_registration: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
};

// ── Driver Drawer ─────────────────────────────────────────────────────────────

function DriverDrawer({
  driver, onClose, onSaved,
}: { driver: Driver | null; onClose: () => void; onSaved: (d: Driver) => void }) {
  const [form, setForm] = useState({ name: driver?.name ?? "", phone: driver?.phone ?? "", aadhar: driver?.aadhar ?? "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteToken, setInviteToken] = useState("");

  async function save() {
    if (!form.name.trim() || !form.phone.trim()) { setError("Name and phone are required."); return; }
    setLoading(true); setError("");
    try {
      const url = driver ? `/api/auth/admin/drivers/${driver.id}/` : "/api/auth/admin/drivers/";
      const data = await apiFetch<Driver & { invite_token?: string }>(url, {
        method: driver ? "PATCH" : "POST",
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim(), aadhar: form.aadhar.trim() }),
      });
      if (data.invite_token) setInviteToken(data.invite_token);
      onSaved(data);
      if (!data.invite_token) onClose();
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
      <motion.aside initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 420, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 20, boxShadow: "var(--shadow-lg)" }}>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Transport</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{driver ? "Edit driver" : "Add driver"}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
        </div>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{error}</div>}

        {inviteToken ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "16px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#15803d", marginBottom: 8 }}>Driver added successfully!</p>
              <p style={{ fontSize: 12, color: "#166534", marginBottom: 12 }}>Share this invite code so the driver can onboard via the Skippo Driver app.</p>
              <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#15803d", textAlign: "center", letterSpacing: "0.08em" }}>
                {inviteToken}
              </div>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(inviteToken); }}
              style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Copy invite code
            </button>
            <button onClick={onClose}
              style={{ background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 10, padding: "11px 0", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "var(--ink-soft)" }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Full name *</label>
              <input style={inputStyle} value={form.name} placeholder="e.g. Rajan Kumar" onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Phone number *</label>
              <input style={inputStyle} value={form.phone} placeholder="+91 98765 43210" onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Aadhaar number <span style={{ fontWeight: 400, color: "var(--ink-dim)" }}>(optional)</span></label>
              <input style={inputStyle} value={form.aadhar} placeholder="XXXX XXXX XXXX" maxLength={14} onChange={(e) => setForm(p => ({ ...p, aadhar: e.target.value }))} />
            </div>
            {!driver && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ fontSize: 12, color: "#1d4ed8", lineHeight: 1.7 }}>
                  An invite code will be generated and an SMS sent to the driver. They use it to complete onboarding in the Skippo Driver app.
                </p>
              </div>
            )}
            <button onClick={save} disabled={loading}
              style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading ? 0.5 : 1, marginTop: "auto" }}>
              {loading ? "Saving…" : driver ? "Save changes" : "Add & send invite"}
            </button>
          </>
        )}
      </motion.aside>
    </motion.div>
  );
}

// ── Driver Row ────────────────────────────────────────────────────────────────

function DriverRow({ driver, onEdit, onDelete, onChanged }: { driver: Driver; onEdit: () => void; onDelete: () => void; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const startKyc = async () => {
    setVerifying(true);
    try {
      const res = await apiFetch<{ status: string; authorize_url: string | null }>(
        "/api/compliance/digilocker/initiate/",
        { method: "POST", body: JSON.stringify({ driver_id: driver.id, doc_type: "driving_license" }) },
      );
      if (res.authorize_url) {
        window.open(res.authorize_url, "_blank", "noopener");
        alert("DigiLocker consent page opened in a new tab. The KYC badge appears once the driver approves access.");
      }
      onChanged();
    } catch (e) {
      alert((e as Error)?.message || "Could not start DigiLocker verification.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div variants={fade} style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
      <div onClick={() => setExpanded((p) => !p)}
        style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: driver.is_approved ? "#f0fdf4" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bus size={18} color={driver.is_approved ? "#16a34a" : "#d97706"} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{driver.name}</p>
            <span style={{
              fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 8px",
              background: driver.is_approved ? "#f0fdf4" : "#fffbeb",
              color: driver.is_approved ? "#16a34a" : "#d97706",
              border: `1px solid ${driver.is_approved ? "#bbf7d0" : "#fde68a"}`,
            }}>
              {driver.is_approved ? "Active" : "Pending"}
            </span>
            {driver.is_kyc_verified && (
              <span style={{
                fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 8px",
                background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
                display: "inline-flex", alignItems: "center", gap: 3,
              }}>
                <ShieldCheck size={10} /> KYC
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 3 }}>
            <span style={{ fontSize: 12, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}>
              <Phone size={11} /> {driver.phone}
            </span>
            {driver.route && (
              <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Route: {driver.route.name}</span>
            )}
            {driver.vehicle && (
              <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Bus: {driver.vehicle.registration_number}</span>
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
            <div style={{ padding: "14px 20px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Aadhaar",   value: driver.aadhar || "Not provided" },
                { label: "Added",     value: new Date(driver.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" }) },
                { label: "Vehicle",   value: driver.vehicle ? `${driver.vehicle.registration_number} (${driver.vehicle.vehicle_type}, ${driver.vehicle.capacity} seats)` : "Not assigned" },
                { label: "Route",     value: driver.route?.name ?? "Not assigned" },
              ].map((f) => (
                <div key={f.label}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{f.label}</p>
                  <p style={{ fontSize: 13, color: "var(--ink)" }}>{f.value}</p>
                </div>
              ))}
            </div>
            {/* DigiLocker KYC */}
            <div style={{ padding: "0 20px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              {driver.is_kyc_verified ? (
                <span style={{ fontSize: 12, color: "#2563eb", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={14} />
                  KYC verified via DigiLocker
                  {driver.kyc_verified_at ? ` on ${new Date(driver.kyc_verified_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : ""}
                </span>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); startKyc(); }} disabled={verifying}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8,
                    padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#2563eb",
                    cursor: "pointer", opacity: verifying ? 0.6 : 1,
                  }}>
                  <ShieldCheck size={13} />
                  {verifying ? "Starting verification…" : "Verify KYC via DigiLocker"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Signup Request Row ────────────────────────────────────────────────────────

function SignupRequestRow({ req, onReview }: { req: SignupRequest; onReview: (action: "approve" | "reject") => void }) {
  return (
    <motion.div variants={fade} style={{
      background: "#fffbeb", border: "1px solid #fde68a",
      borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <AlertCircle size={18} color="#d97706" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{req.name}</p>
        <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
          <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{req.phone}</span>
          {req.vehicle_registration && <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Vehicle: {req.vehicle_registration}</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={() => onReview("approve")}
          style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 8, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
          Approve
        </button>
        <button onClick={() => onReview("reject")}
          style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
          Reject
        </button>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Driver | null | "new">(null);
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      apiFetch<{ results: Driver[] }>("/api/auth/admin/drivers/"),
      apiFetch<{ results: SignupRequest[] }>("/api/auth/admin/driver-requests/?status=pending"),
    ])
      .then(([d, r]) => {
        setDrivers(Array.isArray(d) ? d : (d?.results ?? []));
        setRequests(Array.isArray(r) ? r : (r?.results ?? []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function deleteDriver(id: number) {
    if (!confirm("Remove this driver? This cannot be undone.")) return;
    try {
      await apiFetch(`/api/auth/admin/drivers/${id}/`, { method: "DELETE" });
      setDrivers((p) => p.filter((d) => d.id !== id));
    } catch {}
  }

  async function reviewRequest(id: number, action: "approve" | "reject") {
    try {
      await apiFetch(`/api/auth/admin/driver-requests/${id}/review/`, {
        method: "POST", body: JSON.stringify({ action }),
      });
      setRequests((p) => p.filter((r) => r.id !== id));
      if (action === "approve") load();
    } catch {}
  }

  function onSaved(d: Driver) {
    setDrivers((p) => {
      const exists = p.find((x) => x.id === d.id);
      return exists ? p.map((x) => x.id === d.id ? d : x) : [d, ...p];
    });
  }

  const filtered = drivers.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search)
  );

  const approved = drivers.filter((d) => d.is_approved).length;

  return (
    <DashboardShell>
      <AnimatePresence>
        {editing !== null && (
          <DriverDrawer
            driver={editing === "new" ? null : editing}
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
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>Transport</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Drivers</h1>
          </div>
          <button onClick={() => setEditing("new")}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Plus size={16} /> Add Driver
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total drivers",  value: loading ? "—" : drivers.length,  color: "#2563eb", icon: Bus },
            { label: "Active",         value: loading ? "—" : approved,         color: "#16a34a", icon: CheckCircle2 },
            { label: "Pending review", value: loading ? "—" : requests.length,  color: "#d97706", icon: Clock },
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

        {/* Pending signup requests */}
        {requests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Pending approval ({requests.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {requests.map((r) => (
                <SignupRequestRow key={r.id} req={r} onReview={(a) => reviewRequest(r.id, a)} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            style={inputStyle}
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Driver list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading drivers…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚗</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>{search ? "No drivers found" : "No drivers yet"}</p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
              {search ? "Try a different search term." : "Add your first driver and send them an invite code to onboard."}
            </p>
            {!search && (
              <button onClick={() => setEditing("new")}
                style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Add first driver
              </button>
            )}
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((d) => (
              <DriverRow key={d.id} driver={d} onEdit={() => setEditing(d)} onDelete={() => deleteDriver(d.id)} onChanged={load} />
            ))}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
