"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CarFront, CheckSquare, RefreshCw, Square, Zap } from "lucide-react";

import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";
import dStyles from "./dismissal.module.css";

// ── Types (mirrors backend demo_state shape) ───────────────────────────────

type Intent = {
  id: number;
  student_id: number;
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

type QueueStats = {
  pending: number;
  notified: number;
  completed_today: number;
  avg_wait_minutes: number;
};

type QueueResponse = {
  queue: Intent[];
  stats: QueueStats;
};

// ── Constants ──────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: "#FEE2E2", text: "#DC2626" },
  { bg: "#FEF3C7", text: "#D97706" },
  { bg: "#D1FAE5", text: "#059669" },
  { bg: "#DBEAFE", text: "#2563EB" },
  { bg: "#EDE9FE", text: "#7C3AED" },
];

const POLL_INTERVAL_MS = 12_000;

// ── Page ───────────────────────────────────────────────────────────────────

export default function DismissalPage() {
  const router = useRouter();
  const [queue, setQueue]   = useState<Intent[]>([]);
  const [stats, setStats]   = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [actionInFlight, setActionInFlight] = useState<number | null>(null);
  const [quickDismissInFlight, setQuickDismissInFlight] = useState(false);

  // ── Fetch queue ────────────────────────────────────────────────────────

  const fetchQueue = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await apiFetch<QueueResponse>("/api/dismissal/queue/");
      setQueue(data.queue);
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message ?? "Failed to load dismissal queue.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const id = setInterval(() => fetchQueue(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchQueue]);

  // ── Actions ────────────────────────────────────────────────────────────

  async function markReady(studentId: number) {
    setActionInFlight(studentId);
    try {
      await apiFetch(`/api/dismissal/ready/${studentId}/`, { method: "POST" });
      await fetchQueue(true);
    } catch (err: any) {
      setError(err.message ?? "Action failed.");
    } finally {
      setActionInFlight(null);
    }
  }

  async function quickDismissAll() {
    const notified = queue.filter(i => i.status === "notified");
    if (notified.length === 0) return;
    setQuickDismissInFlight(true);
    try {
      await Promise.all(
        notified.map(i =>
          apiFetch(`/api/dismissal/complete/${i.student_id}/`, { method: "POST" })
        )
      );
      await fetchQueue(true);
    } catch (err: any) {
      setError(err.message ?? "Quick dismiss failed.");
    } finally {
      setQuickDismissInFlight(false);
    }
  }

  async function markComplete(studentId: number) {
    setActionInFlight(studentId);
    try {
      await apiFetch(`/api/dismissal/complete/${studentId}/`, { method: "POST" });
      await fetchQueue(true);
    } catch (err: any) {
      setError(err.message ?? "Action failed.");
    } finally {
      setActionInFlight(null);
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────

  const uniqueClasses = ["All", ...Array.from(new Set(queue.map(i => i.classroom))).sort()];
  const active   = queue.filter(i => i.status !== "completed");
  const totalAll = (stats?.completed_today ?? 0) + active.length;
  const totalPct = totalAll > 0
    ? Math.round(((stats?.completed_today ?? 0) / totalAll) * 100)
    : 0;

  const filtered = (classFilter === "All" ? active : active.filter(i => i.classroom === classFilter))
    .slice()
    .sort((a, b) => a.eta_minutes - b.eta_minutes || a.created_at.localeCompare(b.created_at));

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <DashboardShell>
      <div className={dStyles.page}>

        {/* ── Top action row ──────────────────────────────────────────── */}
        <div className={dStyles.topRow}>
          <div className={dStyles.filterGroup}>
            {uniqueClasses.map(cls => (
              <button
                key={cls}
                className={`${dStyles.filterBtn} ${classFilter === cls ? dStyles.filterBtnActive : ""}`}
                onClick={() => setClassFilter(cls)}
              >
                {cls}
              </button>
            ))}
          </div>
          <div className={dStyles.topActions}>
            <button className={dStyles.refreshBtn} onClick={() => fetchQueue()} title="Refresh queue">
              <RefreshCw size={14} />
            </button>
            <button
              className={dStyles.ctaBtn}
              onClick={quickDismissAll}
              disabled={quickDismissInFlight || queue.filter(i => i.status === "notified").length === 0}
              title="Mark all called students as picked up"
            >
              <Zap size={14} strokeWidth={2.5} />
              {quickDismissInFlight ? "Dismissing…" : "Quick Dismiss"}
            </button>
          </div>
        </div>

        {/* ── Error banner ────────────────────────────────────────────── */}
        {error && (
          <div className={dStyles.errorBanner}>{error}</div>
        )}

        {/* ── Main grid ───────────────────────────────────────────────── */}
        {loading ? (
          <div className={dStyles.loadingState}>Loading dismissal queue…</div>
        ) : (
          <div className={dStyles.mainGrid}>

            {/* ─── Left column ─── */}
            <div className={dStyles.leftCol}>

              {/* Stat cards */}
              <motion.div
                className={dStyles.statRow}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className={dStyles.statCard}>
                  <div className={dStyles.statCardTop}>
                    <div className={dStyles.statIcon} style={{ background: "#D1FAE5", color: "#059669" }}>
                      <CarFront size={18} />
                    </div>
                    <span className={dStyles.statTitle}>Active Queue</span>
                    <ArrowUpRight size={16} className={dStyles.statArrow} />
                  </div>
                  <div className={dStyles.statValue}>
                    {String(active.length).padStart(2, "0")}
                    <span className={dStyles.statFrac}>/{totalAll}</span>
                  </div>
                  <div className={dStyles.statSub}>Parents signalled arrival</div>
                  <div className={dStyles.statWatermark}>🚗</div>
                </div>

                <div className={dStyles.statCard}>
                  <div className={dStyles.statCardTop}>
                    <div className={dStyles.statIcon} style={{ background: "#FEF3C7", color: "#D97706" }}>
                      <CheckSquare size={18} />
                    </div>
                    <span className={dStyles.statTitle}>Dismissed Today</span>
                    <ArrowUpRight size={16} className={dStyles.statArrow} />
                  </div>
                  <div className={dStyles.statValue}>
                    {stats?.completed_today ?? 0}
                    <span className={dStyles.statUnit}> pickups</span>
                  </div>
                  <div className={dStyles.statSub}>Pickups completed this session</div>
                  <div className={dStyles.statWatermark}>✓</div>
                </div>
              </motion.div>

              {/* Session overview card (replaces chart — no time-series endpoint) */}
              <motion.div
                className={dStyles.overviewCard}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className={dStyles.overviewHeader}>
                  <div>
                    <div className={dStyles.overviewTitle}>Session Overview</div>
                    <div className={dStyles.overviewMeta}>
                      <span className={dStyles.overviewBig}>{stats?.avg_wait_minutes ?? "—"} min</span>
                      <span className={dStyles.overviewTrend}>avg wait time</span>
                    </div>
                  </div>
                  <div className={dStyles.livePillSmall}>
                    <span className={dStyles.liveDot} />
                    Live
                  </div>
                </div>

                <div className={dStyles.overviewBars}>
                  {[
                    { label: "Waiting",   value: stats?.pending ?? 0,          color: "#EA580C", max: totalAll || 1 },
                    { label: "Called",    value: stats?.notified ?? 0,         color: "#2563EB", max: totalAll || 1 },
                    { label: "Dismissed", value: stats?.completed_today ?? 0,  color: "#16A34A", max: totalAll || 1 },
                  ].map(row => (
                    <div key={row.label} className={dStyles.overviewBarRow}>
                      <span className={dStyles.overviewBarLabel}>{row.label}</span>
                      <div className={dStyles.overviewBarTrack}>
                        <div
                          className={dStyles.overviewBarFill}
                          style={{
                            width: `${Math.round((row.value / row.max) * 100)}%`,
                            background: row.color,
                          }}
                        />
                      </div>
                      <span className={dStyles.overviewBarCount}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Queue cards */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className={dStyles.sectionHeader}>
                  <span className={dStyles.sectionLabel}>Live Pickup Queue</span>
                  <div className={dStyles.sectionRight}>
                    <div className={dStyles.livePill}>
                      <span className={dStyles.liveDot} />
                      Live · auto-refreshes
                    </div>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className={dStyles.emptyState}>
                    <div className={dStyles.emptyIcon}>🎉</div>
                    <p className={dStyles.emptyTitle}>Queue is clear</p>
                    <p className={dStyles.emptySub}>No pending pickups for this class.</p>
                  </div>
                ) : (
                  <div className={dStyles.queueCards}>
                    {filtered.map((item, idx) => {
                      const color    = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                      const initials = item.student_name.split(" ").map(n => n[0]).join("").slice(0, 2);
                      const busy     = actionInFlight === item.student_id;
                      return (
                        <motion.div
                          key={item.id}
                          className={dStyles.queueCard}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.06, duration: 0.3 }}
                        >
                          <div className={dStyles.cardThumb} style={{ background: color.bg, color: color.text }}>
                            {initials}
                            {item.status === "notified" && <div className={dStyles.cardNotifiedBadge}>✓</div>}
                          </div>

                          <div className={dStyles.cardInfo}>
                            <div className={dStyles.cardName}>{item.student_name}</div>
                            <div className={dStyles.cardMeta}>{item.classroom} · ETA {item.eta_label}</div>
                          </div>

                          {item.status === "pending" && (
                            <button
                              className={dStyles.cardReadyBtn}
                              onClick={() => markReady(item.student_id)}
                              disabled={busy}
                            >
                              {busy ? "…" : "Child ready"}
                            </button>
                          )}
                          {item.status === "notified" && (
                            <button
                              className={dStyles.cardDoneBtn}
                              onClick={() => markComplete(item.student_id)}
                              disabled={busy}
                            >
                              {busy ? "…" : "Picked up"}
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

            </div>

            {/* ─── Right panel ─── */}
            <div className={dStyles.rightPanel}>

              {/* Hero banner */}
              <motion.div
                className={dStyles.heroBanner}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                <div className={dStyles.heroBadge}>
                  <span className={dStyles.heroBadgeAvatars}>👨‍👩‍👧 👩 👨</span>
                  <span className={dStyles.heroBadgeText}>
                    {(stats?.pending ?? 0) + (stats?.notified ?? 0)} waiting · live
                  </span>
                </div>
                <h3 className={dStyles.heroHeadline}>
                  Fast, Organized Car Pickup for Every Student
                </h3>
                <button className={dStyles.heroBtn} onClick={() => router.push("/dashboard/live-fleet")}>
                  <CarFront size={16} strokeWidth={2} />
                  Go to Gate View
                </button>
              </motion.div>

              {/* Progress task card */}
              <motion.div
                className={dStyles.progressCard}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <div className={dStyles.progressHeader}>
                  <span className={dStyles.progressTitle}>Today&apos;s Pickups</span>
                  <span className={dStyles.progressCount}>{totalAll} total</span>
                </div>

                <div className={dStyles.progressStat}>
                  <span className={dStyles.progressPct}>{totalPct}%</span>
                  <span className={dStyles.progressLabel}>Completed</span>
                </div>
                <div className={dStyles.progressBarWrap}>
                  <div className={dStyles.progressBarFill} style={{ width: `${totalPct}%` }} />
                </div>

                {/* All intents — active + completed from stats */}
                <div className={dStyles.taskList}>
                  {queue.length === 0 && (
                    <p className={dStyles.taskEmpty}>No pickup intents yet today.</p>
                  )}
                  {queue.map((item, idx) => {
                    const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                    const done  = item.status === "completed";
                    const timeLabel = new Date(item.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit", minute: "2-digit",
                    });
                    return (
                      <div key={item.id} className={dStyles.taskItem}>
                        <div className={dStyles.taskIcon} style={{ background: color.bg, color: color.text }}>
                          🚗
                        </div>
                        <div className={dStyles.taskBody}>
                          <div className={`${dStyles.taskName} ${done ? dStyles.taskNameDone : ""}`}>
                            {item.student_name}
                          </div>
                          <div className={dStyles.taskMeta}>
                            ETA {item.eta_label} · {timeLabel}
                          </div>
                        </div>
                        <div className={dStyles.taskCheck}>
                          {done
                            ? <CheckSquare size={16} style={{ color: "var(--success)" }} />
                            : <Square size={16} style={{ color: "var(--ink-dim)" }} />
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

            </div>

          </div>
        )}
      </div>
    </DashboardShell>
  );
}
