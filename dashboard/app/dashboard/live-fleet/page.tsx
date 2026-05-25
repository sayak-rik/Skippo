"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import {
  Radar, RefreshCw, Bus, MapPin, Users, CheckCircle2,
  Clock, Navigation,
} from "lucide-react";
import { DashboardShell } from "../../../components/DashboardShell";
import { apiFetch } from "../../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TripLocation { latitude: number; longitude: number; }

interface LiveTrip {
  id: number;
  routeName: string;
  busLabel: string;
  status: "active" | "scheduled" | "completed" | "cancelled";
  location: TripLocation | null;
  driverName?: string;
  boardedCount?: number;
  totalCount?: number;
  shift?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fade = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: "Active",    color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  scheduled: { label: "Scheduled", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  completed: { label: "Completed", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

// ── Trip Card ──────────────────────────────────────────────────────────────────

function TripCard({ trip }: { trip: LiveTrip }) {
  const isActive = trip.status === "active";
  const meta = STATUS_META[trip.status] ?? STATUS_META.scheduled;
  return (
    <motion.div variants={fade} style={{
      background: "var(--surface)", border: `1px solid ${isActive ? "#bbf7d0" : "var(--stroke)"}`,
      borderRadius: 14, padding: "18px 20px", boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: isActive ? "#f0fdf4" : "var(--surface-raised)",
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
        }}>
          <Bus size={20} color={isActive ? "#16a34a" : "var(--ink-dim)"} />
          {isActive && (
            <span style={{
              position: "absolute", top: -3, right: -3, width: 10, height: 10,
              borderRadius: "50%", background: "#16a34a", border: "2px solid var(--surface)",
              animation: "livePulse 2s ease-in-out infinite",
            }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
              {trip.routeName || "Unknown route"}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 8px",
              background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
            }}>{meta.label}</span>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}>
              <Bus size={12} /> {trip.busLabel || "—"}
            </span>
            {trip.driverName && (
              <span style={{ fontSize: 12, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}>
                <Users size={12} /> {trip.driverName}
              </span>
            )}
            {trip.shift && (
              <span style={{ fontSize: 12, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={12} /> {trip.shift.charAt(0).toUpperCase() + trip.shift.slice(1)} shift
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          {trip.boardedCount != null && trip.totalCount != null && trip.totalCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 80, height: 5, background: "var(--stroke)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 999, background: "#16a34a",
                  width: `${(trip.boardedCount / trip.totalCount) * 100}%`,
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>
                {trip.boardedCount}/{trip.totalCount} boarded
              </span>
            </div>
          )}
          {trip.location ? (
            <span style={{ fontSize: 11, color: "#16a34a", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}>
              <Navigation size={11} /> Live GPS
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--ink-dim)", display: "flex", alignItems: "center", gap: 3 }}>
              <MapPin size={11} /> No GPS data
            </span>
          )}
        </div>
      </div>

      {isActive && trip.location && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--stroke)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--ink-dim)", fontFamily: "monospace" }}>
            {trip.location.latitude.toFixed(5)}, {trip.location.longitude.toFixed(5)}
          </span>
          <span style={{ fontSize: 11, color: "#16a34a", marginLeft: "auto", fontWeight: 600 }}>● Transmitting</span>
        </div>
      )}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LiveFleetPage() {
  const [trips, setTrips] = useState<LiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await apiFetch<{ results: LiveTrip[] } | LiveTrip[]>("/api/tracking/fleet/live/");
      setTrips(Array.isArray(data) ? data : ((data as any)?.results ?? []));
      setLastRefresh(new Date());
    } catch {
      setTrips([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 30_000);
    return () => clearInterval(t);
  }, [load]);

  const active    = trips.filter((t) => t.status === "active").length;
  const scheduled = trips.filter((t) => t.status === "scheduled").length;

  return (
    <DashboardShell>
      <div style={{ padding: "24px 28px 48px", maxWidth: 900 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600, marginBottom: 6 }}>Transport</p>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>Live Fleet</h1>
            {lastRefresh && (
              <p style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>
                Updated {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                {" · "} auto-refreshes every 30 s
              </p>
            )}
          </div>
          <button onClick={() => load(true)} disabled={refreshing || loading}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--surface)", border: "1px solid var(--stroke)",
              borderRadius: 10, padding: "10px 18px", fontWeight: 600, fontSize: 14,
              cursor: "pointer", color: "var(--ink)", opacity: refreshing ? 0.6 : 1,
            }}>
            <RefreshCw size={15} style={refreshing ? { animation: "spin 1s linear infinite" } : {}} />
            Refresh
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total trips",  value: loading ? "—" : trips.length, color: "#2563eb", icon: Bus },
            { label: "Active now",   value: loading ? "—" : active,        color: "#16a34a", icon: CheckCircle2 },
            { label: "Scheduled",    value: loading ? "—" : scheduled,     color: "#d97706", icon: Clock },
          ].map((s) => (
            <motion.div key={s.label} variants={fade} style={{
              background: "var(--surface)", border: "1px solid var(--stroke)",
              borderTop: `3px solid ${s.color}`, borderRadius: 14, padding: "16px 18px",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <s.icon size={17} color={s.color} />
              </div>
              <p style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Info banner */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "12px 16px", marginBottom: 22, display: "flex", gap: 10, alignItems: "center" }}>
          <Radar size={15} color="#2563eb" />
          <p style={{ fontSize: 12, color: "#1d4ed8" }}>
            Live positions are transmitted every 10 seconds by the driver app. Only <strong>Active</strong> trips show GPS coordinates.
          </p>
        </motion.div>

        {/* Trip list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-dim)" }}>Loading fleet…</div>
        ) : trips.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚌</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No active trips right now</p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              Trips appear here once a driver starts a run from the Skippo Driver app.
            </p>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {trips.map((t) => <TripCard key={t.id} trip={t} />)}
          </motion.div>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </DashboardShell>
  );
}
