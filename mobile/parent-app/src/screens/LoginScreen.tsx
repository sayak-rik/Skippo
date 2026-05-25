import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { KeyRound, LogIn, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
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
import { useSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

WebBrowser.maybeCompleteAuthSession();

// Phases this screen moves through:
//   "phone"         – enter number and run lookup (login vs signup decision)
//   "otp"           – enter OTP sent for an existing parent (login path)
//   "complete_name" – existing parent logged in but has no display name yet
type Phase = "phone" | "otp" | "complete_name";

const extra = Constants.expoConfig?.extra ?? {};

export function LoginScreen({ navigation }: { navigation?: any }) {
  const login = useSessionStore((s) => s.login);

  const [phase, setPhase]               = useState<Phase>("phone");
  const [phone, setPhone]               = useState("");
  const [schoolSlug, setSchoolSlug]     = useState("");
  const [otp, setOtp]                   = useState("");
  const [otpError, setOtpError]         = useState("");
  const [parentName, setParentName]     = useState("");
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  // Stored Google ID token — set when Google auth needs phone verification.
  // After phone OTP succeeds, this triggers the link-account call.
  const [pendingGoogleIdToken, setPendingGoogleIdToken] = useState<string | null>(null);

  // ── Google OAuth setup ─────────────────────────────────────────────────────

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId:        extra.googleWebClientId     || undefined,
    iosClientId:     extra.googleIosClientId     || undefined,
    androidClientId: extra.googleAndroidClientId || undefined,
    scopes: ["openid", "profile", "email"],
  });

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        handleGoogleToken(idToken);
      } else {
        Alert.alert("Google Sign-In", "Could not retrieve identity token from Google.");
      }
    } else if (googleResponse?.type === "error") {
      Alert.alert("Google Sign-In", "Sign-in was cancelled or failed.");
    }
  }, [googleResponse]);

  // ── Google: exchange token with backend ────────────────────────────────────

  async function handleGoogleToken(idToken: string) {
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/parent/google/", { id_token: idToken });

      if (data.needs_phone) {
        // Google account is new — collect phone to complete setup
        setPendingGoogleIdToken(idToken);
        // Pre-fill name from Google if available
        if (data.google_data?.name) {
          setParentName(data.google_data.name);
        }
        setPhase("phone");
        Alert.alert(
          "One more step",
          "We couldn't find an account linked to your Google email. Please enter your registered phone number to continue.",
        );
      } else {
        // Direct login — Google account already known
        if (data.needs_profile_completion) {
          setVerifiedData(data);
          setAuthToken(data.access);
          setPhase("complete_name");
        } else {
          login({ name: data.user.name, school_slug: data.school_slug, token: data.access });
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Google Sign-In failed. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Phase 1: look up the phone number ─────────────────────────────────────

  async function handleLookup() {
    const contact = phone.trim();
    if (!contact) {
      Alert.alert("Missing field", "Please enter your phone number.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/parent/lookup/", { phone: contact });

      if (data.action === "signup") {
        // Phone is in the system as a pending parent — go to signup screen
        navigation?.navigate?.("Signup", {
          phone: contact,
          schoolSlug: data.school_slug,
          childName: data.child_name ?? "",
          pendingParentName: data.pending_parent_name ?? "",
        });
        return;
      }

      // action === "login" — send OTP immediately and move to OTP phase
      setSchoolSlug(data.school_slug);
      await api.post("/api/auth/otp/request/", {
        contact,
        channel: "sms",
        role: "parent",
        school_slug: data.school_slug,
      });
      setPhase("otp");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        // Phone not in the system at all — guide them through the discovery signup flow
        navigation?.navigate?.("NewParent", { phone: contact });
      } else {
        const msg = err?.response?.data?.detail ?? "Something went wrong. Please try again.";
        Alert.alert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Phase 2: verify OTP (login path) ──────────────────────────────────────

  async function handleVerifyOtp() {
    const contact = phone.trim();
    const code = otp.trim();
    if (!code) {
      Alert.alert("Missing field", "Please enter the OTP.");
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

      // If we have a pending Google token, link it now before completing login
      if (pendingGoogleIdToken) {
        setAuthToken(data.access);
        try {
          await api.post("/api/auth/parent/google/link-account/", {
            id_token: pendingGoogleIdToken,
          });
        } catch {
          // Non-fatal: user is logged in, Google link can be retried from profile
        }
        setPendingGoogleIdToken(null);
      }

      if (data.needs_profile_completion) {
        setVerifiedData(data);
        setAuthToken(data.access);
        setPhase("complete_name");
      } else {
        login({ name: data.user.name, school_slug: data.school_slug, token: data.access });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "The code you entered is incorrect or has expired.";
      setOtpError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Phase 3: save name for incomplete profiles ─────────────────────────────

  async function handleCompleteName() {
    const name = parentName.trim();
    if (!name) {
      Alert.alert("Missing field", "Please enter your name.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/parent/complete-profile/", { name });
      login({
        name,
        school_slug: verifiedData.school_slug,
        token: verifiedData.access,
      });
    } catch {
      Alert.alert("Error", "Could not save your name. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Resend OTP ─────────────────────────────────────────────────────────────

  async function handleResendOtp() {
    setLoading(true);
    try {
      await api.post("/api/auth/otp/request/", {
        contact: phone.trim(),
        channel: "sms",
        role: "parent",
        school_slug: schoolSlug,
      });
      setOtp("");
      Alert.alert("OTP resent", "A new code has been sent to your phone.");
    } catch {
      Alert.alert("Error", "Could not resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const primaryAction =
    phase === "phone"         ? handleLookup      :
    phase === "otp"           ? handleVerifyOtp   :
                                handleCompleteName;

  const primaryLabel =
    loading
      ? phase === "phone"         ? "Checking…"        :
        phase === "otp"           ? "Verifying…"       :
                                    "Saving…"
      : phase === "phone"         ? "Continue"         :
        phase === "otp"           ? "Verify & sign in" :
                                    "Save & continue";

  const formTitle =
    phase === "phone"         ? "Sign in"           :
    phase === "otp"           ? "Enter OTP"         :
                                "What's your name?";

  const FieldIcon =
    phase === "complete_name" ? User    :
    phase === "otp"           ? KeyRound :
                                LogIn;

  const googleConfigured = !!(extra.googleWebClientId || extra.googleIosClientId || extra.googleAndroidClientId);

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kav}
      >
        {/* ── Brand hero ──────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <SkippoLogo size={52} />
          <Text style={styles.kicker}>Skippo · Parent</Text>
          <Text style={styles.headline}>Sign in</Text>
        </View>

        {/* ── Stat pills ──────────────────────────────────────────────── */}
        <View style={styles.pills}>
          {[
            { value: "Live",    label: "Bus tracking" },
            { value: "Instant", label: "Alerts"       },
            { value: "Daily",   label: "Reports"      },
          ].map((p) => (
            <View key={p.label} style={styles.pill}>
              <Text style={styles.pillValue}>{p.value}</Text>
              <Text style={styles.pillLabel}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Form card ───────────────────────────────────────────────── */}
        <View style={styles.form}>
          {/* Blue top accent bar */}
          <View style={styles.formAccent} />

          {/* Card title row */}
          <View style={styles.formTitleRow}>
            <FieldIcon size={16} color={palette.brand} strokeWidth={2.5} />
            <Text style={styles.formTitle}>{formTitle}</Text>
          </View>

          {/* Phone field — visible in phone + otp phases */}
          {phase !== "complete_name" && (
            <View style={styles.field}>
              <Text style={styles.label}>Phone number</Text>
              <PhoneInput
                value={phone}
                onChangePhone={setPhone}
                editable={phase === "phone"}
              />
            </View>
          )}

          {/* OTP field */}
          {phase === "otp" && (
            <View style={styles.field}>
              <Text style={styles.label}>One-time password</Text>
              <TextInput
                style={[styles.input, otpError ? styles.inputError : null]}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor={palette.inkFaint}
                keyboardType="number-pad"
                secureTextEntry
                value={otp}
                onChangeText={(v) => { setOtp(v); setOtpError(""); }}
                autoFocus
                maxLength={6}
              />
              {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
            </View>
          )}

          {/* Name field — complete_name phase only */}
          {phase === "complete_name" && (
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
              <Text style={styles.hint}>This is how teachers will identify you.</Text>
            </View>
          )}

          {/* Primary CTA */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={primaryAction}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{primaryLabel}</Text>
          </TouchableOpacity>

          {/* OTP phase secondary actions */}
          {phase === "otp" && (
            <View style={styles.secondaryRow}>
              <TouchableOpacity
                onPress={() => { setPhase("phone"); setOtp(""); }}
                activeOpacity={0.7}
              >
                <Text style={styles.resendText}>← Change number</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleResendOtp} activeOpacity={0.7} disabled={loading}>
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Google Sign-In — only on phone phase */}
          {phase === "phone" && googleConfigured && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              <TouchableOpacity
                style={[styles.googleBtn, (loading || !googleRequest) && styles.btnDisabled]}
                onPress={() => promptGoogleAsync()}
                disabled={loading || !googleRequest}
                activeOpacity={0.85}
              >
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Signup link — only on phone phase ───────────────────────── */}
        {phase === "phone" && (
          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => navigation?.navigate?.("NewParent")}
            activeOpacity={0.7}
          >
            <Text style={styles.signupText}>
              New parent?{" "}
              <Text style={styles.signupBold}>Create your account →</Text>
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

  // Hero
  hero: { gap: spacing.xs, marginTop: spacing.md, alignItems: "flex-start" },
  kicker: {
    fontSize: 12, fontWeight: "700", color: palette.brand,
    textTransform: "uppercase", letterSpacing: 1.5, marginTop: spacing.sm,
  },
  headline: {
    fontSize: 34, fontWeight: "900", color: palette.ink,
    letterSpacing: -1, lineHeight: 40,
  },

  // Stat pills
  pills: { flexDirection: "row", gap: spacing.sm },
  pill: {
    flex: 1, backgroundColor: palette.surface, borderRadius: 16,
    borderWidth: 1, borderColor: palette.stroke,
    padding: spacing.md, alignItems: "center", gap: 3,
    shadowColor: palette.brand, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 1,
  },
  pillValue: { fontSize: 13, fontWeight: "900", color: palette.brand, letterSpacing: -0.3 },
  pillLabel: {
    fontSize: 10, fontWeight: "600", color: palette.inkSoft,
    textTransform: "uppercase", letterSpacing: 0.5,
  },

  // Form card
  form: {
    backgroundColor: palette.surface, borderRadius: 20,
    borderWidth: 1, borderColor: palette.stroke,
    padding: spacing.lg, gap: spacing.md, overflow: "hidden",
    shadowColor: palette.brand, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09, shadowRadius: 20, elevation: 4,
  },
  formAccent: {
    position: "absolute", top: 0, left: 0, right: 0, height: 3,
    backgroundColor: palette.brand,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  formTitleRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.xs,
    marginTop: spacing.xs,
  },
  formTitle: { fontSize: 17, fontWeight: "800", color: palette.ink, letterSpacing: -0.2 },

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
  hint: { fontSize: 12, color: palette.inkSoft },
  inputError: { borderColor: palette.danger, backgroundColor: "#fff5f5" },
  errorText: { fontSize: 12, color: palette.danger, fontWeight: "600", marginTop: 2 },

  // Primary button
  btn: {
    backgroundColor: palette.brand, borderRadius: 12,
    alignItems: "center", paddingVertical: 16, marginTop: spacing.xs,
    shadowColor: palette.brand, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.2 },

  // OTP secondary row
  secondaryRow: { flexDirection: "row", justifyContent: "space-between" },
  resendText:   { fontSize: 13, color: palette.inkSoft },

  // Divider
  dividerRow:  { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: palette.stroke },
  dividerText: { fontSize: 12, color: palette.inkSoft, fontWeight: "600" },

  // Google button
  googleBtn: {
    backgroundColor: palette.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: palette.stroke,
    alignItems: "center", paddingVertical: 14,
  },
  googleBtnText: { color: palette.ink, fontWeight: "700", fontSize: 15 },

  // Signup link
  signupLink: { alignItems: "center", paddingVertical: spacing.sm },
  signupText: { fontSize: 13, color: palette.inkSoft },
  signupBold: { color: palette.brand, fontWeight: "700" },
});
