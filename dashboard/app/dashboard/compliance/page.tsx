"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ShieldCheck, AlertTriangle, Clock, CheckCircle2,
  FileText, Truck, Bus, RefreshCw,
} from "lucide-react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RenewalItem {
  id: number;
  documentType: string;
  ownerType: "vehicle" | "driver" | string;
  ownerId: number;
  ownerName?: string;
  remindOn: string;
  sent: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const DOC_LABELS: Record<string, string> = {
  fitness_certificate: "Fitness Certificate",
  insurance:           "Insurance",
  permit:              "Route Permit",
  pollution:           "Pollution Certificate",
  license:             "Driving License",
  registration:        "Vehicle Registration",
  puc:                 "PUC Certificate",
};

function urgency(remindOn: string): "overdue" | "urgent" | "soon" | "ok" {
  const today = new Date();
  const date  = new Date(remindOn);
  const days  = Math.floor((date.getTime() - today.getTime()) / 86_400_000);
  if (days < 0)  return "overdue";
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  return "ok";
}

const URGENCY_META = {
  overdue: { label: "Overdue",  color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  urgent:  { label: "Urgent",   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  soon:    { label: "Due soon", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  ok:      { label: "OK",       color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
};

function daysLabel(remindOn: string) {
  const days = Math.floor((new Date(remindOn).getTime() - Date.now()) / 86_400_000);
  if (days < 0)  return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  return `Due in ${days} day${days !== 1 ? "s" : ""}`;
}

// ── Renewal Row ───────────────────────────────────────────────────────────────

function RenewalRow({ item }: { item: RenewalItem }) {
  const u = urgency(item.remindOn);
  const meta = URGENCY_META[u];
  const OwnerIcon = item.ownerType === "vehicle" ? Truck : Bus;
  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: `1px solid ${u === "overdue" ? "#fecaca" : u === "urgent" ? "#fde68a" : "var(--stroke)"}`,
      borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <OwnerIcon size={18} color={meta.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
            {DOC_LABELS[item.documentType] ?? item.documentType}
          </p>
          <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 8px", background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
            {meta.label}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "2px 0 0", textTransform: "capitalize" }}>
          {item.ownerType} #{item.ownerId}{item.ownerName ? ` — ${item.ownerName}` : ""}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: meta.color, margin: 0 }}>{daysLabel(item.remindOn)}</p>
        <p style={{ fontSize: 11, color: "var(--ink-dim)", margin: "2px 0 0" }}>
          {new Date(item.remindOn).toLocaleDateString("en-IN", { dateStyle: "medium" })}
        </p>
        {item.sent && (
          <span style={{ fontSize: 10, color: "#16a34a", display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end", marginTop: 2 }}>
            <CheckCircle2 size={10} /> Reminder sent
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const [items, setItems] = useState<RenewalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "overdue" | "urgent" | "soon">("all");

  function load() {
    setLoading(true);
    apiFetch<{ results: RenewalItem[] }>("/api/compliance/driver/renewals/")
      .then((d) => setItems(Array.isArray(d) ? d : (d?.results ?? [])))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = items.filter((item) => {
    if (filter === "all") return true;
    return urgency(item.remindOn) === filter;
  });

  const overdue = items.filter((i) => urgency(i.remindOn) === "overdue").length;
  const urgent  = items.filter((i) => urgency(i.remindOn) === "urgent").length;
  const ok      = items.filter((i) => urgency(i.remindOn) === "ok").length;

  return (
    <DashboardShell>
      <div style={{ padding: "24px 28px 48px", maxWidth: 900 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>Operations</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Compliance</h1>
          </div>
          <button onClick={load} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 10, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "var(--ink)" }}>
            <RefreshCw size={15} style={loading ? { animation: "spin 1s linear infinite" } : {}} /> Refresh
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total items", value: loading ? "—" : items.length, color: "#2563eb", icon: FileText },
            { label: "Overdue",     value: loading ? "—" : overdue,       color: "#dc2626", icon: AlertTriangle },
            { label: "Urgent",      value: loading ? "—" : urgent,        color: "#d97706", icon: Clock },
            { label: "All OK",      value: loading ? "—" : ok,            color: "#16a34a", icon: CheckCircle2 },
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

        {/* Info banner */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
          <ShieldCheck size={15} color="#2563eb" />
          <p style={{ fontSize: 12, color: "#1d4ed8" }}>
            Renewal reminders are automatically sent 30 days before expiry. Overdue items require immediate action.
          </p>
        </motion.div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["all", "overdue", "urgent", "soon"] as const).map((f) => {
            const active = filter === f;
            const count = f === "all" ? items.length : items.filter((i) => urgency(i.remindOn) === f).length;
            return (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid var(--stroke)", background: active ? "var(--primary)" : "var(--surface)", color: active ? "#fff" : "var(--ink-soft)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} ({count})
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading renewals…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
              {filter === "all" ? "No compliance items yet" : `No ${filter} items`}
            </p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              {filter === "all"
                ? "Compliance documents will appear here when drivers are set up with document expiry dates."
                : "Switch to All to see all compliance items."}
            </p>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...filtered].sort((a, b) => new Date(a.remindOn).getTime() - new Date(b.remindOn).getTime()).map((item) => (
              <RenewalRow key={item.id} item={item} />
            ))}
          </motion.div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardShell>
  );
}
