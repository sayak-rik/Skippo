import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
};

export function SectionTitle({ title, subtitle, style }: SectionTitleProps) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 3, marginBottom: spacing.xs },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.4,
  },
  subtitle: { fontSize: 13, color: palette.inkSoft, fontWeight: "500" },
});
