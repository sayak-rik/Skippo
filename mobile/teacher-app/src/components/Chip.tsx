import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import { palette } from "../theme/palette";
import { radius } from "../theme/spacing";

type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
  bgColor?: string;
  style?: ViewStyle;
};

export function Chip({ label, active, onPress, color, bgColor, style }: ChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active && styles.active,
        bgColor ? { backgroundColor: bgColor } : null,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.label, active && styles.activeLabel, color ? { color } : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  active: {
    backgroundColor: palette.brandSoft,
    borderColor: palette.brand,
  },
  label: { fontSize: 12, fontWeight: "700", color: palette.inkSoft },
  activeLabel: { color: palette.brandDeep },
});
