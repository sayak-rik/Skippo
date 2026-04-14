import { StyleSheet, Text, View } from "react-native";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { StatCard } from "../components/StatCard";
import { useParentDashboard } from "../hooks/useParentDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function HomeScreen() {
  const { data } = useParentDashboard();

  if (!data) {
    return null;
  }

  return (
    <Screen>
      <SectionTitle
        title={`Hello, ${data.student.name.split(" ")[0]}`}
        subtitle={`${data.student.grade} • ${data.student.routeName}`}
      />

      <StatCard
        eyebrow="Live Trip"
        title={`${data.trip.etaMinutes} min away`}
        meta={`${data.trip.busLabel} • ${data.student.stopName}`}
      />

      <InfoCard title="Today at a glance" subtitle="Transport and school signals">
        <View style={styles.row}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{data.trip.status.toUpperCase()}</Text>
            <Text style={styles.metricLabel}>Trip status</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{data.progress.length}</Text>
            <Text style={styles.metricLabel}>New progress notes</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{data.dailyReports[0].unreadCommentCount}</Text>
            <Text style={styles.metricLabel}>Unread teacher comments</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>Ready</Text>
            <Text style={styles.metricLabel}>End-of-day report</Text>
          </View>
        </View>
      </InfoCard>

      <InfoCard title="Latest teacher note" subtitle={data.progress[0].category}>
        <Text style={styles.noteTitle}>{data.progress[0].title}</Text>
        <Text style={styles.noteBody}>{data.progress[0].note}</Text>
      </InfoCard>

      <InfoCard title="Message center" subtitle={`${data.messages.length} items this week`}>
        <Text style={styles.noteTitle}>{data.messages[0].title}</Text>
        <Text style={styles.noteBody}>{data.messages[0].body}</Text>
      </InfoCard>

      <InfoCard title="Daily report" subtitle={data.dailyReports[0].date}>
        <Text style={styles.noteTitle}>Attendance and school-day summary</Text>
        <Text style={styles.noteBody}>{data.dailyReports[0].attendanceSummary}</Text>
        <Text style={styles.noteBody}>{data.dailyReports[0].teacherCommentSummary}</Text>
      </InfoCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metric: {
    flex: 1,
    backgroundColor: palette.surfaceMuted,
    borderRadius: 16,
    padding: spacing.md,
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "900",
    color: palette.ink,
  },
  metricLabel: {
    fontSize: 13,
    color: palette.inkSoft,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: palette.ink,
  },
  noteBody: {
    fontSize: 14,
    color: palette.inkSoft,
    lineHeight: 21,
  },
});
