"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { DashboardShell } from "../../../components/DashboardShell";
import { MetricCard } from "../../../components/MetricCard";
import styles from "../../../components/dashboard.module.css";
import dStyles from "./dismissal.module.css";

// ---------------------------------------------------------------------------
// Demo data — mirrors the pickupIntents seeded in backend/src/common/demo_state.py
// In production this would be fetched from GET /api/dismissal/queue/ and updated
// via ws/dismissal/<school_id>/ WebSocket.
// ---------------------------------------------------------------------------

type Intent = {
  id: number;
  student_name: string;
  parent_name: string;
  classroom: string;
  eta_minutes: number;
  eta_label: string;
  status: "pending" | "notified" | "completed";
  queue_position: number;
  created_at: string;
  notified_at: string | null;
};

const SEED_QUEUE: Intent[] = [
  { id: 1, student_name: "Aarav Roy",    parent_name: "Aarav's Parent",  classroom: "Class 4B", eta_minutes: 0,  eta_label: "Here now", status: "pending",   queue_position: 1, created_at: "14:45", notified_at: null },
  { id: 2, student_name: "Rohan Mehta",  parent_name: "Rohan's Parent",  classroom: "Class 4B", eta_minutes: 1,  eta_label: "1 min",    status: "pending",   queue_position: 2, created_at: "14:44", notified_at: null },
  { id: 4, student_name: "Ved Singh",    parent_name: "Ved's Parent",    classroom: "Class 4B", eta_minutes: 5,  eta_label: "5 min",    status: "notified",  queue_position: 3, created_at: "14:40", notified_at: "14:46" },
  { id: 3, student_name: "Priya Sharma", parent_name: "Priya's Parent",  classroom: "Class 5A", eta_minutes: 5,  eta_label: "5 min",    status: "pending",   queue_position: 4, created_at: "14:43", notified_at: null },
  { id: 5, student_name: "Mira Dutta",   parent_name: "Mira's Parent",   classroom: "Class 5A", eta_minutes: 10, eta_label: "10 min",   status: "pending",   queue_position: 5, created_at: "14:42", notified_at: null },
];

const CLASSES = ["All classes", "Class 4B", "Class 5A", "Class 6A"];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1,  y: 0  },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function etaBadgeClass(eta: number) {
  if (eta === 0) return dStyles.etaHere;
  if (eta <= 1)  return dStyles.etaSoon;
  if (eta <= 5)  return dStyles.etaMid;
  return dStyles.etaFar;
}

function statusClass(s: string) {
  if (s === "notified")  return dStyles.statusNotified;
  if (s === "completed") return dStyles.statusDone;
  return dStyles.statusPending;
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DismissalPage() {
  const [queue, setQueue]           = useState<Intent[]>(SEED_QUEUE);
  const [classFilter, setClassFilter] = useState("All classes");
  const [completedToday, setCompletedToday] = useState(1);

  const active    = queue.filter(i => i.status !== "completed");
  const pending   = queue.filter(i => i.status === "pending").length;
  const notified  = queue.filter(i => i.status === "notified").length;

  const filtered  = (classFilter === "All classes" ? active : active.filter(i => i.classroom === classFilter))
    .slice()
    .sort((a, b) => a.eta_minutes - b.eta_minutes || a.created_at.localeCompare(b.created_at));

  function markReady(studentName: string, intentId: number) {
    setQueue(prev =>
      prev.map(i =>
        i.id === intentId
          ? { ...i, status: "notified", notified_at: "now" }
          : i
      )
    );
  }

  function markComplete(intentId: number) {
    setQueue(prev =>
      prev.map(i =>
        i.id === intentId ? { ...i, status: "completed" } : i
      )
    );
    setCompletedToday(n => n + 1);
  }

  return (
    <DashboardShell>

      {/* KPI Strip */}
      <motion.section
        className={styles.kpiStrip}
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {[
          { label: "Waiting in queue", value: String(pending),        detail: "Parents have signalled arrival",        color: "brand"   as const, badge: "LIVE", badgeType: "live" as const },
          { label: "Child called",     value: String(notified),       detail: "Notified — heading to gate now",        color: "warning" as const },
          { label: "Dismissed today",  value: String(completedToday), detail: "Pickups completed this session",        color: "success" as const },
          { label: "Avg wait",         value: "4 min",                detail: "From signal to gate call",             color: "brand"   as const },
        ].map(kpi => (
          <motion.div key={kpi.label} variants={fadeUp} transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}>
            <MetricCard {...kpi} />
          </motion.div>
        ))}
      </motion.section>

      {/* Hero banner */}
      <motion.section
        className={styles.heroBanner}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
      >
        <div className={styles.heroLeft}>
          <p className={styles.heroEyebrow}>Dismissal Control</p>
          <h3 className={styles.heroHeadline}>Live car-pickup queue, one screen.</h3>
          <p className={styles.heroCopy}>
            Parents signal their ETA from the Skippo app. Call children to the gate
            in arrival order, tap "Child ready", and parents get an instant push
            notification. No more gate chaos, no more office calls.
          </p>
        </div>
        <div className={styles.heroRight}>
          <p className={styles.heroFocusTitle}>How it works</p>
          <ul className={styles.heroFocusList}>
            {[
              "Parent taps "I'm on my way" with an ETA in the Skippo app.",
              "Queue auto-sorts by arrival time — earliest first.",
              "Staff taps "Child ready" — parent gets an instant notification.",
              "Parent confirms pickup — slot is closed and stats update.",
            ].map((item, i) => (
              <li key={i} className={styles.heroFocusItem}>
                <span className={styles.heroFocusDot} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </motion.section>

      {/* Queue panel */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
      >
        {/* Toolbar */}
        <div className={dStyles.toolbar}>
          <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Live Pickup Queue</h3>
          <div className={dStyles.toolbarRight}>
            <div className={dStyles.livePill}>
              <span className={dStyles.liveDot} />
              Live · auto-refreshes
            </div>
            <div className={dStyles.filterGroup}>
              {CLASSES.map(cls => (
                <button
                  key={cls}
                  className={`${dStyles.filterBtn} ${classFilter === cls ? dStyles.filterBtnActive : ""}`}
                  onClick={() => setClassFilter(cls)}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={dStyles.queueTable}>
          {/* Header */}
          <div className={dStyles.tableHead}>
            <span className={dStyles.thPos}>#</span>
            <span className={dStyles.thStudent}>Student</span>
            <span className={dStyles.thClass}>Class</span>
            <span className={dStyles.thParent}>Parent</span>
            <span className={dStyles.thEta}>ETA</span>
            <span className={dStyles.thStatus}>Status</span>
            <span className={dStyles.thAction}>Action</span>
          </div>

          {/* Rows */}
          {filtered.length === 0 && (
            <div className={dStyles.emptyState}>
              <p className={dStyles.emptyTitle}>Queue is clear</p>
              <p className={dStyles.emptySub}>No parents have signalled arrival yet. Check back during dismissal window.</p>
            </div>
          )}

          {filtered.map((intent, idx) => (
            <motion.div
              key={intent.id}
              className={dStyles.tableRow}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1,  x: 0   }}
              transition={{ delay: idx * 0.06, duration: 0.35 }}
            >
              <span className={dStyles.tdPos}>{idx + 1}</span>

              <div className={dStyles.tdStudent}>
                <div className={dStyles.studentAvatar}>
                  {intent.student_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <span className={dStyles.studentName}>{intent.student_name}</span>
              </div>

              <span className={dStyles.tdClass}>{intent.classroom}</span>
              <span className={dStyles.tdParent}>{intent.parent_name}</span>

              <span className={`${dStyles.tdEta} ${etaBadgeClass(intent.eta_minutes)}`}>
                {intent.eta_label}
              </span>

              <span className={`${dStyles.tdStatus} ${statusClass(intent.status)}`}>
                {intent.status === "pending"  ? "Waiting" : ""}
                {intent.status === "notified" ? "Called ✓" : ""}
              </span>

              <div className={dStyles.tdAction}>
                {intent.status === "pending" && (
                  <button
                    className={dStyles.readyBtn}
                    onClick={() => markReady(intent.student_name, intent.id)}
                  >
                    Child is ready
                  </button>
                )}
                {intent.status === "notified" && (
                  <button
                    className={dStyles.doneBtn}
                    onClick={() => markComplete(intent.id)}
                  >
                    Mark picked up
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Stats footer */}
      <motion.section
        className={dStyles.statsRow}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1,  y: 0  }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {[
          { label: "Total signalled today", value: String(queue.length) },
          { label: "Currently in queue",    value: String(active.length) },
          { label: "Dismissed",             value: String(completedToday) },
          { label: "Avg ETA at signal",     value: "5.4 min" },
          { label: "Peak queue depth",      value: "7" },
        ].map(stat => (
          <div key={stat.label} className={dStyles.statItem}>
            <span className={dStyles.statValue}>{stat.value}</span>
            <span className={dStyles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </motion.section>

    </DashboardShell>
  );
}
