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
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { useClassrooms, useSaveSchedulePreferences } from "../hooks/useTeacherDashboard";
import { useTeacherDashboard } from "../hooks/useTeacherDashboard";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { radius, spacing } from "../theme/spacing";
import { Classroom } from "../types";

// ── Subject colour map ────────────────────────────────────────────────────────
// Each session card picks a colour based on a hash of its title string.

const SUBJECT_COLORS = [
  { bg: "#fff7ed", accent: "#fb923c", text: "#9a3412" },
  { bg: "#eff6ff", accent: "#60a5fa", text: "#1e40af" },
  { bg: "#f0fdf4", accent: "#4ade80", text: "#166534" },
  { bg: "#fdf4ff", accent: "#c084fc", text: "#7e22ce" },
  { bg: "#fdf2f8", accent: "#f472b6", text: "#9d174d" },
  { bg: "#fefce8", accent: "#facc15", text: "#854d0e" },
  { bg: "#ecfeff", accent: "#22d3ee", text: "#155e75" },
  { bg: "#f0fdfa", accent: "#2dd4bf", text: "#134e4a" },
];

function getSubjectColor(title: string) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) & 0xffff;
  return SUBJECT_COLORS[h % SUBJECT_COLORS.length];
}

// ── ScheduleScreen ────────────────────────────────────────────────────────────

export function ScheduleScreen() {
  const { data, isLoading } = useTeacherDashboard();
  const teacherName       = useTeacherSessionStore((s) => s.teacherName);
  const schoolName        = useTeacherSessionStore((s) => s.schoolName);
  const activeSessionId   = useTeacherSessionStore((s) => s.activeSessionId);
  const selectSession     = useTeacherSessionStore((s) => s.selectSession);
  const isFirstWeek       = useTeacherSessionStore((s) => s.isFirstWeek);
  const completeSetup     = useTeacherSessionStore((s) => s.completeFirstWeekSetup);
  const setManualOverride = useTeacherSessionStore((s) => s.setManualClassOverride);

  const [pickerVisible, setPickerVisible]       = useState(false);
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

  // Time-of-day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });

  const handlePickClass = (classroom: Classroom) => {
    setManualOverride(classroom.label);
    setPickerVisible(false);
  };

  const toggleClassSelection = (id: number) =>
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

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
      {/* ── Header banner (breaks out of padding for full-width effect) ──── */}
      <View style={styles.headerBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerDateLabel}>{dateLabel.toUpperCase()}</Text>
          <Text style={styles.headerGreeting}>{greeting},</Text>
          <Text style={styles.headerName}>{teacherName.split(" ")[0]}</Text>
          <Text style={styles.headerSchool}>{schoolName}</Text>
        </View>
        <Avatar name={teacherName} size={56} style={styles.headerAvatar} />
      </View>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <View style={[styles.statsCard, { backgroundColor: "#eff6ff" }]}>
          <Text style={[styles.statsValue, { color: "#1e40af" }]}>{data.schedule?.length ?? 0}</Text>
          <Text style={[styles.statsLabel, { color: "#1e40af" }]}>Classes</Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: "#f0fdf4" }]}>
          <Text style={[styles.statsValue, { color: "#166534" }]}>{presentCount}</Text>
          <Text style={[styles.statsLabel, { color: "#166534" }]}>Present</Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: "#fefce8" }]}>
          <Text style={[styles.statsValue, { color: "#854d0e" }]}>{totalCount - presentCount}</Text>
          <Text style={[styles.statsLabel, { color: "#854d0e" }]}>Unmarked</Text>
        </View>
      </View>

      {/* ── First-week setup banner ───────────────────────────────────────── */}
      {isFirstWeek && (
        <TouchableOpacity activeOpacity={0.88} onPress={() => setSetupVisible(true)}>
          <View style={styles.firstWeekBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.firstWeekTitle}>👋 Set up your weekly schedule</Text>
              <Text style={styles.firstWeekSub}>
                Select the classes you teach this week. Skippo will auto-fill your schedule from next week.
              </Text>
            </View>
            <Text style={styles.firstWeekArrow}>→</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Schedule section header ───────────────────────────────────────── */}
      <View style={styles.scheduleHeader}>
        <View>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Text style={styles.sectionSub}>Tap a session to open attendance</Text>
        </View>
        <TouchableOpacity style={styles.pickClassBtn} onPress={() => setPickerVisible(true)}>
          <Text style={styles.pickClassBtnText}>+ Pick a class</Text>
        </TouchableOpacity>
      </View>

      {/* ── Timeline sessions ─────────────────────────────────────────────── */}
      {(data.schedule ?? []).length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No sessions today</Text>
          <Text style={styles.emptySub}>Your schedule for today is clear.</Text>
        </View>
      ) : (
        (data.schedule ?? []).map((session: any, index: number) => {
          const col        = getSubjectColor(session.title);
          const isSelected = activeSessionId === session.id;
          const isLast     = index === (data.schedule?.length ?? 0) - 1;
          return (
            <View key={session.id} style={styles.timelineRow}>
              {/* Time marker + connecting line */}
              <View style={styles.timelineLeft}>
                <Text style={styles.timelineTime}>{session.startsAt}</Text>
                <View style={[styles.timelineDot, { backgroundColor: session.isCurrent ? col.accent : palette.strokeStrong }]} />
                {!isLast && <View style={[styles.timelineConnector, { backgroundColor: col.accent + "30" }]} />}
              </View>

              {/* Session card */}
              <TouchableOpacity
                activeOpacity={0.84}
                style={[
                  styles.timelineCard,
                  { backgroundColor: col.bg, borderColor: isSelected ? col.accent : col.accent + "50" },
                  isSelected && styles.timelineCardSelected,
                ]}
                onPress={() => {
                  setManualOverride(null);
                  selectSession(session.id);
                }}
              >
                <View style={styles.timelineCardTop}>
                  <Text style={[styles.timelineCardSubject, { color: col.text }]} numberOfLines={1}>
                    {session.title}
                  </Text>
                  {session.isCurrent && (
                    <View style={[styles.liveChip, { backgroundColor: col.accent + "25" }]}>
                      <View style={[styles.liveDot, { backgroundColor: col.accent }]} />
                      <Text style={[styles.liveText, { color: col.text }]}>Now</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.timelineCardRoom, { color: col.text + "aa" }]}>
                  {session.classroomLabel}
                </Text>
                <View style={styles.timelineCardFooter}>
                  <View style={[styles.timePill, { backgroundColor: col.accent + "25" }]}>
                    <Text style={[styles.timePillText, { color: col.text }]}>
                      {session.startsAt} – {session.endsAt}
                    </Text>
                  </View>
                  {isSelected && (
                    <Text style={[styles.selectedTag, { color: col.text }]}>✓ Selected</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      {/* ── Class picker modal ────────────────────────────────────────────── */}
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
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.pickerSheet}>
        <View style={styles.pickerHeader}>
          <View>
            <Text style={styles.pickerTitle}>Pick a Different Class</Text>
            <Text style={styles.pickerSubtitle}>Overrides your scheduled class for this session.</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
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
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.pickerSheet, { paddingBottom: 40 }]}>
        <View style={styles.pickerHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pickerTitle}>Your Classes This Week</Text>
            <Text style={styles.pickerSubtitle}>
              Select every class you teach. Skippo will remember these and auto-populate your schedule.
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
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

  // Header banner — negative margins break it out to full width
  headerBanner: {
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    backgroundColor: palette.brand,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + 4,
    paddingBottom: spacing.lg + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerDateLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerGreeting: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  headerName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  headerSchool: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    marginTop: 2,
  },
  headerAvatar: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },

  // Stats strip
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statsCard: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
    alignItems: "center",
  },
  statsValue: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  statsLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  // First-week banner
  firstWeekBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.brandSoft,
    borderRadius: radius.md,
    borderWidth: 1.5,
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
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: palette.ink },
  sectionSub:   { fontSize: 11, color: palette.inkSoft, marginTop: 1 },
  pickClassBtn: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.stroke,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  pickClassBtnText: { fontSize: 12, fontWeight: "700", color: palette.brand },

  // Timeline layout
  timelineRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  timelineLeft: {
    width: 50,
    alignItems: "center",
    paddingTop: 2,
  },
  timelineTime: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.inkDim,
    letterSpacing: 0.3,
    marginBottom: 6,
    textAlign: "center",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    minHeight: 40,
    borderRadius: 1,
  },

  // Session card (right side of timeline)
  timelineCard: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: 5,
    marginBottom: spacing.md,
  },
  timelineCardSelected: {
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  timelineCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  timelineCardSubject: { fontSize: 16, fontWeight: "800", letterSpacing: -0.2, flex: 1 },
  timelineCardRoom:    { fontSize: 12, fontWeight: "600" },
  timelineCardFooter:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  timePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  timePillText: { fontSize: 11, fontWeight: "700" },
  selectedTag:  { fontSize: 11, fontWeight: "800" },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  liveDot:  { width: 5, height: 5, borderRadius: radius.full },
  liveText: { fontSize: 10, fontWeight: "800" },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.lg,
  },
  emptyIcon:  { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: palette.ink },
  emptySub:   { fontSize: 13, color: palette.inkSoft, textAlign: "center" },

  // Modal shared
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  modalClose:    { padding: spacing.xs },
  modalCloseText:{ fontSize: 16, color: palette.inkSoft, fontWeight: "700" },

  // Bottom sheet
  pickerSheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  pickerHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  pickerTitle:    { fontSize: 17, fontWeight: "800", color: palette.ink },
  pickerSubtitle: { fontSize: 12, color: palette.inkSoft, marginTop: 2 },

  // Classroom rows in pickers
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
  classroomMeta:   { flex: 1 },
  classroomLabel:  { fontSize: 15, fontWeight: "700", color: palette.ink },
  classroomSection:{ fontSize: 12, color: palette.inkSoft, marginTop: 1 },
  classroomArrow:  { fontSize: 16, color: palette.inkSoft },
  checkmark:       { width: 24, height: 24, borderRadius: 12, backgroundColor: palette.success, alignItems: "center", justifyContent: "center" },
  checkmarkText:   { fontSize: 12, fontWeight: "900", color: "#fff" },
  separator:       { height: 1, backgroundColor: palette.stroke },
  setupActions:    { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingTop: spacing.sm },
  setupCount:      { fontSize: 13, fontWeight: "700", color: palette.inkSoft },
});
