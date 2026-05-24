import { LogOut, Monitor, ShieldAlert, Smartphone, Trash2 } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Screen } from "../components/Screen";
import { useDriverDevices } from "../hooks/useDriverSupportData";
import { useDriverSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function DevicesScreen() {
  const { data } = useDriverDevices();
  const logout = useDriverSessionStore((state) => state.logout);

  if (!data) return null;

  return (
    <Screen>
      <View style={{ paddingTop: spacing.sm }}>
        <Text style={styles.title}>Devices & Session</Text>
        <Text style={styles.subtitle}>Up to 2 active devices allowed</Text>
      </View>

      <View style={styles.infoCard}>
        <ShieldAlert size={18} color={palette.brand} strokeWidth={2} />
        <Text style={styles.infoText}>
          Your account supports up to 2 simultaneous devices. Revoke access from old devices if you
          change your phone.
        </Text>
      </View>

      {data.map((device) => (
        <View key={device.id} style={[styles.deviceCard, device.isCurrent && styles.deviceCardActive]}>
          <View style={[styles.deviceIconWrap, { backgroundColor: device.isCurrent ? palette.brandSoft : palette.surfaceMuted }]}>
            {device.platform.toLowerCase().includes("android") || device.platform.toLowerCase().includes("ios")
              ? <Smartphone size={22} color={device.isCurrent ? palette.brand : palette.inkSoft} strokeWidth={2} />
              : <Monitor size={22} color={device.isCurrent ? palette.brand : palette.inkSoft} strokeWidth={2} />
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.deviceLabel}>{device.label}</Text>
            <Text style={styles.devicePlatform}>{device.platform}</Text>
          </View>
          {device.isCurrent
            ? <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>Current</Text></View>
            : (
              <TouchableOpacity style={styles.revokeBtn} activeOpacity={0.8}>
                <Trash2 size={15} color={palette.danger} strokeWidth={2} />
                <Text style={styles.revokeBtnText}>Revoke</Text>
              </TouchableOpacity>
            )
          }
        </View>
      ))}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
        <LogOut size={18} color={palette.danger} strokeWidth={2} />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", color: palette.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: palette.inkSoft, marginTop: 2 },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: palette.brandSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.brandMid,
    padding: spacing.md,
  },
  infoText: { flex: 1, fontSize: 13, color: palette.brandDeep, lineHeight: 20 },
  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: spacing.md,
    shadowColor: "#4449CC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  deviceCardActive: { borderColor: palette.brandMid },
  deviceIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceLabel: { fontSize: 14, fontWeight: "700", color: palette.ink },
  devicePlatform: { fontSize: 12, color: palette.inkSoft, marginTop: 2 },
  currentBadge: {
    backgroundColor: palette.brandSoft,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: palette.brandMid,
  },
  currentBadgeText: { fontSize: 11, fontWeight: "700", color: palette.brand },
  revokeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.dangerSoft,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  revokeBtnText: { fontSize: 12, fontWeight: "700", color: palette.danger },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: palette.dangerSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 15,
    marginTop: spacing.sm,
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: palette.danger },
});
