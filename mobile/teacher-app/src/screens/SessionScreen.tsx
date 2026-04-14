import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useTeacherActions, useTeacherDashboard } from "../hooks/useTeacherDashboard";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function SessionScreen() {
  const { data } = useTeacherDashboard();
  const actions = useTeacherActions();
  const activeSessionId = useTeacherSessionStore((state) => state.activeSessionId);
  const selectSession = useTeacherSessionStore((state) => state.selectSession);
  const [presentIds, setPresentIds] = useState<number[]>([]);
  const [commentByStudent, setCommentByStudent] = useState<Record<number, string>>({});
  const selectedSession = data?.schedule.find((session) => session.id === activeSessionId) ?? data?.schedule[0];

  useEffect(() => {
    if (!activeSessionId && selectedSession) {
      selectSession(selectedSession.id);
    }
  }, [activeSessionId, selectSession, selectedSession]);

  if (!data || !selectedSession) {
    return null;
  }

  const roster = useMemo(
    () => [...data.roster].sort((a, b) => Number(presentIds.includes(a.id)) - Number(presentIds.includes(b.id))),
    [data.roster, presentIds],
  );
  const focusedStudent = roster.find((student) => !presentIds.includes(student.id)) ?? roster[0];

  const markPresent = (studentId: number) => {
    setPresentIds((current) => (current.includes(studentId) ? current : [...current, studentId]));
  };

  return (
    <Screen>
      <SectionTitle
        title="Class Attendance"
        subtitle={`${selectedSession.classroomLabel} • ${selectedSession.title}`}
      />

      <Card
        title={focusedStudent.fullName}
        subtitle={`Roll ${focusedStudent.rollNumber} • ${selectedSession.attendanceBoundary === "school_entry" ? "Marks school active" : selectedSession.attendanceBoundary === "school_exit" ? "Marks school concluded" : "Standard attendance"}`}
      >
        <Text style={styles.helper}>Current student stays on top until marked present. Then the next student moves up automatically.</Text>
        <PrimaryButton
          label={presentIds.includes(focusedStudent.id) ? "Marked present" : "Mark present"}
          onPress={async () => {
            markPresent(focusedStudent.id);
            await actions.markAttendance.mutateAsync({ sessionId: selectedSession.id, studentId: focusedStudent.id });
          }}
          disabled={presentIds.includes(focusedStudent.id)}
        />
        <TextInput
          style={styles.commentBox}
          placeholder="Add a comment for the parent app"
          multiline
          value={commentByStudent[focusedStudent.id] ?? ""}
          onChangeText={(value) => setCommentByStudent((current) => ({ ...current, [focusedStudent.id]: value }))}
        />
        <PrimaryButton
          label="Save comment for parent"
          onPress={async () => {
            const note = (commentByStudent[focusedStudent.id] ?? "").trim();
            if (!note) return;
            await actions.addComment.mutateAsync({ sessionId: selectedSession.id, studentId: focusedStudent.id, note });
            setCommentByStudent((current) => ({ ...current, [focusedStudent.id]: "" }));
          }}
        />
      </Card>

      <Card title="Roster order" subtitle="Unmarked students first">
        {roster.map((student) => (
          <View key={student.id} style={styles.row}>
            <View style={styles.studentMeta}>
              <Text style={styles.studentName}>{student.fullName}</Text>
              <Text style={styles.studentSub}>Roll {student.rollNumber}</Text>
            </View>
            <Text style={[styles.state, presentIds.includes(student.id) ? styles.done : styles.pending]}>
              {presentIds.includes(student.id) ? "Present" : "Pending"}
            </Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  helper: {
    color: palette.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  commentBox: {
    minHeight: 110,
    textAlignVertical: "top",
    borderRadius: 16,
    backgroundColor: palette.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: palette.ink,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 8,
  },
  studentMeta: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "800",
    color: palette.ink,
  },
  studentSub: {
    fontSize: 13,
    color: palette.inkSoft,
  },
  state: {
    fontSize: 13,
    fontWeight: "800",
  },
  pending: {
    color: palette.warning,
  },
  done: {
    color: palette.success,
  },
});
