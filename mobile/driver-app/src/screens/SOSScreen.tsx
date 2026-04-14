import { StyleSheet, Text, View } from "react-native";

import { ActionCard } from "../components/ActionCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useDriverActions } from "../hooks/useDriverDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function SOSScreen() {
  const actions = useDriverActions();
  return (
    <Screen>
      <SectionTitle title="Emergency SOS" subtitle="Triggers school, parents, and configured emergency escalation" />
      <View style={styles.alertBox}>
        <Text style={styles.alertTitle}>Use only for active emergencies</Text>
        <Text style={styles.alertBody}>
          This sends an emergency event tied to the current trip and vehicle. The backend should notify the
          school, route parents, and configured escalation contacts.
        </Text>
      </View>
      <PrimaryButton label="Trigger SOS" variant="danger" onPress={() => actions.triggerSos.mutate()} />
      <ActionCard title="What happens next" subtitle="Backend responsibility">
        <Text style={styles.step}>1. Create emergency event with trip and location snapshot.</Text>
        <Text style={styles.step}>2. Notify school command center immediately.</Text>
        <Text style={styles.step}>3. Broadcast to all parents on the active route.</Text>
        <Text style={styles.step}>4. Escalate to configured civic or emergency contacts if enabled.</Text>
      </ActionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  alertBox: {
    backgroundColor: palette.dangerSoft,
    borderRadius: 22,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.danger,
  },
  alertBody: {
    fontSize: 14,
    lineHeight: 21,
    color: palette.ink,
  },
  step: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.inkSoft,
  },
});
