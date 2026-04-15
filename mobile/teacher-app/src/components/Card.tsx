import { PropsWithChildren } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { palette } from "../theme/palette";
import { radius, spacing } from "../theme/spacing";

type CardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  accentColor?: string;
  style?: ViewStyle;
  compact?: boolean;
}>;

export function Card({ title, subtitle, children, accentColor, style, compact }: CardProps) {
  return (
    <View style={[styles.card, compact && styles.compact, style]}>
      {accentColor && <View style={[styles.accent, { backgroundColor: accentColor }]} />}
      {(title || subtitle) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    gap: spacing.md,
    overflow: "hidden",
  },
  compact: {
    padding: spacing.sm + 4,
    gap: spacing.sm,
  },
  accent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 4,
    bottom: 0,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  header: { gap: 3 },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.ink,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: palette.inkSoft,
    fontWeight: "500",
  },
});
