import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { palette } from "../theme/palette";

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: "brand" | "danger" | "muted";
  loading?: boolean;
};

export function PrimaryButton({ label, onPress, variant = "brand", loading }: PrimaryButtonProps) {
  if (variant === "brand") {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} disabled={loading} style={loading ? styles.loadingWrap : undefined}>
        <LinearGradient
          colors={["#0d9488", "#0f766e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Text style={styles.label}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "danger" && styles.danger,
        variant === "muted" && styles.muted,
        loading && styles.loadingWrap,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={loading}
    >
      <Text style={[styles.label, variant === "muted" && styles.mutedLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  danger: {
    backgroundColor: palette.danger,
    shadowColor: palette.danger,
  },
  muted: {
    backgroundColor: palette.surfaceMuted,
    shadowColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingWrap: {
    opacity: 0.6,
  },
  label: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  mutedLabel: {
    color: palette.ink,
  },
});
