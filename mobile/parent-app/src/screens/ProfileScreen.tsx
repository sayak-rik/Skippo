// ---------------------------------------------------------------------------
// ProfileScreen – parent account details, children management, transport.
//
// Sections:
//   - Parent avatar + name (editable)
//   - ACCOUNT: name edit, phone change (OTP)
//   - CHILDREN: all linked students + "Add another child" discovery modal
//   - TRANSPORT: per-student bus enrollment + QR onboarding / delist
//   - DRIVER: current driver contact
//   - LINKED SERVICES + LOGOUT
// ---------------------------------------------------------------------------

import { ActivityIndicator, Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
import { Bus, ChevronRight, LogOut, MapPin, Phone, Smartphone, User, X } from "lucide-react-native";

import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import {
  EnrollmentEntry,
  useAvailableRoutes,
  useDriverContact,
  useParentActions,
  useParentEnrollment,
  useParentProfile,
} from "../hooks/useParentDashboard";
import { api } from "../lib/api";
import { useSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";
import { RouteOption } from "../types";

// ── Types ────────────────────────────────────────────────────────────────────

interface ClassroomItem { id: number; name: string; section: string }
interface StudentItem   { id: number; name: string; parent_status: "none" | "pending" | "linked" }

// ── Component ─────────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const logout      = useSessionStore((s) => s.logout);
  const setName     = useSessionStore((s) => s.setName);
  const schoolSlug  = useSessionStore((s) => s.schoolSlug);

  const { data: profile, refetch: refetchProfile } = useParentProfile();
  const { data: driverContact }                    = useDriverContact();
  const { data: routes = [] }                      = useAvailableRoutes();
  const { data: enrollments = [], refetch: refetchEnrollment } = useParentEnrollment();
  const { unenroll }                               = useParentActions();

  // ── Name edit modal ───────────────────────────────────────────────────────
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameInput, setNameInput]         = useState("");
  const [nameSaving, setNameSaving]       = useState(false);
  const [nameError, setNameError]         = useState("");

  // ── Phone change modal ────────────────────────────────────────────────────
  // phase: "input" → enter new number | "otp" → verify code
  const [phoneModalOpen, setPhoneModalOpen]   = useState(false);
  const [phonePhase, setPhonePhase]           = useState<"input" | "otp">("input");
  const [newPhoneInput, setNewPhoneInput]     = useState("");
  const [phoneOtp, setPhoneOtp]               = useState("");
  const [phoneLoading, setPhoneLoading]       = useState(false);
  const [phoneError, setPhoneError]           = useState("");

  // ── Add child modal ───────────────────────────────────────────────────────
  // phase: "class" → pick classroom | "student" → pick student from class
  const [addChildOpen, setAddChildOpen]         = useState(false);
  const [addChildPhase, setAddChildPhase]       = useState<"class" | "student">("class");
  const [classrooms, setClassrooms]             = useState<ClassroomItem[]>([]);
  const [classLoading, setClassLoading]         = useState(false);
  const [addStudents, setAddStudents]           = useState<StudentItem[]>([]);
  const [addStudentLoading, setAddStudentLoading] = useState(false);
  const [addStudentError, setAddStudentError]   = useState("");

  // ── Bus management: QR modal ──────────────────────────────────────────────
  const [qrModalOpen, setQrModalOpen]         = useState(false);
  const [qrTargetStudent, setQrTargetStudent] = useState<EnrollmentEntry | null>(null);
  const [qrImage, setQrImage]                 = useState<string | null>(null);
  const [qrLoading, setQrLoading]             = useState(false);
  const [qrConfirmed, setQrConfirmed]         = useState(false);

  // ── Bus picker modal ──────────────────────────────────────────────────────
  const [busModalOpen, setBusModalOpen]   = useState(false);
  const [pendingRouteId, setPendingRouteId] = useState<number | null>(null);
  const [busSaving, setBusSaving]         = useState(false);

  // ── Stop edit modal ───────────────────────────────────────────────────────
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [newStopName, setNewStopName]     = useState("");
  const [stopStudentId, setStopStudentId] = useState<number | null>(null);

  // ── Poll for driver QR confirmation ──────────────────────────────────────
  useEffect(() => {
    if (!qrModalOpen || qrConfirmed) return;
    const id = setInterval(async () => {
      try {
        const { data } = await api.get("/api/transport/parent/enrollment/");
        if (data.enrollments?.some((e: EnrollmentEntry) => e.driver_confirmed)) {
          setQrConfirmed(true);
          refetchEnrollment();
        }
      } catch {}
    }, 8000);
    return () => clearInterval(id);
  }, [qrModalOpen, qrConfirmed]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleSaveName() {
    const name = nameInput.trim();
    if (!name) { setNameError("Please enter your name."); return; }
    setNameSaving(true);
    setNameError("");
    try {
      await api.patch("/api/auth/parent/profile/", { name });
      setName(name);
      await refetchProfile();
      setNameModalOpen(false);
    } catch (err: any) {
      setNameError(err?.response?.data?.detail ?? "Could not save name.");
    } finally {
      setNameSaving(false);
    }
  }

  async function handleRequestPhoneChange() {
    const phone = newPhoneInput.trim();
    if (!phone) { setPhoneError("Please enter a phone number."); return; }
    setPhoneLoading(true);
    setPhoneError("");
    try {
      await api.post("/api/auth/parent/change-phone/request/", { new_phone: phone });
      setPhonePhase("otp");
    } catch (err: any) {
      setPhoneError(err?.response?.data?.detail ?? "Could not send OTP.");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleConfirmPhoneChange() {
    const code = phoneOtp.trim();
    if (!code) { setPhoneError("Please enter the OTP."); return; }
    setPhoneLoading(true);
    setPhoneError("");
    try {
      await api.post("/api/auth/parent/change-phone/confirm/", {
        new_phone: newPhoneInput.trim(),
        code,
      });
      await refetchProfile();
      setPhoneModalOpen(false);
      setPhonePhase("input");
      setNewPhoneInput("");
      setPhoneOtp("");
    } catch (err: any) {
      setPhoneError(err?.response?.data?.detail ?? "Incorrect code.");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function openAddChild() {
    setAddChildOpen(true);
    setAddChildPhase("class");
    setAddStudentError("");
    setClassLoading(true);
    try {
      const { data } = await api.get(`/api/auth/parent/classrooms/?school_slug=${schoolSlug}`);
      setClassrooms(data.results ?? []);
    } catch {
      Alert.alert("Error", "Could not load classrooms.");
      setAddChildOpen(false);
    } finally {
      setClassLoading(false);
    }
  }

  async function handlePickClass(classroomId: number) {
    setAddStudentLoading(true);
    setAddChildPhase("student");
    setAddStudentError("");
    try {
      const { data } = await api.get(`/api/auth/parent/discovery-students/?classroom_id=${classroomId}`);
      setAddStudents(data.results ?? []);
    } catch {
      Alert.alert("Error", "Could not load students.");
      setAddChildPhase("class");
    } finally {
      setAddStudentLoading(false);
    }
  }

  async function handleAddStudent(studentId: number) {
    setAddStudentLoading(true);
    setAddStudentError("");
    try {
      await api.post("/api/auth/parent/add-student/", { student_id: studentId });
      await refetchProfile();
      setAddChildOpen(false);
    } catch (err: any) {
      setAddStudentError(err?.response?.data?.detail ?? "Could not add student.");
    } finally {
      setAddStudentLoading(false);
    }
  }

  async function openQRModal(studentId: number, entry: EnrollmentEntry | null) {
    setQrImage(null);
    setQrConfirmed(false);
    setQrTargetStudent(entry);
    setQrModalOpen(true);
    setQrLoading(true);
    try {
      const { data } = await api.get(`/api/transport/students/${studentId}/qr/`);
      setQrImage(data.qr_image);
    } catch {
      Alert.alert("Error", "Could not generate QR.");
      setQrModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  }

  function handleUnenroll(entry: EnrollmentEntry) {
    Alert.alert(
      "Remove from bus",
      `Remove ${entry.student_name} from ${entry.bus_label ?? "their bus"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive",
          onPress: async () => {
            try { await unenroll.mutateAsync(entry.student_id); }
            catch { Alert.alert("Error", "Could not remove from bus."); }
          },
        },
      ],
    );
  }

  async function handleSaveBus(studentId: number) {
    if (!pendingRouteId) return;
    setBusSaving(true);
    try {
      await api.post("/api/transport/parent/change-bus/", { routeId: pendingRouteId });
      refetchEnrollment();
      setBusModalOpen(false);
      const entry = enrollments.find(e => e.student_id === studentId) ?? null;
      openQRModal(studentId, entry);
    } catch {
      Alert.alert("Error", "Could not update the bus.");
    } finally {
      setBusSaving(false);
    }
  }

  async function handleSaveStop() {
    if (!newStopName.trim() || !stopStudentId) return;
    try {
      await api.post("/api/transport/parent/update-stop/", {
        studentId: stopStudentId,
        stopName: newStopName.trim(),
        latitude: 0,
        longitude: 0,
      });
      setStopModalOpen(false);
      Alert.alert("Stop updated", `Pickup stop changed to "${newStopName.trim()}".`);
    } catch {
      Alert.alert("Error", "Could not update the stop.");
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const initials = (profile?.name ?? "P")
    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  // ── Render ────────────────────────────────────────────────────────────────

  if (!profile) {
    return (
      <Screen>
        <ActivityIndicator color={palette.brand} style={{ marginTop: spacing.xl }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionTitle title="My Profile" subtitle="Account and transport settings" />

      {/* ── Avatar hero ──────────────────────────────────────────────────── */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <Text style={styles.avatarName}>{profile.name || "—"}</Text>
        <Text style={styles.avatarSub}>{profile.school_name}</Text>
      </View>

      {/* ── ACCOUNT ──────────────────────────────────────────────────────── */}
      <Text style={styles.sectionHeader}>ACCOUNT</Text>
      <View style={styles.card}>
        <SettingsRow
          icon={<User size={18} color={palette.brand} strokeWidth={2} />}
          label="Your name"
          value={profile.name || "Not set"}
          onPress={() => { setNameInput(profile.name); setNameError(""); setNameModalOpen(true); }}
        />
        <RowDivider />
        <SettingsRow
          icon={<Smartphone size={18} color={palette.brand} strokeWidth={2} />}
          label="Mobile number"
          value={profile.phone}
          onPress={() => {
            setPhonePhase("input"); setNewPhoneInput(""); setPhoneOtp("");
            setPhoneError(""); setPhoneModalOpen(true);
          }}
        />
      </View>

      {/* ── CHILDREN ─────────────────────────────────────────────────────── */}
      <Text style={styles.sectionHeader}>CHILDREN</Text>
      <View style={styles.card}>
        {profile.students.map((s, i) => (
          <View key={s.id}>
            <View style={styles.childRow}>
              <View style={styles.childAvatar}>
                <Text style={styles.childAvatarText}>
                  {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.childName}>{s.name}</Text>
                {s.grade ? <Text style={styles.childGrade}>{s.grade}</Text> : null}
              </View>
            </View>
            {i < profile.students.length - 1 && <RowDivider />}
          </View>
        ))}
        {profile.students.length === 0 && (
          <View style={styles.emptyChildren}>
            <Text style={styles.emptyChildrenText}>No children linked yet.</Text>
          </View>
        )}
        <RowDivider />
        <TouchableOpacity style={styles.addChildBtn} onPress={openAddChild} activeOpacity={0.75}>
          <Text style={styles.addChildBtnText}>+ Add another child</Text>
        </TouchableOpacity>
      </View>

      {/* ── TRANSPORT ────────────────────────────────────────────────────── */}
      <Text style={styles.sectionHeader}>TRANSPORT</Text>
      {enrollments.map((entry) => (
        <View key={entry.student_id} style={[styles.card, { marginBottom: spacing.sm }]}>
          <Text style={styles.transportStudentLabel}>{entry.student_name}</Text>
          {entry.route_id ? (
            <>
              <View style={styles.enrolledRow}>
                <Bus size={16} color={palette.brand} strokeWidth={2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.enrolledBusText}>{entry.bus_label} · {entry.route_name}</Text>
                  {entry.driver_name ? (
                    <Text style={styles.enrolledDriverText}>Driver: {entry.driver_name}</Text>
                  ) : null}
                </View>
                {entry.driver_confirmed ? (
                  <View style={styles.confirmedChip}>
                    <Text style={styles.confirmedChipText}>✓ Confirmed</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.qrChip}
                    onPress={() => openQRModal(entry.student_id, entry)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.qrChipText}>Show QR</Text>
                  </TouchableOpacity>
                )}
              </View>
              <RowDivider />
              <SettingsRow
                icon={<ChevronRight size={15} color={palette.inkSoft} strokeWidth={2} />}
                label="Change bus"
                onPress={() => { setPendingRouteId(null); setBusModalOpen(true); }}
              />
              <RowDivider />
              <SettingsRow
                icon={<MapPin size={16} color={palette.brand} strokeWidth={2} />}
                label="Edit pickup stop"
                onPress={() => { setStopStudentId(entry.student_id); setNewStopName(""); setStopModalOpen(true); }}
              />
              <RowDivider />
              <TouchableOpacity style={styles.removeRow} onPress={() => handleUnenroll(entry)} activeOpacity={0.75}>
                <Text style={styles.removeRowText}>Remove from bus</Text>
              </TouchableOpacity>
            </>
          ) : (
            <SettingsRow
              icon={<Bus size={16} color={palette.inkSoft} strokeWidth={2} />}
              label="No bus assigned"
              value="Tap to add"
              onPress={() => { setPendingRouteId(null); setBusModalOpen(true); }}
            />
          )}
        </View>
      ))}
      {enrollments.length === 0 && (
        <View style={styles.card}>
          <SettingsRow
            icon={<Bus size={18} color={palette.brand} strokeWidth={2} />}
            label="Assign a bus"
            value="No bus assigned yet"
            onPress={() => { setPendingRouteId(null); setBusModalOpen(true); }}
          />
        </View>
      )}

      {/* ── DRIVER ───────────────────────────────────────────────────────── */}
      {driverContact?.name ? (
        <>
          <Text style={styles.sectionHeader}>DRIVER</Text>
          <View style={styles.card}>
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>
                  {driverContact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{driverContact.name}</Text>
                <Text style={styles.driverVehicle}>{driverContact.vehicleLabel}</Text>
              </View>
              <View style={styles.phoneChip}>
                <Phone size={13} color={palette.brand} strokeWidth={2.5} />
                <Text style={styles.phoneChipText}>{driverContact.phone}</Text>
              </View>
            </View>
          </View>
        </>
      ) : null}

      {/* ── LINKED SERVICES ──────────────────────────────────────────────── */}
      <Text style={styles.sectionHeader}>LINKED SERVICES</Text>
      <View style={styles.card}>
        {["Live transport tracking", "Teacher progress feed", "Message centre"].map((s, i, arr) => (
          <View key={s}>
            <View style={styles.serviceRow}>
              <View style={styles.serviceCheck}><View style={styles.serviceDot} /></View>
              <Text style={styles.serviceText}>{s}</Text>
              <Text style={styles.serviceActive}>Active</Text>
            </View>
            {i < arr.length - 1 && <RowDivider />}
          </View>
        ))}
      </View>

      {/* ── LOGOUT ───────────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <LogOut size={18} color={palette.danger} strokeWidth={2.5} />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      {/* ════════════════ MODALS ════════════════ */}

      {/* ── Name edit ────────────────────────────────────────────────────── */}
      <Modal visible={nameModalOpen} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <SheetHeader title="Edit your name" onClose={() => setNameModalOpen(false)} />
            <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              placeholder="e.g. Priya Sharma"
              placeholderTextColor={palette.inkSoft}
              autoCapitalize="words"
              value={nameInput}
              onChangeText={(v) => { setNameInput(v); setNameError(""); }}
              autoFocus
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            <SheetButtons
              onCancel={() => setNameModalOpen(false)}
              onConfirm={handleSaveName}
              confirmLabel={nameSaving ? "Saving…" : "Save"}
              disabled={nameSaving}
            />
          </View>
        </View>
      </Modal>

      {/* ── Phone change ─────────────────────────────────────────────────── */}
      <Modal visible={phoneModalOpen} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <SheetHeader
              title={phonePhase === "input" ? "Change mobile number" : "Verify new number"}
              onClose={() => setPhoneModalOpen(false)}
            />
            {phonePhase === "input" ? (
              <>
                <Text style={styles.sheetSub}>
                  Enter your new number. We'll send a verification code to confirm it.
                </Text>
                <TextInput
                  style={[styles.input, phoneError ? styles.inputError : null]}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={palette.inkSoft}
                  keyboardType="phone-pad"
                  value={newPhoneInput}
                  onChangeText={(v) => { setNewPhoneInput(v); setPhoneError(""); }}
                  autoFocus
                />
                {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                <SheetButtons
                  onCancel={() => setPhoneModalOpen(false)}
                  onConfirm={handleRequestPhoneChange}
                  confirmLabel={phoneLoading ? "Sending…" : "Send OTP"}
                  disabled={phoneLoading}
                />
              </>
            ) : (
              <>
                <Text style={styles.sheetSub}>
                  Enter the 6-digit code sent to{" "}
                  <Text style={{ fontWeight: "700", color: palette.ink }}>{newPhoneInput}</Text>.
                </Text>
                <TextInput
                  style={[styles.input, phoneError ? styles.inputError : null]}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={palette.inkSoft}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                  value={phoneOtp}
                  onChangeText={(v) => { setPhoneOtp(v); setPhoneError(""); }}
                  autoFocus
                />
                {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                <SheetButtons
                  onCancel={() => setPhonePhase("input")}
                  cancelLabel="← Back"
                  onConfirm={handleConfirmPhoneChange}
                  confirmLabel={phoneLoading ? "Verifying…" : "Confirm"}
                  disabled={phoneLoading}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Add child ────────────────────────────────────────────────────── */}
      <Modal visible={addChildOpen} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: "75%" }]}>
            <SheetHeader
              title={addChildPhase === "class" ? "Select a class" : "Select your child"}
              onClose={() => setAddChildOpen(false)}
              onBack={addChildPhase === "student" ? () => setAddChildPhase("class") : undefined}
            />
            {addChildPhase === "class" ? (
              classLoading ? (
                <ActivityIndicator color={palette.brand} style={{ marginVertical: spacing.lg }} />
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
                  {classrooms.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.listRow}
                      onPress={() => handlePickClass(c.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.listRowLabel}>
                        {c.name}{c.section ? ` — ${c.section}` : ""}
                      </Text>
                      <ChevronRight size={14} color={palette.inkFaint} strokeWidth={2} />
                    </TouchableOpacity>
                  ))}
                  {classrooms.length === 0 && (
                    <Text style={styles.emptyText}>No classes found.</Text>
                  )}
                </ScrollView>
              )
            ) : (
              <>
                {addStudentLoading ? (
                  <ActivityIndicator color={palette.brand} style={{ marginVertical: spacing.lg }} />
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
                    {addStudents.map((s) => {
                      const alreadyLinked = profile.students.some((ps) => ps.id === s.id);
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[styles.listRow, alreadyLinked && styles.listRowDisabled]}
                          onPress={() => !alreadyLinked && handleAddStudent(s.id)}
                          activeOpacity={alreadyLinked ? 1 : 0.75}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.listRowLabel, alreadyLinked && { color: palette.inkSoft }]}>
                              {s.name}
                            </Text>
                            {alreadyLinked && (
                              <Text style={styles.alreadyLinkedText}>Already in your account</Text>
                            )}
                          </View>
                          {!alreadyLinked && (
                            <Text style={styles.addStudentPlus}>+</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                    {addStudents.length === 0 && (
                      <Text style={styles.emptyText}>No students found in this class.</Text>
                    )}
                  </ScrollView>
                )}
                {addStudentError ? (
                  <Text style={styles.errorText}>{addStudentError}</Text>
                ) : null}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── QR enroll ────────────────────────────────────────────────────── */}
      <Modal visible={qrModalOpen} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <SheetHeader
              title={qrConfirmed ? "Driver confirmed!" : "Show QR to driver"}
              onClose={() => setQrModalOpen(false)}
            />
            {qrConfirmed ? (
              <View style={styles.qrConfirmedBlock}>
                <View style={styles.qrConfirmedBadge}><Text style={styles.qrConfirmedTick}>✓</Text></View>
                <Text style={styles.qrConfirmedSub}>
                  {qrTargetStudent?.student_name ?? "Your child"} has been added to the bus.
                </Text>
                <TouchableOpacity style={[styles.confirmBtn, { marginTop: spacing.sm }]} onPress={() => setQrModalOpen(false)}>
                  <Text style={styles.confirmBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.sheetSub}>
                  The driver will scan this to add{" "}
                  <Text style={{ fontWeight: "700", color: palette.ink }}>
                    {qrTargetStudent?.student_name ?? "your child"}
                  </Text>{" "}
                  to their bus.
                </Text>
                {qrLoading ? (
                  <ActivityIndicator color={palette.brand} style={{ marginVertical: spacing.xl }} />
                ) : qrImage ? (
                  <View style={styles.qrImageWrap}>
                    <Image source={{ uri: qrImage }} style={styles.qrImage} resizeMode="contain" />
                    <Text style={styles.qrExpiry}>Single-use · Expires in 15 min</Text>
                  </View>
                ) : null}
                <View style={styles.qrWaitRow}>
                  <ActivityIndicator size="small" color={palette.inkSoft} />
                  <Text style={styles.qrWaitText}>Waiting for driver to scan…</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Bus picker ───────────────────────────────────────────────────── */}
      <Modal visible={busModalOpen} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <SheetHeader title="Change bus route" onClose={() => setBusModalOpen(false)} />
            <Text style={styles.sheetSub}>Select the bus your child will travel in.</Text>
            <FlatList
              data={routes}
              keyExtractor={(r: RouteOption) => String(r.id)}
              ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
              style={{ maxHeight: 280 }}
              renderItem={({ item }: { item: RouteOption }) => {
                const active = pendingRouteId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.routeRow, active && styles.routeRowActive]}
                    onPress={() => setPendingRouteId(item.id)}
                    activeOpacity={0.8}
                  >
                    <Bus size={15} color={active ? palette.brand : palette.inkSoft} strokeWidth={2} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.routeName, active && { color: palette.brandDeep }]}>
                        {item.busLabel} · {item.name}
                      </Text>
                      <Text style={styles.routeDriver}>Driver: {item.driverName}</Text>
                    </View>
                    {active && <View style={styles.routeCheck}><Text style={styles.routeCheckText}>✓</Text></View>}
                  </TouchableOpacity>
                );
              }}
            />
            <SheetButtons
              onCancel={() => setBusModalOpen(false)}
              onConfirm={() => {
                const entry = enrollments[0];
                handleSaveBus(entry?.student_id ?? 0);
              }}
              confirmLabel={busSaving ? "Saving…" : "Confirm & get QR"}
              disabled={!pendingRouteId || busSaving}
            />
          </View>
        </View>
      </Modal>

      {/* ── Stop edit ────────────────────────────────────────────────────── */}
      <Modal visible={stopModalOpen} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <SheetHeader title="Edit pickup stop" onClose={() => setStopModalOpen(false)} />
            <Text style={styles.sheetSub}>
              The driver will see this on their roster immediately.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Green Park Gate"
              placeholderTextColor={palette.inkSoft}
              value={newStopName}
              onChangeText={setNewStopName}
              autoCapitalize="words"
              autoFocus
            />
            <SheetButtons
              onCancel={() => setStopModalOpen(false)}
              onConfirm={handleSaveStop}
              confirmLabel="Save stop"
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

// ── Small reusable components ─────────────────────────────────────────────────

function SettingsRow({
  icon, label, value, onPress,
}: {
  icon: React.ReactNode; label: string; value?: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.settingsRowIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingsRowLabel}>{label}</Text>
        {value ? <Text style={styles.settingsRowValue}>{value}</Text> : null}
      </View>
      {onPress && <ChevronRight size={16} color={palette.inkFaint} strokeWidth={2} />}
    </TouchableOpacity>
  );
}

function RowDivider() {
  return <View style={styles.rowDivider} />;
}

function SheetHeader({
  title, onClose, onBack,
}: {
  title: string; onClose: () => void; onBack?: () => void;
}) {
  return (
    <View style={styles.sheetHeader}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.sheetBack}>
          <Text style={styles.sheetBackText}>← Back</Text>
        </TouchableOpacity>
      ) : <View style={{ width: 48 }} />}
      <Text style={styles.sheetTitle}>{title}</Text>
      <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.sheetClose}>
        <X size={18} color={palette.inkSoft} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

function SheetButtons({
  onCancel, onConfirm, confirmLabel, cancelLabel = "Cancel", disabled = false,
}: {
  onCancel: () => void; onConfirm: () => void;
  confirmLabel: string; cancelLabel?: string; disabled?: boolean;
}) {
  return (
    <View style={styles.sheetBtns}>
      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.confirmBtn, disabled && styles.btnDisabled]}
        onPress={onConfirm}
        disabled={disabled}
      >
        <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Avatar hero
  avatarSection: { alignItems: "center", paddingVertical: spacing.lg, gap: spacing.xs },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: palette.brand,
    alignItems: "center", justifyContent: "center",
    shadowColor: palette.brand, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 6, marginBottom: spacing.xs,
  },
  avatarInitials: { fontSize: 32, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  avatarName: { fontSize: 20, fontWeight: "900", color: palette.ink, letterSpacing: -0.3 },
  avatarSub:  { fontSize: 13, color: palette.inkSoft, fontWeight: "600" },

  // Section header label
  sectionHeader: {
    fontSize: 11, fontWeight: "700", color: palette.inkFaint,
    textTransform: "uppercase", letterSpacing: 1,
    marginBottom: spacing.xs, marginTop: spacing.sm, paddingHorizontal: 2,
  },

  // Card container
  card: {
    backgroundColor: palette.surface, borderRadius: 18,
    borderWidth: 1, borderColor: palette.stroke,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    marginBottom: spacing.xs,
  },

  // Settings row
  settingsRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  settingsRowIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: palette.brandSoft,
    alignItems: "center", justifyContent: "center",
  },
  settingsRowLabel: { fontSize: 14, fontWeight: "700", color: palette.ink },
  settingsRowValue: { fontSize: 12, color: palette.inkSoft, marginTop: 1 },
  rowDivider:       { height: 1, backgroundColor: palette.stroke, marginLeft: spacing.md },

  // Children rows
  childRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 13, paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  childAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: palette.brandSoft, borderWidth: 1, borderColor: palette.brandMid,
    alignItems: "center", justifyContent: "center",
  },
  childAvatarText: { fontSize: 13, fontWeight: "800", color: palette.brand },
  childName:  { fontSize: 14, fontWeight: "700", color: palette.ink },
  childGrade: { fontSize: 12, color: palette.inkSoft, marginTop: 1 },
  emptyChildren: { paddingVertical: spacing.md, alignItems: "center" },
  emptyChildrenText: { fontSize: 13, color: palette.inkSoft },
  addChildBtn: { paddingVertical: 14, alignItems: "center" },
  addChildBtnText: { fontSize: 14, fontWeight: "700", color: palette.brand },

  // Transport
  transportStudentLabel: {
    fontSize: 11, fontWeight: "700", color: palette.inkSoft,
    textTransform: "uppercase", letterSpacing: 0.7,
    paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 4,
  },
  enrolledRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingVertical: 12, paddingHorizontal: spacing.md,
  },
  enrolledBusText:    { fontSize: 14, fontWeight: "700", color: palette.ink },
  enrolledDriverText: { fontSize: 12, color: palette.inkSoft, marginTop: 1 },
  confirmedChip: {
    backgroundColor: "#dcfce7", borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "#86efac",
  },
  confirmedChipText: { fontSize: 11, fontWeight: "700", color: "#15803d" },
  qrChip: {
    backgroundColor: palette.brandSoft, borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: palette.brandMid,
  },
  qrChipText: { fontSize: 11, fontWeight: "700", color: palette.brand },
  removeRow:  { paddingVertical: 13, paddingHorizontal: spacing.md, alignItems: "center" },
  removeRowText: { fontSize: 13, fontWeight: "700", color: palette.danger },

  // Driver
  driverRow: {
    flexDirection: "row", alignItems: "center",
    gap: spacing.md, paddingVertical: 14, paddingHorizontal: spacing.md,
  },
  driverAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: palette.brand, alignItems: "center", justifyContent: "center",
  },
  driverAvatarText: { fontSize: 15, fontWeight: "900", color: "#fff" },
  driverName:    { fontSize: 15, fontWeight: "800", color: palette.ink },
  driverVehicle: { fontSize: 12, color: palette.inkSoft, marginTop: 1 },
  phoneChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: palette.brandSoft, borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: palette.brandMid,
  },
  phoneChipText: { fontSize: 12, fontWeight: "700", color: palette.brand },

  // Linked services
  serviceRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingVertical: 14, paddingHorizontal: spacing.md,
  },
  serviceCheck: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center",
  },
  serviceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.success },
  serviceText:   { flex: 1, fontSize: 14, color: palette.ink, fontWeight: "500" },
  serviceActive: { fontSize: 12, fontWeight: "700", color: palette.success },

  // Logout
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.sm, paddingVertical: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: palette.danger,
    marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  logoutText: { color: palette.danger, fontWeight: "800", fontSize: 15 },

  // Modal shared
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: spacing.lg, paddingBottom: 40, gap: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  sheetBack:     { width: 48 },
  sheetBackText: { fontSize: 13, color: palette.inkSoft },
  sheetClose:    { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  sheetTitle:    { fontSize: 17, fontWeight: "900", color: palette.ink, flex: 1, textAlign: "center" },
  sheetSub:      { fontSize: 13, color: palette.inkSoft, lineHeight: 19, marginTop: -spacing.xs },
  input: {
    backgroundColor: palette.surfaceMuted, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    fontSize: 15, color: palette.ink, borderWidth: 1, borderColor: palette.stroke,
  },
  inputError:  { borderColor: palette.danger, backgroundColor: "#fff5f5" },
  errorText:   { fontSize: 12, color: palette.danger, fontWeight: "600", marginTop: -spacing.xs },
  sheetBtns:   { flexDirection: "row", gap: spacing.sm },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: palette.stroke, alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "700", color: palette.inkSoft },
  confirmBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    backgroundColor: palette.brand, alignItems: "center",
  },
  confirmBtnText: { fontSize: 14, fontWeight: "800", color: "#fff" },
  btnDisabled:    { opacity: 0.4 },

  // Add child list
  listRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 13, paddingHorizontal: 2,
    borderBottomWidth: 1, borderBottomColor: palette.stroke, gap: spacing.sm,
  },
  listRowDisabled: { opacity: 0.5 },
  listRowLabel:    { fontSize: 14, fontWeight: "600", color: palette.ink, flex: 1 },
  alreadyLinkedText: { fontSize: 11, color: palette.inkSoft, marginTop: 1 },
  addStudentPlus:    { fontSize: 20, fontWeight: "700", color: palette.brand },
  emptyText: { fontSize: 13, color: palette.inkSoft, textAlign: "center", paddingVertical: spacing.md },

  // Bus picker
  routeRow: {
    flexDirection: "row", alignItems: "center",
    padding: spacing.md, borderRadius: 14,
    borderWidth: 1.5, borderColor: palette.stroke,
    backgroundColor: palette.surfaceMuted, gap: spacing.sm,
  },
  routeRowActive: { borderColor: palette.brand, backgroundColor: palette.brandSoft },
  routeName:      { fontSize: 14, fontWeight: "800", color: palette.ink },
  routeDriver:    { fontSize: 12, color: palette.inkSoft, marginTop: 2 },
  routeCheck: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: palette.brand, alignItems: "center", justifyContent: "center",
  },
  routeCheckText: { fontSize: 12, fontWeight: "900", color: "#fff" },

  // QR modal
  qrImageWrap: {
    alignItems: "center", backgroundColor: "#fff",
    borderRadius: 16, borderWidth: 1, borderColor: palette.stroke,
    padding: spacing.md, gap: spacing.sm,
  },
  qrImage:  { width: 220, height: 220 },
  qrExpiry: { fontSize: 11, color: palette.inkSoft, fontWeight: "600" },
  qrWaitRow: {
    flexDirection: "row", alignItems: "center",
    gap: spacing.sm, justifyContent: "center", paddingVertical: spacing.xs,
  },
  qrWaitText:       { fontSize: 13, color: palette.inkSoft },
  qrConfirmedBlock: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  qrConfirmedBadge: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "#22c55e", alignItems: "center", justifyContent: "center",
  },
  qrConfirmedTick: { fontSize: 26, color: "#fff", fontWeight: "900" },
  qrConfirmedSub:  { fontSize: 14, color: palette.inkSoft, textAlign: "center" },
});
