"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Route, Plus, X, Pencil, Trash2, Bus, MapPin,
  ChevronDown, ChevronRight, GripVertical,
} from "lucide-react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stop {
  id: number;
  name: string;
  sequence: number;
  latitude?: number;
  longitude?: number;
}

interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_type: string;
  capacity: number;
}

interface RouteItem {
  id: number;
  name: string;
  vehicle: Vehicle | null;
  stops: Stop[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
};

// ── Route Drawer ──────────────────────────────────────────────────────────────

function RouteDrawer({
  route, vehicles, onClose, onSaved,
}: {
  route: RouteItem | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onSaved: (r: RouteItem) => void;
}) {
  const [form, setForm] = useState({
    name: route?.name ?? "",
    vehicle_id: route?.vehicle?.id ?? "",
  });
  const [stops, setStops] = useState<{ name: string }[]>(
    route?.stops.map((s) => ({ name: s.name })) ?? [{ name: "" }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addStop() { setStops((p) => [...p, { name: "" }]); }
  function removeStop(i: number) { setStops((p) => p.filter((_, idx) => idx !== i)); }
  function setStopName(i: number, name: string) {
    setStops((p) => p.map((s, idx) => idx === i ? { ...s, name } : s));
  }

  async function save() {
    if (!form.name.trim()) { setError("Route name is required."); return; }
    setLoading(true); setError("");
    try {
      const body = {
        name: form.name.trim(),
        vehicle_id: form.vehicle_id || null,
        stops: stops.filter((s) => s.name.trim()).map((s, i) => ({ name: s.name.trim(), sequence: i + 1 })),
      };
      const url = route ? `/api/transport/admin/routes/${route.id}/` : "/api/transport/admin/routes/";
      const data = await apiFetch<RouteItem>(url, { method: route ? "PATCH" : "POST", body: JSON.stringify(body) });
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
      <motion.aside initial={{ x: 460 }} animate={{ x: 0 }} exit={{ x: 460 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 460, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 20, boxShadow: "var(--shadow-lg)", overflowY: "auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Transport</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{route ? "Edit route" : "New route"}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
        </div>

        {error && <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)" }}>{error}</div>}

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Route name *</label>
          <input style={inputStyle} value={form.name} placeholder="e.g. North Campus Line" onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Assigned vehicle <span style={{ fontWeight: 400, color: "var(--ink-dim)" }}>(optional)</span></label>
          <select value={form.vehicle_id} onChange={(e) => setForm(p => ({ ...p, vehicle_id: e.target.value }))} style={inputStyle}>
            <option value="">None</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.registration_number} — {v.vehicle_type} ({v.capacity} seats)</option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)" }}>Stops <span style={{ fontWeight: 400, color: "var(--ink-dim)" }}>({stops.length})</span></label>
            <button onClick={addStop} style={{ background: "var(--primary-soft)", color: "var(--primary)", border: "none", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              + Add stop
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stops.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <GripVertical size={14} color="var(--ink-dim)" style={{ flexShrink: 0 }} />
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--surface-raised)", border: "1px solid var(--stroke)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 700, color: "var(--ink-dim)" }}>{i + 1}</div>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={s.name}
                  placeholder={`Stop ${i + 1} name`}
                  onChange={(e) => setStopName(i, e.target.value)}
                />
                {stops.length > 1 && (
                  <button onClick={() => removeStop(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", flexShrink: 0 }}><X size={14} /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={loading}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading ? 0.5 : 1, marginTop: "auto" }}>
          {loading ? "Saving…" : route ? "Save changes" : "Create route"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Route Card ────────────────────────────────────────────────────────────────

function RouteCard({
  route, onEdit, onDelete,
}: { route: RouteItem; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow-sm)",
    }}>
      <div
        onClick={() => setExpanded((p) => !p)}
        style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Route size={18} color="#2563eb" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{route.name}</p>
          <div style={{ display: "flex", gap: 12, marginTop: 3 }}>
            {route.vehicle ? (
              <span style={{ fontSize: 12, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}>
                <Bus size={12} /> {route.vehicle.registration_number}
              </span>
            ) : (
              <span style={{ fontSize: 12, color: "#d97706" }}>No vehicle assigned</span>
            )}
            <span style={{ fontSize: 12, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={12} /> {route.stops.length} stop{route.stops.length !== 1 ? "s" : ""}
            </span>
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
        {expanded && route.stops.length > 0 && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            style={{ overflow: "hidden", borderTop: "1px solid var(--stroke)" }}>
            <div style={{ padding: "14px 20px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Stop sequence</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[...route.stops].sort((a, b) => a.sequence - b.sequence).map((s, i) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#eff6ff", border: "2px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#2563eb" }}>{s.sequence}</div>
                      {i < route.stops.length - 1 && <div style={{ width: 2, height: 16, background: "#bfdbfe" }} />}
                    </div>
                    <span style={{ fontSize: 13, color: "var(--ink)" }}>{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RouteItem | null | "new">(null);

  function load() {
    setLoading(true);
    Promise.all([
      apiFetch<RouteItem[]>("/api/transport/admin/routes/"),
      apiFetch<Vehicle[]>("/api/transport/admin/vehicles/"),
    ])
      .then(([r, v]) => {
        setRoutes(Array.isArray(r) ? r : []);
        setVehicles(Array.isArray(v) ? v : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function deleteRoute(id: number) {
    if (!confirm("Delete this route?")) return;
    try {
      await apiFetch(`/api/transport/admin/routes/${id}/`, { method: "DELETE" });
      setRoutes((p) => p.filter((r) => r.id !== id));
    } catch {}
  }

  function onSaved(r: RouteItem) {
    setRoutes((p) => {
      const exists = p.find((x) => x.id === r.id);
      return exists ? p.map((x) => x.id === r.id ? r : x) : [r, ...p];
    });
  }

  const assigned = routes.filter((r) => r.vehicle).length;

  return (
    <DashboardShell>
      <AnimatePresence>
        {editing !== null && (
          <RouteDrawer
            route={editing === "new" ? null : editing}
            vehicles={vehicles}
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
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Routes</h1>
          </div>
          <button onClick={() => setEditing("new")}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Plus size={16} /> New Route
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total routes", value: loading ? "—" : routes.length, color: "#2563eb", icon: Route },
            { label: "With vehicle",  value: loading ? "—" : assigned,      color: "#16a34a", icon: Bus },
            { label: "Total stops",  value: loading ? "—" : routes.reduce((n, r) => n + r.stops.length, 0), color: "#7c3aed", icon: MapPin },
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
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading routes…</div>
        ) : routes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛣️</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No routes yet</p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>Create your first route and add stops along the way.</p>
            <button onClick={() => setEditing("new")}
              style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Create first route
            </button>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {routes.map((r) => (
              <RouteCard key={r.id} route={r} onEdit={() => setEditing(r)} onDelete={() => deleteRoute(r.id)} />
            ))}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
