"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  BarChart3, TrendingUp, Users, Bus, ClipboardList,
  Download, Calendar, GraduationCap, CheckCircle2,
} from "lucide-react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SummaryStats {
  total_students: number;
  total_teachers: number;
  total_drivers: number;
  total_routes: number;
  active_trips_today: number;
  attendance_today_pct: number;
  exams_published: number;
  report_cards_published: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

const REPORT_TYPES = [
  {
    icon: GraduationCap, label: "Student Roster",
    desc: "Full list of enrolled students with classroom, roll number, and contact info.",
    endpoint: "/api/academics/admin/students/export/",
    color: "#2563eb",
  },
  {
    icon: Users, label: "Teacher Directory",
    desc: "All teachers with assigned classrooms, leave status, and contact details.",
    endpoint: "/api/auth/admin/teachers/export/",
    color: "#7c3aed",
  },
  {
    icon: Bus, label: "Trip Summary",
    desc: "All trips for the selected date range with route, driver, and boarded count.",
    endpoint: "/api/transport/admin/trips/export/",
    color: "#0891b2",
  },
  {
    icon: ClipboardList, label: "Exam Results",
    desc: "Marks and grades for a selected exam and classroom, sorted by rank.",
    endpoint: "/api/academics/admin/exams/export/",
    color: "#d97706",
  },
  {
    icon: Calendar, label: "Attendance Log",
    desc: "Daily student attendance log for a selected classroom and date range.",
    endpoint: "/api/academics/admin/attendance/export/",
    color: "#16a34a",
  },
  {
    icon: CheckCircle2, label: "Report Cards",
    desc: "Published report cards for a selected exam and classroom.",
    endpoint: "/api/academics/admin/exams/report-cards/export/",
    color: "#dc2626",
  },
];

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderTop: `3px solid ${color}`, borderRadius: 14, padding: "16px 18px",
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <Icon size={17} color={color} />
      </div>
      <p style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>{value}</p>
      <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{label}</p>
    </motion.div>
  );
}

// ── Report Type Card ──────────────────────────────────────────────────────────

function ReportTypeCard({ r }: { r: typeof REPORT_TYPES[0] }) {
  const [downloading, setDownloading] = useState(false);

  async function download() {
    setDownloading(true);
    try {
      const data = await apiFetch<{ url?: string }>(r.endpoint);
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      // silently fail — backend may not have export endpoint yet
    } finally {
      setDownloading(false);
    }
  }

  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: "1px solid var(--stroke)",
      borderRadius: 14, padding: "20px", boxShadow: "var(--shadow-sm)",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: r.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <r.icon size={20} color={r.color} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{r.label}</p>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.55 }}>{r.desc}</p>
      <button onClick={download} disabled={downloading}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          background: "var(--surface-raised)", border: "1px solid var(--stroke)",
          borderRadius: 9, padding: "9px 0", fontWeight: 600, fontSize: 13,
          cursor: "pointer", color: "var(--ink-soft)", marginTop: "auto",
          opacity: downloading ? 0.5 : 1,
        }}>
        <Download size={14} /> {downloading ? "Preparing…" : "Export CSV"}
      </button>
    </motion.div>
  );
}

// ── Mini bar chart ────────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const MOCK_ATTENDANCE = [92, 88, 95, 91, 87];

function AttendanceChart() {
  const max = Math.max(...MOCK_ATTENDANCE);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--stroke)", borderRadius: 14, padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>This week's attendance</p>
        <span style={{ fontSize: 12, color: "var(--ink-dim)" }}>Sample data</span>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 80 }}>
        {DAYS.map((day, i) => {
          const pct = MOCK_ATTENDANCE[i];
          const h = Math.round((pct / max) * 70);
          const color = pct >= 90 ? "#16a34a" : pct >= 80 ? "#2563eb" : "#d97706";
          return (
            <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color }}>{pct}%</span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: h }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                style={{ width: "100%", background: color, borderRadius: "4px 4px 0 0", opacity: 0.85 }}
              />
              <span style={{ fontSize: 10, color: "var(--ink-dim)" }}>{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiFetch<{ count: number }>("/api/academics/admin/students/"),
      apiFetch<{ count: number }>("/api/auth/admin/teachers/"),
      apiFetch<{ count: number }>("/api/auth/admin/drivers/"),
    ]).then(([students, teachers, drivers]) => {
      setStats({
        total_students:        (students.status === "fulfilled" ? (students.value as any)?.count ?? 0 : 0),
        total_teachers:        (teachers.status === "fulfilled" ? (teachers.value as any)?.count ?? 0 : 0),
        total_drivers:         (drivers.status === "fulfilled"  ? (drivers.value as any)?.count  ?? 0 : 0),
        total_routes:          0,
        active_trips_today:    0,
        attendance_today_pct:  0,
        exams_published:       0,
        report_cards_published: 0,
      });
    }).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      <div style={{ padding: "24px 28px 48px", maxWidth: 1000 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>Operations</p>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Reports</h1>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6 }}>School-wide summaries and data exports</p>
        </motion.div>

        {/* Overview stats */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <StatCard label="Students"  value={loading ? "—" : (stats?.total_students ?? 0)}  icon={GraduationCap} color="#2563eb" />
          <StatCard label="Teachers"  value={loading ? "—" : (stats?.total_teachers ?? 0)}  icon={Users}         color="#7c3aed" />
          <StatCard label="Drivers"   value={loading ? "—" : (stats?.total_drivers ?? 0)}   icon={Bus}           color="#0891b2" />
          <StatCard label="Published exams" value={loading ? "—" : (stats?.exams_published ?? 0)} icon={ClipboardList} color="#d97706" />
        </motion.div>

        {/* Attendance chart */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ marginBottom: 28 }}>
          <AttendanceChart />
        </motion.div>

        {/* Export section */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <BarChart3 size={18} color="var(--primary)" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>Data exports</h2>
          </div>
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {REPORT_TYPES.map((r) => <ReportTypeCard key={r.label} r={r} />)}
          </motion.div>
        </motion.div>

        {/* Future reports note */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: "var(--surface-raised)", border: "1px dashed var(--stroke)", borderRadius: 14, padding: "18px 22px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <TrendingUp size={18} color="var(--ink-dim)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>More analytics coming soon</p>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6 }}>
                Fee collection reports, staff attendance trends, trip analytics, student progress over time, and more detailed visualizations are planned for the next release.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
