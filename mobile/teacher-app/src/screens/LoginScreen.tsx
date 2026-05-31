import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
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
import { Screen } from "../components/Screen";
import { SkippoLogo } from "../components/SkippoLogo";
import { PrimaryButton } from "../components/PrimaryButton";
import { api, setAuthToken } from "../lib/api";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { radius, spacing } from "../theme/spacing";

WebBrowser.maybeCompleteAuthSession();

// Phases:
//   "phone" – enter phone, run lookup to get school_slug
//   "otp"   – verify OTP sent to that phone
type Phase = "phone" | "otp";

const extra = Constants.expoConfig?.extra ?? {};

export function LoginScreen({ navigation }: { navigation?: any }) {
  const login = useTeacherSessionStore((s) => s.login);

  const [phase, setPhase]         = useState<Phase>("phone");
  const [phone, setPhone]         = useState("");
  const [schoolSlug, setSchoolSlug] = useState("");
  const [otp, setOtp]             = useState("");
  const [otpError, setOtpError]   = useState("");
  const [loading, setLoading]     = useState(false);

  // Stored Google ID token — set when Google needs phone verification.
  // Auto-linked after OTP succeeds.
  const [pendingGoogleIdToken, setPendingGoogleIdToken] = useState<string | null>(null);

  // ── Google OAuth setup ─────────────────────────────────────────────────────

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    clientId:        extra.googleWebClientId     || undefined,
    iosClientId:     extra.googleIosClientId     || undefined,
    androidClientId: extra.googleAndroidClientId || undefined,
  });

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const idToken = googleResponse.params?.id_token;
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
      const { data } = await api.post("/api/auth/teacher/google/", { id_token: idToken });

      if (data.needs_phone) {
        setPendingGoogleIdToken(idToken);
        setPhase("phone");
        Alert.alert(
          "One more step",
          "We couldn't find an account linked to your Google email. Enter your registered phone number to continue.",
        );
      } else {
        // Direct login
        login({
          name: data.name,
          token: data.access,
          school_slug: data.school_slug,
          school_name: data.school_name,
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Google Sign-In failed. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Phase 1: look up phone to get school_slug, then request OTP ───────────

  async function handleLookupAndRequestOtp() {
    const contact = phone.trim();
    if (!contact) {
      Alert.alert("Missing field", "Please enter your phone number.");
      return;
    }
    setLoading(true);
    try {
      // Step 1: lookup → school_slug
      const { data: lookupData } = await api.post("/api/auth/teacher/lookup/", { phone: contact });
      const slug = lookupData.school_slug as string;
      setSchoolSlug(slug);

      // Step 2: request OTP with the resolved school_slug
      await api.post("/api/auth/otp/request/", {
        contact,
        channel: "sms",
        role: "teacher",
        school_slug: slug,
      });
      setPhase("otp");
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        status === 404
          ? "No teacher account found for this number. Contact your school admin."
          : (err?.response?.data?.detail ?? "Something went wrong. Please try again.");
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Phase 2: verify OTP ────────────────────────────────────────────────────

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
        role: "teacher",
        school_slug: schoolSlug,
      });

      // If we have a pending Google token, link it before completing login
      if (pendingGoogleIdToken) {
        setAuthToken(data.access);
        try {
          await api.post("/api/auth/teacher/google/link-account/", {
            id_token: pendingGoogleIdToken,
          });
        } catch {
          // Non-fatal: teacher is logged in, Google link can be retried later
        }
        setPendingGoogleIdToken(null);
      }

      login({
        name: data.name,
        token: data.access,
        school_slug: data.school_slug,
        school_name: data.school_name,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "The code you entered is incorrect or has expired.";
      setOtpError(msg);
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
        role: "teacher",
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

  const googleConfigured = !!(extra.googleWebClientId || extra.googleIosClientId || extra.googleAndroidClientId);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.kav}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <SkippoLogo size={48} />
          <Text style={styles.kicker}>Skippo · Teacher</Text>
          <Text style={styles.headline}>Your classroom,{"\n"}always in sync.</Text>
          <Text style={styles.sub}>
            Mark attendance, add parent-visible progress notes, and close out every session in seconds.
          </Text>
        </View>

        {/* Stat pills */}
        <View style={styles.pills}>
          {[
            { label: "Attendance", value: "Real-time" },
            { label: "Parent feed", value: "Instant" },
            { label: "Sessions", value: "All classes" },
          ].map((p) => (
            <View key={p.label} style={styles.pill}>
              <Text style={styles.pillValue}>{p.value}</Text>
              <Text style={styles.pillLabel}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>{phase === "otp" ? "Enter OTP" : "Sign in to your account"}</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +91 98000 00000"
              placeholderTextColor={palette.inkDim}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              editable={phase === "phone"}
            />
          </View>

          {phase === "otp" && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>One-time password</Text>
              <TextInput
                style={[styles.input, otpError ? styles.inputError : null]}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor={palette.inkDim}
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

          <PrimaryButton
            label={
              loading
                ? phase === "otp" ? "Verifying…" : "Checking…"
                : phase === "otp" ? "Verify & sign in" : "Send OTP"
            }
            onPress={phase === "otp" ? handleVerifyOtp : handleLookupAndRequestOtp}
            loading={loading}
          />

          {phase === "otp" && (
            <View style={styles.secondaryRow}>
              <TouchableOpacity
                onPress={() => { setPhase("phone"); setOtp(""); setOtpError(""); }}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryText}>← Change number</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleResendOtp} activeOpacity={0.7} disabled={loading}>
                <Text style={styles.secondaryText}>Resend OTP</Text>
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
                style={[styles.googleBtn, (loading || !googleRequest) && styles.googleBtnDisabled]}
                onPress={() => promptGoogleAsync()}
                disabled={loading || !googleRequest}
                activeOpacity={0.85}
              >
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Invite signup link */}
        {phase === "phone" && (
          <TouchableOpacity
            style={styles.inviteLink}
            onPress={() => navigation?.navigate?.("InviteSignup")}
            activeOpacity={0.7}
          >
            <Text style={styles.inviteLinkText}>
              New teacher? <Text style={styles.inviteLinkBold}>Sign up with an invite link →</Text>
            </Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, gap: spacing.lg },
  headerBlock: { gap: spacing.sm, marginTop: spacing.md },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.brand,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  headline: {
    fontSize: 36,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.8,
    lineHeight: 42,
  },
  sub: {
    fontSize: 15,
    color: palette.inkSoft,
    lineHeight: 22,
    fontWeight: "400",
  },
  pills: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    alignItems: "center",
    gap: 2,
  },
  pillValue: {
    fontSize: 13,
    fontWeight: "800",
    color: palette.brand,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  form: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.lg,
    gap: spacing.md,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.ink,
    marginBottom: spacing.xs,
  },
  field: { gap: spacing.xs },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: palette.ink,
    fontSize: 15,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  inputError: { borderColor: palette.danger, backgroundColor: "#fff5f5" },
  errorText:  { fontSize: 12, color: palette.danger, fontWeight: "600", marginTop: 2 },
  secondaryRow: { flexDirection: "row", justifyContent: "space-between" },
  secondaryText: { fontSize: 13, color: palette.inkSoft, textAlign: "center" },

  // Divider
  dividerRow:  { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: palette.stroke },
  dividerText: { fontSize: 12, color: palette.inkSoft, fontWeight: "600" },

  // Google button
  googleBtn: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: palette.stroke,
    alignItems: "center",
    paddingVertical: 14,
  },
  googleBtnDisabled: { opacity: 0.55 },
  googleBtnText: { color: palette.ink, fontWeight: "700", fontSize: 15 },

  inviteLink: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  inviteLinkText: {
    fontSize: 13,
    color: palette.inkSoft,
  },
  inviteLinkBold: {
    color: palette.brand,
    fontWeight: "700",
  },
});
