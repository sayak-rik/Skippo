// ---------------------------------------------------------------------------
// DashboardScreen – driver home.
// Shows assigned vehicle (with multi-vehicle switcher, req 13),
// current trip status + start/end buttons,
// and a 1-min GPS ping status indicator (req 1).
// ---------------------------------------------------------------------------

import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

      {/* ── Hero vehicle card ─────────────────────────────────────────── */}
      <LinearGradient
        colors={["#0d9488", "#0f766e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroOrb1} />
        <View style={styles.heroOrb2} />

        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>ASSIGNED VEHICLE</Text>
            <Text style={styles.heroVehicle}>{data.vehicle.label}</Text>
            <Text style={styles.heroReg}>{data.vehicle.registrationNumber}</Text>
          </View>
          <View style={styles.capacityBadge}>
            <Text style={styles.capacityNum}>{data.vehicle.capacity}</Text>
            <Text style={styles.capacityUnit}>seats</Text>
          </View>
        </View>

        <View style={styles.heroBottom}>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, isTripActive && styles.statusDotActive]} />
            <Text style={styles.statusText}>{isTripActive ? "ON ROUTE" : "STANDBY"}</Text>
          </View>
          {vehicles.length > 1 && (
            <TouchableOpacity
              style={styles.switchHeroBtn}
              onPress={() => setVehiclePickerOpen((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.switchHeroBtnText}>
                {vehiclePickerOpen ? "Close" : "Switch vehicle"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Vehicle picker inline */}
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
                  <Text style={[styles.vehicleLabel, v.isActive && { color: "#fff" }]}>
                    {v.label}
                  </Text>
                  <Text style={[styles.vehicleMeta, v.isActive && { color: "rgba(255,255,255,0.7)" }]}>
                    {v.registrationNumber} · {v.routeName}
                  </Text>
                </View>
                {v.isActive && <Text style={styles.vehicleCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </LinearGradient>

      {/* ── Current trip ────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Current trip</Text>
          <Text style={styles.cardSubtitle}>{data.trip.shift} shift</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, isTripActive && { color: palette.success }]}>
              {isTripActive ? "ACTIVE" : "READY"}
            </Text>
            <Text style={styles.metricLabel}>Trip state</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {data.trip.boardedCount}/{data.trip.totalCount}
            </Text>
            <Text style={styles.metricLabel}>Boarded</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{data.trip.etaMinutes}m</Text>
            <Text style={styles.metricLabel}>ETA</Text>
          </View>
        </View>

        <Text style={styles.meta}>Next stop: {data.trip.nextStop}</Text>

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
      </View>

      {/* ── GPS ping status (req 1) ──────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Location sharing</Text>
          <Text style={styles.cardSubtitle}>{isTripActive ? "Sending every 60 s" : "Inactive"}</Text>
        </View>
        <View style={styles.pingRow}>
          <View style={[styles.pingDot, isTripActive ? styles.pingDotActive : styles.pingDotIdle]} />
          <Text style={styles.meta}>
            {isTripActive
              ? "GPS pings are being sent to parents. Each update is at most 1 minute old."
              : "Location sharing starts automatically when you begin the trip."}
          </Text>
        </View>
      </View>

      {/* ── Operational reminders ────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Quick reminders</Text>
          <Text style={styles.cardSubtitle}>Before you go</Text>
        </View>
        <Text style={styles.reminder}>Board and drop students within 2 taps.</Text>
        <Text style={styles.reminder}>Keep location services on throughout the route.</Text>
        <Text style={styles.reminder}>Use SOS only for live emergencies. Breakdown for vehicle issues.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: "hidden",
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
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
  heroVehicle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  heroReg: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "600",
    marginTop: 2,
  },
  capacityBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    minWidth: 60,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  capacityNum: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 32,
  },
  capacityUnit: {
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
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  statusDotActive: {
    backgroundColor: "#86efac",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
  },
  switchHeroBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  switchHeroBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  vehiclePicker: {
    marginTop: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    paddingTop: spacing.sm,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  vehicleRowActive: { borderColor: "rgba(255,255,255,0.35)", backgroundColor: "rgba(255,255,255,0.18)" },
  vehicleLabel: { fontSize: 14, fontWeight: "800", color: "rgba(255,255,255,0.85)" },
  vehicleMeta: { fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 1 },
  vehicleCheck: { fontSize: 18, color: "#86efac", fontWeight: "900" },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  cardHeader: { gap: 3 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: palette.ink, letterSpacing: -0.2 },
  cardSubtitle: { fontSize: 12, color: palette.inkSoft, fontWeight: "500" },
  metricsRow: { flexDirection: "row", alignItems: "center" },
  metric: { flex: 1, alignItems: "center", gap: 4, paddingVertical: spacing.sm },
  metricDivider: { width: 1, height: 36, backgroundColor: palette.stroke },
  metricValue: { fontSize: 22, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  metricLabel: { fontSize: 11, color: palette.inkSoft, textAlign: "center", fontWeight: "500" },
  meta: { fontSize: 14, color: palette.inkSoft, lineHeight: 20 },
  pingRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  pingDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  pingDotActive: { backgroundColor: palette.success },
  pingDotIdle: { backgroundColor: palette.stroke },
  reminder: { fontSize: 14, color: palette.inkSoft, lineHeight: 21 },
});
