"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { DashboardShell } from "../../../components/DashboardShell";
import styles from "../../../components/dashboard.module.css";

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

const DEMO_REQUESTS: CallRequest[] = [
  { id: 1, parent_name: "Priya Mehta",    parent_phone: "+91 98765 43210", reason_category: "academic",   reason_text: "Concerned about maths test results",             status: "pending",   created_at: "2026-04-25T09:14:00" },
  { id: 2, parent_name: "Rajan Sinha",    parent_phone: "+91 99001 23456", reason_category: "transport",  reason_text: "Bus was late by 25 min on Wednesday",            status: "pending",   created_at: "2026-04-25T08:50:00" },
  { id: 3, parent_name: "Anita Sharma",   parent_phone: "+91 77889 00112", reason_category: "behavioral", reason_text: "",                                               status: "approved",  created_at: "2026-04-24T16:30:00" },
  { id: 4, parent_name: "Deepak Nair",    parent_phone: "+91 90011 22334", reason_category: "fees",       reason_text: "Question about annual fee structure",            status: "completed", created_at: "2026-04-23T11:00:00" },
  { id: 5, parent_name: "Sunita Kapoor",  parent_phone: "+91 88776 55443", reason_category: "general",    reason_text: "Want to discuss school timing change",           status: "rejected",  created_at: "2026-04-22T14:20:00" },
];

const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 1, name: "Parent-Teacher Meet Q1",  reason_text: "We are organising a parent-teacher meeting on May 10th to discuss student progress for Q1. Please come at the time slots assigned via SMS.",
    objective: "guardian_meet", target_type: "all", status: "running",
    total_calls: 312, completed_calls: 187, failed_calls: 8, tokens_estimated: 312, tokens_used: 195, rate_limit_per_hour: 40, progress_pct: 60, scheduled_at: "2026-04-25T08:00:00",
  },
  {
    id: 2, name: "Class 10 Career Day",     reason_text: "We would like to discuss Class 10 students' career interests ahead of the upcoming Career Guidance Day on May 15th. Please share your child's aspirations.",
    objective: "career_guidance", target_type: "class", status: "queued",
    total_calls: 64, completed_calls: 0, failed_calls: 0, tokens_estimated: 64, tokens_used: 0, rate_limit_per_hour: 20, progress_pct: 0, scheduled_at: "2026-04-26T09:00:00",
  },
  {
    id: 3, name: "Sports Day Reminder",     reason_text: "Sports Day is this Saturday, April 27th. Please ensure your child arrives by 8:00 AM in sports attire. Spectator entry from 9 AM Gate 2.",
    objective: "general_notification", target_type: "all", status: "completed",
    total_calls: 298, completed_calls: 281, failed_calls: 17, tokens_estimated: 298, tokens_used: 298, rate_limit_per_hour: 60, progress_pct: 100, scheduled_at: "2026-04-24T07:00:00",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:   { bg: "#fffbeb", text: "#b45309", dot: "#f59e0b" },
  approved:  { bg: "#ecfdf5", text: "#065f46", dot: "#10b981" },
  rejected:  { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444" },
  calling:   { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
  completed: { bg: "#f0fdf4", text: "#166534", dot: "#22c55e" },
  cancelled: { bg: "#f4f4f5", text: "#52525b", dot: "#a1a1aa" },
  draft:     { bg: "#f4f4f5", text: "#52525b", dot: "#a1a1aa" },
  queued:    { bg: "#f5f3ff", text: "#5b21b6", dot: "#8b5cf6" },
  running:   { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
  paused:    { bg: "#fffbeb", text: "#92400e", dot: "#f59e0b" },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.cancelled;
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const REASON_LABELS: Record<string, string> = {
  academic: "Academic", behavioral: "Behavioural", transport: "Transport", fees: "Fees", general: "General",
};

const OBJ_LABELS: Record<string, string> = {
  guardian_meet: "Guardian Meet", career_guidance: "Career Guidance", general_notification: "Notification",
};

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

// ── Token balance banner ──────────────────────────────────────────────────────

function TokenBanner({ balance }: { balance: number }) {
  const low = balance < 20;
  const critical = balance < 5;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: critical ? "#fef2f2" : low ? "#fffbeb" : "#eef2ff",
        border: `1px solid ${critical ? "#fca5a5" : low ? "#fcd34d" : "#c7d2fe"}`,
        borderRadius: 16, padding: "14px 20px", marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 28 }}>🪙</span>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#52525b" }}>Call Tokens</p>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: critical ? "#dc2626" : low ? "#d97706" : "#4338ca", lineHeight: 1.1 }}>
            {balance}
            <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 6, color: "#71717a" }}>remaining</span>
          </p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {critical && (
          <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>⚠️ Critically low — campaigns may pause</span>
        )}
        {low && !critical && (
          <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>⚠️ Low tokens — top up before next campaign</span>
        )}
        <button
          style={{
            background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10,
            padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >
          + Get more tokens
        </button>
      </div>
    </motion.div>
  );
}

// ── Call Requests tab ─────────────────────────────────────────────────────────

function RequestsTab() {
  const [requests, setRequests] = useState<CallRequest[]>(DEMO_REQUESTS);
  const [actionNote, setActionNote] = useState<Record<number, string>>({});

  function handleAction(id: number, action: "approve" | "reject") {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r
      )
    );
  }

  const pending   = requests.filter((r) => r.status === "pending");
  const others    = requests.filter((r) => r.status !== "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {pending.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#a1a1aa" }}>
          <p style={{ fontSize: 32 }}>✅</p>
          <p style={{ fontSize: 14, fontWeight: 600 }}>No pending call requests</p>
        </div>
      )}

      {pending.map((req) => (
        <motion.div key={req.id} layout variants={fadeUp} initial="hidden" animate="show"
          style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e2ee", padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#0f0f1a" }}>{req.parent_name}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#52525b" }}>{req.parent_phone}</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 8px", borderRadius: 8, color: "#475569", fontWeight: 600 }}>
                {REASON_LABELS[req.reason_category] ?? req.reason_category}
              </span>
              <StatusBadge status={req.status} />
            </div>
          </div>

          {req.reason_text && (
            <p style={{ margin: "0 0 10px 0", fontSize: 13, color: "#52525b", background: "#f8f8fc", borderRadius: 10, padding: "8px 12px" }}>
              "{req.reason_text}"
            </p>
          )}

          <p style={{ margin: "0 0 10px 0", fontSize: 11, color: "#a1a1aa" }}>
            Requested {new Date(req.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>

          <textarea
            placeholder="Optional note to parent (visible after action)…"
            value={actionNote[req.id] ?? ""}
            onChange={(e) => setActionNote((n) => ({ ...n, [req.id]: e.target.value }))}
            style={{ width: "100%", borderRadius: 10, border: "1px solid #e2e2ee", padding: "8px 12px", fontSize: 12, resize: "vertical", minHeight: 52, fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10, color: "#0f0f1a" }}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => handleAction(req.id, "approve")}
              style={{ flex: 1, background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              ✅ Approve — queue call
            </button>
            <button
              onClick={() => handleAction(req.id, "reject")}
              style={{ flex: 1, background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              ✕ Reject
            </button>
          </div>
        </motion.div>
      ))}

      {others.length > 0 && (
        <>
          <p style={{ margin: "8px 0 0 0", fontSize: 12, fontWeight: 700, color: "#a1a1aa", letterSpacing: "0.6px", textTransform: "uppercase" }}>
            History
          </p>
          {others.map((req) => (
            <div key={req.id} style={{ background: "#fafafa", borderRadius: 14, border: "1px solid #e2e2ee", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{req.parent_name}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#71717a" }}>{REASON_LABELS[req.reason_category]}</p>
              </div>
              <StatusBadge status={req.status} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── Campaigns tab ─────────────────────────────────────────────────────────────

const OBJECTIVES = ["guardian_meet", "career_guidance", "general_notification"];
const TARGET_TYPES = ["all", "class", "grade"];

function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(DEMO_CAMPAIGNS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", reason_text: "", objective: "general_notification", target_type: "all", rate_limit_per_hour: 20 });

  function handleCreate() {
    if (!form.name || !form.reason_text) return;
    const newCampaign: Campaign = {
      id: Date.now(), ...form,
      target_ids: [], status: "draft",
      total_calls: 0, completed_calls: 0, failed_calls: 0,
      tokens_estimated: 0, tokens_used: 0,
      progress_pct: 0, scheduled_at: null,
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => setShowCreate((v) => !v)}
          style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          {showCreate ? "✕ Cancel" : "+ New campaign"}
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            style={{ background: "#fff", borderRadius: 18, border: "2px solid #c7d2fe", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}
          >
            <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#4338ca" }}>New Call Campaign</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#71717a", display: "block", marginBottom: 4 }}>Campaign name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sports Day Reminder"
                  style={{ width: "100%", borderRadius: 10, border: "1px solid #e2e2ee", padding: "9px 12px", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit", color: "#0f0f1a" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#71717a", display: "block", marginBottom: 4 }}>Objective</label>
                <select value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  style={{ width: "100%", borderRadius: 10, border: "1px solid #e2e2ee", padding: "9px 12px", fontSize: 13, fontFamily: "inherit", color: "#0f0f1a", background: "#fff" }}>
                  {OBJECTIVES.map((o) => <option key={o} value={o}>{OBJ_LABELS[o]}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#71717a", display: "block", marginBottom: 4 }}>Target audience</label>
                <select value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value })}
                  style={{ width: "100%", borderRadius: 10, border: "1px solid #e2e2ee", padding: "9px 12px", fontSize: 13, fontFamily: "inherit", color: "#0f0f1a", background: "#fff" }}>
                  {TARGET_TYPES.map((t) => <option key={t} value={t}>{t === "all" ? "All parents" : t === "class" ? "Specific classes" : "Specific grades"}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#71717a", display: "block", marginBottom: 4 }}>Rate limit (calls / hour)</label>
                <input type="number" min={1} max={100} value={form.rate_limit_per_hour}
                  onChange={(e) => setForm({ ...form, rate_limit_per_hour: Number(e.target.value) })}
                  style={{ width: "100%", borderRadius: 10, border: "1px solid #e2e2ee", padding: "9px 12px", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit", color: "#0f0f1a" }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#71717a", display: "block", marginBottom: 4 }}>Reason / message context</label>
              <p style={{ margin: "0 0 6px 0", fontSize: 11, color: "#a1a1aa" }}>
                This text is fed to the AI voice agent to construct the call script. Be specific — include dates, locations, actions required.
              </p>
              <textarea value={form.reason_text} onChange={(e) => setForm({ ...form, reason_text: e.target.value })}
                placeholder="e.g. We are organising a parent-teacher meeting on May 10th to discuss Q1 progress. Please arrive at your assigned time slot…"
                style={{ width: "100%", borderRadius: 10, border: "1px solid #e2e2ee", padding: "10px 12px", fontSize: 13, minHeight: 90, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", color: "#0f0f1a" }} />
            </div>

            <button onClick={handleCreate}
              style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
              Save as draft
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign list */}
      {campaigns.map((camp) => (
        <motion.div key={camp.id} layout variants={fadeUp} initial="hidden" animate="show"
          style={{ background: "#fff", borderRadius: 18, border: "1px solid #e2e2ee", padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#0f0f1a" }}>{camp.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#71717a", marginTop: 2 }}>
                {OBJ_LABELS[camp.objective]} · {camp.target_type === "all" ? "All parents" : camp.target_type}
                {camp.scheduled_at && ` · Scheduled ${new Date(camp.scheduled_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}`}
              </p>
            </div>
            <StatusBadge status={camp.status} />
          </div>

          {/* Reason preview */}
          <p style={{ margin: "0 0 12px 0", fontSize: 12, color: "#52525b", background: "#f8f8fc", borderRadius: 10, padding: "8px 12px", lineHeight: 1.6 }}>
            <strong>Script context:</strong> {camp.reason_text.length > 120 ? camp.reason_text.slice(0, 120) + "…" : camp.reason_text}
          </p>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
            {[
              { label: "Total", value: camp.total_calls, color: "#4f46e5" },
              { label: "Done",  value: camp.completed_calls, color: "#16a34a" },
              { label: "Failed", value: camp.failed_calls, color: "#dc2626" },
              { label: "Tokens used", value: `${camp.tokens_used} / ${camp.tokens_estimated}`, color: "#d97706" },
            ].map((stat) => (
              <div key={stat.label} style={{ background: "#f8f8fc", borderRadius: 12, padding: "10px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</p>
                <p style={{ margin: 0, fontSize: 10, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {camp.total_calls > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "#71717a" }}>Progress</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5" }}>{camp.progress_pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "#e2e2ee", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${camp.progress_pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ height: "100%", background: camp.progress_pct === 100 ? "#22c55e" : "#4f46e5", borderRadius: 3 }}
                />
              </div>
            </div>
          )}

          {/* Rate limit indicator */}
          <p style={{ margin: "0 0 12px 0", fontSize: 11, color: "#a1a1aa" }}>
            ⏱ Rate limit: {camp.rate_limit_per_hour} calls / hour · 1 token per call
          </p>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {camp.status === "draft" && (
              <button onClick={() => handleApprove(camp.id)}
                style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                ✅ Approve & queue
              </button>
            )}
            {["queued", "running"].includes(camp.status) && (
              <button onClick={() => handlePause(camp.id)}
                style={{ background: "#fffbeb", color: "#92400e", border: "1px solid #fcd34d", borderRadius: 9, padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                ⏸ Pause
              </button>
            )}
            {camp.status === "paused" && (
              <button onClick={() => handleApprove(camp.id)}
                style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #6ee7b7", borderRadius: 9, padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                ▶ Resume
              </button>
            )}
            <button
              style={{ background: "#f8f8fc", color: "#52525b", border: "1px solid #e2e2ee", borderRadius: 9, padding: "8px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              View calls
            </button>
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

  return (
    <DashboardShell>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f0f1a" }}>
          📞 Call Management
        </h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#52525b" }}>
          Approve parent call-back requests and schedule mass campaigns. Each call costs 1 token.
        </p>
      </motion.div>

      {/* Token banner */}
      <TokenBanner balance={TOKEN_BALANCE} />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f4f4f5", borderRadius: 12, padding: 4 }}>
        {(["requests", "campaigns"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: "9px 0", border: "none", borderRadius: 9,
              background: activeTab === tab ? "#fff" : "transparent",
              color: activeTab === tab ? "#4338ca" : "#71717a",
              fontWeight: activeTab === tab ? 800 : 600,
              fontSize: 13, cursor: "pointer",
              boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
            {tab === "requests"
              ? `Call Requests${pendingCount > 0 ? ` (${pendingCount} pending)` : ""}`
              : "Mass Campaigns"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}>
          {activeTab === "requests" ? <RequestsTab /> : <CampaignsTab />}
        </motion.div>
      </AnimatePresence>
    </DashboardShell>
  );
}
