"use client";

import { motion } from "framer-motion";
import { DashboardShell } from "../../components/DashboardShell";
import { MetricCard } from "../../components/MetricCard";
import { ModuleCard } from "../../components/ModuleCard";
import { dashboardModules } from "../../lib/modules";
import styles from "../../components/dashboard.module.css";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
};

const staggerFast = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.05 } },
};

const KPI_DATA = [
  { label: "Active Trips",      value: "3",   detail: "2 inbound · 1 outbound",             color: "brand"   as const, badge: "LIVE",   badgeType: "live"  as const },
  { label: "Students Present",  value: "847", detail: "94.2% attendance rate today",        color: "success" as const, badge: "TODAY",  badgeType: "live"  as const, variant: "success" as const },
  { label: "Urgent Renewals",   value: "3",   detail: "2 critical · 1 expiring soon",       color: "danger"  as const, badge: "ACTION", badgeType: "alert" as const, variant: "danger"  as const },
  { label: "Unread Notices",    value: "12",  detail: "7 teacher notes · 5 parent replies", color: "warning" as const, variant: "warning" as const },
];

export default function DashboardPage() {
  return (
    <DashboardShell>

      {/* KPI Strip */}
      <motion.section
        className={styles.kpiStrip}
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {KPI_DATA.map((kpi) => (
          <motion.div key={kpi.label} variants={fadeUp} transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}>
            <MetricCard {...kpi} />
          </motion.div>
        ))}
      </motion.section>

      {/* Hero Banner */}
      <motion.section
        className={styles.heroBanner}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <div className={styles.heroLeft}>
          <p className={styles.heroEyebrow}>School Command Center</p>
          <h3 className={styles.heroHeadline}>Full operational visibility, one screen.</h3>
          <p className={styles.heroCopy}>
            Transport activity, teacher attendance signals, compliance risk, and parent-facing
            communications connected so administrators can move from alert to action without switching tools.
          </p>
        </div>
        <div className={styles.heroRight}>
          <p className={styles.heroFocusTitle}>Today&apos;s Operating Focus</p>
          <ul className={styles.heroFocusList}>
            {[
              "3 active fleet trips — monitor pickup & drop events",
              "Vehicle fitness certificate expires in 4 days",
              "7 unread teacher progress comments to review",
              "Class 10-B attendance below 85% threshold",
            ].map((item, i) => (
              <li key={i} className={styles.heroFocusItem}>
                <span className={styles.heroFocusDot} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </motion.section>

      {/* Main insights grid */}
      <motion.section
        className={styles.mainGrid}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Fleet Status */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Live Fleet Status</span>
              <span className={styles.cardBadge}>Transport</span>
            </div>
            <div className={styles.fleetRow}>
              {[
                { name: "Bus KA-04 MN 2210", route: "Route A · North Campus", status: "active", statusLabel: "En Route"  },
                { name: "Bus KA-04 MN 3348", route: "Route B · East Wing",    status: "active", statusLabel: "En Route"  },
                { name: "Bus KA-04 MN 5501", route: "Route C · West End",     status: "active", statusLabel: "Returning" },
                { name: "Bus KA-04 MN 7723", route: "Route D · South Zone",   status: "idle",   statusLabel: "Standby"   },
                { name: "Bus KA-04 MN 9914", route: "Route E · Central",      status: "idle",   statusLabel: "Parked"    },
              ].map((bus) => (
                <div key={bus.name} className={styles.fleetItem}>
                  <span className={`${styles.fleetDot} ${styles[bus.status]}`} />
                  <span className={styles.fleetName}>{bus.name}</span>
                  <span className={styles.fleetRoute}>{bus.route}</span>
                  <span className={`${styles.fleetStatus} ${styles[bus.status]}`}>{bus.statusLabel}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Class Attendance Today</span>
              <span className={styles.cardBadge}>Academics</span>
            </div>
            <div className={styles.attendanceGrid}>
              {[
                { cls: "Class 6",    pct: 97 },
                { cls: "Class 7",    pct: 95 },
                { cls: "Class 8",    pct: 92 },
                { cls: "Class 9",    pct: 89 },
                { cls: "Class 10-A", pct: 96 },
                { cls: "Class 10-B", pct: 81 },
                { cls: "Class 11",   pct: 93 },
                { cls: "Class 12",   pct: 88 },
              ].map((row) => (
                <div key={row.cls} className={styles.attendanceRow}>
                  <span className={styles.attendanceClass}>{row.cls}</span>
                  <div className={styles.attendanceBar}>
                    <motion.div
                      className={styles.attendanceFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${row.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <span className={styles.attendancePct}>{row.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Compliance */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Compliance Status</span>
              <span className={styles.cardBadge}>Risk</span>
            </div>
            <div className={styles.complianceList}>
              {[
                { name: "Bus MN 2210",      sub: "Fitness Certificate",  expiry: "4 days",  level: "critical" },
                { name: "Bus MN 3348",      sub: "Pollution Certificate",expiry: "11 days", level: "soon"     },
                { name: "Bus MN 5501",      sub: "Insurance Policy",     expiry: "22 days", level: "soon"     },
                { name: "Driver Ramesh K.", sub: "Driving License",      expiry: "45 days", level: "ok"       },
                { name: "Bus MN 9914",      sub: "Road Permit",          expiry: "60 days", level: "ok"       },
              ].map((item) => (
                <div key={item.name + item.sub} className={styles.complianceItem}>
                  <div>
                    <p className={styles.complianceName}>{item.name}</p>
                    <p className={styles.complianceSub}>{item.sub}</p>
                  </div>
                  <span className={`${styles.complianceExpiry} ${styles[item.level]}`}>{item.expiry}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts Feed */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Recent Alerts</span>
              <span className={styles.cardBadge}>Live</span>
            </div>
            <div className={styles.alertFeed}>
              {[
                { type: "ok",   text: "Bus MN 2210 departed North Campus stop on schedule.",  time: "8:14 AM"   },
                { type: "warn", text: "Class 10-B attendance flagged below threshold (81%).", time: "8:05 AM"   },
                { type: "info", text: "Driver Suresh M. started morning trip on Route B.",    time: "7:58 AM"   },
                { type: "warn", text: "Fitness certificate for Bus MN 2210 expires in 4 days.",time: "7:30 AM"  },
                { type: "ok",   text: "Parent broadcast sent to 312 parents for sports day.", time: "Yesterday" },
              ].map((alert, i) => (
                <div key={i} className={styles.alertItem}>
                  <span className={`${styles.alertDot} ${styles[alert.type]}`} />
                  <div>
                    <p className={styles.alertText}>{alert.text}</p>
                    <p className={styles.alertTime}>{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Module Grid */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.65, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <h3 className={styles.sectionTitle}>School Modules</h3>
        <motion.div
          className={styles.moduleGrid}
          variants={staggerFast}
          initial="hidden"
          animate="show"
        >
          {dashboardModules.map((module) => (
            <motion.div
              key={module.href}
              variants={fadeUp}
              transition={{ duration: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <ModuleCard {...module} />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>
    </DashboardShell>
  );
}
