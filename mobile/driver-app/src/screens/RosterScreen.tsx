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

  if (!data) {
    return null;
  }

  return (
    <Screen>
      <SectionTitle title="Student Roster" subtitle="Board and drop students with one-thumb actions" />
      {data.students.map((student) => (
        <ActionCard key={student.id} title={student.name} subtitle={student.stopName}>
          <View style={styles.row}>
            <Text style={styles.status}>{student.status.toUpperCase()}</Text>
            {student.status === "absent" ? (
              <PrimaryButton
                label="Board"
                onPress={() => actions.boardStudent.mutate({ tripId: data.trip.id, studentId: student.id })}
              />
            ) : null}
            {student.status === "boarded" ? (
              <PrimaryButton
                label="Drop"
                variant="muted"
                onPress={() => actions.dropStudent.mutate({ tripId: data.trip.id, studentId: student.id })}
              />
            ) : null}
            {student.status === "dropped" ? <PrimaryButton label="Completed" variant="muted" /> : null}
          </View>
        </ActionCard>
      ))}
      <View style={styles.footerPad} />
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
  status: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: palette.brandDeep,
  },
  footerPad: {
    height: spacing.xl,
  },
});
