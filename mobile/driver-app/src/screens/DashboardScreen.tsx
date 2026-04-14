import { StyleSheet, Text, View } from "react-native";

import { ActionCard } from "../components/ActionCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useDriverActions, useDriverDashboard } from "../hooks/useDriverDashboard";
import { useDriverSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function DashboardScreen() {
  const { data } = useDriverDashboard();
  const actions = useDriverActions();
  const activeTripId = useDriverSessionStore((state) => state.activeTripId);
  const startTrip = useDriverSessionStore((state) => state.startTrip);
  const endTrip = useDriverSessionStore((state) => state.endTrip);

  if (!data) {
    return null;
  }

  const isTripActive = activeTripId === data.trip.id;

  return (
    <Screen>
      <SectionTitle title="Driver Dashboard" subtitle={`${data.vehicle.label} • ${data.vehicle.routeName}`} />

      <ActionCard title="Assigned vehicle" subtitle={data.vehicle.registrationNumber}>
        <Text style={styles.bigLine}>{data.vehicle.label}</Text>
        <Text style={styles.meta}>Capacity: {data.vehicle.capacity} students</Text>
        <Text style={styles.meta}>Route: {data.vehicle.routeName}</Text>
      </ActionCard>

      <ActionCard title="Current trip" subtitle={`${data.trip.shift} shift`}>
        <View style={styles.row}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{isTripActive ? "ACTIVE" : "READY"}</Text>
            <Text style={styles.metricLabel}>Trip state</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {data.trip.boardedCount}/{data.trip.totalCount}
            </Text>
            <Text style={styles.metricLabel}>Boarded</Text>
          </View>
        </View>
        <Text style={styles.meta}>Next stop: {data.trip.nextStop}</Text>
        <Text style={styles.meta}>ETA: {data.trip.etaMinutes} min</Text>
        {isTripActive ? (
          <PrimaryButton
            label="End trip"
            onPress={async () => {
              await actions.endTrip.mutateAsync(data.trip.id);
              endTrip();
            }}
            variant="muted"
          />
        ) : (
          <PrimaryButton
            label="Start trip"
            onPress={async () => {
              await actions.startTrip.mutateAsync(data.trip.id);
              startTrip(data.trip.id);
            }}
          />
        )}
      </ActionCard>

      <ActionCard title="Immediate priorities" subtitle="Operational checks">
        <Text style={styles.priorityLine}>Board/drop actions should stay under 2 taps per student.</Text>
        <Text style={styles.priorityLine}>Background location should remain active throughout the route.</Text>
        <Text style={styles.priorityLine}>Escalate using SOS only for live incidents or emergencies.</Text>
      </ActionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metric: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: palette.surfaceMuted,
    padding: spacing.md,
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "900",
    color: palette.ink,
  },
  metricLabel: {
    fontSize: 13,
    color: palette.inkSoft,
  },
  bigLine: {
    fontSize: 24,
    fontWeight: "900",
    color: palette.ink,
  },
  meta: {
    fontSize: 14,
    color: palette.inkSoft,
  },
  priorityLine: {
    fontSize: 14,
    color: palette.inkSoft,
    lineHeight: 20,
  },
});
