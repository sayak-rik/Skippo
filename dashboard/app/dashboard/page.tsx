"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "../../components/DashboardShell";
import { ModuleCard } from "../../components/ModuleCard";
import { dashboardModules } from "../../lib/modules";
import { apiFetch } from "../../lib/api";
import styles from "../../components/dashboard.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Overview {
  school_name: string;
  students: number;
  teachers: number;
  drivers: number;
  vehicles: number;
}

interface FeeSummary {
  total_collected: number;
  pending_count: number;
  pending_amount: number;
  overdue_count: number;
  overdue_amount: number;
  paid_count: number;
}

// ── Animation helpers ─────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] } },
};

const stagger = (delay = 0.06) => ({
  hidden: {},
  show:   { transition: { staggerChildren: delay } },
});

const QUICK_ACTIONS = [
  { icon: "👤", iconColor: "blue",   label: "Add Student",        href: "/dashboard/students"       },
  { icon: "💳", iconColor: "amber",  label: "Fee Collections",    href: "/dashboard/payments"       },
  { icon: "📢", iconColor: "purple", label: "Send Notification",  href: "/dashboard/communications" },
  { icon: "🚌", iconColor: "green",  label: "Live Fleet",         href: "/dashboard/live-fleet"     },
];

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [fees, setFees]         = useState<FeeSummary | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiFetch<Overview>("/api/tenancy/school/overview"),
      apiFetch<FeeSummary>("/api/payments/summary"),
    ]).then(([ov, fee]) => {
      if (ov.status === "fulfilled")  setOverview(ov.value);
      if (fee.status === "fulfilled") setFees(fee.value);
      setLoading(false);
    });
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric", weekday: "long",
  });

  const kpis = [
    {
      icon: "🎓", iconColor: "purple",
      value: loading ? "—" : String(overview?.students ?? 0),
      label: "Total Students",
      sub: `${overview?.teachers ?? 0} teachers`,
    },
    {
      icon: "🚌", iconColor: "blue",
      value: loading ? "—" : String(overview?.vehicles ?? 0),
      label: "Vehicles",
      sub: `${overview?.drivers ?? 0} drivers`,
    },
    {
      icon: "✅", iconColor: "green",
      value: loading ? "—" : fmt(fees?.total_collected ?? 0),
      label: "Fees Collected",
      sub: `${fees?.paid_count ?? 0} invoices paid`,
    },
    {
      icon: "💳", iconColor: "amber",
      value: loading ? "—" : fmt((fees?.pending_amount ?? 0) + (fees?.overdue_amount ?? 0)),
      label: "Pending Fees",
      sub: `${(fees?.pending_count ?? 0) + (fees?.overdue_count ?? 0)} invoices`,
    },
    {
      icon: "⚠️", iconColor: "red",
      value: loading ? "—" : String(fees?.overdue_count ?? 0),
      label: "Overdue Invoices",
      sub: fees?.overdue_count ? `${fmt(fees.overdue_amount)} overdue` : "All clear",
    },
  ];

  return (
    <DashboardShell>
      <div className={styles.inner}>

        {/* ── Greeting Header ─────────────────────────────────────────── */}
        <motion.div
          className={styles.pageHeader}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <h2 className={styles.greeting}>
              Good {getTimeOfDay()}, {overview?.school_name ?? "Admin"} 👋
            </h2>
            <p className={styles.greetingSub}>Here&apos;s what&apos;s happening in your school today.</p>
          </div>
          <div className={styles.dateChip}>📅 {today}</div>
        </motion.div>

        {/* ── KPI Strip ───────────────────────────────────────────────── */}
        <motion.div
          className={styles.kpiStrip}
          variants={stagger(0.06)}
          initial="hidden"
          animate="show"
        >
          {kpis.map((kpi) => (
            <motion.div key={kpi.label} variants={fadeUp} className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <div className={`${styles.kpiIcon} ${styles[kpi.iconColor as keyof typeof styles]}`}>
                  {kpi.icon}
                </div>
              </div>
              <div className={styles.kpiValue}>{kpi.value}</div>
              <div className={styles.kpiLabel}>{kpi.label}</div>
              <div className={styles.kpiSub}>{kpi.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Quick Actions ────────────────────────────────────────────── */}
        <motion.div
          className={styles.quickActions}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <p className={styles.sectionTitle}>Quick Actions</p>
          <div className={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.label} href={a.href}>
                <div className={styles.actionBtn}>
                  <div className={`${styles.actionIcon} ${styles[a.iconColor as keyof typeof styles]}`}>
                    {a.icon}
                  </div>
                  <span className={styles.actionLabel}>{a.label}</span>
                  <span className={styles.actionArrow}>›</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── Fee Summary ──────────────────────────────────────────────── */}
        <motion.div
          className={styles.insightRow}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Fee Overview</span>
              <Link href="/dashboard/payments">
                <span className={styles.cardLink}>View all →</span>
              </Link>
            </div>
            {fees ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
                <FeeRow label="Total collected" value={fmt(fees.total_collected)} color="#16A34A" />
                <FeeRow label="Pending" value={fmt(fees.pending_amount)} sub={`${fees.pending_count} invoices`} color="#D97706" />
                <FeeRow label="Overdue" value={fmt(fees.overdue_amount)} sub={`${fees.overdue_count} invoices`} color="#DC2626" />
              </div>
            ) : (
              <EmptyState icon="💳" text="No fee data yet. Generate fee structures to get started." />
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>School Roster</span>
            </div>
            {overview ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "8px 0" }}>
                <RosterRow icon="🎓" label="Students"  value={overview.students} />
                <RosterRow icon="📚" label="Teachers"  value={overview.teachers} />
                <RosterRow icon="🚗" label="Drivers"   value={overview.drivers} />
                <RosterRow icon="🚌" label="Vehicles"  value={overview.vehicles} />
              </div>
            ) : (
              <EmptyState icon="📊" text="Loading school data…" />
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Alerts</span>
            </div>
            {fees && fees.overdue_count > 0 ? (
              <div className={styles.alertList}>
                <div className={styles.alertItem}>
                  <div className={`${styles.alertItemIcon} ${styles.danger}`}>💳</div>
                  <div className={styles.alertItemBody}>
                    <p className={`${styles.alertItemTitle} ${styles.danger}`}>
                      {fees.overdue_count} overdue invoice{fees.overdue_count !== 1 ? "s" : ""}
                    </p>
                    <p className={styles.alertItemSub}>{fmt(fees.overdue_amount)} total overdue</p>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState icon="✅" text="No active alerts." />
            )}
          </div>
        </motion.div>

        {/* ── School Modules ───────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <p className={styles.sectionTitle}>School Modules</p>
          <motion.div
            className={styles.moduleGrid}
            variants={stagger(0.04)}
            initial="hidden"
            animate="show"
          >
            {dashboardModules.map((module) => (
              <motion.div key={module.href} variants={fadeUp}>
                <ModuleCard {...module} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

      </div>
    </DashboardShell>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-dim, #71717a)" }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <p style={{ fontSize: 13 }}>{text}</p>
    </div>
  );
}

function FeeRow({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "var(--ink-dim, #71717a)" }}>{label}</span>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color }}>{value}</span>
        {sub && <div style={{ fontSize: 11, color: "var(--ink-dim, #a1a1aa)" }}>{sub}</div>}
      </div>
    </div>
  );
}

function RosterRow({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "var(--ink-dim, #71717a)" }}>{icon} {label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink, #0a0a0a)" }}>{value}</span>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
