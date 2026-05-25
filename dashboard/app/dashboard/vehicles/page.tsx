"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Truck, Plus, X, Pencil, Trash2, Users,
  CheckCircle2, Route, AlertCircle,
} from "lucide-react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_type: string;
  capacity: number;
  route_name?: string;
  route_id?: number | null;
  driver_name?: string;
  driver_id?: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
};

const VEHICLE_TYPES = ["bus", "minibus", "van", "tempo", "other"];

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  bus:      { color: "#2563eb", bg: "#eff6ff" },
  minibus:  { color: "#7c3aed", bg: "#f5f3ff" },
  van:      { color: "#0891b2", bg: "#ecfeff" },
  tempo:    { color: "#d97706", bg: "#fffbeb" },
  other:    { color: "#64748b", bg: "#f8fafc" },
};

// ── Vehicle Drawer ────────────────────────────────────────────────────────────

function VehicleDrawer({ vehicle, onClose, onSaved }: {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSaved: (v: Vehicle) => void;
}) {
  const [form, setForm] = useState({
    registration_number: vehicle?.registration_number ?? "",
    vehicle_type: vehicle?.vehicle_type ?? "bus",
    capacity: String(vehicle?.capacity ?? ""),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!form.registration_number.trim()) { setError("Registration number is required."); return; }
    if (!form.capacity || isNaN(Number(form.capacity))) { setError("Valid capacity is required."); return; }
    setLoading(true); setError("");
    try {
      const body = {
        registration_number: form.registration_number.trim().toUpperCase(),
        vehicle_type: form.vehicle_type,
        capacity: Number(form.capacity),
      };
      const url = vehicle ? `/api/transport/admin/vehicles/${vehicle.id}/` : "/api/transport/admin/vehicles/";
      const data = await apiFetch<Vehicle>(url, { method: vehicle ? "PATCH" : "POST", body: JSON.stringify(body) });
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
      <motion.aside initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 420, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 20, boxShadow: "var(--shadow-lg)" }}>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Transport</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{vehicle ? "Edit vehicle" : "Add vehicle"}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
        </div>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{error}</div>}

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Registration number *</label>
          <input style={{ ...inputStyle, textTransform: "uppercase" }} value={form.registration_number}
            placeholder="e.g. MH12AB1234"
            onChange={(e) => setForm(p => ({ ...p, registration_number: e.target.value }))} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 8 }}>Vehicle type</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {VEHICLE_TYPES.map((t) => {
              const active = form.vehicle_type === t;
              const meta = TYPE_COLORS[t] ?? TYPE_COLORS.other;
              return (
                <button key={t} onClick={() => setForm(p => ({ ...p, vehicle_type: t }))}
                  style={{
                    padding: "7px 14px", borderRadius: 8, border: `1px solid ${active ? meta.color : "var(--stroke)"}`,
                    background: active ? meta.bg : "var(--surface-raised)", color: active ? meta.color : "var(--ink-soft)",
                    fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize",
                  }}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Seating capacity *</label>
          <input style={inputStyle} type="number" min={1} max={80} value={form.capacity}
            placeholder="e.g. 40"
            onChange={(e) => setForm(p => ({ ...p, capacity: e.target.value }))} />
        </div>

        <button onClick={save} disabled={loading}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading ? 0.5 : 1, marginTop: "auto" }}>
          {loading ? "Saving…" : vehicle ? "Save changes" : "Add vehicle"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Vehicle Card ──────────────────────────────────────────────────────────────

function VehicleCard({ vehicle, onEdit, onDelete }: {
  vehicle: Vehicle; onEdit: () => void; onDelete: () => void;
}) {
  const meta = TYPE_COLORS[vehicle.vehicle_type] ?? TYPE_COLORS.other;
  const hasRoute = !!vehicle.route_name;
  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderRadius: 14, padding: "18px 20px", boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Truck size={20} color={meta.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", fontFamily: "monospace", letterSpacing: "0.04em" }}>
              {vehicle.registration_number}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "2px 8px", background: meta.bg, color: meta.color, border: `1px solid ${meta.color}30`, textTransform: "capitalize" }}>
              {vehicle.vehicle_type}
            </span>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}>
              <Users size={11} /> {vehicle.capacity} seats
            </span>
            {hasRoute ? (
              <span style={{ fontSize: 12, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}>
                <Route size={11} /> {vehicle.route_name}
              </span>
            ) : (
              <span style={{ fontSize: 12, color: "#d97706", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertCircle size={11} /> No route assigned
              </span>
            )}
            {vehicle.driver_name && (
              <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                Driver: {vehicle.driver_name}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={onEdit}
            style={{ background: "var(--surface-raised)", border: "1px solid var(--stroke)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "var(--ink-soft)" }}>
            <Pencil size={13} />
          </button>
          <button onClick={onDelete}
            style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#dc2626" }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Vehicle | null | "new">(null);

  function load() {
    setLoading(true);
    apiFetch<Vehicle[]>("/api/transport/admin/vehicles/")
      .then((d) => setVehicles(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function deleteVehicle(id: number) {
    if (!confirm("Remove this vehicle?")) return;
    try {
      await apiFetch(`/api/transport/admin/vehicles/${id}/`, { method: "DELETE" });
      setVehicles((p) => p.filter((v) => v.id !== id));
    } catch {}
  }

  function onSaved(v: Vehicle) {
    setVehicles((p) => {
      const exists = p.find((x) => x.id === v.id);
      return exists ? p.map((x) => x.id === v.id ? v : x) : [v, ...p];
    });
  }

  const assigned = vehicles.filter((v) => v.route_id).length;
  const totalSeats = vehicles.reduce((n, v) => n + v.capacity, 0);

  return (
    <DashboardShell>
      <AnimatePresence>
        {editing !== null && (
          <VehicleDrawer
            vehicle={editing === "new" ? null : editing}
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
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Vehicles</h1>
          </div>
          <button onClick={() => setEditing("new")}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Plus size={16} /> Add Vehicle
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total vehicles", value: loading ? "—" : vehicles.length,  color: "#2563eb", icon: Truck },
            { label: "On a route",     value: loading ? "—" : assigned,          color: "#16a34a", icon: CheckCircle2 },
            { label: "Total seats",    value: loading ? "—" : totalSeats,        color: "#7c3aed", icon: Users },
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

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading vehicles…</div>
        ) : vehicles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚌</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No vehicles yet</p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
              Add vehicles to your fleet and assign them to routes.
            </p>
            <button onClick={() => setEditing("new")}
              style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Add first vehicle
            </button>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} onEdit={() => setEditing(v)} onDelete={() => deleteVehicle(v.id)} />
            ))}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
