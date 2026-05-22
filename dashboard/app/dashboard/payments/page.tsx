"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled";
type Frequency     = "monthly" | "quarterly" | "annual" | "one_time";

interface FeeCategory {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface FeeStructure {
  id: number;
  category: number;
  category_name: string;
  classroom: number | null;
  classroom_name: string | null;
  amount: number;
  frequency: Frequency;
  due_day: number;
  academic_year: string;
  is_active: boolean;
}

interface FeeInvoice {
  id: number;
  student: number;
  student_name: string;
  category_name: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  paid_at: string | null;
}

interface CollectionSummary {
  total_collected: number;
  pending_count: number;
  pending_amount: number;
  overdue_count: number;
  overdue_amount: number;
  paid_count: number;
}

interface LinkedAccount {
  account_id: string;
  name: string;
  email: string;
  status: "created" | "activated" | "suspended";
}

// ── Animations ────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.4, 0.25, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  pending:   { bg: "#fef9c3", text: "#854d0e" },
  paid:      { bg: "#dcfce7", text: "#166534" },
  overdue:   { bg: "#fee2e2", text: "#991b1b" },
  cancelled: { bg: "#f1f5f9", text: "#475569" },
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span style={{
      background: c.bg, color: c.text,
      fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 99,
      letterSpacing: 0.3, textTransform: "uppercase" as const,
    }}>
      {status}
    </span>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = "overview" | "structures" | "invoices" | "razorpay";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview",   label: "Overview"       },
  { id: "structures", label: "Fee Structure"  },
  { id: "invoices",   label: "Invoices"       },
  { id: "razorpay",   label: "Razorpay Route" },
];

// ── Add Structure Modal ───────────────────────────────────────────────────────

function AddStructureModal({
  categories, onClose, onSaved,
}: { categories: FeeCategory[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    category: String(categories[0]?.id ?? ""),
    classroom: "", amount: "", frequency: "monthly", due_day: "10", academic_year: "2025-26",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!form.amount) { setErr("Amount is required."); return; }
    setSaving(true);
    setErr("");
    try {
      await apiFetch("/api/payments/structures/", {
        method: "POST",
        body: JSON.stringify({
          category:      Number(form.category),
          classroom:     form.classroom ? Number(form.classroom) : null,
          amount:        Number(form.amount),
          frequency:     form.frequency,
          due_day:       Number(form.due_day),
          academic_year: form.academic_year,
        }),
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={overlayStyle}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={modalStyle}>
        <h2 style={modalTitleStyle}>Add Fee Structure</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={labelStyle}>
            Category
            <select style={inputStyle} value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {categories.filter(c => c.is_active).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Classroom <span style={{ color: "#94a3b8", fontWeight: 400 }}>(leave blank for all)</span>
            <input style={inputStyle} placeholder="e.g. Class 10A" value={form.classroom}
              onChange={e => setForm(p => ({ ...p, classroom: e.target.value }))} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>
              Amount (₹)
              <input style={inputStyle} type="number" placeholder="e.g. 4500" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            </label>
            <label style={labelStyle}>
              Due Day (of month)
              <input style={inputStyle} type="number" min="1" max="28" value={form.due_day}
                onChange={e => setForm(p => ({ ...p, due_day: e.target.value }))} />
            </label>
          </div>
          <label style={labelStyle}>
            Frequency
            <select style={inputStyle} value={form.frequency}
              onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
              <option value="one_time">One-time</option>
            </select>
          </label>
          <label style={labelStyle}>
            Academic Year
            <input style={inputStyle} value={form.academic_year}
              onChange={e => setForm(p => ({ ...p, academic_year: e.target.value }))} />
          </label>
          {err && <p style={{ color: "#dc2626", fontSize: 13 }}>{err}</p>}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnSecondary} disabled={saving}>Cancel</button>
          <button onClick={handleSave} style={btnPrimary} disabled={saving}>
            {saving ? "Saving…" : "Save Structure"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Add Category Modal ────────────────────────────────────────────────────────

function AddCategoryModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleSave() {
    if (!form.name.trim()) { setErr("Name is required."); return; }
    setSaving(true);
    setErr("");
    try {
      await apiFetch("/api/payments/categories/", {
        method: "POST",
        body: JSON.stringify({ name: form.name, description: form.description }),
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={overlayStyle}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ ...modalStyle, width: 400 }}>
        <h2 style={modalTitleStyle}>Add Fee Category</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={labelStyle}>
            Name
            <input style={inputStyle} placeholder="e.g. Lab Fee" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </label>
          <label style={labelStyle}>
            Description
            <input style={inputStyle} placeholder="Short description" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </label>
          {err && <p style={{ color: "#dc2626", fontSize: 13 }}>{err}</p>}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnSecondary} disabled={saving}>Cancel</button>
          <button onClick={handleSave} style={btnPrimary} disabled={saving}>
            {saving ? "Saving…" : "Save Category"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [tab, setTab]                             = useState<Tab>("overview");
  const [invoiceFilter, setInvoiceFilter]         = useState<InvoiceStatus | "all">("all");
  const [showAddStructure, setShowAddStructure]   = useState(false);
  const [showAddCategory, setShowAddCategory]     = useState(false);

  const [summary, setSummary]           = useState<CollectionSummary | null>(null);
  const [categories, setCategories]     = useState<FeeCategory[]>([]);
  const [structures, setStructures]     = useState<FeeStructure[]>([]);
  const [invoices, setInvoices]         = useState<FeeInvoice[]>([]);
  const [linkedAccount, setLinkedAccount] = useState<LinkedAccount | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, catData, strData, invData] = await Promise.all([
        apiFetch<CollectionSummary>("/api/payments/summary/"),
        apiFetch<FeeCategory[]>("/api/payments/categories/"),
        apiFetch<FeeStructure[]>("/api/payments/structures/"),
        apiFetch<FeeInvoice[]>("/api/payments/invoices/"),
      ]);
      setSummary(sumData);
      setCategories(catData);
      setStructures(strData);
      setInvoices(invData);

      apiFetch<LinkedAccount>("/api/payments/linked-account/")
        .then(la => setLinkedAccount(la))
        .catch(() => setLinkedAccount(null));
    } catch (e: any) {
      setError(e.message ?? "Failed to load payments data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filteredInvoices = invoiceFilter === "all"
    ? invoices
    : invoices.filter(i => i.status === invoiceFilter);

  const totalInvoiced = summary
    ? summary.total_collected + summary.pending_amount + summary.overdue_amount
    : 0;
  const collectionRate = totalInvoiced > 0
    ? Math.round((summary!.total_collected / totalInvoiced) * 100)
    : 0;

  if (loading) {
    return (
      <DashboardShell>
        <div style={{ padding: "32px 28px" }}>
          <div style={{ height: 32, width: 200, borderRadius: 8, background: "#f1f5f9", marginBottom: 8 }} />
          <div style={{ height: 16, width: 300, borderRadius: 6, background: "#f8fafc", marginBottom: 32 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[1, 2].map(i => (
                  <div key={i} style={{ height: 120, borderRadius: 18, background: "#f1f5f9" }} />
                ))}
              </div>
              <div style={{ height: 220, borderRadius: 18, background: "#f1f5f9" }} />
              <div style={{ height: 280, borderRadius: 18, background: "#f1f5f9" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ height: 200, borderRadius: 18, background: "#f1f5f9" }} />
              <div style={{ height: 240, borderRadius: 18, background: "#f1f5f9" }} />
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div style={{ padding: "32px 28px" }}>
          <div style={card}>
            <p style={{ color: "#dc2626", fontSize: 14 }}>⚠️ {error}</p>
            <button onClick={loadAll} style={{ ...btnPrimary, marginTop: 12 }}>Retry</button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div style={{ padding: "28px 28px 48px" }}>

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5, margin: 0 }}>
              Fee Management
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, margin: 0 }}>
              Set up fee structures, track collections, and manage Razorpay payouts.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowAddCategory(true)} style={btnSecondary}>
              + Category
            </button>
            <button onClick={() => setShowAddStructure(true)} style={btnPrimary}>
              + Fee Structure
            </button>
          </div>
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28, borderBottom: "1.5px solid #e2e8f0", paddingBottom: 0 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "9px 18px",
                borderRadius: "10px 10px 0 0",
                border: "none",
                cursor: "pointer",
                fontWeight: tab === t.id ? 800 : 600,
                fontSize: 13.5,
                color: tab === t.id ? "#4f46e5" : "#64748b",
                background: tab === t.id ? "#eef2ff" : "transparent",
                borderBottom: tab === t.id ? "2.5px solid #4f46e5" : "2.5px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ─────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* ════════ OVERVIEW ════════ */}
          {tab === "overview" && (
            <motion.div key="overview" variants={stagger} initial="hidden" animate="show">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 316px", gap: 20, alignItems: "start" }}>

                {/* LEFT column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* KPI cards — 2-up matching reference */}
                  <motion.div variants={fadeUp}
                    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <KpiCard
                      icon={<CurrencyIcon />}
                      accent="#16a34a"
                      accentBg="#f0fdf4"
                      label="Total Collected"
                      value={`₹${(summary!.total_collected / 1000).toFixed(1)}k`}
                      sub={`${summary!.paid_count} paid invoices`}
                    />
                    <KpiCard
                      icon={<ClockIcon />}
                      accent="#d97706"
                      accentBg="#fffbeb"
                      label="Pending Amount"
                      value={`₹${(summary!.pending_amount / 1000).toFixed(1)}k`}
                      sub={`${summary!.pending_count} invoices due`}
                    />
                  </motion.div>

                  {/* Collection performance card */}
                  <motion.div variants={fadeUp} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 }}>
                          Collection Performance
                        </p>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span style={{ fontSize: 38, fontWeight: 900, color: "#0f172a", letterSpacing: -1 }}>
                            {collectionRate}%
                          </span>
                          <span style={{
                            fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                            background: collectionRate >= 80 ? "#dcfce7" : "#fef9c3",
                            color:      collectionRate >= 80 ? "#16a34a" : "#854d0e",
                          }}>
                            Collected
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                          ₹{(summary!.total_collected / 1000).toFixed(1)}k of ₹{(totalInvoiced / 1000).toFixed(1)}k total
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Overdue</p>
                        <p style={{ fontSize: 22, fontWeight: 900, color: "#dc2626" }}>
                          ₹{(summary!.overdue_amount / 1000).toFixed(1)}k
                        </p>
                        <p style={{ fontSize: 12, color: "#94a3b8" }}>{summary!.overdue_count} invoices</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ height: 10, background: "#f1f5f9", borderRadius: 999, overflow: "hidden", position: "relative" }}>
                        <div style={{
                          position: "absolute", left: 0, top: 0, bottom: 0,
                          width: `${collectionRate}%`,
                          background: "linear-gradient(90deg, #16a34a, #22c55e)",
                          borderRadius: 999,
                          transition: "width 0.8s cubic-bezier(0.25,0.4,0.25,1)",
                        }} />
                        {/* overdue portion */}
                        {totalInvoiced > 0 && (
                          <div style={{
                            position: "absolute", left: `${collectionRate}%`, top: 0, bottom: 0,
                            width: `${Math.round((summary!.overdue_amount / totalInvoiced) * 100)}%`,
                            background: "#fca5a5",
                            borderRadius: 999,
                          }} />
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
                          ● Collected {collectionRate}%
                        </span>
                        {totalInvoiced > 0 && (
                          <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>
                            ● Overdue {Math.round((summary!.overdue_amount / totalInvoiced) * 100)}%
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                          ● Pending
                        </span>
                      </div>
                    </div>

                    {/* Split pills */}
                    <div style={{ display: "flex", gap: 10, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                      <SplitPill label="School receives" pct="98%" color="#16a34a" />
                      <SplitPill label="Skippo commission" pct="2%"  color="#4f46e5" />
                    </div>
                  </motion.div>

                  {/* Recent invoices */}
                  <motion.div variants={fadeUp} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 style={cardTitleStyle}>Recent Invoices</h3>
                      <button onClick={() => setTab("invoices")} style={btnSecondary}>View all →</button>
                    </div>
                    <InvoiceTable invoices={invoices.slice(0, 5)} />
                  </motion.div>
                </div>

                {/* RIGHT sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* Razorpay Route card — gradient like the reference image's promo card */}
                  <motion.div variants={fadeUp} style={{
                    borderRadius: 20,
                    background: "linear-gradient(135deg, #ffe4d9 0%, #ffd6c8 40%, #fbbfb0 100%)",
                    padding: 24,
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    {/* decorative circle */}
                    <div style={{
                      position: "absolute", right: -30, top: -30,
                      width: 120, height: 120, borderRadius: "50%",
                      background: "rgba(255,255,255,0.18)",
                    }} />
                    <div style={{
                      position: "absolute", right: 10, bottom: -20,
                      width: 80, height: 80, borderRadius: "50%",
                      background: "rgba(255,255,255,0.12)",
                    }} />

                    {linkedAccount ? (
                      <>
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          background: "rgba(255,255,255,0.5)",
                          borderRadius: 999, padding: "4px 10px",
                          fontSize: 11, fontWeight: 700,
                          color: linkedAccount.status === "activated" ? "#16a34a" : "#854d0e",
                          marginBottom: 14,
                        }}>
                          <span style={{
                            width: 7, height: 7, borderRadius: "50%",
                            background: linkedAccount.status === "activated" ? "#16a34a" : "#d97706",
                            display: "inline-block",
                          }} />
                          {linkedAccount.status.toUpperCase()}
                        </div>
                        <p style={{ fontSize: 20, fontWeight: 900, color: "#1e293b", letterSpacing: -0.5, marginBottom: 4 }}>
                          {linkedAccount.name}
                        </p>
                        <p style={{ fontSize: 13, color: "#475569", marginBottom: 16 }}>{linkedAccount.email}</p>
                        <div style={{ background: "rgba(255,255,255,0.55)", borderRadius: 12, padding: "10px 14px" }}>
                          <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 2 }}>Account ID</p>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", fontFamily: "monospace" }}>
                            {linkedAccount.account_id}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", marginBottom: 8 }}>
                          Razorpay Route
                        </p>
                        <p style={{ fontSize: 18, fontWeight: 900, color: "#1e293b", letterSpacing: -0.5, marginBottom: 8 }}>
                          Enable Automated Payouts
                        </p>
                        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, marginBottom: 16 }}>
                          Link your school's bank account via Razorpay Route for instant fee splits.
                        </p>
                        <button
                          onClick={() => setTab("razorpay")}
                          style={{
                            background: "#1e293b", color: "#fff",
                            border: "none", borderRadius: 12,
                            padding: "10px 18px", fontSize: 13, fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                          }}
                        >
                          ⚡ Set Up Account
                        </button>
                      </>
                    )}
                  </motion.div>

                  {/* Fee collection progress — like Learning Task Progress in the reference */}
                  <motion.div variants={fadeUp} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 style={cardTitleStyle}>Collection Progress</h3>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                        background: "#eef2ff", color: "#4f46e5",
                      }}>
                        This Month
                      </span>
                    </div>

                    {/* Overall progress bar */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 28, fontWeight: 900, color: "#0f172a" }}>{collectionRate}%</span>
                        <span style={{ fontSize: 13, color: "#94a3b8", alignSelf: "flex-end", marginBottom: 4 }}>Completed</span>
                      </div>
                      <div style={{ height: 8, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 999,
                          width: `${collectionRate}%`,
                          background: "linear-gradient(90deg, #22c55e, #16a34a)",
                          transition: "width 1s ease",
                        }} />
                      </div>
                    </div>

                    {/* Status breakdown */}
                    {[
                      { label: "Paid",     count: summary!.paid_count,    amount: summary!.total_collected, color: "#16a34a", bg: "#dcfce7", icon: "✓" },
                      { label: "Pending",  count: summary!.pending_count, amount: summary!.pending_amount,  color: "#d97706", bg: "#fef9c3", icon: "⏳" },
                      { label: "Overdue",  count: summary!.overdue_count, amount: summary!.overdue_amount,  color: "#dc2626", bg: "#fee2e2", icon: "⚠" },
                    ].map(item => (
                      <div key={item.label} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 0", borderBottom: "1px solid #f8fafc",
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 10,
                          background: item.bg, color: item.color,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, fontWeight: 700, flexShrink: 0,
                        }}>
                          {item.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{item.label}</p>
                          <p style={{ fontSize: 12, color: "#94a3b8" }}>{item.count} invoices</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: item.color }}>
                            ₹{(item.amount / 1000).toFixed(1)}k
                          </p>
                          <div style={{ width: 24, height: 24, borderRadius: 6,
                            background: item.bg, display: "flex", alignItems: "center", justifyContent: "center",
                            marginLeft: "auto", marginTop: 2 }}>
                            {item.count > 0 ? (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill={item.color}>
                                <path d="M10 4L5 9 2 6" stroke={item.color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                              </svg>
                            ) : (
                              <div style={{ width: 8, height: 2, background: "#cbd5e1", borderRadius: 1 }} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════ FEE STRUCTURES ════════ */}
          {tab === "structures" && (
            <motion.div key="structures" variants={stagger} initial="hidden" animate="show">
              <motion.div variants={fadeUp} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={cardTitleStyle}>Fee Categories</h3>
                  <button onClick={() => setShowAddCategory(true)} style={btnPrimary}>+ Add Category</button>
                </div>
                {categories.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: 14 }}>No categories yet.</p>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10 }}>
                    {categories.map(cat => (
                      <div key={cat.id} style={{
                        padding: "8px 16px", borderRadius: 12,
                        background: cat.is_active ? "#eef2ff" : "#f1f5f9",
                        color: cat.is_active ? "#3730a3" : "#94a3b8",
                        fontSize: 13, fontWeight: 700,
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        {cat.name}
                        {!cat.is_active && <span style={{ fontSize: 11, color: "#94a3b8" }}>inactive</span>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div variants={fadeUp} style={{ ...card, marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={cardTitleStyle}>Fee Structures</h3>
                  <button onClick={() => setShowAddStructure(true)} style={btnPrimary}>+ Add Structure</button>
                </div>
                {structures.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: 14 }}>No structures yet.</p>
                ) : (
                  <div style={{ overflowX: "auto" as const }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          {["Category", "Classroom", "Amount", "Frequency", "Due Day", "Year", "Status"].map(h => (
                            <th key={h} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {structures.map(s => (
                          <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={tdStyle}>{s.category_name}</td>
                            <td style={tdStyle}>
                              {s.classroom_name ?? <span style={{ color: "#94a3b8" }}>All classes</span>}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 700 }}>₹{s.amount.toLocaleString()}</td>
                            <td style={tdStyle}>{FREQ_LABEL[s.frequency]}</td>
                            <td style={tdStyle}>{s.due_day}th</td>
                            <td style={tdStyle}>{s.academic_year}</td>
                            <td style={tdStyle}>
                              <span style={{
                                background: s.is_active ? "#dcfce7" : "#f1f5f9",
                                color:      s.is_active ? "#166534" : "#94a3b8",
                                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                              }}>
                                {s.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ════════ INVOICES ════════ */}
          {tab === "invoices" && (
            <motion.div key="invoices" variants={stagger} initial="hidden" animate="show">
              <motion.div variants={fadeUp} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap" as const, gap: 12 }}>
                  <h3 style={cardTitleStyle}>All Invoices</h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["all", "pending", "paid", "overdue", "cancelled"] as const).map(f => (
                      <button key={f} onClick={() => setInvoiceFilter(f)} style={{
                        padding: "6px 14px", borderRadius: 8, border: "1px solid",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                        background:  invoiceFilter === f ? "#4f46e5" : "#fff",
                        color:       invoiceFilter === f ? "#fff"    : "#475569",
                        borderColor: invoiceFilter === f ? "#4f46e5" : "#e2e8f0",
                      }}>
                        {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <InvoiceTable invoices={filteredInvoices} />
              </motion.div>
            </motion.div>
          )}

          {/* ════════ RAZORPAY ROUTE ════════ */}
          {tab === "razorpay" && (
            <motion.div key="razorpay" variants={stagger} initial="hidden" animate="show">
              <motion.div variants={fadeUp} style={card}>
                <h3 style={cardTitleStyle}>Razorpay Route — School Linked Account</h3>
                <p style={{ fontSize: 14, color: "#64748b", margin: "12px 0 20px", lineHeight: 1.6 }}>
                  Each school is onboarded as a Razorpay Route linked account.
                  Once activated, fee payments are automatically split — the school's share
                  lands directly in their bank. Skippo retains a 2% platform commission.
                </p>

                {linkedAccount ? (
                  <div style={{ background: "#f8fafc", borderRadius: 16, padding: 20, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                          Linked Account
                        </p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{linkedAccount.name}</p>
                        <p style={{ fontSize: 13, color: "#64748b" }}>{linkedAccount.email}</p>
                      </div>
                      <span style={{
                        background: linkedAccount.status === "activated" ? "#dcfce7" : linkedAccount.status === "suspended" ? "#fee2e2" : "#fef9c3",
                        color:      linkedAccount.status === "activated" ? "#166534" : linkedAccount.status === "suspended" ? "#991b1b" : "#854d0e",
                        fontSize: 12, fontWeight: 800, padding: "6px 14px", borderRadius: 99, textTransform: "uppercase" as const,
                      }}>
                        {linkedAccount.status}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ background: "#fff", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                        <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>Account ID</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", fontFamily: "monospace" }}>
                          {linkedAccount.account_id}
                        </p>
                      </div>
                      <div style={{ background: "#fff", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                        <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>Commission Rate</p>
                        <p style={{ fontSize: 24, fontWeight: 900, color: "#4f46e5" }}>2%</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "#f8fafc", borderRadius: 16, padding: 20, border: "1.5px dashed #e2e8f0", textAlign: "center" as const }}>
                    <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>No linked account found for this school.</p>
                    <p style={{ fontSize: 13, color: "#64748b" }}>Contact Skippo support to set up your Razorpay Route account.</p>
                  </div>
                )}
              </motion.div>

              <motion.div variants={fadeUp} style={{ ...card, marginTop: 16 }}>
                <h3 style={cardTitleStyle}>How Razorpay Route Works</h3>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 12, marginTop: 16 }}>
                  {[
                    { step: "1", label: "Parent pays",    desc: "Parent pays the fee via Razorpay checkout in the Skippo app." },
                    { step: "2", label: "Money held",     desc: "Funds land in the Skippo Razorpay account momentarily." },
                    { step: "3", label: "Auto-split",     desc: "Razorpay Route splits: 98% → school account, 2% → Skippo." },
                    { step: "4", label: "School payout",  desc: "School receives their share instantly in their linked bank account." },
                  ].map(s => (
                    <div key={s.step} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", background: "#eef2ff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 900, color: "#4f46e5", flexShrink: 0,
                      }}>
                        {s.step}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{s.label}</p>
                        <p style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {showAddStructure && categories.length > 0 && (
        <AddStructureModal
          categories={categories}
          onClose={() => setShowAddStructure(false)}
          onSaved={loadAll}
        />
      )}
      {showAddCategory && (
        <AddCategoryModal onClose={() => setShowAddCategory(false)} onSaved={loadAll} />
      )}
    </DashboardShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ icon, accent, accentBg, label, value, sub }: {
  icon: React.ReactNode; accent: string; accentBg: string;
  label: string; value: string; sub: string;
}) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 22,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14, background: accentBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 14,
      }}>
        {icon}
      </div>
      <p style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 900, color: "#0f172a", letterSpacing: -0.8, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{sub}</p>
    </div>
  );
}

function SplitPill({ label, pct, color }: { label: string; pct: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", borderRadius: 12, padding: "10px 16px", flex: 1 }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{label}</p>
        <p style={{ fontSize: 20, fontWeight: 900, color }}>{pct}</p>
      </div>
    </div>
  );
}

function InvoiceTable({ invoices }: { invoices: FeeInvoice[] }) {
  if (invoices.length === 0) {
    return <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center" as const, padding: 32 }}>No invoices found.</p>;
  }
  return (
    <div style={{ overflowX: "auto" as const }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {["Student", "Category", "Amount", "Due Date", "Status", "Paid At"].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{inv.student_name}</td>
              <td style={tdStyle}>{inv.category_name}</td>
              <td style={{ ...tdStyle, fontWeight: 700 }}>₹{inv.amount.toLocaleString()}</td>
              <td style={tdStyle}>{inv.due_date}</td>
              <td style={tdStyle}><StatusBadge status={inv.status} /></td>
              <td style={{ ...tdStyle, color: "#94a3b8" }}>
                {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("en-IN") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Small SVG icons ───────────────────────────────────────────────────────────

function CurrencyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.5 8h4a2 2 0 0 1 0 4h-4v4"/>
      <line x1="11" y1="8" x2="11" y2="7"/>
      <line x1="11" y1="16" x2="11" y2="17"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

// ── Style tokens ──────────────────────────────────────────────────────────────

const FREQ_LABEL: Record<Frequency, string> = {
  monthly: "Monthly", quarterly: "Quarterly", annual: "Annual", one_time: "One-time",
};

const card: React.CSSProperties = {
  background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};
const cardTitleStyle: React.CSSProperties = {
  fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0,
};
const tableStyle: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", fontSize: 13,
};
const thStyle: React.CSSProperties = {
  textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8",
  letterSpacing: 0.5, textTransform: "uppercase", paddingBottom: 10, paddingRight: 16,
};
const tdStyle: React.CSSProperties = {
  padding: "10px 16px 10px 0", color: "#374151", verticalAlign: "middle",
};
const labelStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 5,
  fontSize: 13, fontWeight: 600, color: "#374151",
};
const inputStyle: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0",
  fontSize: 14, outline: "none", background: "#f8fafc",
};
const btnPrimary: React.CSSProperties = {
  background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10,
  padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  background: "#f1f5f9", color: "#374151", border: "none", borderRadius: 10,
  padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
};
const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
};
const modalStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 20, padding: 32, width: 480, maxWidth: "90vw",
};
const modalTitleStyle: React.CSSProperties = {
  fontSize: 20, fontWeight: 800, marginBottom: 20, color: "#0f172a",
};
