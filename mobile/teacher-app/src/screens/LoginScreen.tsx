import { StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { api } from "../lib/api";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function LoginScreen() {
  const login = useTeacherSessionStore((state) => state.login);
  const [loading, setLoading] = useState(false);

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
      <View style={styles.hero}>
        <Text style={styles.kicker}>Skippo Teacher</Text>
        <Text style={styles.title}>Attendance, comments, and parent visibility from one flow.</Text>
        <Text style={styles.subtitle}>
          Start with the current class, tap students present, and leave notes that feed the parent app.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Phone or teacher ID</Text>
        <TextInput style={styles.input} placeholder="Enter login" />
        <Text style={styles.label}>OTP or password</Text>
        <TextInput style={styles.input} placeholder="Enter access code" secureTextEntry />
        <PrimaryButton label={loading ? "Connecting..." : "Sign in"} onPress={handleLogin} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  kicker: {
    color: palette.brand,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    color: palette.ink,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.inkSoft,
  },
  form: {
    marginTop: spacing.xl,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.stroke,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    color: palette.inkSoft,
    fontWeight: "700",
  },
  input: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: palette.ink,
    fontSize: 15,
  },
});
