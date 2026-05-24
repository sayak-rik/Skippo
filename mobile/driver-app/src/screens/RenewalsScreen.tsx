import { AlertCircle, CalendarDays, Clock } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "../components/Screen";
import { useDriverRenewals } from "../hooks/useDriverSupportData";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function RenewalsScreen() {
  const { data } = useDriverRenewals();

  if (!data) return null;

  return (
    <Screen>
      <View style={{ paddingTop: spacing.sm }}>
        <Text style={styles.title}>Documents & Renewals</Text>
        <Text style={styles.subtitle}>Vehicle, permit, NOC, and compliance</Text>
      </View>

      {data.length === 0 && (
        <View style={styles.emptyState}>
          <CalendarDays size={36} color={palette.inkFaint} strokeWidth={1.5} />
          <Text style={styles.emptyText}>All documents up to date!</Text>
        </View>
      )}

      {data.map((item) => {
        const isUrgent = item.priority === "urgent";
        return (
          <View
            key={item.id}
            style={[styles.card, isUrgent ? styles.cardUrgent : styles.cardNormal]}
          >
            <View style={[styles.iconWrap, { backgroundColor: isUrgent ? "#FEE2E2" : "#FFF3CD" }]}>
              {isUrgent
                ? <AlertCircle size={22} color={palette.danger} strokeWidth={2} />
                : <Clock size={22} color={palette.warning} strokeWidth={2} />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <View style={styles.dateRow}>
                <CalendarDays size={12} color={palette.inkSoft} strokeWidth={2} />
                <Text style={styles.dateText}>Expires {item.expiresOn}</Text>
              </View>
            </View>
            <View style={[styles.badge, { backgroundColor: isUrgent ? palette.dangerSoft : "#FFF3CD" }]}>
              <Text style={[styles.badgeText, { color: isUrgent ? palette.danger : palette.warning }]}>
                {isUrgent ? "Urgent" : "Upcoming"}
              </Text>
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", color: palette.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: palette.inkSoft, marginTop: 2 },
  emptyState: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl * 2,
  },
  emptyText: { fontSize: 15, fontWeight: "600", color: palette.inkSoft },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
    shadowColor: "#4449CC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUrgent: { borderColor: "#FECACA" },
  cardNormal: { borderColor: "#FDE68A" },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemTitle: { fontSize: 14, fontWeight: "700", color: palette.ink, marginBottom: 4 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { fontSize: 12, color: palette.inkSoft },
  badge: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
});
