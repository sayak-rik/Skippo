"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { DashboardShell } from "../../../components/DashboardShell";

// ── Types ─────────────────────────────────────────────────────────────────────

type RequestStatus = "pending" | "approved" | "rejected" | "calling" | "completed" | "cancelled";
type CampaignStatus = "draft" | "approved" | "queued" | "running" | "paused" | "completed" | "cancelled";

interface CallRequest {
  id: number;
  parent_name: string;
  parent_phone: string;
  reason_category: string;
  reason_text: string;
  status: RequestStatus;
  created_at: string;
}

interface Campaign {
  id: number;
  name: string;
  reason_text: string;
  objective: string;
  target_type: string;
  status: CampaignStatus;
  total_calls: number;
  completed_calls: number;
  failed_calls: number;
  tokens_estimated: number;
  tokens_used: number;
  rate_limit_per_hour: number;
  progress_pct: number;
  scheduled_at: string | null;
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const TOKEN_BALANCE = 47;
const TOKEN_TOTAL = 100;

const DEMO_REQUESTS: CallRequest[] = [
  { id: 1, parent_name: "Priya Mehta",   parent_phone: "+91 98765 43210", reason_category: "academic",   reason_text: "Concerned about maths test results",           status: "pending",   created_at: "2026-04-25T09:14:00" },
  { id: 2, parent_name: "Rajan Sinha",   parent_phone: "+91 99001 23456", reason_category: "transport",  reason_text: "Bus was late by 25 min on Wednesday",          status: "pending",   created_at: "2026-04-25T08:50:00" },
  { id: 3, parent_name: "Anita Sharma",  parent_phone: "+91 77889 00112", reason_category: "behavioral", reason_text: "",                                             status: "approved",  created_at: "2026-04-24T16:30:00" },
  { id: 4, parent_name: "Deepak Nair",   parent_phone: "+91 90011 22334", reason_category: "fees",       reason_text: "Question about annual fee structure",          status: "completed", created_at: "2026-04-23T11:00:00" },
  { id: 5, parent_name: "Sunita Kapoor", parent_phone: "+91 88776 55443", reason_category: "general",    reason_text: "Want to discuss school timing change",         status: "rejected",  created_at: "2026-04-22T14:20:00" },
];

const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 1, name: "Parent-Teacher Meet Q1",
    reason_text: "We are organising a parent-teacher meeting on May 10th to discuss student progress for Q1. Please come at the time slots assigned via SMS.",
    objective: "guardian_meet", target_type: "all", status: "running",
    total_calls: 312, completed_calls: 187, failed_calls: 8,
    tokens_estimated: 312, tokens_used: 195, rate_limit_per_hour: 40, progress_pct: 60, scheduled_at: "2026-04-25T08:00:00",
  },
  {
    id: 2, name: "Class 10 Career Day",
    reason_text: "We would like to discuss Class 10 students' career interests ahead of the upcoming Career Guidance Day on May 15th.",
    objective: "career_guidance", target_type: "class", status: "queued",
    total_calls: 64, completed_calls: 0, failed_calls: 0,
    tokens_estimated: 64, tokens_used: 0, rate_limit_per_hour: 20, progress_pct: 0, scheduled_at: "2026-04-26T09:00:00",
  },
  {
    id: 3, name: "Sports Day Reminder",
    reason_text: "Sports Day is this Saturday, April 27th. Please ensure your child arrives by 8:00 AM in sports attire. Spectator entry from 9 AM Gate 2.",
    objective: "general_notification", target_type: "all", status: "completed",
    total_calls: 298, completed_calls: 281, failed_calls: 17,
    tokens_estimated: 298, tokens_used: 298, rate_limit_per_hour: 60, progress_pct: 100, scheduled_at: "2026-04-24T07:00:00",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  pending:   { bg: "var(--warning-soft)",  color: "var(--warning)",  dot: "var(--warning)",  label: "Pending" },
  approved:  { bg: "var(--success-soft)",  color: "var(--success)",  dot: "var(--success)",  label: "Approved" },
  rejected:  { bg: "var(--danger-soft)",   color: "var(--danger)",   dot: "var(--danger)",   label: "Rejected" },
  calling:   { bg: "#eff6ff",              color: "#2563eb",         dot: "#3b82f6",         label: "Calling" },
  completed: { bg: "var(--success-soft)",  color: "var(--success)",  dot: "var(--success)",  label: "Completed" },
  cancelled: { bg: "var(--surface-raised)", color: "var(--ink-dim)", dot: "var(--ink-dim)",  label: "Cancelled" },
  draft:     { bg: "var(--surface-raised)", color: "var(--ink-dim)", dot: "var(--ink-dim)",  label: "Draft" },
  queued:    { bg: "#f5f3ff",              color: "#7c3aed",         dot: "#8b5cf6",         label: "Queued" },
  running:   { bg: "#eff6ff",              color: "#2563eb",         dot: "#3b82f6",         label: "Running" },
  paused:    { bg: "var(--warning-soft)",  color: "var(--warning)",  dot: "var(--warning)",  label: "Paused" },
};

const REASON_LABELS: Record<string, string> = {
  academic: "Academic", behavioral: "Behavioural", transport: "Transport", fees: "Fees", general: "General",
};

const OBJ_LABELS: Record<string, string> = {
  guardian_meet: "Guardian Meet", career_guidance: "Career Guidance", general_notification: "Notification",
};

const CATEGORY_ICONS: Record<string, string> = {
  academic: "📚", behavioral: "🧠", transport: "🚌", fees: "💳", general: "💬",
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.cancelled;
  return (
    <span style={{
      background: m.bg, color: m.color,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.dot, display: "inline-block", flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.4, 0.25, 1] } },
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

// ── Stat Cards ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  icon: string;
}

function StatCard({ label, value, sub, accent, icon }: StatCardProps) {
  return (
    <motion.div variants={fadeUp} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderRadius: 16, padding: "18px 20px",
      boxShadow: "var(--shadow-sm)",
      borderTop: `3px solid ${accent}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, fontSize: 17,
          background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>{icon}</div>
        {sub && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-dim)", background: "var(--surface-raised)", padding: "2px 8px", borderRadius: 20 }}>
            {sub}
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
      <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "var(--ink-soft)", fontWeight: 500 }}>{label}</p>
    </motion.div>
  );
}

// ── Token Gauge ───────────────────────────────────────────────────────────────

function TokenGauge({ balance, total }: { balance: number; total: number }) {
  const pct = Math.round((balance / total) * 100);
  const low = balance < 20;
  const critical = balance < 5;
  const gaugeColor = critical ? "var(--danger)" : low ? "var(--warning)" : "var(--primary)";

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderRadius: 16, padding: "20px", boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Call Tokens</p>
        {critical && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--danger)", background: "var(--danger-soft)", padding: "2px 8px", borderRadius: 20 }}>Critical</span>}
        {low && !critical && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--warning)", background: "var(--warning-soft)", padding: "2px 8px", borderRadius: 20 }}>Low</span>}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: gaugeColor, letterSpacing: "-0.04em" }}>{balance}</span>
        <span style={{ fontSize: 14, color: "var(--ink-dim)", fontWeight: 500 }}>/ {total}</span>
      </div>

      <div style={{ height: 8, borderRadius: 4, background: "var(--surface-raised)", overflow: "hidden", marginBottom: 12 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 4, background: gaugeColor }}
        />
      </div>

      <p style={{ margin: "0 0 12px 0", fontSize: 12, color: "var(--ink-dim)" }}>
        {pct}% remaining · 1 token per call
      </p>

      <button style={{
        width: "100%", background: "var(--primary)", color: "#fff",
        border: "none", borderRadius: 10, padding: "10px 0",
        fontSize: 13, fontWeight: 700, cursor: "pointer",
      }}>
        + Get more tokens
      </button>
    </div>
  );
}

// ── Recent Activity sidebar ───────────────────────────────────────────────────

function RecentActivity() {
  const items = [
    { name: "Priya Mehta",   action: "Call request",   time: "9:14 AM", category: "academic",   status: "pending" },
    { name: "Rajan Sinha",   action: "Call request",   time: "8:50 AM", category: "transport",  status: "pending" },
    { name: "Anita Sharma",  action: "Call approved",  time: "Yesterday", category: "behavioral", status: "approved" },
    { name: "Deepak Nair",   action: "Call completed", time: "Apr 23",  category: "fees",       status: "completed" },
  ];

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderRadius: 16, padding: "20px", boxShadow: "var(--shadow-sm)", marginTop: 14,
    }}>
      <p style={{ margin: "0 0 14px 0", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Recent Activity</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 0",
            borderBottom: i < items.length - 1 ? "1px solid var(--stroke)" : "none",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: "var(--surface-raised)", fontSize: 15,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {CATEGORY_ICONS[item.category]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.name}
              </p>
              <p style={{ margin: "1px 0 0 0", fontSize: 11, color: "var(--ink-dim)" }}>{item.action}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
              <StatusBadge status={item.status} />
              <span style={{ fontSize: 10, color: "var(--ink-dim)" }}>{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Call Requests ─────────────────────────────────────────────────────────────

function RequestsTab() {
  const [requests, setRequests] = useState<CallRequest[]>(DEMO_REQUESTS);
  const [actionNote, setActionNote] = useState<Record<number, string>>({});

  function handleAction(id: number, action: "approve" | "reject") {
    setRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r)
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const others  = requests.filter((r) => r.status !== "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {pending.length === 0 && (
        <div style={{
          textAlign: "center", padding: "48px 0", color: "var(--ink-dim)",
          background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 16,
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--ink-soft)" }}>No pending requests</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink-dim)" }}>All caught up — great job!</p>
        </div>
      )}

      {pending.map((req) => (
        <motion.div key={req.id} layout variants={fadeUp} initial="hidden" animate="show"
          style={{
            background: "var(--surface)", borderRadius: 16,
            border: "1px solid var(--stroke)", padding: "18px 20px",
            boxShadow: "var(--shadow-sm)",
          }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: "var(--primary-soft)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
              }}>
                {CATEGORY_ICONS[req.reason_category] ?? "📞"}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{req.parent_name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-dim)" }}>{req.parent_phone}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{
                fontSize: 11, background: "var(--surface-raised)", padding: "3px 9px",
                borderRadius: 20, color: "var(--ink-soft)", fontWeight: 600,
                border: "1px solid var(--stroke)",
              }}>
                {REASON_LABELS[req.reason_category] ?? req.reason_category}
              </span>
              <StatusBadge status={req.status} />
            </div>
          </div>

          {req.reason_text && (
            <div style={{
              margin: "0 0 12px", padding: "10px 14px",
              background: "var(--surface-raised)", borderRadius: 10,
              borderLeft: "3px solid var(--primary)",
            }}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, fontStyle: "italic" }}>
                "{req.reason_text}"
              </p>
            </div>
          )}

          <p style={{ margin: "0 0 12px", fontSize: 11, color: "var(--ink-dim)" }}>
            Requested {new Date(req.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>

          <textarea
            placeholder="Optional note to parent (visible after action)…"
            value={actionNote[req.id] ?? ""}
            onChange={(e) => setActionNote((n) => ({ ...n, [req.id]: e.target.value }))}
            style={{
              width: "100%", borderRadius: 10, border: "1px solid var(--stroke)",
              padding: "9px 12px", fontSize: 12.5, resize: "vertical", minHeight: 52,
              fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12,
              color: "var(--ink)", background: "var(--surface)",
              outline: "none",
            }}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => handleAction(req.id, "approve")}
              style={{
                flex: 1, background: "var(--primary)", color: "#fff", border: "none",
                borderRadius: 10, padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}
            >
              Approve & queue call
            </button>
            <button
              onClick={() => handleAction(req.id, "reject")}
              style={{
                flex: 1, background: "var(--danger-soft)", color: "var(--danger)",
                border: "1px solid var(--danger-border)", borderRadius: 10,
                padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}
            >
              Decline
            </button>
          </div>
        </motion.div>
      ))}

      {others.length > 0 && (
        <>
          <p style={{
            margin: "8px 0 4px", fontSize: 11, fontWeight: 700, color: "var(--ink-dim)",
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>History</p>
          {others.map((req) => (
            <div key={req.id} style={{
              background: "var(--surface)", borderRadius: 14,
              border: "1px solid var(--stroke)", padding: "12px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "var(--surface-raised)", fontSize: 15,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {CATEGORY_ICONS[req.reason_category] ?? "📞"}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{req.parent_name}</p>
                  <p style={{ margin: "1px 0 0", fontSize: 11, color: "var(--ink-dim)" }}>
                    {REASON_LABELS[req.reason_category]} · {new Date(req.created_at).toLocaleDateString("en-IN", { dateStyle: "short" })}
                  </p>
                </div>
              </div>
              <StatusBadge status={req.status} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

const OBJECTIVES = ["guardian_meet", "career_guidance", "general_notification"];
const TARGET_TYPES = ["all", "class", "grade"];

function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(DEMO_CAMPAIGNS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", reason_text: "", objective: "general_notification",
    target_type: "all", rate_limit_per_hour: 20,
  });

  function handleCreate() {
    if (!form.name || !form.reason_text) return;
    const newCampaign: Campaign = {
      id: Date.now(), ...form, status: "draft",
      total_calls: 0, completed_calls: 0, failed_calls: 0,
      tokens_estimated: 0, tokens_used: 0, progress_pct: 0, scheduled_at: null,
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    setShowCreate(false);
    setForm({ name: "", reason_text: "", objective: "general_notification", target_type: "all", rate_limit_per_hour: 20 });
  }

  function handleApprove(id: number) {
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: "queued" as CampaignStatus } : c));
  }

  function handlePause(id: number) {
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: "paused" as CampaignStatus } : c));
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: 10, border: "1px solid var(--stroke)",
    padding: "9px 12px", fontSize: 13, boxSizing: "border-box",
    fontFamily: "inherit", color: "var(--ink)", background: "var(--surface)", outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => setShowCreate((v) => !v)}
          style={{
            background: showCreate ? "var(--surface-raised)" : "var(--primary)",
            color: showCreate ? "var(--ink-soft)" : "#fff",
            border: showCreate ? "1px solid var(--stroke)" : "none",
            borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          {showCreate ? "Cancel" : "+ New campaign"}
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.2 }}
            style={{
              background: "var(--surface)", borderRadius: 16,
              border: "2px solid var(--primary)", padding: "22px",
              display: "flex", flexDirection: "column", gap: 14,
              boxShadow: "0 4px 24px rgba(37,99,235,0.08)",
            }}
          >
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "var(--primary)" }}>New Call Campaign</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-dim)", display: "block", marginBottom: 5 }}>Campaign name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sports Day Reminder" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-dim)", display: "block", marginBottom: 5 }}>Objective</label>
                <select value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} style={inputStyle}>
                  {OBJECTIVES.map((o) => <option key={o} value={o}>{OBJ_LABELS[o]}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-dim)", display: "block", marginBottom: 5 }}>Target audience</label>
                <select value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value })} style={inputStyle}>
                  {TARGET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === "all" ? "All parents" : t === "class" ? "Specific classes" : "Specific grades"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-dim)", display: "block", marginBottom: 5 }}>Rate limit (calls / hour)</label>
                <input type="number" min={1} max={100} value={form.rate_limit_per_hour}
                  onChange={(e) => setForm({ ...form, rate_limit_per_hour: Number(e.target.value) })}
                  style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-dim)", display: "block", marginBottom: 5 }}>Script context</label>
              <p style={{ margin: "0 0 6px", fontSize: 11, color: "var(--ink-dim)" }}>
                Fed to the AI voice agent to construct the call. Include dates, locations, and required actions.
              </p>
              <textarea value={form.reason_text} onChange={(e) => setForm({ ...form, reason_text: e.target.value })}
                placeholder="e.g. We are organising a parent-teacher meeting on May 10th to discuss Q1 progress…"
                style={{ ...inputStyle, minHeight: 88, resize: "vertical" }} />
            </div>

            <button onClick={handleCreate} style={{
              background: "var(--primary)", color: "#fff", border: "none",
              borderRadius: 10, padding: "12px 0", fontWeight: 800, fontSize: 14, cursor: "pointer",
            }}>
              Save as draft
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {campaigns.map((camp) => (
        <motion.div key={camp.id} layout variants={fadeUp} initial="hidden" animate="show"
          style={{
            background: "var(--surface)", borderRadius: 16,
            border: "1px solid var(--stroke)", padding: "20px",
            boxShadow: "var(--shadow-sm)",
          }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>{camp.name}</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ink-dim)" }}>
                {OBJ_LABELS[camp.objective]} · {camp.target_type === "all" ? "All parents" : camp.target_type}
                {camp.scheduled_at && ` · ${new Date(camp.scheduled_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}`}
              </p>
            </div>
            <StatusBadge status={camp.status} />
          </div>

          <div style={{
            margin: "0 0 14px", padding: "10px 14px",
            background: "var(--surface-raised)", borderRadius: 10,
            borderLeft: "3px solid var(--stroke-strong)",
          }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.55 }}>
              {camp.reason_text.length > 130 ? camp.reason_text.slice(0, 130) + "…" : camp.reason_text}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Total",       value: camp.total_calls,      color: "var(--primary)" },
              { label: "Completed",   value: camp.completed_calls,  color: "var(--success)" },
              { label: "Failed",      value: camp.failed_calls,     color: "var(--danger)" },
              { label: "Tokens used", value: `${camp.tokens_used}/${camp.tokens_estimated}`, color: "var(--warning)" },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: "var(--surface-raised)", borderRadius: 12,
                padding: "10px", textAlign: "center", border: "1px solid var(--stroke)",
              }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--ink-dim)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {camp.total_calls > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 500 }}>Progress</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>{camp.progress_pct}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: "var(--surface-raised)", overflow: "hidden", border: "1px solid var(--stroke)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${camp.progress_pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{
                    height: "100%", borderRadius: 4,
                    background: camp.progress_pct === 100 ? "var(--success)" : "var(--primary)",
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {camp.status === "draft" && (
              <button onClick={() => handleApprove(camp.id)} style={{
                background: "var(--primary)", color: "#fff", border: "none",
                borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}>
                Approve & queue
              </button>
            )}
            {["queued", "running"].includes(camp.status) && (
              <button onClick={() => handlePause(camp.id)} style={{
                background: "var(--warning-soft)", color: "var(--warning)",
                border: "1px solid var(--warning-border)", borderRadius: 8,
                padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}>
                Pause
              </button>
            )}
            {camp.status === "paused" && (
              <button onClick={() => handleApprove(camp.id)} style={{
                background: "var(--success-soft)", color: "var(--success)",
                border: "1px solid var(--success-border)", borderRadius: 8,
                padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}>
                Resume
              </button>
            )}
            <button style={{
              background: "var(--surface-raised)", color: "var(--ink-soft)",
              border: "1px solid var(--stroke)", borderRadius: 8,
              padding: "8px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer",
            }}>
              View calls
            </button>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-dim)" }}>
              {camp.rate_limit_per_hour} calls / hr
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CallsPage() {
  const [activeTab, setActiveTab] = useState<"requests" | "campaigns">("requests");
  const pendingCount = DEMO_REQUESTS.filter((r) => r.status === "pending").length;
  const completedToday = DEMO_REQUESTS.filter((r) => r.status === "completed").length;
  const activeCampaigns = DEMO_CAMPAIGNS.filter((c) => ["running", "queued"].includes(c.status)).length;

  return (
    <DashboardShell>
      <div style={{ padding: "24px 28px 48px" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Call Management
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--ink-soft)" }}>
              Approve parent callbacks and schedule AI-powered mass campaigns
            </p>
          </div>
          <button style={{
            background: "var(--primary)", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            + New campaign
          </button>
        </motion.div>

        {/* KPI Strip */}
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}
        >
          <StatCard label="Pending Requests"   value={pendingCount}    sub="Today"     accent="#f59e0b" icon="⏳" />
          <StatCard label="Tokens Remaining"   value={TOKEN_BALANCE}  sub="47 / 100"  accent="#2563eb" icon="🪙" />
          <StatCard label="Active Campaigns"   value={activeCampaigns}                accent="#7c3aed" icon="📣" />
          <StatCard label="Completed Calls"    value={completedToday} sub="This week"  accent="#16a34a" icon="✅" />
        </motion.div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

          {/* Left: tabs + content */}
          <div>
            {/* Tab switcher */}
            <div style={{
              display: "flex", gap: 4, marginBottom: 18,
              background: "var(--surface-raised)", borderRadius: 12, padding: 4,
              border: "1px solid var(--stroke)",
            }}>
              {(["requests", "campaigns"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: "8px 0", border: "none", borderRadius: 9,
                  background: activeTab === tab ? "var(--surface)" : "transparent",
                  color: activeTab === tab ? "var(--primary)" : "var(--ink-dim)",
                  fontWeight: activeTab === tab ? 700 : 500,
                  fontSize: 13, cursor: "pointer",
                  boxShadow: activeTab === tab ? "var(--shadow-sm)" : "none",
                  transition: "all 0.15s ease",
                }}>
                  {tab === "requests"
                    ? `Call Requests${pendingCount > 0 ? ` (${pendingCount})` : ""}`
                    : "Mass Campaigns"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "requests" ? <RequestsTab /> : <CampaignsTab />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: token gauge + activity */}
          <div style={{ position: "sticky", top: 24 }}>
            <TokenGauge balance={TOKEN_BALANCE} total={TOKEN_TOTAL} />
            <RecentActivity />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
