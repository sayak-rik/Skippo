// ---------------------------------------------------------------------------
// HomeScreen – parent dashboard.
// Visual hierarchy: hero trip card → today-at-a-glance → latest note → alerts.
// Minimalist but vivid; brand-coloured hero with ETA badge.
// ---------------------------------------------------------------------------

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useParentDashboard } from "../hooks/useParentDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  active: "On the way",
  arriving: "Arriving soon",
  completed: "Trip ended",
};

const LEVEL_COLOR: Record<string, string> = {
  info: palette.brand,
  warning: palette.warning,
  critical: palette.danger,
};

export function HomeScreen() {
  const { data } = useParentDashboard();

  if (!data) return null;

  const { student, trip, progress, dailyReports, messages, alerts, driverContact } = data;
  const latestNote = progress?.[0];
  const latestAlert = alerts?.[0];
  const unread = dailyReports?.[0]?.unreadCommentCount ?? 0;

  return (
    <Screen>
      <SectionTitle
        title={`Hello, ${student.name.split(" ")[0]}`}
        subtitle={`${student.grade}`}
      />

      {/* ── Hero trip card ──────────────────────────────────────────── */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>Live trip</Text>
            <Text style={styles.heroRoute}>{trip.routeName}</Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaNumber}>{trip.etaMinutes}</Text>
            <Text style={styles.etaUnit}>min</Text>
          </View>
        </View>
        <View style={styles.heroBottom}>
          <View style={styles.statusPill}>
            <Text style={styles.statusDot}>●</Text>
            <Text style={styles.statusText}>{STATUS_LABEL[trip.status] ?? trip.status}</Text>
          </View>
          <Text style={styles.heroStop}>{trip.busLabel} · {student.stopName}</Text>
        </View>
      </View>

      {/* ── Today at a glance ─────────────────────────────────────────── */}
      <InfoCard title="Today at a glance" subtitle="School and transport signals">
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{progress.length}</Text>
            <Text style={styles.metricLabel}>Progress notes</Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, unread > 0 && { color: palette.warning }]}>
              {unread}
            </Text>
            <Text style={styles.metricLabel}>Unread comments</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{messages.length}</Text>
            <Text style={styles.metricLabel}>Messages</Text>
          </View>
        </View>
      </InfoCard>

      {/* ── Latest teacher note ───────────────────────────────────────── */}
      {latestNote && (
        <InfoCard title="Latest teacher note" subtitle={latestNote.category}>
          <Text style={styles.noteTitle}>{latestNote.title}</Text>
          <Text style={styles.noteBody}>{latestNote.note}</Text>
        </InfoCard>
      )}

      {/* ── Latest alert ──────────────────────────────────────────────── */}
      {latestAlert && (
        <View style={[styles.alertCard, { borderLeftColor: LEVEL_COLOR[latestAlert.level] ?? palette.brand }]}>
          <Text style={[styles.alertTitle, { color: LEVEL_COLOR[latestAlert.level] ?? palette.ink }]}>
            {latestAlert.title}
          </Text>
          <Text style={styles.alertBody}>{latestAlert.body}</Text>
        </View>
      )}

      {/* ── Driver contact quick-access (req 4) ───────────────────────── */}
      {driverContact && (
        <InfoCard title="Driver on this route" subtitle={driverContact.vehicleLabel}>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>
                {driverContact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driverContact.name}</Text>
              <Text style={styles.driverPhone}>{driverContact.phone}</Text>
            </View>
          </View>
        </InfoCard>
      )}

      {/* ── Daily summary ─────────────────────────────────────────────── */}
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
    backgroundColor: palette.brand,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.8 },
  heroRoute: { fontSize: 20, fontWeight: "900", color: "#fff", marginTop: 2 },
  etaBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    minWidth: 64,
  },
  etaNumber: { fontSize: 28, fontWeight: "900", color: "#fff", lineHeight: 32 },
  etaUnit: { fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: "700" },
  heroBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { fontSize: 8, color: "#7fffd4" },
  statusText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.9)" },
  heroStop: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  metricsRow: { flexDirection: "row", gap: spacing.sm },
  metric: {
    flex: 1,
    backgroundColor: palette.surfaceMuted,
    borderRadius: 14,
    padding: spacing.md,
    gap: 3,
    alignItems: "center",
  },
  metricValue: { fontSize: 22, fontWeight: "900", color: palette.ink },
  metricLabel: { fontSize: 11, color: palette.inkSoft, textAlign: "center", lineHeight: 15 },
  noteTitle: { fontSize: 15, fontWeight: "800", color: palette.ink, marginBottom: 2 },
  noteBody: { fontSize: 14, color: palette.inkSoft, lineHeight: 21 },
  alertCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.stroke,
    borderLeftWidth: 4,
    padding: spacing.md,
    gap: 4,
  },
  alertTitle: { fontSize: 14, fontWeight: "800" },
  alertBody: { fontSize: 13, color: palette.inkSoft, lineHeight: 19 },
  driverRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  driverAvatarText: { fontSize: 15, fontWeight: "900", color: palette.brandDeep },
  driverName: { fontSize: 15, fontWeight: "800", color: palette.ink },
  driverPhone: { fontSize: 13, color: palette.inkSoft, marginTop: 1 },
});
