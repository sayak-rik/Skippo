import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

type CardProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
}>;

export function Card({ title, subtitle, children }: CardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: palette.ink,
  },
  subtitle: {
    fontSize: 13,
    color: palette.inkSoft,
  },
});
