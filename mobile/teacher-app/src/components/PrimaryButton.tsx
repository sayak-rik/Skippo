import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import { palette } from "../theme/palette";
import { radius } from "../theme/spacing";

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "md" | "sm";
  style?: ViewStyle;
};

export function PrimaryButton({
  label, onPress, disabled, loading, variant = "primary", size = "md", style,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        size === "sm" && styles.small,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : palette.brand} size="small" />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`], size === "sm" && styles.smallLabel]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  small: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.sm },
  primary: { backgroundColor: palette.brand },
  secondary: {
    backgroundColor: palette.brandSoft,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  danger: { backgroundColor: palette.danger },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: palette.strokeStrong,
  },
  disabled: { opacity: 0.45 },
  label: { fontWeight: "800", fontSize: 15, letterSpacing: -0.1 },
  smallLabel: { fontSize: 13 },
  primaryLabel: { color: "#ffffff" },
  secondaryLabel: { color: palette.brandDeep },
  dangerLabel: { color: "#ffffff" },
  ghostLabel: { color: palette.ink },
});
