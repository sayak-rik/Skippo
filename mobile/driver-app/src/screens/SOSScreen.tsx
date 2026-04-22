// ---------------------------------------------------------------------------
// SOSScreen – combined SOS + Breakdown emergency screen (req 10, 11).
//
// Layout:
//   - Large red SOS button (triggers full-screen overlay Modal)
//   - Amber Breakdown button (navigates to BreakdownScreen)
//
// The SOS overlay covers the entire screen to make it unmissable.
// Both events alert all parents on the route.
// ---------------------------------------------------------------------------

import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";

import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useDriverActions } from "../hooks/useDriverDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function SOSScreen({ navigation }: { navigation?: any }) {
  const actions = useDriverActions();
  const [sosOverlayVisible, setSosOverlayVisible] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  async function handleSOS() {
    await actions.triggerSos.mutateAsync();
    setSosSent(true);
    setSosOverlayVisible(true);
  }

  function handleBreakdown() {
    navigation?.navigate?.("Breakdown");
  }

  return (
    <>
      <Screen>
        <SectionTitle
          title="Emergency Controls"
          subtitle="Use only during an active incident"
        />

        {/* ── Safety note ────────────────────────────────────────────── */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Know the difference</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>🚨</Text>
            <Text style={styles.infoText}>
              <Text style={{ fontWeight: "800" }}>SOS</Text> – life-threatening emergency.
              Notifies school, all route parents, and configured emergency contacts.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>🔧</Text>
            <Text style={styles.infoText}>
              <Text style={{ fontWeight: "800" }}>Breakdown</Text> – vehicle issue, not a life
              emergency. Alerts parents and lets you contact nearby school buses.
            </Text>
          </View>
        </View>

        {/* ── SOS button ──────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.sosBtn}
          onPress={handleSOS}
          activeOpacity={0.85}
        >
          <Text style={styles.sosBtnEmoji}>🚨</Text>
          <Text style={styles.sosBtnTitle}>Trigger SOS</Text>
          <Text style={styles.sosBtnSub}>Alerts school + all route parents immediately</Text>
        </TouchableOpacity>

        {/* ── Breakdown button ─────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.breakdownBtn}
          onPress={handleBreakdown}
          activeOpacity={0.85}
        >
          <Text style={styles.breakdownEmoji}>🔧</Text>
          <Text style={styles.breakdownTitle}>Report Breakdown</Text>
          <Text style={styles.breakdownSub}>Alert parents · Contact nearby vehicles</Text>
        </TouchableOpacity>
      </Screen>

      {/* ── SOS full-screen overlay (req 10) ──────────────────────────── */}
      <Modal visible={sosOverlayVisible} animationType="fade" statusBarTranslucent>
        <View style={styles.sosOverlay}>
          <Text style={styles.overlayIcon}>🚨</Text>
          <Text style={styles.overlayTitle}>SOS ACTIVE</Text>
          <Text style={styles.overlaySub}>
            Emergency services and all route parents have been notified.{"\n"}
            Stay calm. Help is on the way.
          </Text>

          <View style={styles.overlaySteps}>
            {[
              "Pull over safely if driving.",
              "Stay with the students.",
              "Wait for school or emergency contact.",
            ].map((s, i) => (
              <View key={i} style={styles.overlayStep}>
                <Text style={styles.overlayStepNum}>{i + 1}</Text>
                <Text style={styles.overlayStepText}>{s}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => setSosOverlayVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.dismissBtnText}>Dismiss alert screen</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  infoTitle: { fontSize: 14, fontWeight: "800", color: palette.ink, letterSpacing: -0.2 },
  infoRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  infoEmoji: { fontSize: 20, flexShrink: 0 },
  infoText: { flex: 1, fontSize: 14, color: palette.inkSoft, lineHeight: 21 },
  // SOS button — large, red, impossible to miss
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
  sosBtnEmoji: { fontSize: 48 },
  sosBtnTitle: { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  sosBtnSub: { fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 19 },
  // Breakdown button — amber, prominent but visually distinct from SOS
  breakdownBtn: {
    backgroundColor: "#d97706",
    borderRadius: 22,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 7,
  },
  breakdownEmoji: { fontSize: 32 },
  breakdownTitle: { fontSize: 20, fontWeight: "900", color: "#fff", letterSpacing: -0.3 },
  breakdownSub: { fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "center" },
  // Full-screen SOS overlay
  sosOverlay: {
    flex: 1,
    backgroundColor: palette.danger,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  overlayIcon: { fontSize: 80 },
  overlayTitle: {
    fontSize: 44,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
  },
  overlaySub: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 26,
  },
  overlaySteps: {
    gap: spacing.md,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  overlayStep: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  overlayStepNum: {
    fontSize: 20,
    fontWeight: "900",
    color: "rgba(255,255,255,0.55)",
    width: 24,
  },
  overlayStepText: { flex: 1, fontSize: 15, color: "#fff", lineHeight: 23 },
  dismissBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: spacing.xl,
    alignSelf: "stretch",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  dismissBtnText: { color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.2 },
});
