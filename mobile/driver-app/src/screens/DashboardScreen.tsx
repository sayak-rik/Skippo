// ---------------------------------------------------------------------------
// DashboardScreen – driver home.
// Shows assigned vehicle (with multi-vehicle switcher, req 13),
// current trip status + start/end buttons,
// and a 1-min GPS ping status indicator (req 1).
// ---------------------------------------------------------------------------

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";

import { ActionCard } from "../components/ActionCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import {
  useDriverActions,
  useDriverDashboard,
  useDriverVehicles,
  useSwitchVehicle,
} from "../hooks/useDriverDashboard";
import { useDriverSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";
import { AssignedVehicle } from "../types";

export function DashboardScreen() {
  const { data } = useDriverDashboard();
  const actions = useDriverActions();
  const activeTripId = useDriverSessionStore((s) => s.activeTripId);
  const startTripLocal = useDriverSessionStore((s) => s.startTrip);
  const endTripLocal = useDriverSessionStore((s) => s.endTrip);

  const { data: driverVehicles = [] } = useDriverVehicles();
  const switchVehicle = useSwitchVehicle();
  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);

  if (!data) return null;

  const isTripActive = activeTripId === data.trip.id;
  const vehicles: AssignedVehicle[] = data.driverVehicles ?? driverVehicles;

  async function handleSwitchVehicle(vehicleId: number) {
    await switchVehicle.mutateAsync(vehicleId);
    setVehiclePickerOpen(false);
  }

  return (
    <Screen>
      <SectionTitle
        title="Driver Dashboard"
        subtitle={`${data.vehicle.label} · ${data.vehicle.routeName}`}
      />

      {/* ── Assigned vehicle + multi-vehicle switcher (req 13) ─────────── */}
      <ActionCard title="Assigned vehicle" subtitle={data.vehicle.registrationNumber}>
        <View style={styles.vehicleHeader}>
          <View>
            <Text style={styles.bigLine}>{data.vehicle.label}</Text>
            <Text style={styles.meta}>Capacity: {data.vehicle.capacity} students</Text>
            <Text style={styles.meta}>Route: {data.vehicle.routeName}</Text>
          </View>
          {vehicles.length > 1 && (
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => setVehiclePickerOpen((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.switchBtnText}>
                {vehiclePickerOpen ? "Close" : "Switch vehicle"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Vehicle picker — shown inline when switcher is open */}
        {vehiclePickerOpen && (
          <View style={styles.vehiclePicker}>
            {vehicles.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.vehicleRow, v.isActive && styles.vehicleRowActive]}
                onPress={() => handleSwitchVehicle(v.id)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.vehicleLabel, v.isActive && { color: palette.brandDeep }]}>
                    {v.label}
                  </Text>
                  <Text style={styles.vehicleMeta}>{v.registrationNumber} · {v.routeName}</Text>
                </View>
                {v.isActive && <Text style={styles.vehicleCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ActionCard>

      {/* ── Current trip ────────────────────────────────────────────────── */}
      <ActionCard title="Current trip" subtitle={`${data.trip.shift} shift`}>
        <View style={styles.row}>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, isTripActive && { color: palette.success }]}>
              {isTripActive ? "ACTIVE" : "READY"}
            </Text>
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
              endTripLocal();
            }}
            variant="muted"
          />
        ) : (
          <PrimaryButton
            label="Start trip"
            onPress={async () => {
              await actions.startTrip.mutateAsync(data.trip.id);
              startTripLocal(data.trip.id);
            }}
          />
        )}
      </ActionCard>

      {/* ── GPS ping status (req 1) ──────────────────────────────────────── */}
      <ActionCard title="Location sharing" subtitle={isTripActive ? "Sending every 60 s" : "Inactive"}>
        <View style={styles.pingRow}>
          <View style={[styles.pingDot, isTripActive ? styles.pingDotActive : styles.pingDotIdle]} />
          <Text style={styles.meta}>
            {isTripActive
              ? "GPS pings are being sent to parents. Each update is at most 1 minute old."
              : "Location sharing starts automatically when you begin the trip."}
          </Text>
        </View>
      </ActionCard>

      {/* ── Operational reminders ────────────────────────────────────────── */}
      <ActionCard title="Quick reminders" subtitle="Before you go">
        <Text style={styles.reminder}>Board and drop students within 2 taps.</Text>
        <Text style={styles.reminder}>Keep location services on throughout the route.</Text>
        <Text style={styles.reminder}>Use SOS only for live emergencies. Breakdown for vehicle issues.</Text>
      </ActionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md },
  metric: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: palette.surfaceMuted,
    padding: spacing.md,
    gap: 4,
  },
  metricValue: { fontSize: 20, fontWeight: "900", color: palette.ink },
  metricLabel: { fontSize: 12, color: palette.inkSoft },
  vehicleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  bigLine: { fontSize: 24, fontWeight: "900", color: palette.ink },
  meta: { fontSize: 14, color: palette.inkSoft, lineHeight: 20 },
  switchBtn: {
    backgroundColor: palette.brandSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  switchBtnText: { fontSize: 12, fontWeight: "700", color: palette.brandDeep },
  vehiclePicker: {
    marginTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.stroke,
    paddingTop: spacing.sm,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: palette.stroke,
    backgroundColor: palette.surfaceMuted,
  },
  vehicleRowActive: { borderColor: palette.brand, backgroundColor: palette.brandSoft },
  vehicleLabel: { fontSize: 14, fontWeight: "800", color: palette.ink },
  vehicleMeta: { fontSize: 12, color: palette.inkSoft, marginTop: 1 },
  vehicleCheck: { fontSize: 18, color: palette.brand, fontWeight: "900" },
  pingRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  pingDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  pingDotActive: { backgroundColor: palette.success },
  pingDotIdle: { backgroundColor: palette.stroke },
  reminder: { fontSize: 14, color: palette.inkSoft, lineHeight: 21 },
});
