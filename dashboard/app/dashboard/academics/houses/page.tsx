"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Users } from "lucide-react";
import { DashboardShell } from "../../../../components/DashboardShell";
import { apiFetch } from "../../../../lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

interface House {
  id: number;
  name: string;
  color: string;
  description: string;
  is_active: boolean;
}

// ── Presets ──────────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const fade = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
};

// ── Drawer ───────────────────────────────────────────────────────────────────

function HouseDrawer({
  editing, onClose, onSaved,
}: {
  editing?: House;
  onClose: () => void;
  onSaved: (h: House) => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    color: editing?.color ?? COLOR_PRESETS[0],
    description: editing?.description ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true);
    setError("");
    try {
      const url = editing ? `/api/academics/admin/houses/${editing.id}/` : "/api/academics/admin/houses/";
      const data = await apiFetch<House>(url, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(form),
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
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 420, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 20, boxShadow: "var(--shadow-lg)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>School Setup</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>{editing ? "Edit House" : "New House"}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Preview */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "var(--surface-raised)", borderRadius: 12, border: "1px solid var(--stroke)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: form.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={20} color="rgba(255,255,255,0.9)" />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{form.name || "House name"}</p>
            {form.description && <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>{form.description}</p>}
          </div>
        </div>

        {error && (
          <div style={{ background: "var(--danger-soft)", border: "1px solid var(--danger-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>House name *</label>
          <input style={inputStyle} value={form.name} placeholder="e.g. Blue House" onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 10 }}>House colour</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setForm(p => ({ ...p, color: c }))}
                style={{
                  width: 32, height: 32, borderRadius: "50%", background: c, border: "none", cursor: "pointer",
                  outline: form.color === c ? `3px solid ${c}` : "none",
                  outlineOffset: 2, transition: "transform 0.15s",
                  transform: form.color === c ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm(p => ({ ...p, color: e.target.value }))}
              title="Custom colour"
              style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--stroke)", cursor: "pointer", padding: 0 }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Description <span style={{ fontWeight: 400, color: "var(--ink-dim)" }}>(optional)</span></label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="A brief note about this house…"
            rows={3}
            style={{ ...inputStyle, resize: "none" }}
          />
        </div>

        <button
          onClick={save}
          disabled={!form.name || loading}
          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: !form.name || loading ? 0.5 : 1, marginTop: "auto" }}
        >
          {loading ? "Saving…" : editing ? "Save changes" : "Create house"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── House Card ────────────────────────────────────────────────────────────────

function HouseCard({
  house, onEdit, onDelete,
}: {
  house: House;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function del() {
    if (!confirm(`Delete house "${house.name}"?`)) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/academics/admin/houses/${house.id}/`, { method: "DELETE" });
      onDelete();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)",
    }}>
      {/* Colored header band */}
      <div style={{ height: 80, background: house.color, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Users size={24} color="rgba(255,255,255,0.95)" />
        </div>
      </div>

      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>{house.name}</p>
            {house.description && (
              <p style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>{house.description}</p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: house.color }} />
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--ink-dim)" }}>{house.color}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            <button onClick={onEdit} style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "var(--ink-soft)" }}>
              <Pencil size={13} />
            </button>
            <button onClick={del} disabled={deleting} style={{ background: "none", border: "1px solid var(--stroke)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "var(--ink-dim)" }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HousesPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState<{ open: boolean; editing?: House }>({ open: false });

  function load() {
    setLoading(true);
    apiFetch<House[]>("/api/academics/admin/houses/")
      .then((d) => setHouses(Array.isArray(d) ? d : []))
      .catch(() => setHouses([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <DashboardShell>
      <AnimatePresence>
        {drawer.open && (
          <HouseDrawer
            editing={drawer.editing}
            onClose={() => setDrawer({ open: false })}
            onSaved={(saved) => {
              setHouses((prev) =>
                drawer.editing ? prev.map((h) => h.id === saved.id ? saved : h) : [...prev, saved]
              );
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ padding: "24px 28px 48px" }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>School Setup</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Houses</h1>
          </div>
          <button
            onClick={() => setDrawer({ open: true })}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            <Plus size={16} /> New House
          </button>
        </motion.div>

        {/* Info bar */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: "var(--primary-soft)", border: "1px solid var(--stroke)", borderRadius: 12, padding: "12px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <Users size={15} color="var(--primary)" />
          <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6 }}>
            Houses are assigned to students during admission. Create them here before admitting students.
          </p>
        </motion.div>

        {/* Houses grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading…</div>
        ) : houses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏅</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No houses yet</p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20 }}>
              Create houses like Red, Blue, Green, Yellow for student grouping and inter-house events.
            </p>
            <button onClick={() => setDrawer({ open: true })} style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Create first house
            </button>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {houses.map((h) => (
              <HouseCard
                key={h.id}
                house={h}
                onEdit={() => setDrawer({ open: true, editing: h })}
                onDelete={() => setHouses((prev) => prev.filter((x) => x.id !== h.id))}
              />
            ))}
            {/* Add new card */}
            <motion.div variants={fade}
              onClick={() => setDrawer({ open: true })}
              style={{
                border: "2px dashed var(--stroke)", borderRadius: 16, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                minHeight: 180, gap: 8, color: "var(--ink-dim)",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; (e.currentTarget as HTMLElement).style.color = "var(--primary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--stroke)"; (e.currentTarget as HTMLElement).style.color = "var(--ink-dim)"; }}
            >
              <Plus size={22} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Add house</span>
            </motion.div>
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
