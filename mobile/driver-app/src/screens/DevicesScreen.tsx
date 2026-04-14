import { StyleSheet, Text, View } from "react-native";

import { ActionCard } from "../components/ActionCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useDriverDevices } from "../hooks/useDriverSupportData";
import { useDriverSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function DevicesScreen() {
  const { data } = useDriverDevices();
  const logout = useDriverSessionStore((state) => state.logout);

  if (!data) {
    return null;
  }

  return (
    <Screen>
      <SectionTitle title="Devices and Session" subtitle="Driver OTP supports up to two active devices" />
      {data.map((device) => (
        <ActionCard key={device.id} title={device.label} subtitle={device.platform}>
          <View style={styles.row}>
            <Text style={styles.tag}>{device.isCurrent ? "Current device" : "Secondary device"}</Text>
            {!device.isCurrent ? <PrimaryButton label="Revoke" variant="muted" /> : null}
          </View>
        </ActionCard>
      ))}
      <PrimaryButton label="Log out" onPress={logout} variant="muted" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  tag: {
    fontSize: 13,
    fontWeight: "800",
    color: palette.brandDeep,
  },
});
