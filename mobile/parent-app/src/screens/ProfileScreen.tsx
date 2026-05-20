// ---------------------------------------------------------------------------
// ProfileScreen – parent account details + bus change + stop edit (req 3, 4, 7).
//
// Sections:
//   - Child info (name, grade, current route)
//   - Change bus (opens bus picker modal)  (req 3)
//   - Edit pickup stop (opens stop edit modal)  (req 7)
//   - Driver contact (req 4)
//   - Linked services
//   - Logout
// ---------------------------------------------------------------------------

import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useState } from "react";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useAvailableRoutes, useDriverContact, useParentActions, useParentDashboard } from "../hooks/useParentDashboard";
import { useSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";
import { RouteOption } from "../types";
export function ProfileScreen() {
  const { data } = useParentDashboard();
  const logout = useSessionStore((s) => s.logout);
  const setSelectedRoute = useSessionStore((s) => s.setSelectedRoute);
  const { data: driverContact } = useDriverContact();
  const { data: routes = [] } = useAvailableRoutes();
  const { changeBus, updateStop } = useParentActions();

  // Bus picker modal (req 3)
  const [busModalOpen, setBusModalOpen] = useState(false);
  const [pendingRouteId, setPendingRouteId] = useState<number | null>(null);

  // Stop edit modal (req 7)
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [newStopName, setNewStopName] = useState("");

  if (!data) return null;
  const { student } = data;

  // ── Bus change handlers ───────────────────────────────────────────────────

  async function handleChangeBus() {
    if (!pendingRouteId) return;
    try {
      await changeBus.mutateAsync(pendingRouteId);
      setSelectedRoute(pendingRouteId);
      setBusModalOpen(false);
      Alert.alert("Bus updated", "Your child's bus assignment has been updated.");
    } catch {
      Alert.alert("Error", "Could not update the bus. Please try again.");
    }
  }

  // ── Stop edit handlers ────────────────────────────────────────────────────

  async function handleSaveStop() {
    if (!newStopName.trim()) {
      Alert.alert("Missing field", "Please enter a stop name.");
      return;
    }
    try {
      await updateStop.mutateAsync({
        studentId: student.id,
        stopName: newStopName.trim(),
        latitude: 0,
        longitude: 0,
      });
      setStopModalOpen(false);
      Alert.alert("Stop updated", `Pickup stop changed to "${newStopName.trim()}".`);
    } catch {
      Alert.alert("Error", "Could not update the stop. Please try again.");
    }
  }

  return (
    <Screen>
      <SectionTitle title="My Profile" subtitle="Account and transport settings" />

      {/* ── Child info ───────────────────────────────────────────────── */}
      <InfoCard title="Child" subtitle={student.grade}>
        <Text style={styles.detail}>{student.name}</Text>
        <Text style={styles.detail}>{student.routeName}</Text>
        <View style={styles.stopRow}>
          <Text style={styles.detail}>{student.stopName}</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => { setNewStopName(student.stopName); setStopModalOpen(true); }}
            activeOpacity={0.8}
          >
            <Text style={styles.editBtnText}>Edit stop</Text>
          </TouchableOpacity>
        </View>
      </InfoCard>

      {/* ── Change bus (req 3) ───────────────────────────────────────── */}
      <InfoCard title="Bus assignment" subtitle="Assigned route">
        <Text style={styles.detail}>{student.routeName}</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => { setPendingRouteId(null); setBusModalOpen(true); }}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>Change bus route</Text>
        </TouchableOpacity>
      </InfoCard>

      {/* ── Driver contact (req 4) ─────────────────────────────────── */}
      {driverContact && (
        <InfoCard title="Current trip driver" subtitle={driverContact.vehicleLabel}>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>
                {driverContact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driverContact.name}</Text>
              <Text style={styles.detail}>{driverContact.phone}</Text>
            </View>
          </View>
        </InfoCard>
      )}

      {/* ── Linked services ──────────────────────────────────────────── */}
      <InfoCard title="Linked services" subtitle="All active">
        {["Live transport tracking", "Teacher progress feed", "Message centre"].map((s) => (
          <View key={s} style={styles.serviceRow}>
            <Text style={styles.serviceCheck}>✓</Text>
            <Text style={styles.serviceText}>{s}</Text>
          </View>
        ))}
      </InfoCard>

      {/* ── Logout ───────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      {/* ── Bus picker modal (req 3) ──────────────────────────────────── */}
      <Modal visible={busModalOpen} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Change bus route</Text>
            <Text style={styles.sheetSub}>Select the bus your child will travel in.</Text>
            <FlatList
              data={routes}
              keyExtractor={(r) => String(r.id)}
              ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
              renderItem={({ item }: { item: RouteOption }) => {
                const active = pendingRouteId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.routeRow, active && styles.routeRowActive]}
                    onPress={() => setPendingRouteId(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.routeName, active && { color: palette.brandDeep }]}>
                        {item.busLabel} · {item.name}
                      </Text>
                      <Text style={styles.routeDriver}>Driver: {item.driverName}</Text>
                    </View>
                    {active && <Text style={{ color: palette.brand, fontSize: 18, fontWeight: "900" }}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setBusModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, !pendingRouteId && styles.btnDisabled]}
                onPress={handleChangeBus}
                disabled={!pendingRouteId}
              >
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Stop edit modal (req 7) ────────────────────────────────────── */}
      <Modal visible={stopModalOpen} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Edit pickup stop</Text>
            <Text style={styles.sheetSub}>
              Enter the stop name. The driver will see this on their roster immediately.
            </Text>
            <Text style={styles.inputLabel}>Stop name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Green Park Gate"
              placeholderTextColor={palette.inkSoft}
              value={newStopName}
              onChangeText={setNewStopName}
              autoCapitalize="words"
            />
            <View style={styles.sheetBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setStopModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveStop}>
                <Text style={styles.confirmBtnText}>Save stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  detail: { fontSize: 14, color: palette.inkSoft, lineHeight: 22 },
  stopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: palette.brandSoft,
  },
  editBtnText: { fontSize: 12, fontWeight: "700", color: palette.brandDeep },
  actionBtn: {
    marginTop: spacing.sm,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: palette.brand,
    alignItems: "center",
  },
  actionBtnText: { fontSize: 14, fontWeight: "700", color: palette.brand },
  driverRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  driverAvatarText: { fontSize: 15, fontWeight: "900", color: palette.brandDeep },
  driverName: { fontSize: 15, fontWeight: "800", color: palette.ink },
  serviceRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  serviceCheck: { fontSize: 14, color: palette.success, fontWeight: "900" },
  serviceText: { fontSize: 14, color: palette.inkSoft },
  logoutBtn: {
    backgroundColor: palette.ink,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 16,
    marginBottom: spacing.xl,
  },
  logoutText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  sheetTitle: { fontSize: 20, fontWeight: "900", color: palette.ink },
  sheetSub: { fontSize: 13, color: palette.inkSoft, marginTop: -spacing.sm },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.stroke,
    backgroundColor: palette.surfaceMuted,
  },
  routeRowActive: { borderColor: palette.brand, backgroundColor: palette.brandSoft },
  routeName: { fontSize: 14, fontWeight: "800", color: palette.ink },
  routeDriver: { fontSize: 12, color: palette.inkSoft, marginTop: 2 },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: palette.ink,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  sheetBtns: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.stroke,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "700", color: palette.inkSoft },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: palette.brand,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  confirmBtnText: { fontSize: 14, fontWeight: "800", color: "#fff" },
});
