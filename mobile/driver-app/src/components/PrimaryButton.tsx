import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { palette } from "../theme/palette";

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: "brand" | "danger" | "muted";
};

export function PrimaryButton({ label, onPress, variant = "brand" }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "brand" && styles.brand,
        variant === "danger" && styles.danger,
        variant === "muted" && styles.muted,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.label, variant === "muted" && styles.mutedLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  brand: {
    backgroundColor: palette.brand,
  },
  danger: {
    backgroundColor: palette.danger,
  },
  muted: {
    backgroundColor: palette.surfaceMuted,
  },
  label: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },
  mutedLabel: {
    color: palette.ink,
  },
});
