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
    <LinearGradient
      colors={["#4f46e5", "#7c3aed"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Decorative orb */}
      <View style={styles.orb} />
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.metaRow}>
        <View style={styles.liveIndicator} />
        <Text style={styles.meta}>{meta}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: "hidden",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 24,
    elevation: 8,
  },
  orb: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.70)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#86efac",  // green-300
  },
  meta: {
    fontSize: 13,
    color: "rgba(255,255,255,0.80)",
    fontWeight: "500",
  },
});
