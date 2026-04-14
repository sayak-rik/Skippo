import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useTeacherDashboard } from "../hooks/useTeacherDashboard";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function ScheduleScreen() {
  const { data } = useTeacherDashboard();
  const activeSessionId = useTeacherSessionStore((state) => state.activeSessionId);
  const selectSession = useTeacherSessionStore((state) => state.selectSession);

  if (!data) {
    return null;
  }

  return (
    <Screen>
      <SectionTitle title="Class Schedule" subtitle="Current class floats to the top for fast attendance" />
      {data.schedule.map((session) => (
        <TouchableOpacity key={session.id} activeOpacity={0.86} onPress={() => selectSession(session.id)}>
          <Card
            title={`${session.classroomLabel} • ${session.title}`}
            subtitle={`${session.startsAt} - ${session.endsAt}${session.isCurrent ? " • Current class" : ""}`}
          >
            <View style={styles.row}>
              <Text style={[styles.badge, session.isCurrent ? styles.currentBadge : styles.normalBadge]}>
                {session.isCurrent ? "Current" : "Upcoming"}
              </Text>
              <Text style={styles.meta}>
                {session.attendanceBoundary === "school_entry"
                  ? "Marks school active"
                  : session.attendanceBoundary === "school_exit"
                    ? "Marks school concluded"
                    : "Standard attendance"}
              </Text>
            </View>
            <Text style={styles.meta}>{activeSessionId === session.id ? "Selected for attendance" : "Tap to load class roster"}</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "800",
  },
  currentBadge: {
    backgroundColor: palette.brandSoft,
    color: palette.brandDeep,
  },
  normalBadge: {
    backgroundColor: palette.surfaceMuted,
    color: palette.inkSoft,
  },
  meta: {
    flex: 1,
    color: palette.inkSoft,
    fontSize: 13,
  },
});
