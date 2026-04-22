// ---------------------------------------------------------------------------
// LoginScreen – driver OTP login.
// Two entry points at the bottom:
//   "Have an invite code? Sign up" → DriverSignupScreen (invite flow)
//   "Register your school"         → DriverSignupScreen (self-signup flow)
// ---------------------------------------------------------------------------

import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
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

export function LoginScreen({ navigation }: { navigation?: any }) {
  const login = useDriverSessionStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  async function handleLogin() {
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/demo-login/", { role: "driver" });
      login(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kav}
      >
        {/* Brand */}
        <View style={styles.hero}>
          <LinearGradient
            colors={["#0d9488", "#0f766e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoMark}
          >
            <Text style={styles.logoText}>SK</Text>
          </LinearGradient>
          <Text style={styles.kicker}>Skippo · Driver</Text>
          <Text style={styles.headline}>Run trips fast.{"\n"}Stay visible.</Text>
          <Text style={styles.sub}>
            OTP login, assigned vehicle access, boarding workflow, and emergency controls in one app.
          </Text>
        </View>

        {/* Stat pills */}
        <View style={styles.pills}>
          {[
            { value: "1-tap", label: "Board/drop" },
            { value: "Live", label: "GPS ping" },
            { value: "SOS", label: "Always ready" },
          ].map((p) => (
            <View key={p.label} style={styles.pill}>
              <Text style={styles.pillValue}>{p.value}</Text>
              <Text style={styles.pillLabel}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <LinearGradient
            colors={["#0d9488", "#0f766e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.formAccent}
          />
          <Text style={styles.formTitle}>Sign in</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98XXXXXX21"
              placeholderTextColor={palette.inkFaint}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              placeholderTextColor={palette.inkFaint}
              keyboardType="number-pad"
              secureTextEntry
              value={otp}
              onChangeText={setOtp}
            />
          </View>
          <PrimaryButton label={loading ? "Connecting…" : "Sign in"} onPress={handleLogin} loading={loading} />
          <Text style={styles.hint}>Demo — tap Sign in to enter as a driver with sample data.</Text>
        </View>

        {/* Signup links */}
        <View style={styles.signupSection}>
          <TouchableOpacity
            onPress={() => navigation?.navigate?.("DriverSignup", { flow: "invite" })}
            activeOpacity={0.7}
          >
            <Text style={styles.signupLink}>
              Have an invite code?{" "}
              <Text style={styles.signupBold}>Sign up →</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation?.navigate?.("DriverSignup", { flow: "self" })}
            activeOpacity={0.7}
          >
            <Text style={styles.signupLink}>
              New driver?{" "}
              <Text style={styles.signupBold}>Register your school →</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, gap: spacing.lg },
  hero: { gap: spacing.sm, marginTop: spacing.md },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: { color: "#fff", fontWeight: "900", fontSize: 18, letterSpacing: -0.5 },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.brand,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  headline: {
    fontSize: 34,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  sub: { fontSize: 15, color: palette.inkSoft, lineHeight: 23 },
  pills: { flexDirection: "row", gap: spacing.sm },
  pill: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    alignItems: "center",
    gap: 3,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  pillValue: { fontSize: 14, fontWeight: "900", color: palette.brand, letterSpacing: -0.3 },
  pillLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  form: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: "hidden",
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  formAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  formTitle: { fontSize: 17, fontWeight: "800", color: palette.ink, letterSpacing: -0.2, marginTop: spacing.xs },
  field: { gap: spacing.xs },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: palette.ink,
    fontSize: 15,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  hint: { fontSize: 12, color: palette.inkFaint, textAlign: "center" },
  signupSection: { gap: spacing.sm, alignItems: "center", paddingVertical: spacing.sm },
  signupLink: { fontSize: 13, color: palette.inkSoft },
  signupBold: { color: palette.brand, fontWeight: "700" },
});
