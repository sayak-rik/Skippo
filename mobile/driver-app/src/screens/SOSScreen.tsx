import { AlertTriangle, PhoneCall, Wrench } from "lucide-react-native";
import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Screen } from "../components/Screen";
import { useDriverActions } from "../hooks/useDriverDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function SOSScreen({ navigation }: { navigation?: any }) {
  const actions = useDriverActions();
  const [sosOverlayVisible, setSosOverlayVisible] = useState(false);

  async function handleSOS() {
    await actions.triggerSos.mutateAsync();
    setSosOverlayVisible(true);
  }

  return (
    <>
      <Screen>
        <View style={{ paddingTop: spacing.sm }}>
          <Text style={styles.title}>Emergency Controls</Text>
          <Text style={styles.subtitle}>Use only during an active incident</Text>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Know the difference</Text>
          <View style={styles.infoRow}>
            <View style={[styles.infoIconWrap, { backgroundColor: "#FEE2E2" }]}>
              <AlertTriangle size={18} color={palette.danger} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoHead}>SOS</Text>
              <Text style={styles.infoText}>Life-threatening emergency. Alerts school, all route parents, and emergency contacts.</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.infoIconWrap, { backgroundColor: "#FFF3CD" }]}>
              <Wrench size={18} color={palette.warning} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoHead}>Breakdown</Text>
              <Text style={styles.infoText}>Vehicle issue, not a life emergency. Alerts parents and connects you with nearby school buses.</Text>
            </View>
          </View>
        </View>

        {/* SOS button */}
        <TouchableOpacity
          style={styles.sosBtn}
          onPress={handleSOS}
          activeOpacity={0.88}
        >
          <View style={styles.sosIconRing}>
            <AlertTriangle size={40} color="#fff" strokeWidth={2} />
          </View>
          <Text style={styles.sosBtnTitle}>Trigger SOS</Text>
          <Text style={styles.sosBtnSub}>Alerts school + all route parents immediately</Text>
        </TouchableOpacity>

        {/* Breakdown button */}
        <TouchableOpacity
          style={styles.breakdownBtn}
          onPress={() => navigation?.navigate?.("Breakdown")}
          activeOpacity={0.88}
        >
          <View style={styles.breakdownIconWrap}>
            <Wrench size={28} color={palette.warning} strokeWidth={2} />
          </View>
          <View>
            <Text style={styles.breakdownTitle}>Report Breakdown</Text>
            <Text style={styles.breakdownSub}>Alert parents · Contact nearby vehicles</Text>
          </View>
        </TouchableOpacity>
      </Screen>

      {/* SOS active overlay */}
      <Modal visible={sosOverlayVisible} animationType="fade" statusBarTranslucent>
        <View style={styles.sosOverlay}>
          <View style={styles.overlayIconRing}>
            <PhoneCall size={52} color="#fff" strokeWidth={2} />
          </View>
          <Text style={styles.overlayTitle}>SOS ACTIVE</Text>
          <Text style={styles.overlaySub}>
            Emergency services and all route parents have been notified.{"\n"}Stay calm. Help is on the way.
          </Text>
          <View style={styles.overlaySteps}>
            {[
              "Pull over safely if you are driving.",
              "Stay with the students.",
              "Wait for school or emergency services.",
            ].map((s, i) => (
              <View key={i} style={styles.overlayStep}>
                <View style={styles.overlayStepNum}>
                  <Text style={styles.overlayStepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.overlayStepText}>{s}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => setSosOverlayVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.dismissBtnText}>Dismiss overlay</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", color: palette.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: palette.inkSoft, marginTop: 2 },
  infoCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#4449CC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  infoTitle: { fontSize: 14, fontWeight: "800", color: palette.ink },
  infoRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoHead: { fontSize: 13, fontWeight: "800", color: palette.ink, marginBottom: 2 },
  infoText: { fontSize: 13, color: palette.inkSoft, lineHeight: 20 },
  sosBtn: {
    backgroundColor: palette.danger,
    borderRadius: 28,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    shadowColor: palette.danger,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  sosIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  sosBtnTitle: { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  sosBtnSub: { fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "center" },
  breakdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    padding: spacing.lg,
    shadowColor: palette.warning,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  breakdownIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFF3CD",
    alignItems: "center",
    justifyContent: "center",
  },
  breakdownTitle: { fontSize: 17, fontWeight: "800", color: palette.ink, letterSpacing: -0.2 },
  breakdownSub: { fontSize: 12, color: palette.inkSoft, marginTop: 2 },
  // SOS overlay
  sosOverlay: {
    flex: 1,
    backgroundColor: palette.danger,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  overlayIconRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  overlayTitle: { fontSize: 42, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  overlaySub: { fontSize: 16, color: "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 25 },
  overlaySteps: {
    gap: spacing.md,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  overlayStep: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  overlayStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayStepNumText: { fontSize: 14, fontWeight: "900", color: "#fff" },
  overlayStepText: { flex: 1, fontSize: 15, color: "#fff", lineHeight: 22 },
  dismissBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    alignSelf: "stretch",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  dismissBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
