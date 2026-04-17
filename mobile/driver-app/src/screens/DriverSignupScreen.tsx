// ---------------------------------------------------------------------------
// DriverSignupScreen – two signup flows (req 6):
//
//   "invite" flow  – Driver has an admin-generated invite token.
//                    3 steps: token validation → profile + aadhar → done.
//                    No approval wait; driver is active immediately.
//
//   "self"   flow  – Driver registers without an invite.
//                    3 steps: school selection → profile + aadhar → pending.
//                    Driver sees PendingApprovalScreen until admin approves.
//
// Demo tokens: "demo-driver-invite-2026"
// Demo schools: greenfield-public-school
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { api } from "../lib/api";
import { useDriverSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

const DEMO_SCHOOLS = [
  { slug: "greenfield-public-school", name: "Greenfield Public School" },
  { slug: "sunrise-academy",          name: "Sunrise Academy" },
  { slug: "st-marys-convent",         name: "St. Mary's Convent" },
];

export function DriverSignupScreen({
  navigation,
  route,
}: {
  navigation?: any;
  route?: any;
}) {
  const flow: "invite" | "self" = route?.params?.flow ?? "invite";
  const login = useDriverSessionStore((s) => s.login);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Invite flow — step 1
  const [token, setToken] = useState("");
  const [validating, setValidating] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{ school_name: string } | null>(null);

  // Self flow — step 1
  const [selectedSchool, setSelectedSchool] = useState<typeof DEMO_SCHOOLS[0] | null>(null);

  // Step 2 (both flows)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");

  // ── Step 1 — invite flow ─────────────────────────────────────────────────

  async function handleValidateToken() {
    if (!token.trim()) return;
    setValidating(true);
    try {
      const { data } = await api.get(`/api/auth/driver/invite/${token.trim()}/`);
      setInviteInfo(data);
      setStep(2);
    } catch {
      Alert.alert("Invalid invite", "This code is not valid or has already been used.");
    } finally {
      setValidating(false);
    }
  }

  // ── Step 1 — self flow ────────────────────────────────────────────────────

  function handleSchoolSelect(school: typeof DEMO_SCHOOLS[0]) {
    setSelectedSchool(school);
    setStep(2);
  }

  // ── Step 2 — shared: profile + aadhar ────────────────────────────────────

  async function handleCompleteSignup() {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing fields", "Name and phone are required.");
      return;
    }
    setLoading(true);
    try {
      if (flow === "invite") {
        const { data } = await api.post("/api/auth/driver/accept-invite/", {
          token: token.trim(),
          name: name.trim(),
          phone: phone.trim(),
          aadhar: aadhar.trim(),
        });
        login(data);
        setStep(3);
      } else {
        const { data } = await api.post("/api/auth/driver/signup/", {
          schoolSlug: selectedSchool?.slug,
          name: name.trim(),
          phone: phone.trim(),
          aadhar: aadhar.trim(),
          vehicleReg: vehicleReg.trim(),
        });
        // is_pending_approval=true → RootNavigator shows PendingApprovalScreen
        login(data);
        setStep(3);
      }
    } catch {
      Alert.alert("Signup failed", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const stepLabels =
    flow === "invite"
      ? ["Invite code", "Your details", "Done"]
      : ["Select school", "Your details", "Pending review"];

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kav}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>SK</Text>
          </View>
          <Text style={styles.kicker}>Skippo · Driver Signup</Text>
          <Text style={styles.headline}>{stepLabels[step - 1]}</Text>
        </View>

        {/* Step progress */}
        <View style={styles.stepRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.stepPip, step >= s && styles.stepPipActive]} />
          ))}
        </View>

        {/* ── Invite flow: step 1 ────────────────────────────────────── */}
        {flow === "invite" && step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardSub}>
              Your school admin sent you an invite. Enter the code below.
            </Text>
            <View style={styles.field}>
              <Text style={styles.label}>Invite code</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. demo-driver-invite-2026"
                placeholderTextColor={palette.inkSoft}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <PrimaryButton
              label={validating ? "Checking…" : "Verify code"}
              onPress={handleValidateToken}
              loading={validating}
              disabled={!token.trim()}
            />
            <Text style={styles.hint}>
              Demo: use code <Text style={styles.hintCode}>demo-driver-invite-2026</Text>
            </Text>
          </View>
        )}

        {/* ── Self flow: step 1 ──────────────────────────────────────── */}
        {flow === "self" && step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardSub}>
              Select the school you drive for. An admin will review and approve your request.
            </Text>
            {DEMO_SCHOOLS.map((school) => (
              <TouchableOpacity
                key={school.slug}
                style={[styles.schoolRow, selectedSchool?.slug === school.slug && styles.schoolRowActive]}
                onPress={() => handleSchoolSelect(school)}
                activeOpacity={0.8}
              >
                <Text style={[styles.schoolName, selectedSchool?.slug === school.slug && { color: palette.brandDeep }]}>
                  {school.name}
                </Text>
                {selectedSchool?.slug === school.slug && (
                  <Text style={{ color: palette.brand, fontWeight: "900", fontSize: 16 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Step 2: profile + aadhar (both flows) ─────────────────── */}
        {step === 2 && (
          <View style={styles.card}>
            {inviteInfo && (
              <View style={styles.schoolPill}>
                <Text style={styles.schoolPillText}>🏫 {inviteInfo.school_name}</Text>
              </View>
            )}
            {selectedSchool && (
              <View style={styles.schoolPill}>
                <Text style={styles.schoolPillText}>🏫 {selectedSchool.name}</Text>
              </View>
            )}
            {[
              { label: "Full name",             value: name,       setter: setName,       placeholder: "e.g. Rohit Kumar",    caps: "words" as const },
              { label: "Phone number (for OTP)", value: phone,      setter: setPhone,      placeholder: "+91 98XXXXXX21",      caps: "none" as const, keypad: "phone-pad" as const },
              { label: "Aadhaar number",         value: aadhar,     setter: setAadhar,     placeholder: "XXXX-XXXX-XXXX",     caps: "none" as const },
              { label: "Vehicle reg (optional)", value: vehicleReg, setter: setVehicleReg, placeholder: "WB-04-AB-1288",      caps: "characters" as const },
            ].map(({ label, value, setter, placeholder, caps, keypad }) => (
              <View key={label} style={styles.field}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor={palette.inkSoft}
                  value={value}
                  onChangeText={setter}
                  autoCapitalize={caps}
                  keyboardType={keypad ?? "default"}
                />
              </View>
            ))}
            <PrimaryButton
              label={loading ? "Creating account…" : flow === "invite" ? "Complete signup" : "Submit for review"}
              onPress={handleCompleteSignup}
              loading={loading}
              disabled={!name.trim() || !phone.trim()}
            />
          </View>
        )}

        {/* ── Step 3: outcome ────────────────────────────────────────── */}
        {step === 3 && flow === "invite" && (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>You're all set!</Text>
            <Text style={styles.successSub}>
              Your account is active. The app is loading your assigned vehicle and trip schedule.
            </Text>
          </View>
        )}

        {step === 3 && flow === "self" && (
          <View style={styles.pendingCard}>
            <Text style={styles.successIcon}>⏳</Text>
            <Text style={styles.successTitle}>Request submitted</Text>
            <Text style={styles.successSub}>
              {selectedSchool?.name} admin will review your application. You'll be notified when approved.
            </Text>
          </View>
        )}

        {step > 1 && step < 3 && (
          <TouchableOpacity style={styles.backLink} onPress={() => setStep((s) => (s - 1) as 1 | 2)}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        {step === 1 && (
          <TouchableOpacity style={styles.backLink} onPress={() => navigation?.navigate?.("Login")}>
            <Text style={styles.backText}>← Back to login</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, gap: spacing.lg },
  header: { gap: spacing.sm, marginTop: spacing.md },
  logoMark: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: palette.brand, alignItems: "center", justifyContent: "center",
    marginBottom: spacing.xs,
  },
  logoText: { color: "#fff", fontWeight: "900", fontSize: 18, letterSpacing: -0.5 },
  kicker: {
    fontSize: 12, fontWeight: "700", color: palette.brand,
    textTransform: "uppercase", letterSpacing: 1.2,
  },
  headline: { fontSize: 28, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  stepRow: { flexDirection: "row", gap: spacing.sm },
  stepPip: { height: 4, flex: 1, borderRadius: 99, backgroundColor: palette.surfaceMuted },
  stepPipActive: { backgroundColor: palette.brand },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 24, borderWidth: 1, borderColor: palette.stroke,
    padding: spacing.lg, gap: spacing.md,
  },
  cardSub: { fontSize: 13, color: palette.inkSoft },
  field: { gap: spacing.xs },
  label: {
    fontSize: 12, fontWeight: "700", color: palette.inkSoft,
    textTransform: "uppercase", letterSpacing: 0.6,
  },
  input: {
    backgroundColor: palette.surfaceMuted, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    color: palette.ink, fontSize: 15,
    borderWidth: 1, borderColor: palette.stroke,
  },
  hint: { fontSize: 12, color: palette.inkSoft, textAlign: "center" },
  hintCode: { fontWeight: "700", color: palette.brand },
  schoolPill: {
    backgroundColor: palette.brandSoft, borderRadius: 99,
    paddingHorizontal: spacing.md, paddingVertical: 6, alignSelf: "flex-start",
  },
  schoolPillText: { fontSize: 13, fontWeight: "700", color: palette.brandDeep },
  schoolRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: spacing.md, borderRadius: 14,
    borderWidth: 1.5, borderColor: palette.stroke, backgroundColor: palette.surfaceMuted,
  },
  schoolRowActive: { borderColor: palette.brand, backgroundColor: palette.brandSoft },
  schoolName: { fontSize: 14, fontWeight: "700", color: palette.ink },
  successCard: {
    backgroundColor: palette.brandSoft, borderRadius: 24,
    borderWidth: 1, borderColor: palette.brand,
    padding: spacing.xl, alignItems: "center", gap: spacing.md,
  },
  pendingCard: {
    backgroundColor: "#fff8e6", borderRadius: 24,
    borderWidth: 1, borderColor: palette.warning,
    padding: spacing.xl, alignItems: "center", gap: spacing.md,
  },
  successIcon: { fontSize: 48 },
  successTitle: { fontSize: 22, fontWeight: "900", color: palette.ink },
  successSub: { fontSize: 14, color: palette.inkSoft, textAlign: "center", lineHeight: 21 },
  backLink: { alignItems: "center", paddingVertical: spacing.sm },
  backText: { fontSize: 13, color: palette.inkSoft },
});
