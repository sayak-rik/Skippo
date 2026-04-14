import { DashboardShell } from "../../components/DashboardShell";
import { Header } from "../../components/Header";
import { MetricCard } from "../../components/MetricCard";
import { ModuleCard } from "../../components/ModuleCard";
import { dashboardModules } from "../../lib/modules";
import styles from "../../components/dashboard.module.css";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <Header />

      {/* KPI Strip */}
      <section className={styles.kpiStrip}>
        <MetricCard
          label="Active Trips"
          value="3"
          detail="2 inbound · 1 outbound"
          color="brand"
          badge="LIVE"
          badgeType="live"
        />
        <MetricCard
          label="Students Present"
          value="847"
          detail="94.2% attendance rate today"
          color="success"
          badge="TODAY"
          badgeType="live"
          variant="success"
        />
        <MetricCard
          label="Urgent Renewals"
          value="3"
          detail="2 critical · 1 expiring soon"
          color="danger"
          badge="ACTION"
          badgeType="alert"
          variant="danger"
        />
        <MetricCard
          label="Unread Notices"
          value="12"
          detail="7 teacher notes · 5 parent replies"
          color="warning"
          variant="warning"
        />
      </section>

      {/* Hero Banner */}
      <section className={styles.heroBanner}>
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
            <li className={styles.heroFocusItem}>
              <span className={styles.heroFocusDot} />
              3 active fleet trips — monitor pickup & drop events
            </li>
            <li className={styles.heroFocusItem}>
              <span className={styles.heroFocusDot} />
              Vehicle fitness certificate expires in 4 days
            </li>
            <li className={styles.heroFocusItem}>
              <span className={styles.heroFocusDot} />
              7 unread teacher progress comments to review
            </li>
            <li className={styles.heroFocusItem}>
              <span className={styles.heroFocusDot} />
              Class 10-B attendance below 85% threshold
            </li>
          </ul>
        </div>
      </section>

      {/* Main insights grid */}
      <section className={styles.mainGrid}>
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
                { name: "Bus KA-04 MN 2210", route: "Route A · North Campus", status: "active", statusLabel: "En Route" },
                { name: "Bus KA-04 MN 3348", route: "Route B · East Wing", status: "active", statusLabel: "En Route" },
                { name: "Bus KA-04 MN 5501", route: "Route C · West End", status: "active", statusLabel: "Returning" },
                { name: "Bus KA-04 MN 7723", route: "Route D · South Zone", status: "idle", statusLabel: "Standby" },
                { name: "Bus KA-04 MN 9914", route: "Route E · Central", status: "idle", statusLabel: "Parked" },
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

          {/* Attendance by Class */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Class Attendance Today</span>
              <span className={styles.cardBadge}>Academics</span>
            </div>
            <div className={styles.attendanceGrid}>
              {[
                { cls: "Class 6", pct: 97 },
                { cls: "Class 7", pct: 95 },
                { cls: "Class 8", pct: 92 },
                { cls: "Class 9", pct: 89 },
                { cls: "Class 10-A", pct: 96 },
                { cls: "Class 10-B", pct: 81 },
                { cls: "Class 11", pct: 93 },
                { cls: "Class 12", pct: 88 },
              ].map((row) => (
                <div key={row.cls} className={styles.attendanceRow}>
                  <span className={styles.attendanceClass}>{row.cls}</span>
                  <div className={styles.attendanceBar}>
                    <div className={styles.attendanceFill} style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className={styles.attendancePct}>{row.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Compliance Center */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Compliance Status</span>
              <span className={styles.cardBadge}>Risk</span>
            </div>
            <div className={styles.complianceList}>
              {[
                { name: "Bus MN 2210", sub: "Fitness Certificate", expiry: "4 days", level: "critical" },
                { name: "Bus MN 3348", sub: "Pollution Certificate", expiry: "11 days", level: "soon" },
                { name: "Bus MN 5501", sub: "Insurance Policy", expiry: "22 days", level: "soon" },
                { name: "Driver Ramesh K.", sub: "Driving License", expiry: "45 days", level: "ok" },
                { name: "Bus MN 9914", sub: "Road Permit", expiry: "60 days", level: "ok" },
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
                { type: "ok", text: "Bus MN 2210 departed North Campus stop on schedule.", time: "8:14 AM" },
                { type: "warn", text: "Class 10-B attendance flagged below threshold (81%).", time: "8:05 AM" },
                { type: "info", text: "Driver Suresh M. started morning trip on Route B.", time: "7:58 AM" },
                { type: "warn", text: "Fitness certificate for Bus MN 2210 expires in 4 days.", time: "7:30 AM" },
                { type: "ok", text: "Parent broadcast sent to 312 parents for sports day.", time: "Yesterday" },
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
      </section>

      {/* Module Grid */}
      <section>
        <h3 className={styles.sectionTitle}>School Modules</h3>
        <div className={styles.moduleGrid}>
          {dashboardModules.map((module) => (
            <ModuleCard key={module.href} {...module} />
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
