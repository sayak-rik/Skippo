import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar } from "../components/Avatar";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useTeacherDashboard } from "../hooks/useTeacherDashboard";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { radius, spacing } from "../theme/spacing";

const BOUNDARY_META: Record<string, { label: string; color: string; bg: string }> = {
  school_entry: { label: "Marks school active", color: palette.brand, bg: palette.brandSoft },
  school_exit: { label: "Marks school concluded", color: palette.warning, bg: palette.warningSoft },
  none: { label: "Standard attendance", color: palette.inkSoft, bg: palette.surfaceMuted },
};

export function ScheduleScreen() {
  const { data, isLoading } = useTeacherDashboard();
  const teacherName = useTeacherSessionStore((s) => s.teacherName);
  const schoolName = useTeacherSessionStore((s) => s.schoolName);
  const activeSessionId = useTeacherSessionStore((s) => s.activeSessionId);
  const selectSession = useTeacherSessionStore((s) => s.selectSession);

  if (isLoading || !data) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading schedule…</Text>
        </View>
      </Screen>
    );
  }

  const presentCount = data.roster?.filter((s: any) => s.isPresent).length ?? 0;
  const totalCount = data.roster?.length ?? 0;

  return (
    <Screen>
      {/* Top greeting */}
      <View style={styles.greeting}>
        <Avatar name={teacherName} size={44} />
        <View style={styles.greetingText}>
          <Text style={styles.greetingName}>{teacherName}</Text>
          <Text style={styles.greetingSchool}>{schoolName}</Text>
        </View>
      </View>

      {/* Today's summary strip */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{data.schedule?.length ?? 0}</Text>
          <Text style={styles.summaryLabel}>Classes today</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: palette.success }]}>{presentCount}</Text>
          <Text style={styles.summaryLabel}>Present so far</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: palette.warning }]}>
            {totalCount - presentCount}
          </Text>
          <Text style={styles.summaryLabel}>Unmarked</Text>
        </View>
      </View>

      <SectionTitle
        title="Today's Schedule"
        subtitle="Current class is pinned to the top"
      />

      {data.schedule?.map((session: any) => {
        const meta = BOUNDARY_META[session.attendanceBoundary] ?? BOUNDARY_META.none;
        const isSelected = activeSessionId === session.id;
        return (
          <TouchableOpacity
            key={session.id}
            activeOpacity={0.84}
            onPress={() => selectSession(session.id)}
          >
            <Card
              accentColor={session.isCurrent ? palette.brand : undefined}
              style={[styles.sessionCard, isSelected && styles.sessionCardSelected]}
            >
              <View style={styles.sessionHeader}>
                <View style={styles.sessionLeft}>
                  <View style={styles.sessionTitleRow}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    {session.isCurrent && (
                      <View style={styles.liveChip}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>Now</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sessionClassroom}>{session.classroomLabel}</Text>
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeText}>{session.startsAt}</Text>
                  <Text style={styles.timeSep}>–</Text>
                  <Text style={styles.timeText}>{session.endsAt}</Text>
                </View>
              </View>

              <View style={styles.sessionFooter}>
                <View style={[styles.boundaryBadge, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.boundaryText, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <Text style={styles.tapHint}>
                  {isSelected ? "✓ Selected for attendance" : "Tap to open"}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  loadingText: { color: palette.inkSoft, fontSize: 15 },
  greeting: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  greetingText: { gap: 2 },
  greetingName: { fontSize: 18, fontWeight: "800", color: palette.ink },
  greetingSchool: { fontSize: 12, color: palette.inkSoft, fontWeight: "500" },
  summaryRow: { flexDirection: "row", gap: spacing.sm },
  summaryCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    alignItems: "center",
    gap: 2,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  sessionCard: { paddingLeft: spacing.md + 4 },
  sessionCardSelected: {
    borderColor: palette.brand,
    backgroundColor: "#fafdfb",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sessionLeft: { flex: 1, gap: 3 },
  sessionTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  sessionTitle: { fontSize: 16, fontWeight: "800", color: palette.ink },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.brandSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: palette.brand,
  },
  liveText: { fontSize: 10, fontWeight: "800", color: palette.brand },
  sessionClassroom: { fontSize: 12, color: palette.inkSoft, fontWeight: "500" },
  timeBlock: { alignItems: "flex-end", gap: 1 },
  timeText: { fontSize: 14, fontWeight: "700", color: palette.ink },
  timeSep: { fontSize: 10, color: palette.inkDim },
  sessionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  boundaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  boundaryText: { fontSize: 11, fontWeight: "700" },
  tapHint: { fontSize: 11, color: palette.inkDim, fontWeight: "500" },
});
