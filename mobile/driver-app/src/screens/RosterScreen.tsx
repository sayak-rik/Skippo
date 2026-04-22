// ---------------------------------------------------------------------------
// RosterScreen – per-student board/drop actions.
// Shows a custom stop badge when a parent has set a stop override (req 7).
// ---------------------------------------------------------------------------

import { StyleSheet, Text, View } from "react-native";

import { ActionCard } from "../components/ActionCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useDriverActions, useDriverDashboard } from "../hooks/useDriverDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function RosterScreen() {
  const { data } = useDriverDashboard();
  const actions = useDriverActions();

  if (!data) return null;

  return (
    <Screen>
      <SectionTitle
        title="Student Roster"
        subtitle={`${data.students.length} students · ${data.trip.routeName}`}
      />

      {data.students.map((student) => (
        <ActionCard key={student.id} title={student.name} subtitle={student.stopName}>
          {/* Custom stop badge — shown when parent has overridden the stop (req 7) */}
          {student.hasStopOverride && (
            <View style={styles.overrideBadge}>
              <Text style={styles.overrideIcon}>📍</Text>
              <Text style={styles.overrideText}>Parent set a custom stop</Text>
            </View>
          )}

          <View style={styles.row}>
            <View style={[styles.statusChip, STATUS_CHIP[student.status]]}>
              <Text style={[styles.statusText, STATUS_TEXT[student.status]]}>
                {student.status.toUpperCase()}
              </Text>
            </View>

            {student.status === "absent" && (
              <PrimaryButton
                label="Board"
                onPress={() =>
                  actions.boardStudent.mutate({ tripId: data.trip.id, studentId: student.id })
                }
              />
            )}
            {student.status === "boarded" && (
              <PrimaryButton
                label="Drop"
                variant="muted"
                onPress={() =>
                  actions.dropStudent.mutate({ tripId: data.trip.id, studentId: student.id })
                }
              />
            )}
            {student.status === "dropped" && (
              <PrimaryButton label="Done" variant="muted" />
            )}
          </View>
        </ActionCard>
      ))}

      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}

const STATUS_CHIP: Record<string, object> = {
  absent:  { backgroundColor: "#fff8e1", borderWidth: 1, borderColor: "#fde68a" },
  boarded: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0" },
  dropped: { backgroundColor: palette.surfaceMuted, borderWidth: 1, borderColor: palette.stroke },
};

const STATUS_TEXT: Record<string, object> = {
  absent:  { color: palette.warning },
  boarded: { color: palette.success },
  dropped: { color: palette.inkSoft },
};

const styles = StyleSheet.create({
  overrideBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.brandSoft,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: palette.brandMid,
  },
  overrideIcon: { fontSize: 12 },
  overrideText: { fontSize: 12, fontWeight: "700", color: palette.brandDeep },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  statusChip: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: "center",
  },
  statusText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
});
