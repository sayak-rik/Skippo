import { useState } from "react";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { Avatar } from "../components/Avatar";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useTeacherEndOfDayReports } from "../hooks/useTeacherReports";
import { useProgressNotes } from "../hooks/useTeacherDashboard";
import { palette } from "../theme/palette";
import { radius, spacing } from "../theme/spacing";

const FILTER_OPTIONS = ["All", "Unread", "Academic", "Behavior", "Concern"];

export function ParentSummaryScreen() {
  const { data: reports, isLoading } = useTeacherEndOfDayReports();
  const { data: allNotes = [] } = useProgressNotes();
  const [filter, setFilter] = useState("All");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const totalUnread = reports?.reduce(
    (sum: number, r: any) => sum + (r.unreadCommentCount ?? 0),
    0
  ) ?? 0;

  const notes = allNotes.filter((n: any) => {
    if (filter === "Unread") return !n.isReadByParent;
    if (filter === "All") return true;
    return n.category === filter.toLowerCase();
  });

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading parent reports…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionTitle
        title="Parent Reports"
        subtitle="End-of-day summary and progress note status"
      />

      {/* Summary strip */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderColor: palette.warning }]}>
          <Text style={[styles.summaryValue, { color: palette.warning }]}>{totalUnread}</Text>
          <Text style={styles.summaryLabel}>Unread by parents</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{reports?.length ?? 0}</Text>
          <Text style={styles.summaryLabel}>Students tracked</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: palette.success }]}>
          <Text style={[styles.summaryValue, { color: palette.success }]}>
            {notes.length}
          </Text>
          <Text style={styles.summaryLabel}>Notes logged</Text>
        </View>
      </View>

      {/* Per-student cards */}
      <SectionTitle title="Student Summaries" />
      {(reports ?? []).map((item: any) => {
        const isExpanded = expandedStudent === item.studentName;
        const studentNotes = allNotes.filter(
          (n: any) => n.studentName === item.studentName
        );
        return (
          <TouchableOpacity
            key={item.studentName}
            activeOpacity={0.85}
            onPress={() =>
              setExpandedStudent(isExpanded ? null : item.studentName)
            }
          >
            <Card
              accentColor={
                item.unreadCommentCount > 0 ? palette.warning : palette.success
              }
            >
              <View style={styles.studentHeader}>
                <Avatar name={item.studentName} size={42} />
                <View style={styles.studentMeta}>
                  <Text style={styles.studentName}>{item.studentName}</Text>
                  <Text style={styles.studentSub}>{item.summary}</Text>
                </View>
                {item.unreadCommentCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unreadCommentCount}</Text>
                  </View>
                )}
              </View>

              {isExpanded && studentNotes.length > 0 && (
                <View style={styles.notesWrap}>
                  <Text style={styles.notesLabel}>Progress notes</Text>
                  {studentNotes.map((note) => (
                    <View key={note.id} style={styles.noteItem}>
                      <View style={styles.noteTop}>
                        <CategoryBadge category={note.category} />
                        {!note.isReadByParent && (
                          <View style={styles.unreadDot} />
                        )}
                      </View>
                      <Text style={styles.noteText}>{note.note}</Text>
                      <Text style={styles.noteTime}>
                        {new Date(note.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                        {note.isReadByParent ? "  · Read by parent" : "  · Unread"}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {isExpanded && studentNotes.length === 0 && (
                <Text style={styles.emptyNotes}>No progress notes logged today.</Text>
              )}
            </Card>
          </TouchableOpacity>
        );
      })}

      {/* All progress notes */}
      <SectionTitle title="All Progress Notes" subtitle="Tap a student card above to filter" />

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map((opt) => (
            <Chip
              key={opt}
              label={opt}
              active={filter === opt}
              onPress={() => setFilter(opt)}
            />
          ))}
        </View>
      </ScrollView>

      {notes.length === 0 && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No notes match this filter</Text>
          <Text style={styles.emptySub}>
            Try "All" or log new notes from the Class tab.
          </Text>
        </Card>
      )}

      {notes.map((note) => (
        <Card key={note.id} compact>
          <View style={styles.noteRow}>
            <Avatar name={note.studentName} size={34} />
            <View style={styles.noteContent}>
              <View style={styles.noteTopRow}>
                <Text style={styles.noteStudent}>{note.studentName}</Text>
                <CategoryBadge category={note.category} />
              </View>
              <Text style={styles.noteBody}>{note.note}</Text>
              <View style={styles.noteFooter}>
                <Text style={styles.noteTimestamp}>
                  {new Date(note.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Text>
                <View
                  style={[
                    styles.readPill,
                    note.isReadByParent
                      ? styles.readPillDone
                      : styles.readPillPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.readPillText,
                      note.isReadByParent
                        ? styles.readPillTextDone
                        : styles.readPillTextPending,
                    ]}
                  >
                    {note.isReadByParent ? "Read" : "Unread"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  academic: { label: "📚 Academic", color: palette.info, bg: palette.infoSoft },
  participation: { label: "🙋 Participation", color: palette.success, bg: palette.successSoft },
  behavior: { label: "⭐ Behavior", color: palette.brand, bg: palette.brandSoft },
  homework: { label: "📝 Homework", color: palette.warning, bg: palette.warningSoft },
  milestone: { label: "🏆 Milestone", color: "#7c3aed", bg: "#ede8fc" },
  concern: { label: "⚠️ Concern", color: palette.danger, bg: palette.dangerSoft },
};

function CategoryBadge({ category }: { category: string }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.academic;
  return (
    <View style={[styles.catBadge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.catText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  loadingText: { color: palette.inkSoft, fontSize: 15 },
  summaryRow: { flexDirection: "row", gap: spacing.sm },
  summaryCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    alignItems: "center",
    gap: 2,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  studentHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  studentMeta: { flex: 1, gap: 4 },
  studentName: { fontSize: 16, fontWeight: "800", color: palette.ink },
  studentSub: { fontSize: 12, color: palette.inkSoft, lineHeight: 17 },
  unreadBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.warning,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { fontSize: 11, fontWeight: "900", color: "#fff" },
  notesWrap: { gap: spacing.sm },
  notesLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  noteItem: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  noteTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.warning,
  },
  noteText: { fontSize: 13, color: palette.ink, lineHeight: 19 },
  noteTime: { fontSize: 11, color: palette.inkDim, fontWeight: "500" },
  emptyNotes: { fontSize: 13, color: palette.inkDim, textAlign: "center", paddingVertical: spacing.sm },
  filterScroll: { marginHorizontal: -spacing.md },
  filterRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  emptyCard: { alignItems: "center", paddingVertical: spacing.xl },
  emptyTitle: { fontSize: 15, fontWeight: "800", color: palette.ink },
  emptySub: { fontSize: 13, color: palette.inkSoft, textAlign: "center" },
  noteRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  noteContent: { flex: 1, gap: spacing.xs },
  noteTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  noteStudent: { fontSize: 14, fontWeight: "800", color: palette.ink },
  noteBody: { fontSize: 13, color: palette.inkSoft, lineHeight: 19 },
  noteFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  noteTimestamp: { fontSize: 11, color: palette.inkDim, fontWeight: "500" },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  catText: { fontSize: 10, fontWeight: "700" },
  readPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  readPillDone: { backgroundColor: palette.successSoft },
  readPillPending: { backgroundColor: palette.warningSoft },
  readPillText: { fontSize: 10, fontWeight: "700" },
  readPillTextDone: { color: palette.success },
  readPillTextPending: { color: palette.warning },
});
