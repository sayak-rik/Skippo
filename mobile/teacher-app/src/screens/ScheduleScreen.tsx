// ---------------------------------------------------------------------------
// ScheduleScreen – shows the teacher's day schedule and class management tools.
//
// Features:
//   1. Today's schedule with current class pinned to the top.
//   2. Summary strip: classes today / present so far / unmarked count.
//   3. First-week setup banner – prompts the teacher to pick their classes when
//      they have never saved schedule preferences (is_first_week flag from login).
//   4. Class picker modal – teacher can manually select any classroom when
//      verbally assigned to a different class outside their schedule.
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar } from "../components/Avatar";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useClassrooms, useSaveSchedulePreferences } from "../hooks/useTeacherDashboard";
import { useTeacherDashboard } from "../hooks/useTeacherDashboard";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { radius, spacing } from "../theme/spacing";
import { Classroom } from "../types";

// Metadata for each attendance boundary type shown on session cards
const BOUNDARY_META: Record<string, { label: string; color: string; bg: string }> = {
  school_entry: { label: "Marks school active",     color: palette.brand,   bg: palette.brandSoft },
  school_exit:  { label: "Marks school concluded",  color: palette.warning, bg: palette.warningSoft },
  none:         { label: "Standard attendance",     color: palette.inkSoft, bg: palette.surfaceMuted },
};

// ── ScheduleScreen ────────────────────────────────────────────────────────────

export function ScheduleScreen() {
  const { data, isLoading } = useTeacherDashboard();
  const teacherName   = useTeacherSessionStore((s) => s.teacherName);
  const schoolName    = useTeacherSessionStore((s) => s.schoolName);
  const activeSessionId = useTeacherSessionStore((s) => s.activeSessionId);
  const selectSession   = useTeacherSessionStore((s) => s.selectSession);
  const isFirstWeek     = useTeacherSessionStore((s) => s.isFirstWeek);
  const completeSetup   = useTeacherSessionStore((s) => s.completeFirstWeekSetup);
  const setManualOverride = useTeacherSessionStore((s) => s.setManualClassOverride);

  // ── Class picker state ─────────────────────────────────────────────────
  const [pickerVisible, setPickerVisible]   = useState(false);

  // ── First-week setup state ─────────────────────────────────────────────
  const [setupVisible, setSetupVisible]         = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [savingSetup, setSavingSetup]           = useState(false);

  const { data: classrooms = [] } = useClassrooms();
  const savePreferences           = useSaveSchedulePreferences();

  if (isLoading || !data) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading schedule…</Text>
        </View>
      </Screen>
    );
  }

  const presentCount = data.roster?.filter((s: any) => s.isPresent).length ?? 0;
  const totalCount   = data.roster?.length ?? 0;

  // ── Handlers ──────────────────────────────────────────────────────────

  /** Called when the teacher picks a classroom via the class-picker modal. */
  const handlePickClass = (classroom: Classroom) => {
    // Store the override label so SessionScreen shows the correct classroom name.
    setManualOverride(classroom.label);
    setPickerVisible(false);
  };

  /** Toggle a classroom selection during first-week setup. */
  const toggleClassSelection = (id: number) =>
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  /** Save the first-week classroom selections to the backend. */
  const handleSaveSetup = async () => {
    if (selectedClassIds.length === 0) return;
    setSavingSetup(true);
    try {
      const prefs = await savePreferences.mutateAsync(selectedClassIds);
      completeSetup(prefs);
      setSetupVisible(false);
    } finally {
      setSavingSetup(false);
    }
  };

  return (
    <Screen>
      {/* ── Greeting block ───────────────────────────────────────────────── */}
      <View style={styles.greeting}>
        <Avatar name={teacherName} size={44} />
        <View style={styles.greetingText}>
          <Text style={styles.greetingName}>{teacherName}</Text>
          <Text style={styles.greetingSchool}>{schoolName}</Text>
        </View>
      </View>

      {/* ── Today's summary strip ────────────────────────────────────────── */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{data.schedule?.length ?? 0}</Text>
          <Text style={styles.summaryLabel}>Classes today</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: palette.success }]}>{presentCount}</Text>
          <Text style={styles.summaryLabel}>Present so far</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: palette.warning }]}>
            {totalCount - presentCount}
          </Text>
          <Text style={styles.summaryLabel}>Unmarked</Text>
        </View>
      </View>

      {/* ── First-week setup banner ──────────────────────────────────────── */}
      {/* Shown only when the teacher hasn't set schedule preferences yet.   */}
      {isFirstWeek && (
        <TouchableOpacity activeOpacity={0.88} onPress={() => setSetupVisible(true)}>
          <View style={styles.firstWeekBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.firstWeekTitle}>👋 Set up your weekly schedule</Text>
              <Text style={styles.firstWeekSub}>
                Select the classes you teach this week. The system will remember
                these and auto-fill your schedule from next week onwards.
              </Text>
            </View>
            <Text style={styles.firstWeekArrow}>→</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Schedule section header + class-picker trigger ───────────────── */}
      <View style={styles.scheduleHeader}>
        <View>
          <Text style={styles.scheduleSectionTitle}>Today's Schedule</Text>
          <Text style={styles.scheduleSectionSub}>Current class is pinned to the top</Text>
        </View>
        {/* Button lets teacher override with a verbally assigned class */}
        <TouchableOpacity style={styles.pickClassBtn} onPress={() => setPickerVisible(true)}>
          <Text style={styles.pickClassBtnText}>+ Pick a class</Text>
        </TouchableOpacity>
      </View>

      {/* ── Session cards ────────────────────────────────────────────────── */}
      {data.schedule?.map((session: any) => {
        const meta       = BOUNDARY_META[session.attendanceBoundary] ?? BOUNDARY_META.none;
        const isSelected = activeSessionId === session.id;
        return (
          <TouchableOpacity
            key={session.id}
            activeOpacity={0.84}
            onPress={() => {
              // Selecting a scheduled session clears any manual override
              setManualOverride(null);
              selectSession(session.id);
            }}
          >
            <Card
              accentColor={session.isCurrent ? palette.brand : undefined}
              style={[styles.sessionCard, isSelected && styles.sessionCardSelected]}
            >
              <View style={styles.sessionHeader}>
                <View style={styles.sessionLeft}>
                  <View style={styles.sessionTitleRow}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    {session.isCurrent && (
                      <View style={styles.liveChip}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>Now</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sessionClassroom}>{session.classroomLabel}</Text>
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeText}>{session.startsAt}</Text>
                  <Text style={styles.timeSep}>–</Text>
                  <Text style={styles.timeText}>{session.endsAt}</Text>
                </View>
              </View>

              <View style={styles.sessionFooter}>
                <View style={[styles.boundaryBadge, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.boundaryText, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <Text style={styles.tapHint}>
                  {isSelected ? "✓ Selected for attendance" : "Tap to open"}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        );
      })}

      {/* ── Class picker modal ───────────────────────────────────────────── */}
      <ClassPickerModal
        visible={pickerVisible}
        classrooms={classrooms}
        onPick={handlePickClass}
        onClose={() => setPickerVisible(false)}
      />

      {/* ── First-week setup modal ────────────────────────────────────────── */}
      <FirstWeekSetupModal
        visible={setupVisible}
        classrooms={classrooms}
        selectedIds={selectedClassIds}
        onToggle={toggleClassSelection}
        onSave={handleSaveSetup}
        onClose={() => setSetupVisible(false)}
        saving={savingSetup}
      />
    </Screen>
  );
}

// ── ClassPickerModal ──────────────────────────────────────────────────────────

type ClassPickerProps = {
  visible: boolean;
  classrooms: Classroom[];
  onPick: (c: Classroom) => void;
  onClose: () => void;
};

function ClassPickerModal({ visible, classrooms, onPick, onClose }: ClassPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />

      <View style={styles.pickerSheet}>
        {/* Header */}
        <View style={styles.pickerHeader}>
          <View>
            <Text style={styles.pickerTitle}>Pick a Different Class</Text>
            <Text style={styles.pickerSubtitle}>
              Overrides your scheduled class for this session.
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Classroom list */}
        <FlatList
          data={classrooms}
          keyExtractor={(item) => String(item.id)}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.classroomRow} onPress={() => onPick(item)}>
              <View style={styles.classroomAvatar}>
                <Text style={styles.classroomAvatarText}>{item.label.replace("Class ", "")}</Text>
              </View>
              <View style={styles.classroomMeta}>
                <Text style={styles.classroomLabel}>{item.label}</Text>
                <Text style={styles.classroomSection}>Section {item.section}</Text>
              </View>
              <Text style={styles.classroomArrow}>→</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

// ── FirstWeekSetupModal ───────────────────────────────────────────────────────

type FirstWeekSetupProps = {
  visible: boolean;
  classrooms: Classroom[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
};

function FirstWeekSetupModal({
  visible, classrooms, selectedIds, onToggle, onSave, onClose, saving,
}: FirstWeekSetupProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />

      <View style={[styles.pickerSheet, { paddingBottom: 40 }]}>
        {/* Header */}
        <View style={styles.pickerHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pickerTitle}>Your Classes This Week</Text>
            <Text style={styles.pickerSubtitle}>
              Select every class you teach. Skippo will remember these and
              auto-populate your schedule from next week onwards.
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Classroom multi-select list */}
        <FlatList
          data={classrooms}
          keyExtractor={(item) => String(item.id)}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const selected = selectedIds.includes(item.id);
            return (
              <TouchableOpacity style={styles.classroomRow} onPress={() => onToggle(item.id)}>
                <View style={[styles.classroomAvatar, selected && styles.classroomAvatarSelected]}>
                  <Text style={[styles.classroomAvatarText, selected && { color: "#fff" }]}>
                    {item.label.replace("Class ", "")}
                  </Text>
                </View>
                <View style={styles.classroomMeta}>
                  <Text style={styles.classroomLabel}>{item.label}</Text>
                  <Text style={styles.classroomSection}>Section {item.section}</Text>
                </View>
                {/* Checkmark when selected */}
                {selected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          style={{ maxHeight: 320 }}
        />

        {/* Save action */}
        <View style={styles.setupActions}>
          <Text style={styles.setupCount}>
            {selectedIds.length} class{selectedIds.length !== 1 ? "es" : ""} selected
          </Text>
          <PrimaryButton
            label={saving ? "Saving…" : "Save my schedule"}
            variant="primary"
            size="sm"
            onPress={onSave}
            loading={saving}
            disabled={selectedIds.length === 0}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loading:     { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  loadingText: { color: palette.inkSoft, fontSize: 15 },

  // Greeting
  greeting:       { flexDirection: "row", alignItems: "center", gap: spacing.md },
  greetingText:   { gap: 2 },
  greetingName:   { fontSize: 18, fontWeight: "800", color: palette.ink },
  greetingSchool: { fontSize: 12, color: palette.inkSoft, fontWeight: "500" },

  // Summary strip
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
  summaryValue: { fontSize: 26, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  summaryLabel: {
    fontSize: 10, fontWeight: "600", color: palette.inkSoft,
    textTransform: "uppercase", letterSpacing: 0.4, textAlign: "center",
  },

  // First-week banner
  firstWeekBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.brandSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.brand,
    padding: spacing.md,
    gap: spacing.sm,
  },
  firstWeekTitle: { fontSize: 14, fontWeight: "800", color: palette.brandDeep },
  firstWeekSub:   { fontSize: 12, color: palette.inkSoft, marginTop: 2, lineHeight: 17 },
  firstWeekArrow: { fontSize: 18, color: palette.brand, fontWeight: "700" },

  // Schedule section header
  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  scheduleSectionTitle: { fontSize: 14, fontWeight: "800", color: palette.ink },
  scheduleSectionSub:   { fontSize: 11, color: palette.inkSoft, marginTop: 1 },
  pickClassBtn: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.stroke,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  pickClassBtnText: { fontSize: 13, fontWeight: "700", color: palette.brand },

  // Session cards
  sessionCard:         { paddingLeft: spacing.md + 4 },
  sessionCardSelected: { borderColor: palette.brand, backgroundColor: "#fafdfb" },
  sessionHeader:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  sessionLeft:         { flex: 1, gap: 3 },
  sessionTitleRow:     { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  sessionTitle:        { fontSize: 16, fontWeight: "800", color: palette.ink },
  liveChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: palette.brandSoft,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full,
  },
  liveDot:         { width: 5, height: 5, borderRadius: radius.full, backgroundColor: palette.brand },
  liveText:        { fontSize: 10, fontWeight: "800", color: palette.brand },
  sessionClassroom:{ fontSize: 12, color: palette.inkSoft, fontWeight: "500" },
  timeBlock:       { alignItems: "flex-end", gap: 1 },
  timeText:        { fontSize: 14, fontWeight: "700", color: palette.ink },
  timeSep:         { fontSize: 10, color: palette.inkDim },
  sessionFooter:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  boundaryBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  boundaryText:    { fontSize: 11, fontWeight: "700" },
  tapHint:         { fontSize: 11, color: palette.inkDim, fontWeight: "500" },

  // Modal shared
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  modalClose:    { padding: spacing.xs },
  modalCloseText:{ fontSize: 16, color: palette.inkSoft, fontWeight: "700" },

  // Class picker / first-week setup sheet
  pickerSheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  pickerHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  pickerTitle:     { fontSize: 17, fontWeight: "800", color: palette.ink },
  pickerSubtitle:  { fontSize: 12, color: palette.inkSoft, marginTop: 2 },

  // Classroom row inside pickers
  classroomRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingVertical: spacing.md,
  },
  classroomAvatar: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: palette.surfaceMuted,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: palette.stroke,
  },
  classroomAvatarSelected: { backgroundColor: palette.brand, borderColor: palette.brand },
  classroomAvatarText: { fontSize: 12, fontWeight: "800", color: palette.ink },
  classroomMeta:       { flex: 1 },
  classroomLabel:      { fontSize: 15, fontWeight: "700", color: palette.ink },
  classroomSection:    { fontSize: 12, color: palette.inkSoft, marginTop: 1 },
  classroomArrow:      { fontSize: 16, color: palette.inkSoft },

  // Checkmark for selected classrooms in first-week setup
  checkmark:     { width: 24, height: 24, borderRadius: 12, backgroundColor: palette.success, alignItems: "center", justifyContent: "center" },
  checkmarkText: { fontSize: 12, fontWeight: "900", color: "#fff" },

  separator: { height: 1, backgroundColor: palette.stroke },

  // First-week setup save actions
  setupActions: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm },
  setupCount:   { fontSize: 13, fontWeight: "700", color: palette.inkSoft },
});
