import { StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";

import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { api } from "../lib/api";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";
import { useDriverSessionStore } from "../store/session";

export function LoginScreen() {
  const login = useDriverSessionStore((state) => state.login);
  const [loading, setLoading] = useState(false);

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
      <View style={styles.hero}>
        <Text style={styles.kicker}>Skippo Driver</Text>
        <Text style={styles.title}>Run trips fast. Stay visible. Stay compliant.</Text>
        <Text style={styles.subtitle}>
          OTP login, assigned vehicle access, boarding workflow, and SOS controls in one app.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Phone number</Text>
        <TextInput style={styles.input} placeholder="+91 98XXXXXX21" keyboardType="phone-pad" />
        <Text style={styles.label}>OTP</Text>
        <TextInput style={styles.input} placeholder="Enter OTP" keyboardType="number-pad" />
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
