import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

WebBrowser.maybeCompleteAuthSession();

interface Props {
  loading: boolean;
  onToken: (idToken: string) => void;
  onError: (message: string) => void;
}

export function GoogleSignInButton({ loading, onToken, onError }: Props) {
  const extra = Constants.expoConfig?.extra ?? {};

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
        onToken(idToken);
      } else {
        onError("Could not retrieve identity token from Google.");
      }
    } else if (googleResponse?.type === "error") {
      onError("Sign-in was cancelled or failed.");
    }
  }, [googleResponse]);

  const configured = !!(extra.googleWebClientId || extra.googleIosClientId || extra.googleAndroidClientId);
  if (!configured) return null;

  return (
    <>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      <TouchableOpacity
        style={[styles.googleBtn, (loading || !googleRequest) && styles.disabled]}
        onPress={() => promptGoogleAsync()}
        disabled={loading || !googleRequest}
        activeOpacity={0.85}
      >
        <Text style={styles.googleBtnText}>Continue with Google</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  dividerRow:  { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: palette.stroke },
  dividerText: { fontSize: 12, color: palette.inkSoft, fontWeight: "600" },
  googleBtn: {
    backgroundColor: palette.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: palette.stroke,
    alignItems: "center", paddingVertical: 14,
  },
  disabled:      { opacity: 0.55 },
  googleBtnText: { color: palette.ink, fontWeight: "700", fontSize: 15 },
});
