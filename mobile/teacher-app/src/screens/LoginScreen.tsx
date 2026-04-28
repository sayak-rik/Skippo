import { useState } from "react";
import {
  KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { Screen } from "../components/Screen";
import { SkippoLogo } from "../components/SkippoLogo";
import { PrimaryButton } from "../components/PrimaryButton";
import { api } from "../lib/api";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { radius, spacing } from "../theme/spacing";

export function LoginScreen({ navigation }: { navigation?: any }) {
  const login = useTeacherSessionStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  async function handleLogin() {
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/demo-login/", { role: "teacher" });
      login(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.kav}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <SkippoLogo size={48} />
          <Text style={styles.kicker}>Skippo · Teacher</Text>
          <Text style={styles.headline}>Your classroom,{"\n"}always in sync.</Text>
          <Text style={styles.sub}>
            Mark attendance, add parent-visible progress notes, and close out every session in seconds.
          </Text>
        </View>

        {/* Stat pills */}
        <View style={styles.pills}>
          {[
            { label: "Attendance", value: "Real-time" },
            { label: "Parent feed", value: "Instant" },
            { label: "Sessions", value: "All classes" },
          ].map((p) => (
            <View key={p.label} style={styles.pill}>
              <Text style={styles.pillValue}>{p.value}</Text>
              <Text style={styles.pillLabel}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Sign in to your account</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Phone or Teacher ID</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9800000000 or T-204"
              placeholderTextColor={palette.inkDim}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>OTP or Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your access code"
              placeholderTextColor={palette.inkDim}
              secureTextEntry
              value={otp}
              onChangeText={setOtp}
            />
          </View>

          <PrimaryButton
            label={loading ? "Connecting…" : "Sign in"}
            onPress={handleLogin}
            loading={loading}
          />

          <Text style={styles.hint}>
            This is a demo — tap Sign in to enter as a teacher with sample data.
          </Text>
        </View>

        {/* Invite signup link — for new teachers who received an admin invite email */}
        <TouchableOpacity
          style={styles.inviteLink}
          onPress={() => navigation?.navigate?.("InviteSignup")}
          activeOpacity={0.7}
        >
          <Text style={styles.inviteLinkText}>
            New teacher? <Text style={styles.inviteLinkBold}>Sign up with an invite link →</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, gap: spacing.lg },
  headerBlock: { gap: spacing.sm, marginTop: spacing.md },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.brand,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  headline: {
    fontSize: 36,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.8,
    lineHeight: 42,
  },
  sub: {
    fontSize: 15,
    color: palette.inkSoft,
    lineHeight: 22,
    fontWeight: "400",
  },
  pills: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    alignItems: "center",
    gap: 2,
  },
  pillValue: {
    fontSize: 13,
    fontWeight: "800",
    color: palette.brand,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  form: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.lg,
    gap: spacing.md,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.ink,
    marginBottom: spacing.xs,
  },
  field: { gap: spacing.xs },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.6,
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
  hint: {
    fontSize: 12,
    color: palette.inkDim,
    textAlign: "center",
    lineHeight: 18,
  },
  // Invite signup link below the form
  inviteLink: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  inviteLinkText: {
    fontSize: 13,
    color: palette.inkSoft,
  },
  inviteLinkBold: {
    color: palette.brand,
    fontWeight: "700",
  },
});
