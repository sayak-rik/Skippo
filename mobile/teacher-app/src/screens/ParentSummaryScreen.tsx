import { StyleSheet, Text } from "react-native";

import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useTeacherEndOfDayReports } from "../hooks/useTeacherReports";
import { palette } from "../theme/palette";

export function ParentSummaryScreen() {
  const { data } = useTeacherEndOfDayReports();

  if (!data) {
    return null;
  }

  return (
    <Screen>
      <SectionTitle title="End-of-Day Parent Report" subtitle="Parent-facing summary and unread comment status" />
      {data.map((item) => (
        <Card
          key={item.studentName}
          title={item.studentName}
          subtitle={`${item.unreadCommentCount} unread comment${item.unreadCommentCount === 1 ? "" : "s"}`}
        >
          <Text style={styles.summary}>{item.summary}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    fontSize: 14,
    color: palette.inkSoft,
    lineHeight: 21,
  },
});
