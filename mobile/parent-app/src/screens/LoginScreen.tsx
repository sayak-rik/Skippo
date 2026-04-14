import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useState } from "react";

import { Screen } from "../components/Screen";
import { api } from "../lib/api";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";
import { useSessionStore } from "../store/session";

export function LoginScreen() {
  const login = useSessionStore((state) => state.login);
  const [loading, setLoading] = useState(false);

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
      <View style={styles.hero}>
        <Text style={styles.kicker}>Skippo Parent</Text>
        <Text style={styles.title}>Track every ride, every day.</Text>
        <Text style={styles.subtitle}>
          Live bus movement, school updates, and your child's progress in one calm place.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Phone number</Text>
        <TextInput placeholder="+91 98XXXXXX21" style={styles.input} keyboardType="phone-pad" />
        <Text style={styles.label}>One-time password</Text>
        <TextInput placeholder="Enter OTP" style={styles.input} keyboardType="number-pad" />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Connecting..." : "Continue"}</Text>
        </TouchableOpacity>
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
    fontSize: 34,
    fontWeight: "900",
    color: palette.ink,
    lineHeight: 40,
  },
  subtitle: {
    color: palette.inkSoft,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    marginTop: spacing.xl,
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.stroke,
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
    fontSize: 15,
    color: palette.ink,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: palette.brand,
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 16,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
