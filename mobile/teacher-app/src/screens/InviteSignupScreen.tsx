// ---------------------------------------------------------------------------
// InviteSignupScreen – teacher onboarding via admin-generated invite link.
//
// Flow (3 steps):
//   Step 1 – Enter invite token (or it arrives pre-filled from a deep link).
//            Validates the token and fetches school context from the backend.
//   Step 2 – Complete profile: enter full name and phone number.
//            POSTs to /api/auth/teacher/accept-invite/ and receives a login
//            payload with is_first_week=true.
//   Step 3 – Success screen.  The app navigates to the main tabs (ScheduleScreen
//            will show the first-week setup banner where the teacher picks classes).
//
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SkippoLogo } from "../components/SkippoLogo";
import { api } from "../lib/api";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { radius, spacing } from "../theme/spacing";

// ── Types ─────────────────────────────────────────────────────────────────────

type InviteInfo = {
  token: string;
  email: string;
  schoolName: string;
  schoolSlug: string;
};

// ── InviteSignupScreen ────────────────────────────────────────────────────────

export function InviteSignupScreen({ navigation }: { navigation?: any }) {
  const login = useTeacherSessionStore((s) => s.login);

  // ── Step 1: token validation ──────────────────────────────────────────
  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [token, setToken]         = useState("");
  const [validating, setValidating] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);

  // ── Step 2: profile completion ────────────────────────────────────────
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Step 1 handler: validate invite token ─────────────────────────────

  const handleValidateToken = async () => {
    const t = token.trim();
    if (!t) return;
    setValidating(true);
    try {
      const { data } = await api.get(`/api/auth/teacher/invite/${t}/`);
      setInviteInfo({
        token: t,
        email: data.email,
        schoolName: data.school_name,
        schoolSlug: data.school_slug,
      });
      setStep(2);
    } catch {
      Alert.alert(
        "Invalid invite",
        "This invite link is not valid or has already been used. Ask your school admin to send a new one."
      );
    } finally {
      setValidating(false);
    }
  };

  // ── Step 2 handler: complete signup ───────────────────────────────────

  const handleCompleteSignup = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing fields", "Please enter your name and phone number.");
      return;
    }
    if (!inviteInfo) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/api/auth/teacher/accept-invite/", {
        token: inviteInfo.token,
        name: name.trim(),
        phone: phone.trim(),
      });
      // Persist session — is_first_week=true drives the schedule setup banner
      login(data);
      setStep(3);
    } catch {
      Alert.alert("Signup failed", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kav}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <SkippoLogo size={48} />
          <Text style={styles.kicker}>Skippo · Teacher Signup</Text>
          <Text style={styles.headline}>
            {step === 1 && "Enter your invite code"}
            {step === 2 && "Complete your profile"}
            {step === 3 && "You're all set!"}
          </Text>
          {step < 3 && (
            <Text style={styles.sub}>
              {step === 1
                ? "Your school admin sent you an invite link. Enter the code below to get started."
                : `Welcome to ${inviteInfo?.schoolName ?? "your school"}. Fill in your details to create your account.`}
            </Text>
          )}
        </View>

        {/* ── Step progress pills ──────────────────────────────────────── */}
        <View style={styles.stepRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.stepPip, step >= s && styles.stepPipActive]} />
          ))}
        </View>

        {/* ── Step 1: invite code entry ────────────────────────────────── */}
        {step === 1 && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Invite Code</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Code from your invite email</Text>
              <TextInput
                style={styles.input}
                placeholder="Paste your invite code here"
                placeholderTextColor={palette.inkDim}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <PrimaryButton
              label={validating ? "Checking…" : "Continue"}
              onPress={handleValidateToken}
              loading={validating}
              disabled={!token.trim()}
            />

          </View>
        )}

        {/* ── Step 2: profile completion ───────────────────────────────── */}
        {step === 2 && inviteInfo && (
          <View style={styles.form}>
            {/* Contextual school pill */}
            <View style={styles.schoolPill}>
              <Text style={styles.schoolPillText}>🏫 {inviteInfo.schoolName}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Priya Sharma"
                placeholderTextColor={palette.inkDim}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9800000000"
                placeholderTextColor={palette.inkDim}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <PrimaryButton
              label={submitting ? "Creating account…" : "Create my account"}
              onPress={handleCompleteSignup}
              loading={submitting}
              disabled={!name.trim() || !phone.trim()}
            />
          </View>
        )}

        {/* ── Step 3: success ──────────────────────────────────────────── */}
        {step === 3 && (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>Account created!</Text>
            <Text style={styles.successSub}>
              Your schedule is being set up. You'll be prompted to pick your classes
              for this week so Skippo can auto-fill your timetable from next week.
            </Text>
            {/* Navigation happens automatically via RootNavigator watching isAuthenticated */}
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  kav: { flex: 1, gap: spacing.lg },

  // Header
  header:    { gap: spacing.sm, marginTop: spacing.md },
  kicker:   { fontSize: 12, fontWeight: "700", color: palette.brand, textTransform: "uppercase", letterSpacing: 1.2 },
  headline: { fontSize: 30, fontWeight: "900", color: palette.ink, letterSpacing: -0.5, lineHeight: 36 },
  sub:      { fontSize: 14, color: palette.inkSoft, lineHeight: 21 },

  // Step progress indicator
  stepRow: { flexDirection: "row", gap: spacing.sm },
  stepPip: {
    height: 4, flex: 1, borderRadius: radius.full,
    backgroundColor: palette.surfaceMuted,
  },
  stepPipActive: { backgroundColor: palette.brand },

  // Form card
  form: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.lg,
    gap: spacing.md,
  },
  formTitle: { fontSize: 16, fontWeight: "800", color: palette.ink, marginBottom: spacing.xs },

  // School context pill
  schoolPill: {
    backgroundColor: palette.brandSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  schoolPillText: { fontSize: 13, fontWeight: "700", color: palette.brandDeep },

  // Fields
  field:      { gap: spacing.xs },
  fieldLabel: {
    fontSize: 12, fontWeight: "700", color: palette.inkSoft,
    textTransform: "uppercase", letterSpacing: 0.6,
  },
  input: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: palette.ink,
    fontSize: 15,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  // Success
  successCard: {
    backgroundColor: palette.brandSoft,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.brand,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  successIcon:  { fontSize: 48 },
  successTitle: { fontSize: 22, fontWeight: "900", color: palette.ink },
  successSub:   { fontSize: 14, color: palette.inkSoft, textAlign: "center", lineHeight: 21 },
});
