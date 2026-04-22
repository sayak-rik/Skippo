// ---------------------------------------------------------------------------
// LoginScreen – parent OTP login.
// Clean, minimalist hero + form.  "New parent? Sign up" link at bottom
// navigates to the 3-step SignupScreen.
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

import { Screen } from "../components/Screen";
import { api } from "../lib/api";
import { useSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function LoginScreen({ navigation }: { navigation?: any }) {
  const login = useSessionStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  async function handleLogin() {
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/demo-login/", { role: "parent" });
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
        {/* ── Brand mark ──────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <LinearGradient
            colors={["#4f46e5", "#7c3aed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoMark}
          >
            <Text style={styles.logoText}>SK</Text>
          </LinearGradient>
          <Text style={styles.kicker}>Skippo · Parent</Text>
          <Text style={styles.headline}>Know every{"\n"}moment of the day.</Text>
          <Text style={styles.sub}>
            Live bus tracking, school updates, and your child's progress — all in one calm place.
          </Text>
        </View>

        {/* ── Stat row ─────────────────────────────────────────────────── */}
        <View style={styles.pills}>
          {[
            { value: "Live", label: "Bus tracking" },
            { value: "Instant", label: "Alerts" },
            { value: "Daily", label: "Reports" },
          ].map((p) => (
            <View key={p.label} style={styles.pill}>
              <Text style={styles.pillValue}>{p.value}</Text>
              <Text style={styles.pillLabel}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Login form ────────────────────────────────────────────────── */}
        <View style={styles.form}>
          {/* Gradient accent bar */}
          <LinearGradient
            colors={["#4f46e5", "#7c3aed"]}
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
            <Text style={styles.label}>One-time password</Text>
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

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            style={loading ? styles.btnLoading : undefined}
          >
            <LinearGradient
              colors={["#4f46e5", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>{loading ? "Connecting…" : "Continue"}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.hint}>Demo — tap Continue to enter with sample data.</Text>
        </View>

        {/* ── Signup link ───────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.signupLink}
          onPress={() => navigation?.navigate?.("Signup")}
          activeOpacity={0.7}
        >
          <Text style={styles.signupText}>
            New parent?{" "}
            <Text style={styles.signupBold}>Create your account →</Text>
          </Text>
        </TouchableOpacity>
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
    shadowColor: "#4f46e5",
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
    fontSize: 36,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -1,
    lineHeight: 42,
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
    shadowColor: "#4f46e5",
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
    shadowColor: "#4f46e5",
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
    fontSize: 15,
    color: palette.ink,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  btn: {
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 16,
    marginTop: spacing.xs,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  btnLoading: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.2 },
  hint: { fontSize: 12, color: palette.inkFaint, textAlign: "center" },
  signupLink: { alignItems: "center", paddingVertical: spacing.sm },
  signupText: { fontSize: 13, color: palette.inkSoft },
  signupBold: { color: palette.brand, fontWeight: "700" },
});
