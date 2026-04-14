import { StyleSheet, Text, View } from "react-native";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useParentDashboard } from "../hooks/useParentDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function ProgressScreen() {
  const { data } = useParentDashboard();

  if (!data) {
    return null;
  }

  return (
    <Screen>
      <SectionTitle
        title="Student Progress"
        subtitle={`Updates shared by teachers and school staff • ${data.progress.filter((entry) => !entry.isReadByParent).length} unread`}
      />
      {data.progress.map((entry) => (
        <InfoCard
          key={entry.id}
          title={entry.title}
          subtitle={`${entry.category} • ${entry.createdAt} • ${entry.isReadByParent ? "Read" : "Unread"}`}
        >
          <Text style={styles.note}>{entry.note}</Text>
        </InfoCard>
      ))}
      <InfoCard title="End-of-day report" subtitle={data.dailyReports[0].date}>
        <Text style={styles.note}>{data.dailyReports[0].attendanceSummary}</Text>
        <Text style={styles.note}>{data.dailyReports[0].teacherCommentSummary}</Text>
        <Text style={styles.summary}>Unread comments: {data.dailyReports[0].unreadCommentCount}</Text>
      </InfoCard>
      <View style={styles.footerPad} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: {
    fontSize: 14,
    color: palette.inkSoft,
    lineHeight: 21,
  },
  summary: {
    fontSize: 13,
    fontWeight: "800",
    color: palette.brand,
  },
  footerPad: {
    height: spacing.xl,
  },
});
