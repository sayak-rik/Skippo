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

import { PhoneInput } from "../components/PhoneInput";
import { Screen } from "../components/Screen";
import { SkippoLogo } from "../components/SkippoLogo";
import { api, setAuthToken } from "../lib/api";
import { useAvailableRoutes } from "../hooks/useParentDashboard";
import { useSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";
import { RouteOption } from "../types";

// Steps:
//   1 – Phone + OTP verification (account is auto-created by the backend on verify)
//   2 – Confirm / enter parent name (only shown when needs_profile_completion = true)
//   3 – Pick a bus route (optional but encouraged)
type Step = 1 | 2 | 3;

const TOTAL_STEPS = 3;

export function SignupScreen({ navigation, route }: { navigation?: any; route?: any }) {
  const login             = useSessionStore((s) => s.login);
  const setSelectedRoute  = useSessionStore((s) => s.setSelectedRoute);
  const { data: routes = [] } = useAvailableRoutes();

  // Pre-filled from LoginScreen when it detected a signup-path phone
  const params: {
    phone?: string;
    schoolSlug?: string;
    childName?: string;
    pendingParentName?: string;
  } = route?.params ?? {};

  const [step, setStep]             = useState<Step>(1);
  const [loading, setLoading]       = useState(false);

  // Step 1 — OTP
  const [phone, setPhone]           = useState(params.phone ?? "");
  const [schoolSlug, setSchoolSlug] = useState(params.schoolSlug ?? "");
  const [otp, setOtp]               = useState("");
  const [otpSent, setOtpSent]       = useState(false);
  const [verifiedData, setVerifiedData] = useState<any>(null);

  // Step 2 — parent name
  const [parentName, setParentName] = useState(params.pendingParentName ?? "");

  // Step 3 — bus picker
  const [selectedRouteId, setLocalRouteId] = useState<number | null>(null);

  // ── Step 1a: send OTP ──────────────────────────────────────────────────────

  async function handleSendOtp() {
    const contact = phone.trim();
    if (!contact) {
      Alert.alert("Missing field", "Please enter your phone number.");
      return;
    }
    setLoading(true);
    try {
      // If we don't have a school slug yet (manual signup entry, not from login redirect),
      // run the lookup first to discover it.
      let slug = schoolSlug;
      if (!slug) {
        const { data: lookup } = await api.post("/api/auth/parent/lookup/", { phone: contact });
        if (lookup.action === "login") {
          // They already have an account — send back to login
          Alert.alert(
            "Account exists",
            "You already have an account. Please sign in instead.",
            [{ text: "Sign in", onPress: () => navigation?.navigate?.("Login") }]
          );
          return;
        }
        slug = lookup.school_slug;
        setSchoolSlug(slug);
      }

      await api.post("/api/auth/otp/request/", {
        contact,
        channel: "sms",
        role: "parent",
        school_slug: slug,
      });
      setOtpSent(true);
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Could not send OTP. Make sure your number is registered with your school.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1b: verify OTP ────────────────────────────────────────────────────

  async function handleVerifyOtp() {
    const contact = phone.trim();
    const code = otp.trim();
    if (!code) {
      Alert.alert("Missing field", "Please enter the OTP sent to your phone.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/otp/verify/", {
        contact,
        code,
        role: "parent",
        school_slug: schoolSlug,
      });

      // The backend has now created the ParentProfile and linked the student(s).
      setVerifiedData(data);
      setAuthToken(data.access); // needed for the complete-profile call in step 2

      if (data.needs_profile_completion) {
        setStep(2);
      } else {
        // Name already present (from pending_parent_name) — skip to bus picker
        setStep(3);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "The code you entered is incorrect or has expired.";
      Alert.alert("Invalid OTP", msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: save parent name ───────────────────────────────────────────────

  async function handleSaveName() {
    const name = parentName.trim();
    if (!name) {
      Alert.alert("Missing field", "Please enter your name.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/parent/complete-profile/", { name });
      setStep(3);
    } catch {
      Alert.alert("Error", "Could not save your name. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: finish (with or without bus selection) ─────────────────────────

  async function handleFinish() {
    const data = verifiedData!;
    const name = parentName.trim() || data.user?.name || "";

    if (selectedRouteId) {
      try {
        await api.post("/api/transport/parent/change-bus/", { routeId: selectedRouteId });
        setSelectedRoute(selectedRouteId);
      } catch {
        // Non-fatal — user can change bus from profile later
      }
    }

    login({
      name,
      school_slug: data.school_slug,
      token: data.access,
      routeId: selectedRouteId ?? undefined,
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const stepLabels: Record<Step, string> = {
    1: "Verify your phone",
    2: "Your name",
    3: "Pick a bus",
  };

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kav}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <SkippoLogo size={44} />
          <Text style={styles.kicker}>Skippo · Parent</Text>
          <Text style={styles.headline}>{stepLabels[step]}</Text>
          {step === 1 && params.childName ? (
            <Text style={styles.sub}>
              Welcome!{" "}
              <Text style={styles.childName}>{params.childName}</Text>
              {" "}is enrolled at your school.
            </Text>
          ) : null}
        </View>

        {/* ── Step dots ───────────────────────────────────────────────── */}
        <View style={styles.stepRow}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                i < step       && styles.stepDotDone,
                i === step - 1 && styles.stepDotCurrent,
              ]}
            />
          ))}
        </View>

        {/* ── Step 1: Phone + OTP ─────────────────────────────────────── */}
        {step === 1 && (
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Phone number</Text>
              <PhoneInput
                value={phone}
                onChangePhone={setPhone}
                editable={!otpSent}
              />
            </View>

            {otpSent && (
              <View style={styles.field}>
                <Text style={styles.label}>OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={palette.inkFaint}
                  keyboardType="number-pad"
                  secureTextEntry
                  value={otp}
                  onChangeText={setOtp}
                  autoFocus
                  maxLength={6}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={otpSent ? handleVerifyOtp : handleSendOtp}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>
                {loading
                  ? otpSent ? "Verifying…" : "Sending OTP…"
                  : otpSent ? "Verify & continue" : "Send OTP"}
              </Text>
            </TouchableOpacity>

            {otpSent && (
              <TouchableOpacity
                onPress={() => { setOtpSent(false); setOtp(""); }}
                activeOpacity={0.7}
                style={styles.linkRow}
              >
                <Text style={styles.linkText}>← Change number or resend</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Step 2: Parent name ──────────────────────────────────────── */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardSub}>
              We couldn't find your name in our records. Please enter it so teachers can identify you.
            </Text>
            <View style={styles.field}>
              <Text style={styles.label}>Your full name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Priya Sharma"
                placeholderTextColor={palette.inkFaint}
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
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>{loading ? "Saving…" : "Continue"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 3: Bus route picker ─────────────────────────────────── */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select your child's bus</Text>
            <Text style={styles.cardSub}>Optional — you can change this later from your profile.</Text>

            {routes.length === 0 && (
              <Text style={styles.emptyText}>No routes available yet.</Text>
            )}

            <FlatList
              data={routes}
              keyExtractor={(r) => String(r.id)}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
              renderItem={({ item }: { item: RouteOption }) => {
                const active = selectedRouteId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.routeCard, active && styles.routeCardActive]}
                    onPress={() => setLocalRouteId(item.id)}
                    activeOpacity={0.8}
                  >
                    {/* Blue left border accent when selected */}
                    {active && <View style={styles.routeCardAccent} />}

                    <View style={styles.routeInfo}>
                      <Text style={[styles.routeName, active && styles.routeNameActive]}>
                        {item.busLabel} · {item.name}
                      </Text>
                      <Text style={styles.routeDriver}>Driver: {item.driverName}</Text>
                      <Text style={styles.routeStops}>{item.stops.join("  ›  ")}</Text>
                    </View>

                    {active && (
                      <View style={styles.routeCheckBadge}>
                        <Text style={styles.routeCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleFinish}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>
                {loading ? "Setting up…" : selectedRouteId ? "Finish setup" : "Skip for now"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Back link ────────────────────────────────────────────────── */}
        {step > 1 && (
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => setStep((s) => (s - 1) as Step)}
          >
            <Text style={styles.linkText}>← Back</Text>
          </TouchableOpacity>
        )}

        {/* ── Sign-in link ─────────────────────────────────────────────── */}
        {step === 1 && (
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation?.navigate?.("Login")}
          >
            <Text style={styles.linkText}>
              Already have an account?{" "}
              <Text style={styles.linkBold}>Sign in →</Text>
            </Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: palette.canvas },
  kav:    { flex: 1, gap: spacing.lg },

  // Header
  header: { gap: spacing.xs, marginTop: spacing.md },
  kicker: {
    fontSize: 12, fontWeight: "700", color: palette.brand,
    textTransform: "uppercase", letterSpacing: 1.2, marginTop: spacing.sm,
  },
  headline:  { fontSize: 26, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  sub:       { fontSize: 14, color: palette.inkSoft, lineHeight: 20 },
  childName: { fontWeight: "700", color: palette.ink },

  // Step dots
  stepRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  stepDot: {
    width: 8, height: 8, borderRadius: 99,
    backgroundColor: palette.stroke,
  },
  stepDotDone:    { backgroundColor: palette.brandMid, width: 24 },
  stepDotCurrent: { backgroundColor: palette.brand, width: 24 },

  // Card
  card: {
    backgroundColor: palette.surface, borderRadius: 20,
    borderWidth: 1, borderColor: palette.stroke,
    padding: spacing.lg, gap: spacing.md,
    shadowColor: palette.brand, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: palette.ink },
  cardSub:   { fontSize: 13, color: palette.inkSoft, lineHeight: 19 },

  // Fields
  field: { gap: spacing.xs },
  label: {
    fontSize: 11, fontWeight: "700", color: palette.inkSoft,
    textTransform: "uppercase", letterSpacing: 0.8,
  },
  input: {
    backgroundColor: palette.surfaceMuted, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    fontSize: 15, color: palette.ink,
    borderWidth: 1, borderColor: palette.stroke,
  },

  // Button
  btn: {
    backgroundColor: palette.brand, borderRadius: 12,
    alignItems: "center", paddingVertical: 16,
    shadowColor: palette.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 10, elevation: 4,
  },
  btnDisabled: { opacity: 0.45 },
  btnText:     { color: "#fff", fontWeight: "800", fontSize: 15 },

  // Empty / links
  emptyText: { fontSize: 13, color: palette.inkSoft, textAlign: "center", paddingVertical: spacing.sm },
  linkRow:   { alignItems: "center", paddingVertical: spacing.sm },
  linkText:  { fontSize: 13, color: palette.inkSoft },
  linkBold:  { color: palette.brand, fontWeight: "700" },

  // Route cards
  routeCard: {
    flexDirection: "row", alignItems: "center",
    padding: spacing.md, borderRadius: 14,
    borderWidth: 1.5, borderColor: palette.stroke,
    backgroundColor: palette.surface, gap: spacing.sm,
    overflow: "hidden",
  },
  routeCardActive: {
    borderColor: palette.brand,
    backgroundColor: palette.brandSoft,
  },
  routeCardAccent: {
    position: "absolute", left: 0, top: 0, bottom: 0,
    width: 4, backgroundColor: palette.brand,
    borderTopLeftRadius: 14, borderBottomLeftRadius: 14,
  },
  routeInfo:       { flex: 1, gap: 2 },
  routeName:       { fontSize: 14, fontWeight: "800", color: palette.ink },
  routeNameActive: { color: palette.brandDeep },
  routeDriver:     { fontSize: 12, color: palette.inkSoft },
  routeStops:      { fontSize: 11, color: palette.inkFaint, marginTop: 2 },
  routeCheckBadge: {
    width: 24, height: 24, borderRadius: 99,
    backgroundColor: palette.brand,
    alignItems: "center", justifyContent: "center",
  },
  routeCheckText: { color: "#fff", fontSize: 13, fontWeight: "900" },
});
