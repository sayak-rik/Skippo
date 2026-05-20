// ---------------------------------------------------------------------------
// BreakdownScreen – vehicle breakdown flow (req 10, 11, 12).
//
// Step 1: Confirm and broadcast a breakdown alert to all parents (req 11).
// Step 2: View and contact nearby school vehicles for assistance (req 12).
// ---------------------------------------------------------------------------

import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";

import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useDriverActions, useNearbyVehicles } from "../hooks/useDriverDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";
import { NearbyVehicle } from "../types";

export function BreakdownScreen({ navigation }: { navigation?: any }) {
  const actions = useDriverActions();
  const { data: nearbyVehicles = [] } = useNearbyVehicles();
  const [alertSent, setAlertSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleBroadcastBreakdown() {
    setSending(true);
    try {
      await actions.triggerBreakdown.mutateAsync();
      setAlertSent(true);
    } finally {
      setSending(false);
    }
  }

  function callDriver(vehicle: NearbyVehicle) {
    Linking.openURL(`tel:${vehicle.phone.replace(/\s/g, "")}`);
  }

  return (
    <Screen>
      <SectionTitle
        title="Vehicle Breakdown"
        subtitle="Alert parents and coordinate support"
      />

      {/* ── Step 1: Alert parents ───────────────────────────────────── */}
      {!alertSent ? (
        <View style={styles.alertCard}>
          <Text style={styles.alertIcon}>🔧</Text>
          <Text style={styles.alertTitle}>Broadcast breakdown to parents</Text>
          <Text style={styles.alertBody}>
            This will immediately alert all parents on your current route that the vehicle has broken
            down and that alternative transport is being arranged.
          </Text>
          <TouchableOpacity
            style={[styles.broadcastBtn, sending && styles.btnDisabled]}
            onPress={handleBroadcastBreakdown}
            disabled={sending}
            activeOpacity={0.85}
          >
            <Text style={styles.broadcastBtnText}>
              {sending ? "Sending alert…" : "Alert all parents now"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.sentCard}>
          <Text style={styles.sentIcon}>✓</Text>
          <Text style={styles.sentTitle}>Parents notified</Text>
          <Text style={styles.sentBody}>
            All route parents have been sent a breakdown alert. The school has also been notified.
          </Text>
        </View>
      )}

      {/* ── Step 2: Contact nearby vehicles (req 12) ────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby school vehicles</Text>
        <Text style={styles.sectionSub}>
          Contact these drivers to coordinate student transfers.
        </Text>
      </View>

      {(nearbyVehicles as NearbyVehicle[]).map((v) => (
        <View key={v.id} style={styles.vehicleCard}>
          <View style={styles.vehicleIcon}>
            <Text style={styles.vehicleIconText}>🚌</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>{v.label} · {v.routeName}</Text>
            <Text style={styles.vehicleDriver}>{v.driverName}</Text>
            <Text style={styles.vehicleDist}>{v.distanceKm} km away</Text>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => callDriver(v)}
            activeOpacity={0.8}
          >
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={styles.backLink}
        onPress={() => navigation?.goBack?.()}
        activeOpacity={0.7}
      >
        <Text style={styles.backLinkText}>← Back to emergency controls</Text>
      </TouchableOpacity>

      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    backgroundColor: "#fffbeb",
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "#d97706",
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: "center",
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  alertIcon: { fontSize: 48 },
  alertTitle: { fontSize: 20, fontWeight: "900", color: palette.ink, textAlign: "center", letterSpacing: -0.3 },
  alertBody: { fontSize: 14, color: palette.inkSoft, textAlign: "center", lineHeight: 22 },
  broadcastBtn: {
    backgroundColor: "#d97706",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    alignSelf: "stretch",
    alignItems: "center",
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.5 },
  broadcastBtnText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.2 },
  sentCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: palette.success,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: "center",
    shadowColor: palette.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  sentIcon: { fontSize: 40, color: palette.success },
  sentTitle: { fontSize: 18, fontWeight: "900", color: palette.ink, letterSpacing: -0.3 },
  sentBody: { fontSize: 14, color: palette.inkSoft, textAlign: "center", lineHeight: 22 },
  section: { gap: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: palette.ink, letterSpacing: -0.2 },
  sectionSub: { fontSize: 13, color: palette.inkSoft },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.brandMid,
  },
  vehicleIconText: { fontSize: 22 },
  vehicleInfo: { flex: 1 },
  vehicleName: { fontSize: 14, fontWeight: "800", color: palette.ink, letterSpacing: -0.2 },
  vehicleDriver: { fontSize: 13, color: palette.inkSoft, marginTop: 1 },
  vehicleDist: { fontSize: 12, color: palette.brand, fontWeight: "700", marginTop: 2 },
  callBtn: {
    backgroundColor: palette.brand,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  callBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  backLink: { alignItems: "center", paddingVertical: spacing.sm },
  backLinkText: { fontSize: 13, color: palette.inkSoft },
});
