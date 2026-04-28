import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

type InfoCardProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
}>;

export function InfoCard({ title, subtitle, children }: InfoCardProps) {
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
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  header: {
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.ink,
    letterSpacing: -0.2,
  },
  subtitle: {
    color: palette.inkSoft,
    fontSize: 12,
    fontWeight: "500",
  },
});
