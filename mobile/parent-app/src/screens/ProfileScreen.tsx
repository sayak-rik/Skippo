import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useParentDashboard } from "../hooks/useParentDashboard";
import { useSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function ProfileScreen() {
  const { data } = useParentDashboard();
  const logout = useSessionStore((state) => state.logout);

  if (!data) {
    return null;
  }

  return (
    <Screen>
      <SectionTitle title="Profile" subtitle="Parent and student-linked account details" />
      <InfoCard title="Student" subtitle={data.student.grade}>
        <Text style={styles.detail}>{data.student.name}</Text>
        <Text style={styles.detail}>{data.student.routeName}</Text>
        <Text style={styles.detail}>{data.student.stopName}</Text>
      </InfoCard>
      <InfoCard title="Linked services" subtitle="Visibility enabled">
        <Text style={styles.detail}>Live transport tracking</Text>
        <Text style={styles.detail}>Teacher progress feed</Text>
        <Text style={styles.detail}>Message center access</Text>
      </InfoCard>
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
      <View style={styles.footerPad} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  detail: {
    fontSize: 14,
    color: palette.inkSoft,
  },
  button: {
    backgroundColor: palette.ink,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 16,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  footerPad: {
    height: spacing.xl,
  },
});
