import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Bus, Clock, MessageCircle, Phone, BookOpen } from "lucide-react-native";

import { Screen } from "../components/Screen";
import { useParentDashboard } from "../hooks/useParentDashboard";
import { useSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  active:    "On the way",
  arriving:  "Arriving soon",
  completed: "Trip ended",
};

const STATUS_DOT: Record<string, string> = {
  scheduled: "#9CA3AF",
  active:    "#10B981",
  arriving:  "#F59E0B",
  completed: "#6B7280",
};

const LEVEL_COLOR: Record<string, string> = {
  info:     palette.brand,
  warning:  palette.warning,
  critical: palette.danger,
};

const LEVEL_BG: Record<string, string> = {
  info:     "#EFF6FF",
  warning:  "#FFFBEB",
  critical: "#FEF2F2",
};

function formatDate() {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export function HomeScreen() {
  const parentName = useSessionStore((s) => s.parentName);
  const { data, isLoading } = useParentDashboard();

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={palette.brand} />
        </View>
      </Screen>
    );
  }

  if (!data) return null;

  const { student, trip, progress, dailyReports, messages, alerts, driverContact } = data;
  const firstName   = (parentName || student?.name || "there").split(" ")[0];
  const latestNote  = progress?.[0];
  const latestAlert = alerts?.[0];
  const unread      = dailyReports?.[0]?.unreadCommentCount ?? 0;

  return (
    <Screen scroll padded={false}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.greetingRow}>
            <View style={styles.accentDot} />
            <Text style={styles.greeting}>Hi, {firstName}! 👋</Text>
          </View>
          <Text style={styles.dateText}>{formatDate()}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {firstName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* ── Live bus card ──────────────────────────────────────────────── */}
        {trip ? (
          <View style={styles.busCard}>
            <View style={styles.busCardTop}>
              <View style={styles.nowBadge}>
                <View style={[styles.nowDot, { backgroundColor: STATUS_DOT[trip.status] ?? "#10B981" }]} />
                <Text style={styles.nowText}>{STATUS_LABEL[trip.status] ?? trip.status}</Text>
              </View>
              <View style={styles.etaBadge}>
                <Text style={styles.etaNum}>{trip.etaMinutes}</Text>
                <Text style={styles.etaLabel}>min</Text>
              </View>
            </View>

            <View style={styles.busCardBody}>
              <Bus size={20} color={palette.brand} strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={styles.busRoute}>{trip.routeName}</Text>
                <Text style={styles.busLabel}>{trip.busLabel} · {student?.stopName}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.busCardEmpty}>
            <Bus size={28} color={palette.inkFaint} strokeWidth={1.5} />
            <Text style={styles.busCardEmptyText}>No active trip right now</Text>
          </View>
        )}

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <BookOpen size={18} color={palette.brand} strokeWidth={2} />
            <Text style={styles.statValue}>{progress?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Notes</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={18} color={unread > 0 ? palette.warning : palette.brand} strokeWidth={2} />
            <Text style={[styles.statValue, unread > 0 && { color: palette.warning }]}>{unread}</Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
          <View style={styles.statCard}>
            <MessageCircle size={18} color={palette.brand} strokeWidth={2} />
            <Text style={styles.statValue}>{messages?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
        </View>

        {/* ── Latest teacher note ─────────────────────────────────────────── */}
        {latestNote && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Latest teacher note</Text>
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{latestNote.category}</Text>
              </View>
            </View>
            <Text style={styles.noteTitle}>{latestNote.title}</Text>
            <Text style={styles.noteBody}>{latestNote.note}</Text>
          </View>
        )}

        {/* ── Latest alert ────────────────────────────────────────────────── */}
        {latestAlert && (
          <View style={[
            styles.alertCard,
            { borderLeftColor: LEVEL_COLOR[latestAlert.level] ?? palette.brand,
              backgroundColor: LEVEL_BG[latestAlert.level] ?? "#EFF6FF" }
          ]}>
            <Text style={[styles.alertTitle, { color: LEVEL_COLOR[latestAlert.level] ?? palette.ink }]}>
              {latestAlert.title}
            </Text>
            <Text style={styles.alertBody}>{latestAlert.body}</Text>
          </View>
        )}

        {/* ── Driver contact ──────────────────────────────────────────────── */}
        {driverContact && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Driver on this route</Text>
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>
                  {driverContact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{driverContact.name}</Text>
                <Text style={styles.driverSub}>{driverContact.vehicleLabel}</Text>
              </View>
              <View style={styles.callBtn}>
                <Phone size={18} color={palette.success} strokeWidth={2} />
              </View>
            </View>
          </View>
        )}

        {/* ── Daily report ────────────────────────────────────────────────── */}
        {dailyReports?.[0] && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Daily report · {dailyReports[0].date}</Text>
            <Text style={styles.noteBody}>{dailyReports[0].attendanceSummary}</Text>
            {!!dailyReports[0].teacherCommentSummary && (
              <Text style={[styles.noteBody, { marginTop: 4 }]}>
                {dailyReports[0].teacherCommentSummary}
              </Text>
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.canvas,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerLeft:   { gap: 3 },
  greetingRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  accentDot: {
    width: 4, height: 24,
    borderRadius: 2,
    backgroundColor: palette.accent,
  },
  greeting: {
    fontSize: 24, fontWeight: "800",
    color: palette.ink, letterSpacing: -0.4,
  },
  dateText: { fontSize: 13, color: palette.inkSoft, marginLeft: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: palette.brand,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "800", color: "#fff" },

  content: { padding: spacing.lg, gap: spacing.md },

  // Bus card
  busCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: palette.brand,
  },
  busCardTop:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nowBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: palette.brandSoft,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 99,
  },
  nowDot:  { width: 7, height: 7, borderRadius: 4 },
  nowText: { fontSize: 12, fontWeight: "700", color: palette.brand },
  etaBadge: {
    backgroundColor: palette.brand,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: 12, alignItems: "center",
  },
  etaNum:   { fontSize: 20, fontWeight: "900", color: "#fff", lineHeight: 24 },
  etaLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
  busCardBody: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  busRoute:    { fontSize: 15, fontWeight: "700", color: palette.ink },
  busLabel:    { fontSize: 12, color: palette.inkSoft, marginTop: 1 },

  busCardEmpty: {
    backgroundColor: palette.surface,
    borderRadius: 20, padding: spacing.lg,
    alignItems: "center", gap: spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  busCardEmptyText: { fontSize: 14, color: palette.inkFaint },

  // Stats
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statCard: {
    flex: 1, backgroundColor: palette.surface,
    borderRadius: 16, padding: spacing.md,
    alignItems: "center", gap: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: palette.inkSoft, fontWeight: "500" },

  // Generic card
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20, padding: spacing.md,
    gap: spacing.xs,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardLabel: {
    fontSize: 11, fontWeight: "700",
    color: palette.inkSoft,
    textTransform: "uppercase", letterSpacing: 0.7,
    marginBottom: 2,
  },
  chipRow: { flexDirection: "row" },
  chip: {
    backgroundColor: palette.brandSoft,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 99,
  },
  chipText:  { fontSize: 11, color: palette.brand, fontWeight: "700" },
  noteTitle: { fontSize: 14, fontWeight: "700", color: palette.ink },
  noteBody:  { fontSize: 13, color: palette.inkSoft, lineHeight: 20 },

  // Alert
  alertCard: {
    borderRadius: 16, borderLeftWidth: 4,
    padding: spacing.md, gap: 4,
  },
  alertTitle: { fontSize: 14, fontWeight: "700" },
  alertBody:  { fontSize: 13, color: palette.inkSoft, lineHeight: 19 },

  // Driver
  driverRow:      { flexDirection: "row", alignItems: "center", gap: spacing.md },
  driverAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: palette.brand,
    alignItems: "center", justifyContent: "center",
  },
  driverAvatarText: { fontSize: 14, fontWeight: "900", color: "#fff" },
  driverName: { fontSize: 14, fontWeight: "700", color: palette.ink },
  driverSub:  { fontSize: 12, color: palette.inkSoft, marginTop: 1 },
  callBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#D1FAE5",
    alignItems: "center", justifyContent: "center",
  },
});
