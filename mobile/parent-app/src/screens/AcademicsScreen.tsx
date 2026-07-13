import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  LayoutGrid,
  Medal,
} from "lucide-react-native";

import { Screen } from "../components/Screen";
import {
  AIClassesSection,
  OnlineTestsSection,
} from "../components/StudentActivitySections";
import { useParentAcademics } from "../hooks/useParentFeeds";
import { useStudentActivities } from "../hooks/useStudentActivities";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubjectMark {
  subject: string;
  marksObtained: number | null;
  maxMarks: number;
  isAbsent: boolean;
  grade: string;
}

interface ReportCard {
  id: number;
  examName: string;
  examType: string;
  totalMarks: number | null;
  obtainedMarks: number | null;
  percentage: number | null;
  grade: string;
  rank: number | null;
  subjectMarks: SubjectMark[];
}

interface ExamResult {
  id: number;
  examName: string;
  subject: string;
  marksObtained: number | null;
  maxMarks: number;
  passingMarks: number | null;
  isAbsent: boolean;
  grade: string;
  examDate: string | null;
}

interface TimetableSlot {
  day: number;
  period: number;
  subject: string;
  startTime: string;
  endTime: string;
  slotType: string;
}

interface ClassroomInfo {
  id: number;
  name: string;
  section: string;
  teacherName: string;
}

interface StudentData {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  classroom: ClassroomInfo | null;
  timetable: TimetableSlot[];
  reportCards: ReportCard[];
  examResults: ExamResult[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function gradeColor(grade: string) {
  if (grade === "A+" || grade === "A") return palette.green;
  if (grade === "B+" || grade === "B") return palette.brand;
  if (grade === "C+" || grade === "C") return palette.warning;
  if (grade === "F") return palette.danger;
  return palette.inkSoft;
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${suffix}`;
}

function formatDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: typeof GraduationCap; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Icon size={16} color={palette.brand} strokeWidth={2} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function ClassroomCard({ info }: { info: ClassroomInfo }) {
  return (
    <View style={styles.card}>
      <View style={styles.classRow}>
        <View style={styles.classBadge}>
          <Text style={styles.classBadgeText}>
            {info.name}
            {info.section ? ` – ${info.section}` : ""}
          </Text>
        </View>
        {info.teacherName ? (
          <Text style={styles.teacherName}>Class Teacher: {info.teacherName}</Text>
        ) : null}
      </View>
    </View>
  );
}

function TimetableCard({ slots }: { slots: TimetableSlot[] }) {
  if (slots.length === 0) return null;

  // Group by day
  const byDay: Record<number, TimetableSlot[]> = {};
  slots.forEach((s) => {
    if (!byDay[s.day]) byDay[s.day] = [];
    byDay[s.day].push(s);
  });

  return (
    <View style={styles.card}>
      {Object.entries(byDay).map(([day, daySlots]) => (
        <View key={day} style={styles.dayGroup}>
          <Text style={styles.dayLabel}>{DAY_NAMES[parseInt(day)] ?? `Day ${day}`}</Text>
          {daySlots.map((s, i) => (
            <View key={i} style={styles.slotRow}>
              <Text style={styles.slotTime}>
                {formatTime(s.startTime)}–{formatTime(s.endTime)}
              </Text>
              <Text style={styles.slotSubject}>{s.subject}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function ReportCardItem({ rc }: { rc: ReportCard }) {
  return (
    <View style={styles.card}>
      <View style={styles.rcHeader}>
        <Text style={styles.rcExamName}>{rc.examName}</Text>
        {rc.grade ? (
          <View style={[styles.gradePill, { backgroundColor: gradeColor(rc.grade) + "1A" }]}>
            <Text style={[styles.gradeText, { color: gradeColor(rc.grade) }]}>{rc.grade}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.rcStats}>
        {rc.percentage != null && (
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{rc.percentage.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Percentage</Text>
          </View>
        )}
        {rc.obtainedMarks != null && rc.totalMarks != null && (
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>
              {rc.obtainedMarks}/{rc.totalMarks}
            </Text>
            <Text style={styles.statLabel}>Marks</Text>
          </View>
        )}
        {rc.rank != null && (
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>#{rc.rank}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        )}
      </View>

      {rc.subjectMarks.length > 0 && (
        <View style={styles.subjectList}>
          {rc.subjectMarks.map((sm, i) => (
            <View key={i} style={styles.subjectRow}>
              <Text style={styles.subjectName}>{sm.subject}</Text>
              <Text style={styles.subjectMarks}>
                {sm.isAbsent ? "Absent" : `${sm.marksObtained ?? "-"}/${sm.maxMarks}`}
              </Text>
              {sm.grade ? (
                <Text style={[styles.subjectGrade, { color: gradeColor(sm.grade) }]}>
                  {sm.grade}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ExamResultItem({ result }: { result: ExamResult }) {
  const passed =
    !result.isAbsent &&
    result.marksObtained != null &&
    result.passingMarks != null &&
    result.marksObtained >= result.passingMarks;

  return (
    <View style={[styles.resultRow, { borderLeftColor: result.isAbsent ? palette.inkFaint : passed ? palette.green : palette.danger }]}>
      <View style={styles.resultLeft}>
        <Text style={styles.resultSubject}>{result.subject}</Text>
        <Text style={styles.resultExam}>{result.examName}</Text>
        {result.examDate ? (
          <Text style={styles.resultDate}>{formatDate(result.examDate)}</Text>
        ) : null}
      </View>
      <View style={styles.resultRight}>
        <Text style={styles.resultMarks}>
          {result.isAbsent ? "AB" : `${result.marksObtained ?? "-"}/${result.maxMarks}`}
        </Text>
        {result.grade ? (
          <Text style={[styles.resultGrade, { color: gradeColor(result.grade) }]}>
            {result.grade}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function AcademicsScreen() {
  const { data, isLoading } = useParentAcademics();
  const { data: activities } = useStudentActivities();

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={palette.brand} style={{ marginTop: 60 }} />
      </Screen>
    );
  }

  if (!data || data.students.length === 0) {
    return (
      <Screen>
        <View style={styles.headerWrap}>
          <Text style={styles.headerTitle}>Academics</Text>
          <Text style={styles.headerSub}>Class, timetable, exams and report cards</Text>
        </View>
        <View style={styles.emptyWrap}>
          <GraduationCap size={40} color={palette.inkFaint} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No academic data yet</Text>
          <Text style={styles.emptySub}>
            Class setup, exam marks, and report cards will appear here when available.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Header */}
      <View style={styles.headerWrap}>
        <Text style={styles.headerTitle}>Academics</Text>
        <Text style={styles.headerSub}>Class, timetable, exams and report cards</Text>
      </View>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {data.students.map((student: any) => {
        const activity = activities?.find((a) => a.studentId === student.studentId);
        return (
        <View key={student.studentId}>
          {/* Student name chip — only shown if multiple students */}
          {data.students.length > 1 && (
            <Text style={styles.studentChip}>{student.studentName}</Text>
          )}

          {/* Online Tests + AI Classes */}
          {activity && (
            <>
              <OnlineTestsSection tests={activity.tests} studentId={activity.studentId} />
              <AIClassesSection classes={activity.aiClasses} />
            </>
          )}

          {/* Class Setup */}
          {student.classroom && (
            <>
              <SectionHeader icon={LayoutGrid} title="Class" />
              <ClassroomCard info={student.classroom} />
            </>
          )}

          {/* Timetable */}
          {student.timetable.length > 0 && (
            <>
              <SectionHeader icon={Clock} title="Timetable" />
              <TimetableCard slots={student.timetable} />
            </>
          )}

          {/* Report Cards */}
          {student.reportCards.length > 0 && (
            <>
              <SectionHeader icon={Medal} title="Report Cards" />
              {student.reportCards.map((rc: ReportCard) => (
                <ReportCardItem key={rc.id} rc={rc} />
              ))}
            </>
          )}

          {/* Individual Exam Marks */}
          {student.examResults.length > 0 && (
            <>
              <SectionHeader icon={BookOpen} title="Exam Marks" />
              <View style={styles.card}>
                {student.examResults.map((r: ExamResult) => (
                  <ExamResultItem key={r.id} result={r} />
                ))}
              </View>
            </>
          )}

          {/* Empty state per student */}
          {!student.classroom &&
            student.timetable.length === 0 &&
            student.reportCards.length === 0 &&
            student.examResults.length === 0 &&
            (activity?.tests.length ?? 0) === 0 &&
            (activity?.aiClasses.length ?? 0) === 0 && (
              <View style={styles.emptyWrap}>
                <Calendar size={32} color={palette.inkFaint} strokeWidth={1.5} />
                <Text style={styles.emptySub}>No academic data available yet.</Text>
              </View>
            )}
        </View>
        );
      })}
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  headerWrap: { gap: 3 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 13,
    color: palette.inkSoft,
    lineHeight: 18,
  },

  studentChip: {
    fontSize: 15,
    fontWeight: "800",
    color: palette.brand,
    marginBottom: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.ink,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.stroke,
    gap: 8,
    shadowColor: palette.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },

  // Classroom
  classRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
  classBadge: {
    backgroundColor: palette.brandMid,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  classBadgeText: { fontSize: 14, fontWeight: "800", color: palette.brandDeep },
  teacherName: { fontSize: 13, color: palette.inkSoft },

  // Timetable
  dayGroup: { gap: 4 },
  dayLabel: { fontSize: 12, fontWeight: "700", color: palette.inkFaint, textTransform: "uppercase" },
  slotRow: { flexDirection: "row", gap: 10 },
  slotTime: { fontSize: 12, color: palette.inkSoft, width: 100 },
  slotSubject: { fontSize: 13, color: palette.ink, fontWeight: "500", flex: 1 },

  // Report card
  rcHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rcExamName: { fontSize: 14, fontWeight: "800", color: palette.ink, flex: 1 },
  gradePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  gradeText: { fontSize: 12, fontWeight: "800" },
  rcStats: { flexDirection: "row", gap: 20 },
  statBlock: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 18, fontWeight: "900", color: palette.ink },
  statLabel: { fontSize: 11, color: palette.inkFaint },
  subjectList: { gap: 6, borderTopWidth: 1, borderTopColor: palette.stroke, paddingTop: 8 },
  subjectRow: { flexDirection: "row", alignItems: "center" },
  subjectName: { flex: 1, fontSize: 13, color: palette.inkSoft },
  subjectMarks: { fontSize: 13, fontWeight: "600", color: palette.ink, marginRight: 8 },
  subjectGrade: { fontSize: 13, fontWeight: "700", width: 28, textAlign: "right" },

  // Exam results
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
    gap: 8,
  },
  resultLeft: { flex: 1, gap: 2 },
  resultSubject: { fontSize: 13, fontWeight: "700", color: palette.ink },
  resultExam: { fontSize: 11, color: palette.inkSoft },
  resultDate: { fontSize: 11, color: palette.inkFaint },
  resultRight: { alignItems: "flex-end", gap: 2 },
  resultMarks: { fontSize: 13, fontWeight: "700", color: palette.ink },
  resultGrade: { fontSize: 12, fontWeight: "700" },

  // Empty
  emptyWrap: { alignItems: "center", paddingTop: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: palette.ink },
  emptySub: { fontSize: 13, color: palette.inkSoft, textAlign: "center", lineHeight: 19 },
});
