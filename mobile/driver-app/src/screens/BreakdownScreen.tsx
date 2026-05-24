import { ArrowLeft, Bus, Check, Phone, Wrench } from "lucide-react-native";
import { useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Screen } from "../components/Screen";
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

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={palette.ink} strokeWidth={2.5} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Vehicle Breakdown</Text>
          <Text style={styles.subtitle}>Alert parents and coordinate support</Text>
        </View>
      </View>

      {/* Alert card */}
      {!alertSent ? (
        <View style={styles.alertCard}>
          <View style={styles.alertIconWrap}>
            <Wrench size={32} color={palette.warning} strokeWidth={2} />
          </View>
          <Text style={styles.alertTitle}>Broadcast breakdown alert</Text>
          <Text style={styles.alertBody}>
            This will immediately notify all parents on your current route that the vehicle has
            broken down and that alternative transport is being arranged.
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
          <View style={styles.sentIconWrap}>
            <Check size={28} color={palette.success} strokeWidth={3} />
          </View>
          <Text style={styles.sentTitle}>Parents notified</Text>
          <Text style={styles.sentBody}>
            All route parents have been sent a breakdown alert. The school has also been notified.
          </Text>
        </View>
      )}

      {/* Nearby vehicles */}
      <Text style={styles.sectionTitle}>Nearby school vehicles</Text>
      <Text style={styles.sectionSub}>Contact these drivers to coordinate student transfers.</Text>

      {(nearbyVehicles as NearbyVehicle[]).length === 0 && (
        <View style={styles.emptyNearby}>
          <Bus size={28} color={palette.inkFaint} strokeWidth={1.5} />
          <Text style={styles.emptyNearbyText}>No nearby vehicles found.</Text>
        </View>
      )}

      {(nearbyVehicles as NearbyVehicle[]).map((v) => (
        <View key={v.id} style={styles.vehicleCard}>
          <View style={styles.vehicleIconWrap}>
            <Bus size={22} color={palette.brand} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName}>{v.label} · {v.routeName}</Text>
            <Text style={styles.vehicleDriver}>{v.driverName}</Text>
            <Text style={styles.vehicleDist}>{v.distanceKm} km away</Text>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL(`tel:${v.phone.replace(/\s/g, "")}`)}
            activeOpacity={0.8}
          >
            <Phone size={15} color="#fff" strokeWidth={2.5} />
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.stroke,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "800", color: palette.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: palette.inkSoft, marginTop: 1 },
  alertCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: "center",
    shadowColor: palette.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  alertIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#FFF3CD",
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitle: { fontSize: 18, fontWeight: "800", color: palette.ink, textAlign: "center" },
  alertBody: { fontSize: 14, color: palette.inkSoft, textAlign: "center", lineHeight: 22 },
  broadcastBtn: {
    backgroundColor: palette.warning,
    borderRadius: 14,
    paddingVertical: 14,
    alignSelf: "stretch",
    alignItems: "center",
    shadowColor: palette.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.5 },
  broadcastBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  sentCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: "center",
  },
  sentIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  sentTitle: { fontSize: 17, fontWeight: "800", color: palette.ink },
  sentBody: { fontSize: 14, color: palette.inkSoft, textAlign: "center", lineHeight: 22 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: palette.ink, letterSpacing: -0.2 },
  sectionSub: { fontSize: 13, color: palette.inkSoft, marginTop: -spacing.sm + 2 },
  emptyNearby: { alignItems: "center", gap: 8, paddingVertical: spacing.lg },
  emptyNearbyText: { fontSize: 14, color: palette.inkFaint },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    shadowColor: "#4449CC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  vehicleIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: palette.brandSoft,
    borderWidth: 1,
    borderColor: palette.brandMid,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleName: { fontSize: 14, fontWeight: "800", color: palette.ink },
  vehicleDriver: { fontSize: 13, color: palette.inkSoft, marginTop: 1 },
  vehicleDist: { fontSize: 12, color: palette.brand, fontWeight: "700", marginTop: 2 },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.brand,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: palette.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  callBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
