// ---------------------------------------------------------------------------
// HomeScreen – parent dashboard.
// Visual hierarchy: hero trip card → today-at-a-glance → latest note → alerts.
// ---------------------------------------------------------------------------

import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useParentDashboard } from "../hooks/useParentDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  active:    "On the way",
  arriving:  "Arriving soon",
  completed: "Trip ended",
};

const LEVEL_COLOR: Record<string, string> = {
  info:     palette.brand,
  warning:  palette.warning,
  critical: palette.danger,
};

const LEVEL_BG: Record<string, string> = {
  info:     "#eef2ff",
  warning:  "#fffbeb",
  critical: "#fef2f2",
};

export function HomeScreen() {
  const { data } = useParentDashboard();

  if (!data) return null;

  const { student, trip, progress, dailyReports, messages, alerts, driverContact } = data;
  const latestNote  = progress?.[0];
  const latestAlert = alerts?.[0];
  const unread      = dailyReports?.[0]?.unreadCommentCount ?? 0;

  return (
    <Screen>
      <SectionTitle
        title={`Hello, ${student.name.split(" ")[0]} 👋`}
        subtitle={student.grade}
      />

      {/* ── Hero trip card ──────────────────────────────────────────────── */}
      <LinearGradient
        colors={["#4f46e5", "#7c3aed"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        {/* Decorative orbs */}
        <View style={styles.heroOrb1} />
        <View style={styles.heroOrb2} />

        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>LIVE TRIP</Text>
            <Text style={styles.heroRoute}>{trip.routeName}</Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaNumber}>{trip.etaMinutes}</Text>
            <Text style={styles.etaUnit}>min</Text>
          </View>
        </View>

        <View style={styles.heroBottom}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{STATUS_LABEL[trip.status] ?? trip.status}</Text>
          </View>
          <Text style={styles.heroStop}>{trip.busLabel} · {student.stopName}</Text>
        </View>
      </LinearGradient>

      {/* ── Today at a glance ──────────────────────────────────────────── */}
      <InfoCard title="Today at a glance" subtitle="School and transport signals">
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{progress.length}</Text>
            <Text style={styles.metricLabel}>Progress{"\n"}notes</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={[styles.metricValue, unread > 0 && styles.metricWarn]}>
              {unread}
            </Text>
            <Text style={styles.metricLabel}>Unread{"\n"}comments</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{messages.length}</Text>
            <Text style={styles.metricLabel}>Messages</Text>
          </View>
        </View>
      </InfoCard>

      {/* ── Latest teacher note ─────────────────────────────────────────── */}
      {latestNote && (
        <InfoCard title="Latest teacher note" subtitle={latestNote.category}>
          <Text style={styles.noteTitle}>{latestNote.title}</Text>
          <Text style={styles.noteBody}>{latestNote.note}</Text>
        </InfoCard>
      )}

      {/* ── Latest alert ────────────────────────────────────────────────── */}
      {latestAlert && (
        <View style={[
          styles.alertCard,
          { borderLeftColor: LEVEL_COLOR[latestAlert.level] ?? palette.brand,
            backgroundColor: LEVEL_BG[latestAlert.level] ?? "#eef2ff" }
        ]}>
          <Text style={[styles.alertTitle, { color: LEVEL_COLOR[latestAlert.level] ?? palette.ink }]}>
            {latestAlert.title}
          </Text>
          <Text style={styles.alertBody}>{latestAlert.body}</Text>
        </View>
      )}

      {/* ── Driver contact ──────────────────────────────────────────────── */}
      {driverContact && (
        <InfoCard title="Driver on this route" subtitle={driverContact.vehicleLabel}>
          <View style={styles.driverRow}>
            <LinearGradient
              colors={["#4f46e5", "#7c3aed"]}
              style={styles.driverAvatar}
            >
              <Text style={styles.driverAvatarText}>
                {driverContact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driverContact.name}</Text>
              <Text style={styles.driverPhone}>{driverContact.phone}</Text>
            </View>
            <View style={styles.callBadge}>
              <Text style={styles.callBadgeText}>📞</Text>
            </View>
          </View>
        </InfoCard>
      )}

      {/* ── Daily summary ────────────────────────────────────────────────── */}
      {dailyReports?.[0] && (
        <InfoCard title="Daily report" subtitle={dailyReports[0].date}>
          <Text style={styles.noteBody}>{dailyReports[0].attendanceSummary}</Text>
          <Text style={styles.noteBody}>{dailyReports[0].teacherCommentSummary}</Text>
        </InfoCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: "hidden",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 10,
  },
  heroOrb1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroOrb2: {
    position: "absolute",
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  heroRoute: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  etaBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    minWidth: 68,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  etaNumber: {
    fontSize: 30,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 34,
  },
  etaUnit: {
    fontSize: 11,
    color: "rgba(255,255,255,0.80)",
    fontWeight: "700",
  },
  heroBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#86efac",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
  },
  heroStop: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metric: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.sm,
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: palette.stroke,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.5,
  },
  metricWarn: {
    color: palette.warning,
  },
  metricLabel: {
    fontSize: 11,
    color: palette.inkSoft,
    textAlign: "center",
    lineHeight: 15,
    fontWeight: "500",
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: palette.ink,
    marginBottom: 2,
  },
  noteBody: {
    fontSize: 14,
    color: palette.inkSoft,
    lineHeight: 21,
  },
  alertCard: {
    borderRadius: 20,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "transparent",
    padding: spacing.md,
    gap: 5,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  alertBody: {
    fontSize: 13,
    color: palette.inkSoft,
    lineHeight: 19,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  driverAvatarText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
  },
  driverName: {
    fontSize: 15,
    fontWeight: "800",
    color: palette.ink,
  },
  driverPhone: {
    fontSize: 13,
    color: palette.inkSoft,
    marginTop: 1,
  },
  callBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  callBadgeText: {
    fontSize: 16,
  },
});
