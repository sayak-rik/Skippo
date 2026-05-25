/**
 * NewParentScreen — Discovery signup flow for parents whose phone isn't in the DB.
 *
 * Steps:
 *   school         → pick a school from the list (or "My school isn't here")
 *   class_name     → pick the classroom name
 *   section        → pick the section within that class
 *   student        → pick the student from the roster
 *   school_email   → school not found path: enter school name + email
 *   migration_modal→ other students linked to same old parent (checkboxes)
 *   otp            → enter the 6-digit OTP
 *   name           → enter parent name (if needed)
 *   bus            → optional bus picker
 *   qr_onboard     → show QR for driver to scan; poll for confirmation
 */

import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Screen } from "../components/Screen";
import { SkippoLogo } from "../components/SkippoLogo";
import { api, setAuthToken } from "../lib/api";
import { useAvailableRoutes } from "../hooks/useParentDashboard";
import { useSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";
import { RouteOption } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step =
  | "school"
  | "class_name"
  | "section"
  | "student"
  | "school_email"
  | "migration_modal"
  | "otp"
  | "name"
  | "bus"
  | "qr_onboard";

interface SchoolItem    { id: number; name: string; slug: string }
interface ClassroomItem { id: number; name: string; section: string }
interface StudentItem   { id: number; name: string; parent_status: "none" | "pending" | "linked" }
interface OtherStudent  { id: number; name: string }

// ── Step meta ─────────────────────────────────────────────────────────────────

const STEP_TITLE: Record<Step, string> = {
  school:          "Find your school",
  class_name:      "Select class",
  section:         "Select section",
  student:         "Select your child",
  school_email:    "Tell us about your school",
  migration_modal: "More children found",
  otp:             "Verify the code",
  name:            "What's your name?",
  bus:             "Pick a bus",
  qr_onboard:      "Join your bus",
};

// ── Mail-sent success animation ───────────────────────────────────────────────

function MailSentAnimation({ email, onSignIn }: { email: string; onSignIn: () => void }) {
  const envelopeScale    = useRef(new Animated.Value(0)).current;
  const envelopeRotate   = useRef(new Animated.Value(0)).current;
  const checkScale       = useRef(new Animated.Value(0)).current;
  const textOpacity      = useRef(new Animated.Value(0)).current;
  const textTranslateY   = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(envelopeScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(envelopeRotate, { toValue:  1, duration: 75, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(envelopeRotate, { toValue: -1, duration: 75, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(envelopeRotate, { toValue:  0, duration: 75, easing: Easing.linear, useNativeDriver: true }),
      ]),
    ]).start();

    const t1 = setTimeout(() => {
      Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true }).start();
    }, 380);

    const t2 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity,    { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(textTranslateY, { toValue: 0, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    }, 580);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const rotate = envelopeRotate.interpolate({ inputRange: [-1, 0, 1], outputRange: ["-9deg", "0deg", "9deg"] });

  return (
    <View style={ss.container}>
      <View style={ss.iconWrap}>
        <Animated.Text style={[ss.envelope, { transform: [{ scale: envelopeScale }, { rotate }] }]}>
          ✉️
        </Animated.Text>
        <Animated.View style={[ss.checkBadge, { transform: [{ scale: checkScale }] }]}>
          <Text style={ss.checkTick}>✓</Text>
        </Animated.View>
      </View>

      <Animated.View style={[ss.textBlock, { opacity: textOpacity, transform: [{ translateY: textTranslateY }] }]}>
        <Text style={ss.title}>Email sent!</Text>
        <Text style={ss.sub}>
          {"We've sent Skippo details to "}
          <Text style={ss.emailHighlight}>{email}</Text>
          {". Once your school signs up, you'll be able to join."}
        </Text>
        <TouchableOpacity onPress={onSignIn} activeOpacity={0.7} style={ss.signInBtn}>
          <Text style={ss.signInText}>
            Back to{" "}
            <Text style={ss.signInLink}>sign in</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const ss = StyleSheet.create({
  container:      { alignItems: "center", gap: spacing.lg, paddingVertical: spacing.xl },
  iconWrap:       { width: 96, height: 96, alignItems: "center", justifyContent: "center" },
  envelope:       { fontSize: 64 },
  checkBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#22c55e",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2.5, borderColor: "#fff",
  },
  checkTick:      { color: "#fff", fontSize: 13, fontWeight: "900" },
  textBlock:      { alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.sm },
  title:          { fontSize: 22, fontWeight: "900", color: palette.ink, letterSpacing: -0.4 },
  sub:            { fontSize: 13, color: palette.inkSoft, textAlign: "center", lineHeight: 20 },
  emailHighlight: { color: palette.ink, fontWeight: "700" },
  signInBtn:      { marginTop: spacing.sm, paddingVertical: spacing.xs },
  signInText:     { fontSize: 14, color: palette.inkSoft, textAlign: "center" },
  signInLink:     { color: palette.brand, fontWeight: "800" },
});

// ── Component ─────────────────────────────────────────────────────────────────

export function NewParentScreen({ navigation, route }: { navigation?: any; route?: any }) {
  const login          = useSessionStore((s) => s.login);
  const setSelectedRoute = useSessionStore((s) => s.setSelectedRoute);
  const { data: routes = [] } = useAvailableRoutes();

  const newPhone: string = route?.params?.phone ?? "";

  // ── Navigation state ───────────────────────────────────────────────────────
  const [step, setStep]     = useState<Step>("school");
  const [loading, setLoading] = useState(false);

  // ── Discovery selections ───────────────────────────────────────────────────
  const [schools, setSchools]         = useState<SchoolItem[]>([]);
  const [classrooms, setClassrooms]   = useState<ClassroomItem[]>([]);
  const [students, setStudents]       = useState<StudentItem[]>([]);
  const [schoolSearch, setSchoolSearch] = useState("");

  const [selectedSchool, setSelectedSchool]       = useState<SchoolItem | null>(null);
  const [selectedClassName, setSelectedClassName]  = useState("");
  const [selectedSection, setSelectedSection]      = useState("");
  const [selectedStudent, setSelectedStudent]      = useState<StudentItem | null>(null);

  // ── School-not-found ───────────────────────────────────────────────────────
  const [schoolNameInput, setSchoolNameInput] = useState("");
  const [schoolEmailInput, setSchoolEmailInput] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // ── Migration modal ────────────────────────────────────────────────────────
  const [situation, setSituation]           = useState<"free" | "pending" | "linked">("free");
  const [otpPhone, setOtpPhone]             = useState("");         // actual phone OTP was sent to
  const [otpPhoneMasked, setOtpPhoneMasked] = useState("");
  const [otherStudents, setOtherStudents]   = useState<OtherStudent[]>([]);
  // student IDs the user wants to migrate; selectedStudent is always included
  const [migrateIds, setMigrateIds]         = useState<Set<number>>(new Set());

  // ── QR onboarding ──────────────────────────────────────────────────────────
  const [qrImage, setQrImage]               = useState<string | null>(null);
  const [qrLoading, setQrLoading]           = useState(false);
  const [qrDriverConfirmed, setQrDriverConfirmed] = useState(false);

  // ── OTP ────────────────────────────────────────────────────────────────────
  const [otp, setOtp]               = useState("");
  const [otpError, setOtpError]     = useState("");
  const [parentEmail, setParentEmail] = useState("");

  // ── Profile completion ─────────────────────────────────────────────────────
  const [parentName, setParentName]   = useState("");
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [selectedRouteId, setLocalRouteId] = useState<number | null>(null);

  // ── Load schools on mount ──────────────────────────────────────────────────
  useEffect(() => {
    api.get("/api/auth/parent/schools/")
      .then(({ data }) => setSchools(data.results ?? []))
      .catch(() => {});
  }, []);

  // ── Poll for driver confirmation while on qr_onboard ──────────────────────
  useEffect(() => {
    if (step !== "qr_onboard" || qrDriverConfirmed) return;
    const id = setInterval(async () => {
      try {
        const { data } = await api.get("/api/transport/parent/enrollment/");
        if (data.enrollments?.some((e: any) => e.driver_confirmed)) {
          setQrDriverConfirmed(true);
        }
      } catch {}
    }, 8000);
    return () => clearInterval(id);
  }, [step, qrDriverConfirmed]);

  // ── Derived lists ──────────────────────────────────────────────────────────

  const filteredSchools = schoolSearch.trim()
    ? schools.filter(s => s.name.toLowerCase().includes(schoolSearch.toLowerCase()))
    : schools;

  const classNames = [...new Set(classrooms.map(c => c.name))].sort();

  const sections = classrooms
    .filter(c => c.name === selectedClassName)
    .map(c => c.section)
    .filter(Boolean)
    .sort();

  const showSectionStep = sections.length > 0;

  const selectedClassroom = classrooms.find(
    c => c.name === selectedClassName && (sections.length === 0 || c.section === selectedSection)
  ) ?? null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleSchoolSelect(school: SchoolItem) {
    setSelectedSchool(school);
    setLoading(true);
    try {
      const { data } = await api.get(`/api/auth/parent/classrooms/?school_slug=${school.slug}`);
      setClassrooms(data.results ?? []);
      setStep("class_name");
    } catch {
      Alert.alert("Error", "Could not load classrooms. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClassroomSelect(classroomId: number) {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/auth/parent/discovery-students/?classroom_id=${classroomId}`);
      setStudents(data.results ?? []);
      setStep("student");
    } catch {
      Alert.alert("Error", "Could not load students. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStudentSelect(student: StudentItem) {
    setSelectedStudent(student);
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/parent/signup/check/", {
        student_id: student.id,
        new_phone: newPhone,
      });

      setSituation(data.situation);
      setOtpPhone(data.otp_phone);
      setOtpPhoneMasked(data.otp_phone_masked);

      const others: OtherStudent[] = data.other_students ?? [];
      setOtherStudents(others);

      // Always include the selected student in the migration set
      const initialIds = new Set([student.id]);
      setMigrateIds(initialIds);

      if (others.length > 0 && (data.situation === "linked" || data.situation === "pending")) {
        setStep("migration_modal");
      } else {
        setStep("otp");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Could not check student status. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }

  function toggleMigrateStudent(id: number) {
    setMigrateIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) {
      Alert.alert("Missing field", "Please enter the OTP.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/parent/signup/complete/", {
        otp_phone:   otpPhone,
        otp_code:    otp.trim(),
        new_phone:   newPhone,
        new_name:    parentName.trim() || "",
        email:       parentEmail.trim().toLowerCase() || "",
        school_slug: selectedSchool!.slug,
        student_ids: [...migrateIds],
      });

      setVerifiedData(data);
      setAuthToken(data.access);

      if (data.needs_profile_completion) {
        setStep("name");
      } else {
        setStep("bus");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Incorrect code or it has expired.";
      setOtpError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveName() {
    const name = parentName.trim();
    if (!name) {
      Alert.alert("Missing field", "Please enter your name.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/parent/complete-profile/", { name });
      setStep("bus");
    } catch {
      Alert.alert("Error", "Could not save your name. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish() {
    const data = verifiedData!;
    const name = parentName.trim() || data.user?.name || "";

    if (selectedRouteId) {
      try {
        await api.post("/api/transport/parent/change-bus/", { routeId: selectedRouteId });
        setSelectedRoute(selectedRouteId);
      } catch {
        /* non-fatal */
      }
    }

    login({ name, school_slug: data.school_slug, token: data.access, routeId: selectedRouteId ?? undefined });
  }

  async function handleSendSchoolEmail() {
    if (!schoolNameInput.trim() || !schoolEmailInput.trim()) {
      Alert.alert("Missing fields", "Please enter both the school name and email.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/parent/school-not-found/", {
        school_name: schoolNameInput.trim(),
        email: schoolEmailInput.trim(),
      });
      setEmailSent(true);
    } catch {
      Alert.alert("Error", "Could not send the email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── QR-based bus onboarding ────────────────────────────────────────────────

  async function handleEnterQRStep() {
    if (!selectedRouteId || !selectedStudent) {
      await handleFinish();
      return;
    }
    setQrLoading(true);
    try {
      const { data } = await api.get(`/api/transport/students/${selectedStudent.id}/qr/`);
      setQrImage(data.qr_image);
      setStep("qr_onboard");
    } catch {
      await handleFinish();
    } finally {
      setQrLoading(false);
    }
  }

  // ── Section / class selection helpers ──────────────────────────────────────

  function handleClassNameSelect(name: string) {
    setSelectedClassName(name);
    const secs = classrooms.filter(c => c.name === name).map(c => c.section).filter(Boolean);
    if (secs.length > 0) {
      setStep("section");
    } else {
      // No sections — go directly to students using the single classroom
      const cls = classrooms.find(c => c.name === name);
      if (cls) {
        setSelectedSection("");
        handleClassroomSelect(cls.id);
      }
    }
  }

  function handleSectionSelect(section: string) {
    setSelectedSection(section);
    const cls = classrooms.find(c => c.name === selectedClassName && c.section === section);
    if (cls) handleClassroomSelect(cls.id);
  }

  // ── Shared UI helpers ──────────────────────────────────────────────────────

  function BackButton({ onPress }: { onPress: () => void }) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.backBtn} activeOpacity={0.7}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>
    );
  }

  function OptionRow({ label, sub, onPress, selected }: {
    label: string; sub?: string; onPress: () => void; selected?: boolean;
  }) {
    return (
      <TouchableOpacity
        style={[styles.optionRow, selected && styles.optionRowSelected]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
          {sub ? <Text style={styles.optionSub}>{sub}</Text> : null}
        </View>
        {selected && <Text style={styles.optionCheck}>✓</Text>}
      </TouchableOpacity>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kav}
      >
        {/* Header */}
        <View style={styles.header}>
          <SkippoLogo size={44} />
          <Text style={styles.kicker}>Skippo · New Parent</Text>
          <Text style={styles.headline}>{STEP_TITLE[step]}</Text>
        </View>

        {/* ── SCHOOL SELECTION ──────────────────────────────────────── */}
        {step === "school" && (
          <View style={styles.card}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search school name…"
              placeholderTextColor={palette.inkSoft}
              value={schoolSearch}
              onChangeText={setSchoolSearch}
              autoCapitalize="words"
            />
            {loading && <ActivityIndicator style={{ marginVertical: 16 }} color={palette.brand} />}
            <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
              {filteredSchools.map(s => (
                <OptionRow key={s.id} label={s.name} onPress={() => handleSchoolSelect(s)} />
              ))}
              {filteredSchools.length === 0 && !loading && (
                <Text style={styles.emptyText}>No schools match "{schoolSearch}"</Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.notFoundBtn}
              onPress={() => setStep("school_email")}
              activeOpacity={0.75}
            >
              <Text style={styles.notFoundBtnText}>My school isn't listed here →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── CLASS NAME SELECTION ──────────────────────────────────── */}
        {step === "class_name" && (
          <View style={styles.card}>
            <Text style={styles.cardSub}>
              Select the class your child is in at {selectedSchool?.name}.
            </Text>
            <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
              {classNames.map(name => (
                <OptionRow
                  key={name}
                  label={name}
                  onPress={() => handleClassNameSelect(name)}
                  selected={selectedClassName === name}
                />
              ))}
            </ScrollView>
            <BackButton onPress={() => { setSelectedSchool(null); setStep("school"); }} />
          </View>
        )}

        {/* ── SECTION SELECTION ─────────────────────────────────────── */}
        {step === "section" && (
          <View style={styles.card}>
            <Text style={styles.cardSub}>Select the section.</Text>
            <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
              {sections.map(sec => (
                <OptionRow
                  key={sec}
                  label={`${selectedClassName} — ${sec}`}
                  onPress={() => handleSectionSelect(sec)}
                  selected={selectedSection === sec}
                />
              ))}
            </ScrollView>
            {loading && <ActivityIndicator color={palette.brand} style={{ marginVertical: 8 }} />}
            <BackButton onPress={() => setStep("class_name")} />
          </View>
        )}

        {/* ── STUDENT SELECTION ─────────────────────────────────────── */}
        {step === "student" && (
          <View style={styles.card}>
            <Text style={styles.cardSub}>
              Select your child from the roster.
            </Text>
            <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
              {students.map(s => (
                <OptionRow
                  key={s.id}
                  label={s.name}
                  sub={
                    s.parent_status === "linked"  ? "Parent account exists" :
                    s.parent_status === "pending" ? "Number on file — needs verification" :
                    undefined
                  }
                  onPress={() => handleStudentSelect(s)}
                />
              ))}
              {students.length === 0 && (
                <Text style={styles.emptyText}>No students found in this class.</Text>
              )}
            </ScrollView>
            {loading && <ActivityIndicator color={palette.brand} style={{ marginVertical: 8 }} />}
            <BackButton onPress={() => setStep(showSectionStep ? "section" : "class_name")} />
          </View>
        )}

        {/* ── SCHOOL NOT FOUND ──────────────────────────────────────── */}
        {step === "school_email" && (
          <View style={styles.card}>
            {emailSent ? (
              <MailSentAnimation
                email={schoolEmailInput}
                onSignIn={() => navigation?.navigate?.("Login")}
              />
            ) : (
              <>
                <Text style={styles.cardSub}>
                  Tell us your school's name and email. We'll reach out to them with details about joining Skippo.
                </Text>
                <View style={styles.field}>
                  <Text style={styles.label}>School name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Delhi Public School, Noida"
                    placeholderTextColor={palette.inkSoft}
                    autoCapitalize="words"
                    value={schoolNameInput}
                    onChangeText={setSchoolNameInput}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>School email address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. admin@dpsnoidaschool.edu.in"
                    placeholderTextColor={palette.inkSoft}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={schoolEmailInput}
                    onChangeText={setSchoolEmailInput}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  onPress={handleSendSchoolEmail}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnText}>{loading ? "Sending…" : "Notify my school"}</Text>
                </TouchableOpacity>
                <BackButton onPress={() => setStep("school")} />
              </>
            )}
          </View>
        )}

        {/* ── MIGRATION MODAL ───────────────────────────────────────── */}
        {step === "migration_modal" && selectedStudent && (
          <View style={styles.card}>
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>⚠️</Text>
              <Text style={styles.infoText}>
                This parent account is also linked to{" "}
                <Text style={{ fontWeight: "700" }}>{otherStudents.length}</Text> other{" "}
                {otherStudents.length === 1 ? "student" : "students"}. Select the ones you'd like to transfer to your new account.
              </Text>
            </View>

            {/* Selected student — always included */}
            <View style={styles.fixedStudentRow}>
              <Text style={styles.checkMark}>✓</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.fixedStudentName}>{selectedStudent.name}</Text>
                <Text style={styles.fixedStudentSub}>Selected by you — always transferred</Text>
              </View>
            </View>

            {otherStudents.map(s => {
              const checked = migrateIds.has(s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.checkRow, checked && styles.checkRowActive]}
                  onPress={() => toggleMigrateStudent(s.id)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <Text style={styles.checkboxTick}>✓</Text>}
                  </View>
                  <Text style={styles.checkRowLabel}>{s.name}</Text>
                </TouchableOpacity>
              );
            })}

            <Text style={styles.migrateNote}>
              Students you don't select will stay linked to the previous parent account.
              Students from different parent accounts cannot be combined.
            </Text>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => setStep("otp")}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>
                Continue with {migrateIds.size} {migrateIds.size === 1 ? "student" : "students"}
              </Text>
            </TouchableOpacity>
            <BackButton onPress={() => setStep("student")} />
          </View>
        )}

        {/* ── OTP ENTRY ─────────────────────────────────────────────── */}
        {step === "otp" && (
          <View style={styles.card}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {situation === "free"
                  ? `A verification code has been sent to your number ${otpPhoneMasked}.`
                  : `To authorise this transfer, a code was sent to the previous parent's number ${otpPhoneMasked}.`}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Verification code</Text>
              <TextInput
                style={[styles.input, otpError ? styles.inputError : null]}
                placeholder="Enter 6-digit code"
                placeholderTextColor={palette.inkSoft}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                value={otp}
                onChangeText={(v: string) => { setOtp(v); setOtpError(""); }}
                autoFocus
              />
              {otpError ? <Text style={styles.otpErrorText}>{otpError}</Text> : null}
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Email address (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={palette.inkSoft}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={parentEmail}
                onChangeText={setParentEmail}
              />
              <Text style={styles.inputHint}>
                Used for Google Sign-In and email notifications. You can add this later.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>{loading ? "Verifying…" : "Verify & continue"}</Text>
            </TouchableOpacity>
            <BackButton onPress={() => setStep(otherStudents.length > 0 ? "migration_modal" : "student")} />
          </View>
        )}

        {/* ── NAME ENTRY ────────────────────────────────────────────── */}
        {step === "name" && (
          <View style={styles.card}>
            <Text style={styles.cardSub}>
              We couldn't find your name in our records. Please enter it so teachers can identify you.
            </Text>
            <View style={styles.field}>
              <Text style={styles.label}>Your full name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Priya Sharma"
                placeholderTextColor={palette.inkSoft}
                autoCapitalize="words"
                value={parentName}
                onChangeText={setParentName}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSaveName}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>{loading ? "Saving…" : "Continue"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── BUS PICKER ────────────────────────────────────────────── */}
        {step === "bus" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select your child's bus</Text>
            {routes.length === 0 ? (
              <>
                <View style={styles.noBusState}>
                  <Text style={styles.noBusEmoji}>🚌</Text>
                  <Text style={styles.noBusTitle}>No buses set up yet</Text>
                  <Text style={styles.noBusSub}>
                    Your school hasn't added any bus routes yet. You can assign a bus later from your profile once they're available.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={handleFinish}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnText}>Continue without bus</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.cardSub}>
                  Pick a bus and we'll generate a QR for the driver to scan.
                </Text>
                <FlatList
                  data={routes}
                  keyExtractor={(r: RouteOption) => String(r.id)}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                  renderItem={({ item }: { item: RouteOption }) => {
                    const active = selectedRouteId === item.id;
                    return (
                      <TouchableOpacity
                        style={[styles.routeRow, active && styles.routeRowActive]}
                        onPress={() => setLocalRouteId(item.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.routeInfo}>
                          <Text style={[styles.routeName, active && styles.routeNameActive]}>
                            {item.busLabel} · {item.name}
                          </Text>
                          <Text style={styles.routeDriver}>Driver: {item.driverName}</Text>
                          <Text style={styles.routeStops}>{item.stops.join("  ›  ")}</Text>
                        </View>
                        {active && <Text style={styles.routeCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  }}
                />
                <TouchableOpacity
                  style={[styles.btn, (loading || qrLoading) && styles.btnDisabled]}
                  onPress={handleEnterQRStep}
                  disabled={loading || qrLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnText}>
                    {(loading || qrLoading) ? "Setting up…" : selectedRouteId ? "Get QR code →" : "Skip for now"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* ── QR ONBOARDING ─────────────────────────────────────────── */}
        {step === "qr_onboard" && (
          <View style={styles.card}>
            {qrDriverConfirmed ? (
              <View style={styles.qrConfirmedBlock}>
                <View style={styles.qrConfirmedBadge}>
                  <Text style={styles.qrConfirmedTick}>✓</Text>
                </View>
                <Text style={styles.qrConfirmedTitle}>Driver confirmed!</Text>
                <Text style={styles.qrConfirmedSub}>
                  {selectedStudent?.name} has been added to the bus.
                </Text>
                <TouchableOpacity
                  style={[styles.btn, { marginTop: spacing.md }]}
                  onPress={handleFinish}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnText}>Complete setup</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.cardSub}>
                  Show this QR code to your driver. They'll scan it to add{" "}
                  <Text style={{ fontWeight: "700", color: palette.ink }}>{selectedStudent?.name}</Text>{" "}
                  to the bus.
                </Text>
                {qrImage ? (
                  <View style={styles.qrImageWrap}>
                    <Image
                      source={{ uri: qrImage }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                    <View style={styles.qrScanHint}>
                      <Text style={styles.qrScanHintText}>Expires in 15 min · Single-use</Text>
                    </View>
                  </View>
                ) : (
                  <ActivityIndicator color={palette.brand} style={{ marginVertical: spacing.xl }} />
                )}
                <View style={styles.qrWaitingRow}>
                  <ActivityIndicator size="small" color={palette.inkSoft} />
                  <Text style={styles.qrWaitingText}>Waiting for driver to scan…</Text>
                </View>
                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={handleFinish}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipBtnText}>
                    I'll do this later — <Text style={{ color: palette.brand, fontWeight: "700" }}>skip for now</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Back to login link on school step */}
        {step === "school" && (
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation?.navigate?.("Login")}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLinkText}>Already have an account? Sign in →</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  kav:    { flex: 1, gap: spacing.md },
  header: { gap: spacing.xs, marginTop: spacing.md },
  kicker: {
    fontSize: 11, fontWeight: "700", color: palette.brand,
    textTransform: "uppercase", letterSpacing: 1.2,
  },
  headline: { fontSize: 26, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  card: {
    backgroundColor: palette.surface, borderRadius: 20,
    borderWidth: 1, borderColor: palette.stroke,
    padding: spacing.lg, gap: spacing.md, flex: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: palette.ink },
  cardSub:   { fontSize: 13, color: palette.inkSoft, lineHeight: 19 },
  searchInput: {
    backgroundColor: palette.surfaceMuted, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    fontSize: 14, color: palette.ink,
    borderWidth: 1, borderColor: palette.stroke,
  },
  listScroll: { maxHeight: 320 },
  optionRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 13, paddingHorizontal: 2,
    borderBottomWidth: 1, borderBottomColor: palette.stroke,
  },
  optionRowSelected: { /* highlight handled by optionLabelSelected */ },
  optionLabel:         { fontSize: 14, fontWeight: "600", color: palette.ink },
  optionLabelSelected: { color: palette.brand },
  optionSub:   { fontSize: 11, color: palette.inkSoft, marginTop: 2 },
  optionCheck: { fontSize: 16, color: palette.brand, fontWeight: "900", marginLeft: 8 },
  emptyText: { fontSize: 13, color: palette.inkSoft, textAlign: "center", paddingVertical: spacing.md },
  notFoundBtn: { paddingVertical: spacing.sm, alignItems: "center" },
  notFoundBtnText: { fontSize: 13, color: palette.brand, fontWeight: "700" },
  backBtn:     { alignItems: "center", paddingVertical: spacing.xs },
  backBtnText: { fontSize: 13, color: palette.inkSoft },
  field:  { gap: spacing.xs },
  label: {
    fontSize: 11, fontWeight: "700", color: palette.inkSoft,
    textTransform: "uppercase", letterSpacing: 0.7,
  },
  input: {
    backgroundColor: palette.surfaceMuted, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: 13,
    fontSize: 15, color: palette.ink,
    borderWidth: 1, borderColor: palette.stroke,
  },
  btn:          { backgroundColor: palette.brand, borderRadius: 14, alignItems: "center", paddingVertical: 15 },
  btnDisabled:  { opacity: 0.4 },
  btnText:      { color: "#fff", fontWeight: "800", fontSize: 14 },
  inputError:   { borderColor: palette.danger, backgroundColor: "#fff5f5" },
  inputHint:    { fontSize: 11, color: palette.inkSoft, lineHeight: 16 },
  otpErrorText: { fontSize: 12, color: palette.danger, fontWeight: "600", marginTop: 2 },
  infoBox: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: "#fffbeb", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#fde68a",
  },
  infoIcon: { fontSize: 16 },
  infoText: { flex: 1, fontSize: 13, color: "#78350f", lineHeight: 19 },
  fixedStudentRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 13, borderRadius: 12,
    backgroundColor: palette.brandSoft, borderWidth: 1.5, borderColor: palette.brand,
  },
  checkMark: { fontSize: 16, color: palette.brand, fontWeight: "900" },
  fixedStudentName: { fontSize: 14, fontWeight: "700", color: palette.brandDeep },
  fixedStudentSub:  { fontSize: 11, color: palette.brand, marginTop: 1 },
  checkRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 13, borderRadius: 12,
    borderWidth: 1.5, borderColor: palette.stroke,
    backgroundColor: palette.surfaceMuted,
  },
  checkRowActive: { borderColor: palette.brand, backgroundColor: palette.brandSoft },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: palette.stroke,
    alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { borderColor: palette.brand, backgroundColor: palette.brand },
  checkboxTick:    { color: "#fff", fontSize: 12, fontWeight: "900" },
  checkRowLabel:   { fontSize: 14, fontWeight: "600", color: palette.ink },
  migrateNote: { fontSize: 11, color: palette.inkSoft, lineHeight: 16 },
  successBlock: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg },
  successEmoji: { fontSize: 48 },
  successTitle: { fontSize: 20, fontWeight: "900", color: palette.ink, letterSpacing: -0.3 },
  successSub:   { fontSize: 13, color: palette.inkSoft, textAlign: "center", lineHeight: 20 },
  routeRow: {
    flexDirection: "row", alignItems: "center",
    padding: spacing.md, borderRadius: 12,
    borderWidth: 1.5, borderColor: palette.stroke,
    backgroundColor: palette.surfaceMuted, gap: spacing.sm,
  },
  routeRowActive:  { borderColor: palette.brand, backgroundColor: palette.brandSoft },
  routeInfo:       { flex: 1, gap: 2 },
  routeName:       { fontSize: 14, fontWeight: "800", color: palette.ink },
  routeNameActive: { color: palette.brandDeep },
  routeDriver:     { fontSize: 12, color: palette.inkSoft },
  routeStops:      { fontSize: 11, color: palette.inkSoft, marginTop: 2 },
  routeCheck:      { fontSize: 18, color: palette.brand, fontWeight: "900" },
  loginLink:     { alignItems: "center", paddingVertical: spacing.sm },
  loginLinkText: { fontSize: 13, color: palette.inkSoft },

  // No-bus empty state
  noBusState: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.lg },
  noBusEmoji: { fontSize: 40 },
  noBusTitle: { fontSize: 16, fontWeight: "800", color: palette.ink },
  noBusSub:   { fontSize: 13, color: palette.inkSoft, textAlign: "center", lineHeight: 19 },

  // QR onboarding
  qrImageWrap: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    gap: spacing.sm,
  },
  qrImage: { width: 220, height: 220 },
  qrScanHint: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  qrScanHintText: { fontSize: 11, color: palette.inkSoft, fontWeight: "600" },
  qrWaitingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
  },
  qrWaitingText: { fontSize: 13, color: palette.inkSoft },
  skipBtn:     { alignItems: "center", paddingVertical: spacing.sm },
  skipBtnText: { fontSize: 13, color: palette.inkSoft, textAlign: "center" },

  // QR confirmed state
  qrConfirmedBlock: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg },
  qrConfirmedBadge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#22c55e",
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.xs,
  },
  qrConfirmedTick:  { fontSize: 28, color: "#fff", fontWeight: "900" },
  qrConfirmedTitle: { fontSize: 20, fontWeight: "900", color: palette.ink, letterSpacing: -0.3 },
  qrConfirmedSub:   { fontSize: 13, color: palette.inkSoft, textAlign: "center", lineHeight: 19 },
});
