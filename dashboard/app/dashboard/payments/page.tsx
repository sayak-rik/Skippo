"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { DashboardShell } from "../../../components/DashboardShell";
import styles from "../../../components/dashboard.module.css";

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

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_SUMMARY: CollectionSummary = {
  total_collected: 285400,
  pending_count:   47,
  pending_amount:  94300,
  overdue_count:   12,
  overdue_amount:  24000,
  paid_count:      183,
};

const DEMO_CATEGORIES: FeeCategory[] = [
  { id: 1, name: "Tuition Fee",    description: "Monthly academic fee",       is_active: true  },
  { id: 2, name: "Transport Fee",  description: "Bus route fee",              is_active: true  },
  { id: 3, name: "Lab Fee",        description: "Science lab consumables",    is_active: true  },
  { id: 4, name: "Sports Fee",     description: "Annual sports & activities", is_active: false },
];

const DEMO_STRUCTURES: FeeStructure[] = [
  { id: 1, category: 1, category_name: "Tuition Fee",   classroom: null, classroom_name: null,       amount: 4500, frequency: "monthly",   due_day: 10, academic_year: "2025-26", is_active: true  },
  { id: 2, category: 2, category_name: "Transport Fee", classroom: null, classroom_name: null,       amount: 1200, frequency: "monthly",   due_day: 10, academic_year: "2025-26", is_active: true  },
  { id: 3, category: 3, category_name: "Lab Fee",       classroom: 3,   classroom_name: "Class 10A", amount: 800,  frequency: "quarterly", due_day: 5,  academic_year: "2025-26", is_active: true  },
  { id: 4, category: 3, category_name: "Lab Fee",       classroom: 4,   classroom_name: "Class 10B", amount: 800,  frequency: "quarterly", due_day: 5,  academic_year: "2025-26", is_active: true  },
];

const DEMO_INVOICES: FeeInvoice[] = [
  { id: 1,  student: 1, student_name: "Aryan Sharma",    category_name: "Tuition Fee",   amount: 4500, due_date: "2026-05-10", status: "pending",  paid_at: null                },
  { id: 2,  student: 2, student_name: "Priya Mehta",     category_name: "Tuition Fee",   amount: 4500, due_date: "2026-05-10", status: "pending",  paid_at: null                },
  { id: 3,  student: 3, student_name: "Rohit Kumar",     category_name: "Transport Fee", amount: 1200, due_date: "2026-04-10", status: "overdue",  paid_at: null                },
  { id: 4,  student: 4, student_name: "Sneha Patel",     category_name: "Tuition Fee",   amount: 4500, due_date: "2026-04-10", status: "paid",     paid_at: "2026-04-08T11:22:00" },
  { id: 5,  student: 5, student_name: "Aditya Nair",     category_name: "Lab Fee",       amount: 800,  due_date: "2026-04-05", status: "paid",     paid_at: "2026-04-03T09:15:00" },
  { id: 6,  student: 6, student_name: "Kavya Iyer",      category_name: "Transport Fee", amount: 1200, due_date: "2026-04-10", status: "overdue",  paid_at: null                },
  { id: 7,  student: 7, student_name: "Vikram Singh",    category_name: "Tuition Fee",   amount: 4500, due_date: "2026-05-10", status: "pending",  paid_at: null                },
  { id: 8,  student: 8, student_name: "Ananya Reddy",    category_name: "Tuition Fee",   amount: 4500, due_date: "2026-04-10", status: "paid",     paid_at: "2026-04-09T16:40:00" },
];

const DEMO_LINKED_ACCOUNT: LinkedAccount = {
  account_id: "acc_PqR2sT3uV4wX5y",
  name:       "St. Xavier's School",
  email:      "finance@stxaviers.edu.in",
  status:     "activated",
};

// ── Animations ────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.4, 0.25, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

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
      background:    c.bg,
      color:         c.text,
      fontSize:      11,
      fontWeight:    700,
      padding:       "3px 10px",
      borderRadius:  99,
      letterSpacing: 0.3,
      textTransform: "uppercase" as const,
    }}>
      {status}
    </span>
  );
}

const LINKED_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  created:   { bg: "#fef9c3", text: "#854d0e" },
  activated: { bg: "#dcfce7", text: "#166534" },
  suspended: { bg: "#fee2e2", text: "#991b1b" },
};

// ── Tab bar ───────────────────────────────────────────────────────────────────

type Tab = "overview" | "structures" | "invoices" | "razorpay";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview",   label: "Overview"        },
  { id: "structures", label: "Fee Structure"   },
  { id: "invoices",   label: "Invoices"        },
  { id: "razorpay",   label: "Razorpay Route"  },
];

// ── Add structure modal ───────────────────────────────────────────────────────

function AddStructureModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    category: "1", classroom: "", amount: "", frequency: "monthly", due_day: "10", academic_year: "2025-26",
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ background: "#fff", borderRadius: 20, padding: 32, width: 480, maxWidth: "90vw" }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Add Fee Structure</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={labelStyle}>
            Category
            <select style={inputStyle} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {DEMO_CATEGORIES.filter(c => c.is_active).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Classroom <span style={{ color: "#94a3b8" }}>(leave blank for all)</span>
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
            <select style={inputStyle} value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}>
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
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...btnSecondary }}>Cancel</button>
          <button onClick={onClose} style={{ ...btnPrimary }}>Save Structure</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Add category modal ────────────────────────────────────────────────────────

function AddCategoryModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", description: "" });
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ background: "#fff", borderRadius: 20, padding: 32, width: 400 }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Add Fee Category</h2>
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
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={onClose} style={btnPrimary}>Save Category</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [tab, setTab]                     = useState<Tab>("overview");
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceStatus | "all">("all");
  const [showAddStructure, setShowAddStructure] = useState(false);
  const [showAddCategory, setShowAddCategory]   = useState(false);

  const filteredInvoices = invoiceFilter === "all"
    ? DEMO_INVOICES
    : DEMO_INVOICES.filter(i => i.status === invoiceFilter);

  return (
    <DashboardShell>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Fee Management</h1>
          <p className={styles.pageSubtitle}>
            Set up fee structures, track collections, and manage Razorpay payouts.
          </p>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, borderBottom: "1px solid #e2e8f0", paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding:         "10px 18px",
              borderRadius:    "10px 10px 0 0",
              border:          "none",
              cursor:          "pointer",
              fontWeight:      tab === t.id ? 800 : 600,
              fontSize:        14,
              color:           tab === t.id ? "#4f46e5" : "#64748b",
              background:      tab === t.id ? "#eef2ff" : "transparent",
              borderBottom:    tab === t.id ? "2px solid #4f46e5" : "2px solid transparent",
              transition:      "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div key="overview" variants={stagger} initial="hidden" animate="show">
            {/* ── KPI cards ──────────────────────────────────────────────── */}
            <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
              <KpiCard
                icon="₹" iconColor="#16a34a"
                label="Total Collected"
                value={`₹${(DEMO_SUMMARY.total_collected / 1000).toFixed(0)}k`}
                sub={`${DEMO_SUMMARY.paid_count} payments`}
              />
              <KpiCard
                icon="⏳" iconColor="#d97706"
                label="Pending"
                value={`₹${(DEMO_SUMMARY.pending_amount / 1000).toFixed(0)}k`}
                sub={`${DEMO_SUMMARY.pending_count} invoices`}
              />
              <KpiCard
                icon="⚠️" iconColor="#dc2626"
                label="Overdue"
                value={`₹${(DEMO_SUMMARY.overdue_amount / 1000).toFixed(0)}k`}
                sub={`${DEMO_SUMMARY.overdue_count} invoices`}
              />
            </motion.div>

            {/* ── Platform split info ────────────────────────────────────── */}
            <motion.div variants={fadeUp} style={card}>
              <h3 style={cardTitle}>Razorpay Route — Payment Split</h3>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>
                Every payment is automatically split between the school and Skippo via Razorpay Route.
                The school's share is transferred directly to their linked account.
              </p>
              <div style={{ display: "flex", gap: 24 }}>
                <SplitPill label="School receives" pct="98%" color="#16a34a" />
                <SplitPill label="Skippo commission" pct="2%"  color="#4f46e5" />
              </div>
            </motion.div>

            {/* ── Recent invoices ────────────────────────────────────────── */}
            <motion.div variants={fadeUp} style={{ ...card, marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={cardTitle}>Recent Invoices</h3>
                <button onClick={() => setTab("invoices")} style={btnSecondary}>View all →</button>
              </div>
              <InvoiceTable invoices={DEMO_INVOICES.slice(0, 5)} />
            </motion.div>
          </motion.div>
        )}

        {tab === "structures" && (
          <motion.div key="structures" variants={stagger} initial="hidden" animate="show">
            {/* ── Categories ─────────────────────────────────────────────── */}
            <motion.div variants={fadeUp} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={cardTitle}>Fee Categories</h3>
                <button onClick={() => setShowAddCategory(true)} style={btnPrimary}>+ Add Category</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10 }}>
                {DEMO_CATEGORIES.map(cat => (
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
            </motion.div>

            {/* ── Structures table ───────────────────────────────────────── */}
            <motion.div variants={fadeUp} style={{ ...card, marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={cardTitle}>Fee Structures</h3>
                <button onClick={() => setShowAddStructure(true)} style={btnPrimary}>+ Add Structure</button>
              </div>

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
                    {DEMO_STRUCTURES.map(s => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={tdStyle}>{s.category_name}</td>
                        <td style={tdStyle}>{s.classroom_name ?? <span style={{ color: "#94a3b8" }}>All classes</span>}</td>
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
            </motion.div>
          </motion.div>
        )}

        {tab === "invoices" && (
          <motion.div key="invoices" variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap" as const, gap: 12 }}>
                <h3 style={cardTitle}>All Invoices</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["all", "pending", "paid", "overdue", "cancelled"] as const).map(f => (
                    <button key={f} onClick={() => setInvoiceFilter(f)} style={{
                      padding: "6px 14px", borderRadius: 8, border: "1px solid",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                      background:   invoiceFilter === f ? "#4f46e5" : "#fff",
                      color:        invoiceFilter === f ? "#fff"    : "#475569",
                      borderColor:  invoiceFilter === f ? "#4f46e5" : "#e2e8f0",
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

        {tab === "razorpay" && (
          <motion.div key="razorpay" variants={stagger} initial="hidden" animate="show">
            {/* ── Linked account status ──────────────────────────────────── */}
            <motion.div variants={fadeUp} style={card}>
              <h3 style={cardTitle}>Razorpay Route — School Linked Account</h3>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
                Each school is onboarded as a Razorpay Route linked account.
                Once activated, fee payments are automatically split — the school's share
                lands directly in their bank. Skippo retains a 2% platform commission.
              </p>

              <div style={{
                background: "#f8fafc", borderRadius: 16, padding: 20,
                border: "1px solid #e2e8f0",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                      Linked Account
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{DEMO_LINKED_ACCOUNT.name}</p>
                    <p style={{ fontSize: 13, color: "#64748b" }}>{DEMO_LINKED_ACCOUNT.email}</p>
                  </div>
                  <div style={{
                    background: LINKED_STATUS_COLORS[DEMO_LINKED_ACCOUNT.status].bg,
                    color:      LINKED_STATUS_COLORS[DEMO_LINKED_ACCOUNT.status].text,
                    fontSize:   12, fontWeight: 800, padding: "6px 14px", borderRadius: 99,
                    textTransform: "uppercase" as const,
                  }}>
                    {DEMO_LINKED_ACCOUNT.status}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#fff", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>Account ID</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", fontFamily: "monospace" }}>
                      {DEMO_LINKED_ACCOUNT.account_id}
                    </p>
                  </div>
                  <div style={{ background: "#fff", padding: 14, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>Commission Rate</p>
                    <p style={{ fontSize: 20, fontWeight: 900, color: "#4f46e5" }}>2%</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── How Route works ────────────────────────────────────────── */}
            <motion.div variants={fadeUp} style={{ ...card, marginTop: 16 }}>
              <h3 style={cardTitle}>How Razorpay Route Works</h3>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 12, marginTop: 4 }}>
                {[
                  { step: "1", label: "Parent pays",        desc: "Parent pays the fee via Razorpay checkout in the Skippo app." },
                  { step: "2", label: "Money held",          desc: "Funds land in the Skippo Razorpay account momentarily." },
                  { step: "3", label: "Auto-split",          desc: "Razorpay Route splits: 98% → school account, 2% → Skippo." },
                  { step: "4", label: "School payout",       desc: "School receives their share instantly in their linked bank account." },
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

      {showAddStructure && <AddStructureModal onClose={() => setShowAddStructure(false)} />}
      {showAddCategory  && <AddCategoryModal  onClose={() => setShowAddCategory(false)}  />}
    </DashboardShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ icon, iconColor, label, value, sub }: {
  icon: string; iconColor: string; label: string; value: string; sub: string;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 20 }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <p style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}>{value}</p>
      <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</p>
    </div>
  );
}

function SplitPill({ label, pct, color }: { label: string; pct: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", borderRadius: 12, padding: "12px 18px" }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
      <div>
        <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 900, color }}>{pct}</p>
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

// ── Shared style tokens ───────────────────────────────────────────────────────

const FREQ_LABEL: Record<Frequency, string> = {
  monthly: "Monthly", quarterly: "Quarterly", annual: "Annual", one_time: "One-time",
};

const card: React.CSSProperties = {
  background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24,
};
const cardTitle: React.CSSProperties = {
  fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0,
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
