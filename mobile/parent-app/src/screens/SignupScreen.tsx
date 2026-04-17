// ---------------------------------------------------------------------------
// SignupScreen – new parent onboarding, 3 steps:
//   Step 1 – Phone number + OTP
//   Step 2 – Child's name and grade
//   Step 3 – Pick a bus route (req 3)
//
// On success: calls login() and the app navigates to the main tabs.
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Screen } from "../components/Screen";
import { api } from "../lib/api";
import { mockRoutes } from "../data/mock";
import { useAvailableRoutes } from "../hooks/useParentDashboard";
import { useSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";
import { RouteOption } from "../types";

export function SignupScreen({ navigation }: { navigation?: any }) {
  const login = useSessionStore((s) => s.login);
  const setSelectedRoute = useSessionStore((s) => s.setSelectedRoute);
  const { data: routes = mockRoutes } = useAvailableRoutes();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  // Step 2
  const [childName, setChildName] = useState("");
  const [grade, setGrade] = useState("");

  // Step 3
  const [selectedRouteId, setLocalRouteId] = useState<number | null>(null);

  // ── Step handlers ─────────────────────────────────────────────────────────

  function handleStep1() {
    if (!phone.trim()) {
      Alert.alert("Missing field", "Please enter your phone number.");
      return;
    }
    setStep(2);
  }

  function handleStep2() {
    if (!childName.trim() || !grade.trim()) {
      Alert.alert("Missing fields", "Please enter your child's name and grade.");
      return;
    }
    setStep(3);
  }

  async function handleCompleteSignup() {
    if (!selectedRouteId) {
      Alert.alert("Pick a bus", "Please select the bus your child travels in.");
      return;
    }
    setLoading(true);
    try {
      // In demo mode, demo-login gives us a valid session.
      // In production, a real OTP flow would authenticate the parent here.
      const { data } = await api.post("/api/auth/demo-login/", { role: "parent" });
      // Assign the selected route on the backend
      await api.post("/api/transport/parent/change-bus/", { routeId: selectedRouteId });
      setSelectedRoute(selectedRouteId);
      login({ ...data, routeId: selectedRouteId });
    } catch {
      Alert.alert("Signup failed", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const stepLabels = ["Verify phone", "Child details", "Pick a bus"];

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kav}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>SK</Text>
          </View>
          <Text style={styles.kicker}>Skippo · Parent Signup</Text>
          <Text style={styles.headline}>{stepLabels[step - 1]}</Text>
        </View>

        {/* Step progress */}
        <View style={styles.stepRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.stepPip, step >= s && styles.stepPipActive]} />
          ))}
        </View>

        {/* ── Step 1: Phone + OTP ─────────────────────────────────────── */}
        {step === 1 && (
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Phone number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98XXXXXX21"
                placeholderTextColor={palette.inkSoft}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>OTP</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                placeholderTextColor={palette.inkSoft}
                keyboardType="number-pad"
                secureTextEntry
                value={otp}
                onChangeText={setOtp}
              />
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleStep1} activeOpacity={0.8}>
              <Text style={styles.btnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Child details ────────────────────────────────────── */}
        {step === 2 && (
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Child's full name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Aarav Roy"
                placeholderTextColor={palette.inkSoft}
                autoCapitalize="words"
                value={childName}
                onChangeText={setChildName}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Grade / Class</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Class 4B"
                placeholderTextColor={palette.inkSoft}
                autoCapitalize="words"
                value={grade}
                onChangeText={setGrade}
              />
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleStep2} activeOpacity={0.8}>
              <Text style={styles.btnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 3: Bus route picker (req 3) ────────────────────────── */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select your child's bus</Text>
            <Text style={styles.cardSub}>You can change this later from your profile.</Text>
            <FlatList
              data={routes}
              keyExtractor={(r) => String(r.id)}
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
              style={[styles.btn, (!selectedRouteId || loading) && styles.btnDisabled]}
              onPress={handleCompleteSignup}
              disabled={!selectedRouteId || loading}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>
                {loading ? "Creating account…" : "Complete signup"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Back link */}
        {step > 1 && (
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}

        {/* Login link */}
        {step === 1 && (
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation?.navigate?.("Login")}
          >
            <Text style={styles.backText}>Already have an account? Sign in →</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, gap: spacing.lg },
  header: { gap: spacing.sm, marginTop: spacing.md },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: palette.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  logoText: { color: "#fff", fontWeight: "900", fontSize: 18, letterSpacing: -0.5 },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.brand,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  headline: {
    fontSize: 28,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.5,
  },
  stepRow: { flexDirection: "row", gap: spacing.sm },
  stepPip: {
    height: 4,
    flex: 1,
    borderRadius: 99,
    backgroundColor: palette.surfaceMuted,
  },
  stepPipActive: { backgroundColor: palette.brand },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: palette.ink },
  cardSub: { fontSize: 13, color: palette.inkSoft, marginTop: -spacing.sm },
  field: { gap: spacing.xs },
  label: {
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
  btn: {
    backgroundColor: palette.brand,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 16,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.stroke,
    backgroundColor: palette.surfaceMuted,
    gap: spacing.sm,
  },
  routeRowActive: {
    borderColor: palette.brand,
    backgroundColor: palette.brandSoft,
  },
  routeInfo: { flex: 1, gap: 2 },
  routeName: { fontSize: 14, fontWeight: "800", color: palette.ink },
  routeNameActive: { color: palette.brandDeep },
  routeDriver: { fontSize: 12, color: palette.inkSoft },
  routeStops: { fontSize: 11, color: palette.inkSoft, marginTop: 2 },
  routeCheck: { fontSize: 18, color: palette.brand, fontWeight: "900" },
  backLink: { alignItems: "center", paddingVertical: spacing.sm },
  backText: { fontSize: 13, color: palette.inkSoft },
});
