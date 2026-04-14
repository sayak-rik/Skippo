import { StyleSheet, Text } from "react-native";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useParentAlerts } from "../hooks/useParentFeeds";
import { palette } from "../theme/palette";

export function NotificationsScreen() {
  const { data } = useParentAlerts();

  if (!data) {
    return null;
  }

  return (
    <Screen>
      <SectionTitle title="Alerts" subtitle="Transport and safety notifications" />
      {data.map((alert) => (
        <InfoCard key={alert.id} title={alert.title} subtitle={`${alert.level} • ${alert.createdAt}`}>
          <Text style={styles.body}>{alert.body}</Text>
        </InfoCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    color: palette.inkSoft,
    lineHeight: 21,
  },
});
