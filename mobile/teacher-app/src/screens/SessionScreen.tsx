// ---------------------------------------------------------------------------
// SessionScreen – attendance marking for the selected class session.
//
// Features:
//   1. Mark each student present or absent (synced to backend immediately).
//   2. Add a parent-visible progress note per student (category + free text).
//   3. Send a class-wide broadcast to all parents in the classroom.
//   4. View and resolve assist requests (doubt cards) raised by parents.
//   5. Students are auto-sorted: unmarked → present → absent.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar } from "../components/Avatar";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import {
  useAssistRequests,
  useBroadcast,
  useTeacherActions,
  useTeacherDashboard,
} from "../hooks/useTeacherDashboard";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { radius, spacing } from "../theme/spacing";
import { AssistRequest, RosterStudent } from "../types";

// ── Progress note categories ──────────────────────────────────────────────────

const PROGRESS_CATEGORIES = [
  { key: "academic",      label: "📚 Academic",     color: palette.info,    bg: palette.infoSoft },
  { key: "participation", label: "🙋 Participation", color: palette.success, bg: palette.successSoft },
  { key: "behavior",      label: "⭐ Behavior",      color: palette.brand,   bg: palette.brandSoft },
  { key: "homework",      label: "📝 Homework",      color: palette.warning, bg: palette.warningSoft },
  { key: "milestone",     label: "🏆 Milestone",     color: "#7c3aed",       bg: "#ede8fc" },
  { key: "concern",       label: "⚠️ Concern",       color: palette.danger,  bg: palette.dangerSoft },
];

// ── SessionScreen ─────────────────────────────────────────────────────────────

export function SessionScreen() {
  const { data, isLoading } = useTeacherDashboard();
  const actions = useTeacherActions();
  const activeSessionId = useTeacherSessionStore((s) => s.activeSessionId);
  const selectSession   = useTeacherSessionStore((s) => s.selectSession);
  const manualOverride  = useTeacherSessionStore((s) => s.manualClassOverride);

  // ── Local attendance state ─────────────────────────────────────────────
  const [presentIds, setPresentIds]       = useState<number[]>([]);
  const [absentIds, setAbsentIds]         = useState<number[]>([]);
  const [expandedId, setExpandedId]       = useState<number | null>(null);
  const [savingComment, setSavingComment] = useState(false);

  // Per-student comment form state
  const [commentByStudent, setCommentByStudent]   = useState<Record<number, string>>({});
  const [categoryByStudent, setCategoryByStudent] = useState<Record<number, string>>({});

  // ── Broadcast modal state ──────────────────────────────────────────────
  const [broadcastVisible, setBroadcastVisible] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Resolve the session to display; fall back to the first scheduled item.
  const selectedSession =
    data?.schedule?.find((s: any) => s.id === activeSessionId) ??
    data?.schedule?.[0];

  // Auto-select the first session when none is active yet.
  useEffect(() => {
    if (!activeSessionId && selectedSession) selectSession(selectedSession.id);
  }, [activeSessionId, selectSession, selectedSession]);

  // Fetch broadcasts and assist requests for the current session.
  const { send: sendBroadcast, broadcasts } = useBroadcast(selectedSession?.id ?? null);
  const { byStudent: assistByStudent }       = useAssistRequests(selectedSession?.id ?? null);

  // ── Derived roster state ───────────────────────────────────────────────
  // Sort so unmarked students appear first, keeping urgent attention at top.
  const roster: RosterStudent[] = useMemo(() => {
    const base: RosterStudent[] = data?.roster ?? [];
    return [...base].sort((a, b) => {
      const aMarked = presentIds.includes(a.id) || absentIds.includes(a.id);
      const bMarked = presentIds.includes(b.id) || absentIds.includes(b.id);
      return Number(aMarked) - Number(bMarked);
    });
  }, [data?.roster, presentIds, absentIds]);

  const unmarked      = roster.filter((s) => !presentIds.includes(s.id) && !absentIds.includes(s.id));
  const markedPresent = roster.filter((s) => presentIds.includes(s.id));
  const markedAbsent  = roster.filter((s) => absentIds.includes(s.id));
  const progressPct   = roster.length > 0
    ? Math.round(((presentIds.length + absentIds.length) / roster.length) * 100)
    : 0;

  // Loading / empty states
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

  // ── Attendance handlers ────────────────────────────────────────────────

  const markPresent = async (studentId: number) => {
    setPresentIds((c) => (c.includes(studentId) ? c : [...c, studentId]));
    setAbsentIds((c) => c.filter((id) => id !== studentId));
    await actions.markAttendance.mutateAsync({ sessionId: selectedSession.id, studentId, isPresent: true });
  };

  const markAbsent = async (studentId: number) => {
    setAbsentIds((c) => (c.includes(studentId) ? c : [...c, studentId]));
    setPresentIds((c) => c.filter((id) => id !== studentId));
    await actions.markAttendance.mutateAsync({ sessionId: selectedSession.id, studentId, isPresent: false });
  };

  const saveComment = async (studentId: number) => {
    const note     = (commentByStudent[studentId] ?? "").trim();
    const category = categoryByStudent[studentId] ?? "academic";
    if (!note) return;
    setSavingComment(true);
    try {
      await actions.addComment.mutateAsync({ sessionId: selectedSession.id, studentId, note, category });
      setCommentByStudent((c) => ({ ...c, [studentId]: "" }));
      Alert.alert("Saved", "Note sent to parent app.");
    } finally {
      setSavingComment(false);
    }
  };

  // ── Broadcast handler ──────────────────────────────────────────────────

  const handleSendBroadcast = async () => {
    const text = broadcastMessage.trim();
    if (!text) return;
    setSendingBroadcast(true);
    try {
      await sendBroadcast.mutateAsync(text);
      setBroadcastMessage("");
      setBroadcastVisible(false);
      Alert.alert("Broadcast sent", "All parents in this class have been notified.");
    } finally {
      setSendingBroadcast(false);
    }
  };

  // ── Render the classroom label: manual override takes priority ─────────
  const displayLabel = manualOverride ?? selectedSession.classroomLabel;

  return (
    <Screen>
      {/* ── Session header card ─────────────────────────────────────────── */}
      <Card accentColor={palette.brand}>
        {/* Title row */}
        <View style={styles.sessionInfo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionTitle}>{selectedSession.title}</Text>
            <Text style={styles.sessionMeta}>
              {displayLabel} · {selectedSession.startsAt}–{selectedSession.endsAt}
            </Text>
          </View>
          {selectedSession.isCurrent && (
            <View style={styles.nowBadge}>
              <View style={styles.nowDot} />
              <Text style={styles.nowText}>Live</Text>
            </View>
          )}
        </View>

        {/* Attendance progress bar */}
        <View>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Attendance progress</Text>
            <Text style={styles.progressPct}>{progressPct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
          </View>
          <View style={styles.progressStats}>
            <Text style={[styles.stat, { color: palette.success }]}>✓ {presentIds.length} present</Text>
            <Text style={[styles.stat, { color: palette.danger  }]}>✗ {absentIds.length} absent</Text>
            <Text style={[styles.stat, { color: palette.warning }]}>· {unmarked.length} unmarked</Text>
          </View>
        </View>

        {/* Broadcast button – sends a message to all parents in this class */}
        <TouchableOpacity
          style={styles.broadcastBtn}
          activeOpacity={0.8}
          onPress={() => setBroadcastVisible(true)}
        >
          <Text style={styles.broadcastBtnText}>📢 Broadcast to class</Text>
          {broadcasts.length > 0 && (
            <Text style={styles.broadcastCount}>{broadcasts.length} sent today</Text>
          )}
        </TouchableOpacity>
      </Card>

      {/* ── Unmarked students ────────────────────────────────────────────── */}
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
              assistRequests={assistByStudent[student.id] ?? []}
              sessionId={selectedSession.id}
            />
          ))}
        </>
      )}

      {/* ── Present students ─────────────────────────────────────────────── */}
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
              assistRequests={assistByStudent[student.id] ?? []}
              sessionId={selectedSession.id}
            />
          ))}
        </>
      )}

      {/* ── Absent students ──────────────────────────────────────────────── */}
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
              assistRequests={assistByStudent[student.id] ?? []}
              sessionId={selectedSession.id}
            />
          ))}
        </>
      )}

      {/* ── All done card ─────────────────────────────────────────────────── */}
      {progressPct === 100 && (
        <Card style={styles.doneCard}>
          <Text style={styles.doneText}>🎉 All students accounted for!</Text>
          <Text style={styles.doneSub}>
            Attendance is complete. Progress notes will appear in the parent app immediately.
          </Text>
        </Card>
      )}

      {/* ── Broadcast modal ───────────────────────────────────────────────── */}
      <BroadcastModal
        visible={broadcastVisible}
        classroomLabel={displayLabel}
        message={broadcastMessage}
        onChangeMessage={setBroadcastMessage}
        onSend={handleSendBroadcast}
        onClose={() => { setBroadcastVisible(false); setBroadcastMessage(""); }}
        sending={sendingBroadcast}
      />
    </Screen>
  );
}

// ── BroadcastModal ────────────────────────────────────────────────────────────

type BroadcastModalProps = {
  visible: boolean;
  classroomLabel: string;
  message: string;
  onChangeMessage: (v: string) => void;
  onSend: () => void;
  onClose: () => void;
  sending: boolean;
};

function BroadcastModal({
  visible, classroomLabel, message, onChangeMessage, onSend, onClose, sending,
}: BroadcastModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Dimmed backdrop */}
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />

      <View style={styles.modalSheet}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>Broadcast to {classroomLabel}</Text>
            <Text style={styles.modalSubtitle}>
              All parents in this class will receive this message instantly.
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Message input */}
        <TextInput
          style={styles.broadcastInput}
          placeholder="Type your message…"
          placeholderTextColor={palette.inkDim}
          multiline
          value={message}
          onChangeText={onChangeMessage}
          autoFocus
        />

        {/* Actions */}
        <View style={styles.modalActions}>
          <PrimaryButton
            label="Cancel"
            variant="ghost"
            size="sm"
            onPress={onClose}
            style={{ flex: 1 }}
          />
          <PrimaryButton
            label={sending ? "Sending…" : "Send Broadcast"}
            variant="primary"
            size="sm"
            onPress={onSend}
            loading={sending}
            disabled={!message.trim()}
            style={{ flex: 2 }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ── StudentRow ────────────────────────────────────────────────────────────────

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
  /** Pending assist requests for this student, raised via the parent app. */
  assistRequests: AssistRequest[];
  sessionId: number;
};

function StudentRow({
  student, status, expanded, onToggle, onPresent, onAbsent,
  comment, onCommentChange, category, onCategoryChange, onSaveComment, savingComment,
  assistRequests, sessionId,
}: StudentRowProps) {
  const { resolve } = useAssistRequests(sessionId);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [replyById, setReplyById]     = useState<Record<number, string>>({});

  const handleResolve = async (requestId: number) => {
    setResolvingId(requestId);
    try {
      await resolve.mutateAsync({ requestId, reply: replyById[requestId] ?? "" });
    } finally {
      setResolvingId(null);
    }
  };

  // Border colour indicates attendance status at a glance
  const cardStyle =
    status === "present" ? styles.presentCard :
    status === "absent"  ? styles.absentCard  : undefined;

  return (
    <Card compact style={cardStyle}>
      {/* ── Collapsed row ──────────────────────────────────────────────── */}
      <TouchableOpacity activeOpacity={0.8} onPress={onToggle}>
        <View style={styles.studentRow}>
          <Avatar name={student.fullName} size={38} />

          {/* Name + roll number */}
          <View style={styles.studentMeta}>
            <Text style={styles.studentName}>{student.fullName}</Text>
            <Text style={styles.studentRoll}>Roll {student.rollNumber}</Text>
          </View>

          {/* Status badge + assist badge + chevron */}
          <View style={styles.statusBadgeWrap}>
            {status === "present" && (
              <View style={styles.statusPresent}>
                <Text style={styles.statusPresentText}>Present</Text>
              </View>
            )}
            {status === "absent" && (
              <View style={styles.statusAbsent}>
                <Text style={styles.statusAbsentText}>Absent</Text>
              </View>
            )}
            {!status && (
              <View style={styles.statusPending}>
                <Text style={styles.statusPendingText}>Unmarked</Text>
              </View>
            )}

            {/* Assist badge: shown when the parent has open questions */}
            {assistRequests.length > 0 && (
              <View style={styles.assistBadge}>
                <Text style={styles.assistBadgeText}>🙋 {assistRequests.length}</Text>
              </View>
            )}

            <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Expanded content ───────────────────────────────────────────── */}
      {expanded && (
        <View style={styles.expanded}>

          {/* ── Parent questions (assist requests) ──────────────────────
              Show before attendance actions so urgent questions get
              immediate teacher attention. */}
          {assistRequests.length > 0 && (
            <View style={styles.assistSection}>
              <Text style={styles.assistSectionLabel}>🙋 Parent has a question</Text>
              {assistRequests.map((req) => (
                <View key={req.id} style={styles.assistCard}>
                  <Text style={styles.assistQuestion}>{req.question}</Text>

                  {/* Reply input – optional message sent back to parent */}
                  <TextInput
                    style={styles.assistReplyInput}
                    placeholder="Reply to parent (optional)…"
                    placeholderTextColor={palette.inkDim}
                    value={replyById[req.id] ?? ""}
                    onChangeText={(v) => setReplyById((c) => ({ ...c, [req.id]: v }))}
                  />

                  <PrimaryButton
                    label={resolvingId === req.id ? "Resolving…" : "Mark Resolved"}
                    variant="secondary"
                    size="sm"
                    loading={resolvingId === req.id}
                    onPress={() => handleResolve(req.id)}
                  />
                </View>
              ))}
            </View>
          )}

          {/* ── Attendance action buttons ────────────────────────────── */}
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

          {/* ── Progress note for parent ─────────────────────────────── */}
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Progress Note for Parent</Text>

            {/* Category selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
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

            {/* Note text input */}
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Loading state
  loading:     { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  loadingText: { color: palette.inkSoft, fontSize: 15, textAlign: "center" },

  // Session header
  sessionInfo:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  sessionTitle:   { fontSize: 18, fontWeight: "800", color: palette.ink },
  sessionMeta:    { fontSize: 12, color: palette.inkSoft, marginTop: 2 },
  nowBadge:       { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: palette.brandSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  nowDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.brand },
  nowText:        { fontSize: 11, fontWeight: "800", color: palette.brand },

  // Progress bar
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel:  { fontSize: 11, fontWeight: "600", color: palette.inkSoft, textTransform: "uppercase", letterSpacing: 0.4 },
  progressPct:    { fontSize: 11, fontWeight: "800", color: palette.brand },
  progressTrack:  { height: 6, backgroundColor: palette.surfaceMuted, borderRadius: radius.full, overflow: "hidden" },
  progressFill:   { height: "100%", backgroundColor: palette.brand, borderRadius: radius.full, minWidth: 4 },
  progressStats:  { flexDirection: "row", gap: spacing.md, marginTop: 6 },
  stat:           { fontSize: 12, fontWeight: "700" },

  // Broadcast button (inside the session header card)
  broadcastBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  broadcastBtnText:  { fontSize: 13, fontWeight: "700", color: palette.ink },
  broadcastCount:    { fontSize: 11, color: palette.inkSoft, fontWeight: "500" },

  // Broadcast modal
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  modalHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitle:       { fontSize: 17, fontWeight: "800", color: palette.ink },
  modalSubtitle:    { fontSize: 12, color: palette.inkSoft, marginTop: 2, maxWidth: "85%" },
  modalClose:       { padding: spacing.xs },
  modalCloseText:   { fontSize: 16, color: palette.inkSoft, fontWeight: "700" },
  broadcastInput: {
    minHeight: 110,
    textAlignVertical: "top",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: palette.ink,
    fontSize: 14,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  modalActions: { flexDirection: "row", gap: spacing.sm },

  // Student row
  studentRow:       { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  studentMeta:      { flex: 1, gap: 2 },
  studentName:      { fontSize: 15, fontWeight: "800", color: palette.ink },
  studentRoll:      { fontSize: 11, color: palette.inkSoft, fontWeight: "500" },
  statusBadgeWrap:  { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusPresent:    { backgroundColor: palette.successSoft, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.full },
  statusPresentText:{ fontSize: 11, fontWeight: "800", color: palette.success },
  statusAbsent:     { backgroundColor: palette.dangerSoft, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.full },
  statusAbsentText: { fontSize: 11, fontWeight: "800", color: palette.danger },
  statusPending:    { backgroundColor: palette.warningSoft, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.full },
  statusPendingText:{ fontSize: 11, fontWeight: "800", color: palette.warning },

  // Assist request badge on the student card header
  assistBadge:     { backgroundColor: "#ede8fc", paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  assistBadgeText: { fontSize: 11, fontWeight: "800", color: "#7c3aed" },

  chevron: { fontSize: 10, color: palette.inkDim },

  // Expanded student card sections
  expanded:     { gap: spacing.md, paddingTop: spacing.xs },
  actionRow:    { flexDirection: "row", gap: spacing.sm },
  noteSection:  { gap: spacing.sm },
  noteLabel:    { fontSize: 11, fontWeight: "700", color: palette.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 },
  categoryScroll: { marginHorizontal: -spacing.md },
  categoryRow:    { flexDirection: "row", gap: spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  commentBox: {
    minHeight: 90,
    textAlignVertical: "top",
    borderRadius: radius.md,
    backgroundColor: palette.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: palette.ink,
    fontSize: 14,
    borderWidth: 1,
    borderColor: palette.stroke,
  },

  // Assist request section within the expanded card
  assistSection: {
    backgroundColor: "#f5f0ff",
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "#d8ccf8",
  },
  assistSectionLabel: { fontSize: 11, fontWeight: "800", color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.5 },
  assistCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "#e0d8fa",
  },
  assistQuestion:    { fontSize: 13, color: palette.ink, lineHeight: 19 },
  assistReplyInput: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    color: palette.ink,
    fontSize: 13,
    borderWidth: 1,
    borderColor: palette.stroke,
  },

  // Card border variants
  presentCard: { borderColor: palette.success, borderWidth: 1.5 },
  absentCard:  { borderColor: palette.danger,  borderWidth: 1.5 },

  // All-done card
  doneCard: { backgroundColor: palette.brandSoft, borderColor: palette.brand, alignItems: "center" },
  doneText: { fontSize: 18, fontWeight: "900", color: palette.ink, textAlign: "center" },
  doneSub:  { fontSize: 13, color: palette.inkSoft, textAlign: "center", lineHeight: 19 },
});
