import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

type StatCardProps = {
  eyebrow: string;
  title: string;
  meta: string;
};

export function StatCard({ eyebrow, title, meta }: StatCardProps) {
  return (
    <LinearGradient colors={[palette.brand, palette.brandDeep]} style={styles.card}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{meta}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#d8f1fb",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
  },
  metaRow: {
    flexDirection: "row",
  },
  meta: {
    fontSize: 14,
    color: "#d8f1fb",
  },
});
