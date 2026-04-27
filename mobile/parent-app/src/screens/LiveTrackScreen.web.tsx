// ---------------------------------------------------------------------------
// LiveTrackScreen.web.tsx – web-safe version of the live tracking screen.
// react-native-maps has no web implementation so this file is resolved
// instead when Metro bundles for the web platform.
// ---------------------------------------------------------------------------

import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useDriverContact, useParentDashboard, useTripTracking } from "../hooks/useParentDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function LiveTrackScreen() {
  const { data } = useParentDashboard();
  const tracking  = useTripTracking(data?.trip?.id);
  const { data: driverContact } = useDriverContact();

  if (!data) return null;

  const location = tracking.data?.result?.latest_location ?? data.trip.busLocation;
  const isLive   = data.trip.status === "active" || data.trip.status === "arriving";

  function callDriver() {
    if (driverContact?.phone) {
      Linking.openURL(`tel:${driverContact.phone.replace(/\s/g, "")}`);
    }
  }

  return (
    <Screen>
      <SectionTitle
        title="Live Tracking"
        subtitle={`${data.trip.busLabel} · ${data.trip.routeName}`}
      />

      {/* ── Map placeholder ─────────────────────────────────────────────── */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapPinRing}>
          <Text style={styles.mapPinEmoji}>📍</Text>
        </View>
        <Text style={styles.mapPlaceholderTitle}>
          {isLive ? "Bus is live" : "No active trip"}
        </Text>
        <Text style={styles.mapPlaceholderSub}>
          {isLive
            ? `Lat ${location.latitude.toFixed(4)}, Lng ${location.longitude.toFixed(4)}`
            : "Open the mobile app to view the live map"}
        </Text>
        {isLive && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveDot}>●</Text>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* ── Trip summary ─────────────────────────────────────────────────── */}
      <InfoCard title="Trip details" subtitle="Updated every minute">
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailValue}>{data.trip.etaMinutes} min</Text>
            <Text style={styles.detailLabel}>ETA</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailValue}>{location.speed ?? 0} km/h</Text>
            <Text style={styles.detailLabel}>Speed</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailValue}>{data.trip.status.toUpperCase()}</Text>
            <Text style={styles.detailLabel}>Status</Text>
          </View>
        </View>
        <Text style={styles.lastUpdate}>
          Last update: {location.created_at ?? location.updatedAt}
        </Text>
      </InfoCard>

      {/* ── Driver contact ───────────────────────────────────────────────── */}
      {driverContact && (
        <InfoCard title="Driver contact" subtitle="Available during the trip">
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
            <TouchableOpacity onPress={callDriver} activeOpacity={0.85} style={styles.callBtn}>
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        </InfoCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapPlaceholder: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.stroke,
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.brandSoft,
    gap: spacing.sm,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  mapPinRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.brandMid,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  mapPinEmoji: { fontSize: 28 },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.brand,
    textAlign: "center",
  },
  mapPlaceholderSub: {
    fontSize: 13,
    color: palette.inkSoft,
    textAlign: "center",
    lineHeight: 19,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(79,70,229,0.15)",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: palette.brandMid,
    marginTop: spacing.xs,
  },
  liveDot:  { fontSize: 8, color: "#86efac" },
  liveText: { fontSize: 11, fontWeight: "800", color: palette.brand, letterSpacing: 1 },
  detailRow:  { flexDirection: "row", gap: spacing.sm },
  detailItem: {
    flex: 1,
    backgroundColor: palette.brandSoft,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: palette.brandMid,
  },
  detailValue: { fontSize: 18, fontWeight: "900", color: palette.brand, letterSpacing: -0.5 },
  detailLabel: { fontSize: 10, color: palette.inkSoft, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: "600" },
  lastUpdate:  { fontSize: 12, color: palette.inkFaint, marginTop: spacing.xs },
  driverRow:   { flexDirection: "row", alignItems: "center", gap: spacing.md },
  driverAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: palette.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  driverAvatarText: { fontSize: 15, fontWeight: "900", color: "#fff" },
  driverName:    { fontSize: 15, fontWeight: "800", color: palette.ink },
  driverVehicle: { fontSize: 12, color: palette.inkSoft, marginTop: 1 },
  callBtn: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: palette.brand,
  },
  callBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
