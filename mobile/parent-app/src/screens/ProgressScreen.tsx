import { StyleSheet, Text, View } from "react-native";
import { GraduationCap, BookOpen, CalendarCheck } from "lucide-react-native";

import { Screen } from "../components/Screen";
import { useParentDashboard } from "../hooks/useParentDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

interface ProgressEntry {
  id: number;
  title: string;
  note: string;
  category: string;
  createdAt: string;
  isReadByParent: boolean;
}

interface DailyReport {
  date: string;
  attendanceSummary: string;
  teacherCommentSummary: string;
  unreadCommentCount: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function ProgressScreen() {
  const { data } = useParentDashboard();

  if (!data) {
    return null;
  }

  const unreadCount = data.progress.filter((e: ProgressEntry) => !e.isReadByParent).length;
  const report: DailyReport = data.dailyReports[0];

  return (
    <Screen>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <GraduationCap size={24} color={palette.brand} strokeWidth={2} />
          <Text style={styles.headerTitle}>Progress</Text>
        </View>
        <Text style={styles.headerSub}>
          Updates shared by teachers and school staff
          {unreadCount > 0 ? ` • ${unreadCount} unread` : ""}
        </Text>
      </View>

      {/* Daily report card — blue banner at top */}
      {report && (
        <View style={styles.reportCard}>
          <View style={styles.reportHeaderRow}>
            <CalendarCheck size={18} color="#fff" strokeWidth={2} />
            <Text style={styles.reportTitle}>End-of-day Report</Text>
            <Text style={styles.reportDate}>{formatDate(report.date)}</Text>
          </View>
          <Text style={styles.reportBody}>{report.attendanceSummary}</Text>
          {report.teacherCommentSummary ? (
            <Text style={styles.reportBody}>{report.teacherCommentSummary}</Text>
          ) : null}
          {report.unreadCommentCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {report.unreadCommentCount} unread comment{report.unreadCommentCount > 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Progress entries */}
      {data.progress.map((entry: ProgressEntry) => (
        <View key={entry.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <BookOpen
              size={16}
              color={entry.isReadByParent ? palette.inkFaint : palette.brand}
              strokeWidth={2}
            />
            <Text style={[styles.cardTitle, !entry.isReadByParent && styles.cardTitleUnread]}>
              {entry.title}
            </Text>
            {!entry.isReadByParent && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.cardNote}>{entry.note}</Text>
          <View style={styles.cardFooter}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{entry.category}</Text>
            </View>
            <Text style={styles.cardDate}>{formatDate(entry.createdAt)}</Text>
          </View>
        </View>
      ))}

      {data.progress.length === 0 && (
        <View style={styles.emptyWrap}>
          <GraduationCap size={40} color={palette.inkFaint} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No progress entries yet</Text>
          <Text style={styles.emptySub}>Teacher notes and academic updates will appear here.</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Header
  headerWrap: { gap: 4 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 13,
    color: palette.inkSoft,
    fontWeight: "400",
    lineHeight: 18,
  },

  // Daily report (blue card)
  reportCard: {
    backgroundColor: palette.brand,
    borderRadius: 16,
    padding: spacing.md,
    gap: 8,
    shadowColor: palette.brandDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  reportHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reportTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },
  reportDate: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  reportBody: {
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 19,
  },
  unreadBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },

  // Progress entry card
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: spacing.md,
    gap: 8,
    shadowColor: palette.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: palette.ink,
    letterSpacing: -0.1,
  },
  cardTitleUnread: {
    fontWeight: "800",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.brand,
  },
  cardNote: {
    fontSize: 13,
    color: palette.inkSoft,
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.brandMid,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: palette.brandDeep,
  },
  cardDate: {
    fontSize: 11,
    color: palette.inkFaint,
    fontWeight: "500",
  },

  // Empty state
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: palette.ink,
  },
  emptySub: {
    fontSize: 13,
    color: palette.inkSoft,
    textAlign: "center",
    lineHeight: 19,
  },
});
