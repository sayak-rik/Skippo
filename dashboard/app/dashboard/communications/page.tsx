"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Radio, Send, Plus, X, Users, BookOpen, Bus,
  CheckCircle2, Bell, Megaphone, Clock,
} from "lucide-react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type AudienceType = "all_parents" | "classroom" | "route" | "custom";
type ChannelType  = "push" | "sms" | "both";

interface Broadcast {
  id: number;
  title: string;
  body: string;
  audience_type: AudienceType;
  channel: ChannelType;
  sent_at: string;
  delivered: number;
  total: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AUDIENCE_META: Record<AudienceType, { label: string; icon: React.ElementType; color: string }> = {
  all_parents: { label: "All parents",    icon: Users,     color: "#2563eb" },
  classroom:   { label: "Classroom",      icon: BookOpen,  color: "#7c3aed" },
  route:       { label: "Bus route",      icon: Bus,       color: "#0891b2" },
  custom:      { label: "Custom list",    icon: Users,     color: "#64748b" },
};

const CHANNEL_META: Record<ChannelType, { label: string; color: string; bg: string; border: string }> = {
  push: { label: "Push",     color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  sms:  { label: "SMS",      color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  both: { label: "Push+SMS", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
};

const DEMO_BROADCASTS: Broadcast[] = [
  { id: 1, title: "Sports Day this Saturday", body: "Dear Parents, Sports Day is this Saturday, April 27th. Students should arrive by 8:00 AM in sports attire. Spectator entry from Gate 2 from 9 AM.", audience_type: "all_parents", channel: "both", sent_at: "2026-04-24T07:00:00", delivered: 281, total: 298 },
  { id: 2, title: "Parent-Teacher Meeting on May 10th", body: "We are conducting a Parent-Teacher Meeting on May 10th (Saturday) from 9 AM to 1 PM. Time slots will be shared via SMS separately.", audience_type: "all_parents", channel: "push", sent_at: "2026-04-22T10:00:00", delivered: 305, total: 312 },
  { id: 3, title: "Class 5B — Field trip reminder", body: "This is a reminder for Class 5B parents that the field trip to Science Museum is scheduled for April 28th. Please send the permission slip by April 25th.", audience_type: "classroom", channel: "push", sent_at: "2026-04-21T14:30:00", delivered: 28, total: 32 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface-raised)", border: "1px solid var(--stroke)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--ink)", outline: "none",
};

function deliveryRate(b: Broadcast) {
  return b.total > 0 ? Math.round((b.delivered / b.total) * 100) : 0;
}

// ── Compose Drawer ────────────────────────────────────────────────────────────

function ComposeDrawer({ onClose, onSent }: { onClose: () => void; onSent: (b: Broadcast) => void }) {
  const [form, setForm] = useState({
    title: "",
    body: "",
    audience_type: "all_parents" as AudienceType,
    channel: "push" as ChannelType,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!form.title.trim() || !form.body.trim()) { setError("Title and message are required."); return; }
    setLoading(true); setError("");
    try {
      const data = await apiFetch<Broadcast>("/api/communications/admin/broadcasts/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onSent(data);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to send.");
    } finally {
      setLoading(false);
    }
  }

  const charLeft = 160 - form.body.length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}
      onClick={onClose}>
      <motion.aside initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: 480, background: "var(--surface)", borderLeft: "1px solid var(--stroke)", padding: 32, display: "flex", flexDirection: "column", gap: 20, boxShadow: "var(--shadow-lg)" }}>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 10, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>Operations</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>New broadcast</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-dim)" }}><X size={20} /></button>
        </div>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{error}</div>}

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Title *</label>
          <input style={inputStyle} value={form.title} maxLength={100} placeholder="e.g. School will remain closed on Monday" onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>Message *</label>
          <textarea
            style={{ ...inputStyle, minHeight: 100, resize: "vertical", fontFamily: "inherit" }}
            value={form.body}
            maxLength={160}
            placeholder="Write your message here…"
            onChange={(e) => setForm(p => ({ ...p, body: e.target.value }))}
          />
          <p style={{ fontSize: 11, color: charLeft < 20 ? "#dc2626" : "var(--ink-dim)", textAlign: "right", marginTop: 4 }}>
            {charLeft} characters remaining
          </p>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 8 }}>Audience</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(Object.entries(AUDIENCE_META) as [AudienceType, typeof AUDIENCE_META[AudienceType]][]).map(([k, v]) => {
              const active = form.audience_type === k;
              return (
                <button key={k} onClick={() => setForm(p => ({ ...p, audience_type: k }))}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: `1px solid ${active ? v.color : "var(--stroke)"}`, background: active ? v.color + "15" : "var(--surface-raised)", color: active ? v.color : "var(--ink-soft)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                  <v.icon size={13} /> {v.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 8 }}>Channel</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(Object.entries(CHANNEL_META) as [ChannelType, typeof CHANNEL_META[ChannelType]][]).map(([k, v]) => {
              const active = form.channel === k;
              return (
                <button key={k} onClick={() => setForm(p => ({ ...p, channel: k }))}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${active ? v.color : "var(--stroke)"}`, background: active ? v.bg : "var(--surface-raised)", color: active ? v.color : "var(--ink-soft)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 12, color: "#1d4ed8", lineHeight: 1.7 }}>
            {form.channel !== "push" && "SMS charges apply. "}
            Message will be sent immediately to {AUDIENCE_META[form.audience_type].label.toLowerCase()}.
          </p>
        </div>

        <button onClick={send} disabled={loading}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: loading ? 0.5 : 1, marginTop: "auto" }}>
          <Send size={16} /> {loading ? "Sending…" : "Send now"}
        </button>
      </motion.aside>
    </motion.div>
  );
}

// ── Broadcast Card ────────────────────────────────────────────────────────────

function BroadcastCard({ b }: { b: Broadcast }) {
  const aud = AUDIENCE_META[b.audience_type];
  const ch  = CHANNEL_META[b.channel];
  const rate = deliveryRate(b);
  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderRadius: 14, padding: "18px 20px", boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Megaphone size={18} color="#2563eb" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", margin: 0 }}>{b.title}</p>
            <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 8px", background: ch.bg, color: ch.color, border: `1px solid ${ch.border}` }}>
              {ch.label}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 8px", lineHeight: 1.5 }}>
            {b.body.length > 100 ? b.body.slice(0, 100) + "…" : b.body}
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--ink-dim)", display: "flex", alignItems: "center", gap: 4 }}>
              <aud.icon size={11} color={aud.color} /> {aud.label}
            </span>
            <span style={{ fontSize: 12, color: "var(--ink-dim)", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} /> {new Date(b.sent_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </span>
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: rate >= 90 ? "#16a34a" : "#d97706", margin: 0 }}>{rate}%</p>
          <p style={{ fontSize: 11, color: "var(--ink-dim)", margin: "2px 0 0" }}>{b.delivered}/{b.total} delivered</p>
          <div style={{ width: 80, height: 4, background: "var(--stroke)", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
            <div style={{ height: "100%", width: `${rate}%`, background: rate >= 90 ? "#16a34a" : "#d97706", borderRadius: 999 }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CommunicationsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(DEMO_BROADCASTS);
  const [showCompose, setShowCompose] = useState(false);

  const avgDelivery = broadcasts.length
    ? Math.round(broadcasts.reduce((s, b) => s + deliveryRate(b), 0) / broadcasts.length)
    : 0;
  const totalReached = broadcasts.reduce((s, b) => s + b.delivered, 0);

  return (
    <DashboardShell>
      <AnimatePresence>
        {showCompose && (
          <ComposeDrawer
            onClose={() => setShowCompose(false)}
            onSent={(b) => setBroadcasts((p) => [b, ...p])}
          />
        )}
      </AnimatePresence>

      <div style={{ padding: "24px 28px 48px", maxWidth: 900 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>Operations</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Communications</h1>
          </div>
          <button onClick={() => setShowCompose(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Plus size={16} /> New Broadcast
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total broadcasts", value: broadcasts.length, color: "#2563eb", icon: Megaphone },
            { label: "Parents reached",  value: totalReached,       color: "#16a34a", icon: CheckCircle2 },
            { label: "Avg. delivery",    value: `${avgDelivery}%`,  color: "#7c3aed", icon: Bell },
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

        {/* Channel guide */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 14, padding: "14px 18px", marginBottom: 22, display: "flex", gap: 20, flexWrap: "wrap" }}>
          {(Object.entries(CHANNEL_META) as [ChannelType, typeof CHANNEL_META[ChannelType]][]).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 10px", background: v.bg, color: v.color, border: `1px solid ${v.border}` }}>{v.label}</span>
              <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {k === "push" ? "In-app only" : k === "sms" ? "SMS only (charges apply)" : "In-app + SMS"}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Broadcast list */}
        <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {broadcasts.map((b) => <BroadcastCard key={b.id} b={b} />)}
        </motion.div>
      </div>
    </DashboardShell>
  );
}
