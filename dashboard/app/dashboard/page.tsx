"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "../../components/DashboardShell";
import { ModuleCard } from "../../components/ModuleCard";
import { dashboardModules } from "../../lib/modules";
import styles from "../../components/dashboard.module.css";

// ── Animation helpers ─────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] } },
};

const stagger = (delay = 0.06) => ({
  hidden: {},
  show:   { transition: { staggerChildren: delay } },
});

// ── Static data (would come from API in production) ──────────────────────────

const KPI_DATA = [
  {
    icon: "👥",
    iconColor: "blue",
    value: "92.6%",
    label: "Attendance Today",
    sub: "↑ 4.2% from yesterday",
    change: "+4.2%",
    changeType: "up" as const,
  },
  {
    icon: "₹",
    iconColor: "green",
    value: "₹1,45,320",
    label: "Fees Collected Today",
    sub: "↑ 12.5% from yesterday",
    change: "+12.5%",
    changeType: "up" as const,
  },
  {
    icon: "💳",
    iconColor: "amber",
    value: "₹8,76,850",
    label: "Pending Fees",
    sub: "231 students",
    subLink: "231 students",
    change: "231",
    changeType: "neutral" as const,
  },
  {
    icon: "🎓",
    iconColor: "purple",
    value: "1,248",
    label: "Total Students",
    sub: "62 new this month",
    change: "+62",
    changeType: "up" as const,
  },
  {
    icon: "🔔",
    iconColor: "red",
    value: "12",
    label: "Alerts",
    sub: "View all alerts →",
    change: "12",
    changeType: "neutral" as const,
  },
];

const QUICK_ACTIONS = [
  { icon: "👤", iconColor: "blue",   label: "Add Student",        href: "/dashboard/students"       },
  { icon: "✅", iconColor: "green",  label: "Mark Attendance",    href: "/dashboard/live-fleet"     },
  { icon: "₹",  iconColor: "amber",  label: "Record Payment",     href: "/dashboard/reports"        },
  { icon: "📢", iconColor: "purple", label: "Send Notification",  href: "/dashboard/communications" },
];

// Attendance 7-day sparkline data (values 0–100)
const ATTEND_SPARK = [91, 93, 90, 94, 92, 95, 92.6];
// Fee collection 7-day sparkline (scaled in lakhs)
const FEE_SPARK    = [0.6, 0.9, 1.1, 0.8, 1.3, 1.2, 1.45];
const DAYS         = ["15", "16", "17", "18", "19", "20", "21"];

const ALERTS = [
  {
    type: "danger"  as const,
    icon: "🔔",
    title: "12 students have attendance below 75%",
    sub:   "Please take necessary action",
  },
  {
    type: "warning" as const,
    icon: "💳",
    title: "Fees of ₹8,76,850 is pending",
    sub:   "231 students have pending fees",
  },
  {
    type: "success" as const,
    icon: "✅",
    title: "Great job! Attendance improved in Class 8A",
    sub:   "↑ 8.5% this week",
  },
];

const ACTIVITY = [
  { icon: "₹",  iconColor: "fees",       text: "Payment of ₹5,000 received from Rohan Sharma", badge: "Fees",       badgeColor: "fees",       time: "Today, 09:45 AM" },
  { icon: "✅",  iconColor: "attendance", text: "Attendance marked for Class 7A",                badge: "Attendance", badgeColor: "attendance", time: "Today, 09:30 AM" },
  { icon: "📢", iconColor: "comm",       text: "Notification sent to Class 10 parents",         badge: "Communication", badgeColor: "comm",    time: "Today, 09:15 AM" },
  { icon: "👤", iconColor: "student",    text: "New student Aarav Mehta added in Class 6B",     badge: "Students",   badgeColor: "student",    time: "Yesterday, 04:30 PM" },
];

const EVENTS = [
  { day: "24", month: "MAY", title: "PTM Meeting",        sub: "Class 1 to 5",  time: "10:00 AM – 01:00 PM" },
  { day: "27", month: "MAY", title: "Unit Test - 1",      sub: "Class 6 to 10", time: "09:00 AM – 12:00 PM" },
  { day: "31", month: "MAY", title: "School Annual Day",  sub: "All Classes",   time: "04:00 PM – 08:00 PM" },
];

const FLEET = [
  { name: "Bus KA-04 MN 2210", route: "Route A · North Campus", status: "active", statusLabel: "En Route"  },
  { name: "Bus KA-04 MN 3348", route: "Route B · East Wing",    status: "active", statusLabel: "En Route"  },
  { name: "Bus KA-04 MN 5501", route: "Route C · West End",     status: "active", statusLabel: "Returning" },
  { name: "Bus KA-04 MN 7723", route: "Route D · South Zone",   status: "idle",   statusLabel: "Standby"   },
  { name: "Bus KA-04 MN 9914", route: "Route E · Central",      status: "idle",   statusLabel: "Parked"    },
];

const ATTENDANCE_CLASSES = [
  { cls: "Class 6",    pct: 97 },
  { cls: "Class 7",    pct: 95 },
  { cls: "Class 8",    pct: 92 },
  { cls: "Class 9",    pct: 89 },
  { cls: "Class 10-A", pct: 96 },
  { cls: "Class 10-B", pct: 81 },
  { cls: "Class 11",   pct: 93 },
  { cls: "Class 12",   pct: 88 },
];

const COMPLIANCE = [
  { name: "Bus MN 2210",      sub: "Fitness Certificate",   expiry: "4 days",  level: "critical" },
  { name: "Bus MN 3348",      sub: "Pollution Certificate", expiry: "11 days", level: "soon"     },
  { name: "Bus MN 5501",      sub: "Insurance Policy",      expiry: "22 days", level: "soon"     },
  { name: "Driver Ramesh K.", sub: "Driving License",       expiry: "45 days", level: "ok"       },
  { name: "Bus MN 9914",      sub: "Road Permit",           expiry: "60 days", level: "ok"       },
];

// ── SVG sparkline helper ──────────────────────────────────────────────────────

function Sparkline({ data, color, fill }: { data: number[]; color: string; fill: string }) {
  const w = 300;
  const h = 56;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });

  const pathD = `M ${pts.join(" L ")}`;
  const areaD = `M 0,${h} L ${pts.join(" L ")} L ${w},${h} Z`;

  return (
    <svg className={styles.sparkChart} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* Last data point dot */}
      {(() => {
        const last = pts[pts.length - 1].split(",");
        return <circle cx={last[0]} cy={last[1]} r="4" fill={color} />;
      })()}
    </svg>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });

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
            <h2 className={styles.greeting}>Good morning, Admin! 👋</h2>
            <p className={styles.greetingSub}>Here&apos;s what&apos;s happening in your school today.</p>
          </div>
          <div className={styles.dateChip}>
            📅 {today}
          </div>
        </motion.div>

        {/* ── KPI Strip ───────────────────────────────────────────────── */}
        <motion.div
          className={styles.kpiStrip}
          variants={stagger(0.06)}
          initial="hidden"
          animate="show"
        >
          {KPI_DATA.map((kpi) => (
            <motion.div key={kpi.label} variants={fadeUp} className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <div className={`${styles.kpiIcon} ${styles[kpi.iconColor as keyof typeof styles]}`}>
                  {kpi.icon}
                </div>
                <span className={`${styles.kpiChange} ${styles[kpi.changeType]}`}>
                  {kpi.change}
                </span>
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

        {/* ── Insights Row (Trends + Alerts) ───────────────────────────── */}
        <motion.div
          className={styles.insightRow}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {/* Attendance Trend */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Attendance Trend (7 Days)</span>
              <span className={styles.cardLink}>This Week</span>
            </div>
            <div className={styles.sparkWrap}>
              <div className={styles.sparkStat}>
                <span className={styles.sparkValue}>92.6%</span>
                <span className={`${styles.sparkChange} ${styles.up}`}>↑ 4.2%</span>
              </div>
              <div className={styles.sparkSub}>Average Attendance</div>
            </div>
            <Sparkline data={ATTEND_SPARK} color="#2563EB" fill="#EFF6FF" />
            <div className={styles.sparkDays}>
              {DAYS.map((d) => <span key={d} className={styles.sparkDay}>{d} May</span>)}
            </div>
          </div>

          {/* Fee Collection Trend */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Fee Collection Trend (7 Days)</span>
              <span className={styles.cardLink}>This Week</span>
            </div>
            <div className={styles.sparkWrap}>
              <div className={styles.sparkStat}>
                <span className={styles.sparkValue}>₹9,85,650</span>
                <span className={`${styles.sparkChange} ${styles.up}`}>↑ 18.7%</span>
              </div>
              <div className={styles.sparkSub}>Total Collection</div>
            </div>
            <Sparkline data={FEE_SPARK} color="#16A34A" fill="#F0FDF4" />
            <div className={styles.sparkDays}>
              {DAYS.map((d) => <span key={d} className={styles.sparkDay}>{d} May</span>)}
            </div>
          </div>

          {/* Alerts & Insights */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Alerts & Insights</span>
              <span className={styles.cardLink}>···</span>
            </div>
            <div className={styles.alertList}>
              {ALERTS.map((alert, i) => (
                <div key={i} className={styles.alertItem}>
                  <div className={`${styles.alertItemIcon} ${styles[alert.type]}`}>
                    {alert.icon}
                  </div>
                  <div className={styles.alertItemBody}>
                    <p className={`${styles.alertItemTitle} ${styles[alert.type]}`}>{alert.title}</p>
                    <p className={styles.alertItemSub}>{alert.sub}</p>
                  </div>
                  <span className={styles.alertChevron}>›</span>
                </div>
              ))}
            </div>
            <span className={styles.viewAllBtn}>View all alerts</span>
          </div>
        </motion.div>

        {/* ── Bottom Row (Activity + Upcoming Events) ──────────────────── */}
        <motion.div
          className={styles.bottomRow}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {/* Recent Activity */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Recent Activity</span>
              <span className={styles.cardLink}>View all activity</span>
            </div>
            <div className={styles.activityList}>
              {ACTIVITY.map((a, i) => (
                <div key={i} className={styles.activityItem}>
                  <div className={`${styles.activityIcon} ${styles[a.iconColor as keyof typeof styles]}`}>
                    {a.icon}
                  </div>
                  <div className={styles.activityBody}>
                    <p className={styles.activityText}>
                      {a.text}
                      <span className={`${styles.activityBadge} ${styles[a.badgeColor as keyof typeof styles]}`}>
                        {a.badge}
                      </span>
                    </p>
                    <p className={styles.activityTime}>{a.time}</p>
                  </div>
                  <span className={styles.activityTs}>{a.time.includes("Yesterday") ? "Yesterday" : a.time.split(",")[1]?.trim()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Upcoming Events</span>
              <span className={styles.cardLink}>View calendar</span>
            </div>
            <div className={styles.eventsList}>
              {EVENTS.map((e, i) => (
                <div key={i} className={styles.eventItem}>
                  <div className={styles.eventDate}>
                    <span className={styles.eventDay}>{e.day}</span>
                    <span className={styles.eventMonth}>{e.month}</span>
                  </div>
                  <div className={styles.eventBody}>
                    <p className={styles.eventTitle}>{e.title}</p>
                    <p className={styles.eventSubtitle}>{e.sub}</p>
                  </div>
                  <span className={styles.eventTime}>{e.time}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Fleet & Compliance Row ───────────────────────────────────── */}
        <motion.div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          {/* Live Fleet */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Live Fleet Status</span>
              <Link href="/dashboard/live-fleet">
                <span className={`${styles.cardBadge} ${styles.transport}`}>Transport</span>
              </Link>
            </div>
            <div className={styles.fleetRow}>
              {FLEET.map((bus) => (
                <div key={bus.name} className={styles.fleetItem}>
                  <span className={`${styles.fleetDot} ${styles[bus.status as keyof typeof styles]}`} />
                  <span className={styles.fleetName}>{bus.name}</span>
                  <span className={styles.fleetRoute}>{bus.route}</span>
                  <span className={`${styles.fleetStatus} ${styles[bus.status as keyof typeof styles]}`}>
                    {bus.statusLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Compliance Status</span>
              <Link href="/dashboard/compliance">
                <span className={`${styles.cardBadge} ${styles.risk}`}>Risk</span>
              </Link>
            </div>
            <div className={styles.complianceList}>
              {COMPLIANCE.map((item) => (
                <div key={item.name + item.sub} className={styles.complianceItem}>
                  <div>
                    <p className={styles.complianceName}>{item.name}</p>
                    <p className={styles.complianceSub}>{item.sub}</p>
                  </div>
                  <span className={`${styles.complianceExpiry} ${styles[item.level as keyof typeof styles]}`}>
                    {item.expiry}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Class Attendance ─────────────────────────────────────────── */}
        <motion.div
          className={styles.card}
          style={{ marginBottom: 24 }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Class Attendance Today</span>
            <span className={`${styles.cardBadge} ${styles.academic}`}>Academics</span>
          </div>
          <div className={styles.attendanceGrid}>
            {ATTENDANCE_CLASSES.map((row) => (
              <div key={row.cls} className={styles.attendanceRow}>
                <span className={styles.attendanceClass}>{row.cls}</span>
                <div className={styles.attendanceBar}>
                  <motion.div
                    className={`${styles.attendanceFill} ${row.pct < 85 ? styles.warn : ""}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${row.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
                <span className={styles.attendancePct}>{row.pct}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── School Modules ───────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
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
