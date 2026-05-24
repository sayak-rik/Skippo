import {
  AlertCircle,
  CheckCircle2,
  MapPin,
  QrCode,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Screen } from "../components/Screen";
import { useDriverActions, useDriverDashboard } from "../hooks/useDriverDashboard";
import { api } from "../lib/api";
import { useDriverSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

type RemoveState = { studentId: number; studentName: string } | null;

export function RosterScreen({ navigation }: { navigation?: any }) {
  const { data, refetch } = useDriverDashboard();
  const actions = useDriverActions();
  const driverId = useDriverSessionStore((s) => s.driverId);

  const [removeTarget, setRemoveTarget] = useState<RemoveState>(null);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [parentHint, setParentHint] = useState("");
  const [removing, setRemoving] = useState(false);

  if (!data) return null;

  async function requestRemoval(studentId: number, studentName: string) {
    setRemoveTarget({ studentId, studentName });
    setOtpStep(false);
    setOtp("");
  }

  async function sendRemovalOtp() {
    if (!removeTarget || !driverId) return;
    setRemoving(true);
    try {
      const { data: res } = await api.post(
        `/api/transport/driver/students/${removeTarget.studentId}/request-remove/`,
        { driver_id: driverId },
      );
      setParentHint(res.parent_phone_hint ?? "");
      setOtpStep(true);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail ?? "Failed to send OTP.");
    } finally {
      setRemoving(false);
    }
  }

  async function confirmRemoval() {
    if (!removeTarget || !otp.trim()) return;
    setRemoving(true);
    try {
      await api.post(
        `/api/transport/driver/students/${removeTarget.studentId}/confirm-remove/`,
        { parent_id: parentId, code: otp.trim() },
      );
      Alert.alert("Removed", `${removeTarget.studentName} has been removed from the bus.`);
      setRemoveTarget(null);
      setOtpStep(false);
      refetch?.();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail ?? "Incorrect OTP or request expired.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <Screen>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Student Roster</Text>
            <Text style={styles.subtitle}>
              {data.students.length} students · {data.trip.routeName}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.qrBtn}
            onPress={() => navigation?.navigate?.("QRScan")}
            activeOpacity={0.8}
          >
            <QrCode size={18} color="#fff" strokeWidth={2} />
            <Text style={styles.qrBtnText}>Add via QR</Text>
          </TouchableOpacity>
        </View>

        {data.students.length === 0 && (
          <View style={styles.emptyState}>
            <UserX size={40} color={palette.inkFaint} strokeWidth={1.5} />
            <Text style={styles.emptyText}>No students on this roster yet.</Text>
            <Text style={styles.emptySub}>Scan a student QR to add them.</Text>
          </View>
        )}

        {data.students.map((student) => (
          <View key={student.id} style={styles.studentCard}>
            {/* Top row */}
            <View style={styles.cardTop}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{student.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{student.name}</Text>
                <View style={styles.stopRow}>
                  <MapPin size={11} color={palette.inkSoft} strokeWidth={2} />
                  <Text style={styles.stopName}>{student.stopName}</Text>
                </View>
              </View>
              <StatusChip status={student.status} />
            </View>

            {/* Custom stop badge */}
            {student.hasStopOverride && (
              <View style={styles.overrideBadge}>
                <MapPin size={11} color={palette.brand} strokeWidth={2} />
                <Text style={styles.overrideText}>Parent set a custom stop</Text>
              </View>
            )}

            {/* Action row */}
            <View style={styles.actionRow}>
              {student.status === "absent" && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.boardBtn]}
                  onPress={() => actions.boardStudent.mutate({ tripId: data.trip.id, studentId: student.id })}
                  activeOpacity={0.8}
                >
                  <UserCheck size={15} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.actionBtnText}>Board</Text>
                </TouchableOpacity>
              )}
              {student.status === "boarded" && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.dropBtn]}
                  onPress={() => actions.dropStudent.mutate({ tripId: data.trip.id, studentId: student.id })}
                  activeOpacity={0.8}
                >
                  <CheckCircle2 size={15} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.actionBtnText}>Drop off</Text>
                </TouchableOpacity>
              )}
              {student.status === "dropped" && (
                <View style={[styles.actionBtn, styles.doneBtn]}>
                  <CheckCircle2 size={15} color={palette.success} strokeWidth={2.5} />
                  <Text style={[styles.actionBtnText, { color: palette.success }]}>Dropped</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, styles.removeBtn]}
                onPress={() => requestRemoval(student.id, student.name)}
                activeOpacity={0.8}
              >
                <Trash2 size={14} color={palette.danger} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </Screen>

      {/* ── Remove confirmation modal ─────────────────────────────── */}
      <Modal
        visible={!!removeTarget}
        animationType="slide"
        transparent
        onRequestClose={() => { setRemoveTarget(null); setOtpStep(false); }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {!otpStep ? (
              <>
                <AlertCircle size={36} color={palette.danger} strokeWidth={1.5} />
                <Text style={styles.modalTitle}>Remove Student?</Text>
                <Text style={styles.modalBody}>
                  Removing <Text style={{ fontWeight: "800" }}>{removeTarget?.studentName}</Text> from
                  this bus requires parent approval.{"\n\n"}An OTP will be sent to the parent's
                  registered phone number to confirm this action.
                </Text>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnDanger, removing && styles.btnDisabled]}
                  onPress={sendRemovalOtp}
                  disabled={removing}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalBtnText}>{removing ? "Sending OTP…" : "Send OTP to Parent"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setRemoveTarget(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <CheckCircle2 size={36} color={palette.brand} strokeWidth={1.5} />
                <Text style={styles.modalTitle}>Enter Parent OTP</Text>
                <Text style={styles.modalBody}>
                  An OTP was sent to the parent's phone ending in{" "}
                  <Text style={{ fontWeight: "800" }}>····{parentHint}</Text>.{"\n"}
                  Ask the parent to share the code with you.
                </Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="6-digit OTP"
                  placeholderTextColor={palette.inkFaint}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[styles.modalBtn, !otp.trim() && styles.btnDisabled, removing && styles.btnDisabled]}
                  onPress={confirmRemoval}
                  disabled={!otp.trim() || removing}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalBtnText}>{removing ? "Confirming…" : "Confirm Removal"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => { setRemoveTarget(null); setOtpStep(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

function StatusChip({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    absent:  { label: "Absent",   bg: "#FFF8E1", color: palette.warning },
    boarded: { label: "Boarded",  bg: "#F0FDF4", color: palette.success },
    dropped: { label: "Dropped",  bg: palette.surfaceMuted, color: palette.inkSoft },
  };
  const c = config[status] ?? config.absent;
  return (
    <View style={[styles.statusChip, { backgroundColor: c.bg }]}>
      <Text style={[styles.statusChipText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  title: { fontSize: 22, fontWeight: "800", color: palette.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: palette.inkSoft, marginTop: 2 },
  qrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.brand,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: palette.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  qrBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  emptyState: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl * 2,
  },
  emptyText: { fontSize: 16, fontWeight: "700", color: palette.inkSoft },
  emptySub: { fontSize: 13, color: palette.inkFaint },
  studentCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: "#4449CC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.brandSoft,
    borderWidth: 1,
    borderColor: palette.brandMid,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 17, fontWeight: "800", color: palette.brand },
  studentName: { fontSize: 15, fontWeight: "800", color: palette.ink, letterSpacing: -0.2 },
  stopRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  stopName: { fontSize: 12, color: palette.inkSoft },
  statusChip: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipText: { fontSize: 11, fontWeight: "700" },
  overrideBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.brandSoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: palette.brandMid,
  },
  overrideText: { fontSize: 12, fontWeight: "600", color: palette.brand },
  actionRow: { flexDirection: "row", gap: spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 12,
    paddingVertical: 10,
  },
  boardBtn: { backgroundColor: palette.brand },
  dropBtn: { backgroundColor: palette.accent },
  doneBtn: { backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: "#A7F3D0" },
  removeBtn: {
    flex: 0,
    width: 40,
    backgroundColor: palette.dangerSoft,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  actionBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: "center",
    paddingBottom: 48,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: palette.stroke,
    marginBottom: spacing.sm,
  },
  modalTitle: { fontSize: 20, fontWeight: "900", color: palette.ink, letterSpacing: -0.3 },
  modalBody: {
    fontSize: 14,
    color: palette.inkSoft,
    textAlign: "center",
    lineHeight: 22,
  },
  modalBtn: {
    backgroundColor: palette.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignSelf: "stretch",
    alignItems: "center",
    shadowColor: palette.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalBtnDanger: { backgroundColor: palette.danger },
  modalBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  modalCancelBtn: { paddingVertical: spacing.sm, alignSelf: "stretch", alignItems: "center" },
  modalCancelText: { color: palette.inkSoft, fontWeight: "600", fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
  otpInput: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.stroke,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: "700",
    color: palette.ink,
    textAlign: "center",
    alignSelf: "stretch",
    letterSpacing: 6,
  },
});
