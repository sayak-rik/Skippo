import { useEffect, useMemo, useState } from "react";
import {
  Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { Avatar } from "../components/Avatar";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useTeacherActions, useTeacherDashboard } from "../hooks/useTeacherDashboard";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { radius, spacing } from "../theme/spacing";
import { RosterStudent } from "../types";

const PROGRESS_CATEGORIES = [
  { key: "academic", label: "📚 Academic", color: palette.info, bg: palette.infoSoft },
  { key: "participation", label: "🙋 Participation", color: palette.success, bg: palette.successSoft },
  { key: "behavior", label: "⭐ Behavior", color: palette.brand, bg: palette.brandSoft },
  { key: "homework", label: "📝 Homework", color: palette.warning, bg: palette.warningSoft },
  { key: "milestone", label: "🏆 Milestone", color: "#7c3aed", bg: "#ede8fc" },
  { key: "concern", label: "⚠️ Concern", color: palette.danger, bg: palette.dangerSoft },
];

export function SessionScreen() {
  const { data, isLoading } = useTeacherDashboard();
  const actions = useTeacherActions();
  const activeSessionId = useTeacherSessionStore((s) => s.activeSessionId);
  const selectSession = useTeacherSessionStore((s) => s.selectSession);

  const [presentIds, setPresentIds] = useState<number[]>([]);
  const [absentIds, setAbsentIds] = useState<number[]>([]);
  const [commentByStudent, setCommentByStudent] = useState<Record<number, string>>({});
  const [categoryByStudent, setCategoryByStudent] = useState<Record<number, string>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingComment, setSavingComment] = useState(false);

  const selectedSession =
    data?.schedule?.find((s: any) => s.id === activeSessionId) ?? data?.schedule?.[0];

  useEffect(() => {
    if (!activeSessionId && selectedSession) selectSession(selectedSession.id);
  }, [activeSessionId, selectSession, selectedSession]);

  const roster: RosterStudent[] = useMemo(() => {
    const base: RosterStudent[] = data?.roster ?? [];
    return [...base].sort((a, b) => {
      if (presentIds.includes(a.id) !== presentIds.includes(b.id))
        return Number(presentIds.includes(a.id)) - Number(presentIds.includes(b.id));
      if (absentIds.includes(a.id) !== absentIds.includes(b.id))
        return Number(absentIds.includes(a.id)) - Number(absentIds.includes(b.id));
      return 0;
    });
  }, [data?.roster, presentIds, absentIds]);

  const unmarked = roster.filter((s) => !presentIds.includes(s.id) && !absentIds.includes(s.id));
  const markedPresent = roster.filter((s) => presentIds.includes(s.id));
  const markedAbsent = roster.filter((s) => absentIds.includes(s.id));

  if (isLoading || !data || !selectedSession) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>
            {isLoading ? "Loading class…" : "Select a session from the Schedule tab"}
          </Text>
        </View>
      </Screen>
    );
  }

  const markPresent = async (studentId: number) => {
    setPresentIds((c) => (c.includes(studentId) ? c : [...c, studentId]));
    setAbsentIds((c) => c.filter((id) => id !== studentId));
    await actions.markAttendance.mutateAsync({ sessionId: selectedSession.id, studentId });
  };

  const markAbsent = (studentId: number) => {
    setAbsentIds((c) => (c.includes(studentId) ? c : [...c, studentId]));
    setPresentIds((c) => c.filter((id) => id !== studentId));
  };

  const saveComment = async (studentId: number) => {
    const note = (commentByStudent[studentId] ?? "").trim();
    const category = categoryByStudent[studentId] ?? "academic";
    if (!note) return;
    setSavingComment(true);
    try {
      await actions.addComment.mutateAsync({ sessionId: selectedSession.id, studentId, note, category });
      setCommentByStudent((c) => ({ ...c, [studentId]: "" }));
      Alert.alert("Saved", "Comment sent to parent app.");
    } finally {
      setSavingComment(false);
    }
  };

  const progressPct = roster.length > 0
    ? Math.round(((presentIds.length + absentIds.length) / roster.length) * 100)
    : 0;

  return (
    <Screen>
      {/* Session header */}
      <Card accentColor={palette.brand}>
        <View style={styles.sessionInfo}>
          <View>
            <Text style={styles.sessionTitle}>{selectedSession.title}</Text>
            <Text style={styles.sessionMeta}>
              {selectedSession.classroomLabel} · {selectedSession.startsAt}–{selectedSession.endsAt}
            </Text>
          </View>
          {selectedSession.isCurrent && (
            <View style={styles.nowBadge}>
              <View style={styles.nowDot} />
              <Text style={styles.nowText}>Live</Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        <View>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Attendance progress</Text>
            <Text style={styles.progressPct}>{progressPct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
          </View>
          <View style={styles.progressStats}>
            <Text style={[styles.stat, { color: palette.success }]}>
              ✓ {presentIds.length} present
            </Text>
            <Text style={[styles.stat, { color: palette.danger }]}>
              ✗ {absentIds.length} absent
            </Text>
            <Text style={[styles.stat, { color: palette.warning }]}>
              · {unmarked.length} unmarked
            </Text>
          </View>
        </View>
      </Card>

      {/* Unmarked students */}
      {unmarked.length > 0 && (
        <>
          <SectionTitle title="Unmarked" subtitle={`${unmarked.length} students need attention`} />
          {unmarked.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              expanded={expandedId === student.id}
              onToggle={() => setExpandedId(expandedId === student.id ? null : student.id)}
              onPresent={() => markPresent(student.id)}
              onAbsent={() => markAbsent(student.id)}
              comment={commentByStudent[student.id] ?? ""}
              onCommentChange={(v) => setCommentByStudent((c) => ({ ...c, [student.id]: v }))}
              category={categoryByStudent[student.id] ?? "academic"}
              onCategoryChange={(v) => setCategoryByStudent((c) => ({ ...c, [student.id]: v }))}
              onSaveComment={() => saveComment(student.id)}
              savingComment={savingComment}
            />
          ))}
        </>
      )}

      {/* Present */}
      {markedPresent.length > 0 && (
        <>
          <SectionTitle title="Present" subtitle={`${markedPresent.length} marked`} />
          {markedPresent.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              status="present"
              expanded={expandedId === student.id}
              onToggle={() => setExpandedId(expandedId === student.id ? null : student.id)}
              onPresent={() => markPresent(student.id)}
              onAbsent={() => markAbsent(student.id)}
              comment={commentByStudent[student.id] ?? ""}
              onCommentChange={(v) => setCommentByStudent((c) => ({ ...c, [student.id]: v }))}
              category={categoryByStudent[student.id] ?? "academic"}
              onCategoryChange={(v) => setCategoryByStudent((c) => ({ ...c, [student.id]: v }))}
              onSaveComment={() => saveComment(student.id)}
              savingComment={savingComment}
            />
          ))}
        </>
      )}

      {/* Absent */}
      {markedAbsent.length > 0 && (
        <>
          <SectionTitle title="Absent" subtitle={`${markedAbsent.length} marked absent`} />
          {markedAbsent.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              status="absent"
              expanded={expandedId === student.id}
              onToggle={() => setExpandedId(expandedId === student.id ? null : student.id)}
              onPresent={() => markPresent(student.id)}
              onAbsent={() => markAbsent(student.id)}
              comment={commentByStudent[student.id] ?? ""}
              onCommentChange={(v) => setCommentByStudent((c) => ({ ...c, [student.id]: v }))}
              category={categoryByStudent[student.id] ?? "academic"}
              onCategoryChange={(v) => setCategoryByStudent((c) => ({ ...c, [student.id]: v }))}
              onSaveComment={() => saveComment(student.id)}
              savingComment={savingComment}
            />
          ))}
        </>
      )}

      {progressPct === 100 && (
        <Card style={styles.doneCard}>
          <Text style={styles.doneText}>🎉 All students accounted for!</Text>
          <Text style={styles.doneSub}>
            Attendance is complete. Progress notes will appear in the parent app immediately.
          </Text>
        </Card>
      )}
    </Screen>
  );
}

type StudentRowProps = {
  student: RosterStudent;
  status?: "present" | "absent";
  expanded: boolean;
  onToggle: () => void;
  onPresent: () => void;
  onAbsent: () => void;
  comment: string;
  onCommentChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  onSaveComment: () => void;
  savingComment: boolean;
};

function StudentRow({
  student, status, expanded, onToggle, onPresent, onAbsent,
  comment, onCommentChange, category, onCategoryChange, onSaveComment, savingComment,
}: StudentRowProps) {
  return (
    <Card compact style={status === "present" ? styles.presentCard : status === "absent" ? styles.absentCard : undefined}>
      <TouchableOpacity activeOpacity={0.8} onPress={onToggle}>
        <View style={styles.studentRow}>
          <Avatar name={student.fullName} size={38} />
          <View style={styles.studentMeta}>
            <Text style={styles.studentName}>{student.fullName}</Text>
            <Text style={styles.studentRoll}>Roll {student.rollNumber}</Text>
          </View>
          <View style={styles.statusBadgeWrap}>
            {status === "present" && (
              <View style={styles.statusPresent}><Text style={styles.statusPresentText}>Present</Text></View>
            )}
            {status === "absent" && (
              <View style={styles.statusAbsent}><Text style={styles.statusAbsentText}>Absent</Text></View>
            )}
            {!status && (
              <View style={styles.statusPending}><Text style={styles.statusPendingText}>Unmarked</Text></View>
            )}
            <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expanded}>
          {/* Action buttons */}
          <View style={styles.actionRow}>
            <PrimaryButton
              label="✓ Present"
              variant={status === "present" ? "primary" : "secondary"}
              size="sm"
              onPress={onPresent}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              label="✗ Absent"
              variant={status === "absent" ? "danger" : "ghost"}
              size="sm"
              onPress={onAbsent}
              style={{ flex: 1 }}
            />
          </View>

          {/* Progress note */}
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Progress Note for Parent</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              <View style={styles.categoryRow}>
                {PROGRESS_CATEGORIES.map((cat) => (
                  <Chip
                    key={cat.key}
                    label={cat.label}
                    active={category === cat.key}
                    onPress={() => onCategoryChange(cat.key)}
                    color={category === cat.key ? cat.color : undefined}
                    bgColor={category === cat.key ? cat.bg : undefined}
                  />
                ))}
              </View>
            </ScrollView>
            <TextInput
              style={styles.commentBox}
              placeholder="Write a note — it goes directly to the parent app…"
              placeholderTextColor={palette.inkDim}
              multiline
              value={comment}
              onChangeText={onCommentChange}
            />
            <PrimaryButton
              label="Send to parent app"
              variant="secondary"
              size="sm"
              loading={savingComment}
              onPress={onSaveComment}
              disabled={!comment.trim()}
            />
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  loadingText: { color: palette.inkSoft, fontSize: 15, textAlign: "center" },
  sessionInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  sessionTitle: { fontSize: 18, fontWeight: "800", color: palette.ink },
  sessionMeta: { fontSize: 12, color: palette.inkSoft, marginTop: 2 },
  nowBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: palette.brandSoft, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.full,
  },
  nowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.brand },
  nowText: { fontSize: 11, fontWeight: "800", color: palette.brand },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: 11, fontWeight: "600", color: palette.inkSoft, textTransform: "uppercase", letterSpacing: 0.4 },
  progressPct: { fontSize: 11, fontWeight: "800", color: palette.brand },
  progressTrack: {
    height: 6, backgroundColor: palette.surfaceMuted,
    borderRadius: radius.full, overflow: "hidden",
  },
  progressFill: {
    height: "100%", backgroundColor: palette.brand,
    borderRadius: radius.full, minWidth: 4,
  },
  progressStats: { flexDirection: "row", gap: spacing.md, marginTop: 6 },
  stat: { fontSize: 12, fontWeight: "700" },
  studentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  studentMeta: { flex: 1, gap: 2 },
  studentName: { fontSize: 15, fontWeight: "800", color: palette.ink },
  studentRoll: { fontSize: 11, color: palette.inkSoft, fontWeight: "500" },
  statusBadgeWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusPresent: {
    backgroundColor: palette.successSoft, paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusPresentText: { fontSize: 11, fontWeight: "800", color: palette.success },
  statusAbsent: {
    backgroundColor: palette.dangerSoft, paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusAbsentText: { fontSize: 11, fontWeight: "800", color: palette.danger },
  statusPending: {
    backgroundColor: palette.warningSoft, paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusPendingText: { fontSize: 11, fontWeight: "800", color: palette.warning },
  chevron: { fontSize: 10, color: palette.inkDim },
  expanded: { gap: spacing.md, paddingTop: spacing.xs },
  actionRow: { flexDirection: "row", gap: spacing.sm },
  noteSection: { gap: spacing.sm },
  noteLabel: {
    fontSize: 11, fontWeight: "700", color: palette.inkSoft,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  categoryScroll: { marginHorizontal: -spacing.md },
  categoryRow: {
    flexDirection: "row", gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingBottom: spacing.xs,
  },
  commentBox: {
    minHeight: 90, textAlignVertical: "top",
    borderRadius: radius.md, backgroundColor: palette.surfaceMuted,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    color: palette.ink, fontSize: 14,
    borderWidth: 1, borderColor: palette.stroke,
  },
  presentCard: { borderColor: palette.success, borderWidth: 1.5 },
  absentCard: { borderColor: palette.danger, borderWidth: 1.5 },
  doneCard: { backgroundColor: palette.brandSoft, borderColor: palette.brand, alignItems: "center" },
  doneText: { fontSize: 18, fontWeight: "900", color: palette.ink, textAlign: "center" },
  doneSub: { fontSize: 13, color: palette.inkSoft, textAlign: "center", lineHeight: 19 },
});
