import { StyleSheet, Text } from "react-native";

import { ActionCard } from "../components/ActionCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useDriverRenewals } from "../hooks/useDriverSupportData";
import { palette } from "../theme/palette";

export function RenewalsScreen() {
  const { data } = useDriverRenewals();

  if (!data) {
    return null;
  }

  return (
    <Screen>
      <SectionTitle title="Documents and Renewals" subtitle="Vehicle, permit, NOC, and compliance status" />
      {data.map((item) => (
        <ActionCard key={item.id} title={item.title} subtitle={`Expires on ${item.expiresOn}`}>
          <Text style={[styles.priority, item.priority === "urgent" ? styles.urgent : styles.normal]}>
            {item.priority === "urgent" ? "Urgent renewal required" : "Upcoming renewal"}
          </Text>
        </ActionCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  priority: {
    fontSize: 14,
    fontWeight: "800",
  },
  urgent: {
    color: palette.danger,
  },
  normal: {
    color: palette.warning,
  },
});
