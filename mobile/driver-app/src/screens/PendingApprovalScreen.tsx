// ---------------------------------------------------------------------------
// PendingApprovalScreen – shown when is_pending_approval=true.
// Self-signup drivers see this until an admin approves them.
// Includes a "Check status" button that polls for approval in demo mode.
// ---------------------------------------------------------------------------

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Screen } from "../components/Screen";
import { useDriverSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function PendingApprovalScreen() {
  const logout = useDriverSessionStore((s) => s.logout);
  const approvalGranted = useDriverSessionStore((s) => s.approvalGranted);
  const driverName = useDriverSessionStore((s) => s.driverName);

  // In production this would poll /api/auth/driver/approval-status/
  // In demo mode, tapping "Check status" simulates an admin approving the request.
  function handleCheckStatus() {
    approvalGranted();
  }

  return (
    <Screen>
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconShell}>
          <Text style={styles.icon}>⏳</Text>
        </View>

        {/* Message */}
        <Text style={styles.title}>Pending approval</Text>
        <Text style={styles.sub}>
          Hi {driverName.split(" ")[0]}, your registration request has been received. The school admin
          will review your details and activate your account shortly.
        </Text>

        {/* What happens next */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>What happens next</Text>
          {[
            "Admin reviews your vehicle registration and Aadhaar details.",
            "You get notified once your account is activated.",
            "Log in with your phone number and OTP to start operating.",
          ].map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Check status (demo: simulates approval) */}
        <TouchableOpacity style={styles.checkBtn} onPress={handleCheckStatus} activeOpacity={0.8}>
          <Text style={styles.checkBtnText}>Check approval status</Text>
        </TouchableOpacity>

        <Text style={styles.demoHint}>Demo: tap above to simulate admin approval.</Text>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutLink} onPress={logout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", gap: spacing.lg, paddingTop: spacing.xl },
  iconShell: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff8e6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: palette.warning,
  },
  icon: { fontSize: 44 },
  title: { fontSize: 26, fontWeight: "900", color: palette.ink, textAlign: "center" },
  sub: {
    fontSize: 15,
    color: palette.inkSoft,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  stepsCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.lg,
    gap: spacing.md,
    alignSelf: "stretch",
  },
  stepsTitle: { fontSize: 14, fontWeight: "800", color: palette.ink, marginBottom: spacing.xs },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { fontSize: 12, fontWeight: "800", color: palette.brandDeep },
  stepText: { flex: 1, fontSize: 14, color: palette.inkSoft, lineHeight: 20 },
  checkBtn: {
    backgroundColor: palette.brand,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    alignSelf: "stretch",
  },
  checkBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  demoHint: { fontSize: 12, color: palette.inkSoft, textAlign: "center" },
  logoutLink: { paddingVertical: spacing.sm },
  logoutText: { fontSize: 13, color: palette.inkSoft, fontWeight: "600" },
});
