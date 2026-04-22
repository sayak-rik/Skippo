// ---------------------------------------------------------------------------
// LiveTrackScreen – real-time bus map + driver contact (req 4).
// Polls the tracking API every 60 s (req 1) via useTripTracking's
// refetchInterval so the map marker always reflects the latest driver ping.
// ---------------------------------------------------------------------------

import { LinearGradient } from "expo-linear-gradient";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useDriverContact, useParentDashboard, useTripTracking } from "../hooks/useParentDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

export function LiveTrackScreen() {
  const { data } = useParentDashboard();
  const tracking = useTripTracking(data?.trip?.id);
  const { data: driverContact } = useDriverContact();

  if (!data) return null;

  // Prefer the freshest ping from the tracking endpoint; fall back to dashboard data
  const location = tracking.data?.result?.latest_location ?? data.trip.busLocation;
  const isLive = data.trip.status === "active" || data.trip.status === "arriving";

  function callDriver() {
    if (driverContact?.phone) {
      Linking.openURL(`tel:${driverContact.phone.replace(/\s/g, "")}`);
    }
  }

  return (
    <Screen scroll={false}>
      <SectionTitle
        title="Live Tracking"
        subtitle={`${data.trip.busLabel} · ${data.trip.routeName}`}
      />

      {/* ── Map ────────────────────────────────────────────────────────── */}
      <View style={styles.mapShell}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
        >
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title={data.trip.busLabel}
            description={`ETA: ${data.trip.etaMinutes} min`}
          />
        </MapView>

        {/* Live badge overlay */}
        {isLive && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveDot}>●</Text>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* ── Trip summary ──────────────────────────────────────────────── */}
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

      {/* ── Driver contact (req 4) ──────────────────────────────────────── */}
      {driverContact && (
        <InfoCard title="Driver contact" subtitle="Available during the trip">
          <View style={styles.driverRow}>
            <LinearGradient
              colors={["#4f46e5", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.driverAvatar}
            >
              <Text style={styles.driverAvatarText}>
                {driverContact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driverContact.name}</Text>
              <Text style={styles.driverVehicle}>{driverContact.vehicleLabel}</Text>
            </View>
            <TouchableOpacity onPress={callDriver} activeOpacity={0.85}>
              <LinearGradient
                colors={["#4f46e5", "#7c3aed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.callBtn}
              >
                <Text style={styles.callBtnText}>Call</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </InfoCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.stroke,
    flex: 1,
    minHeight: 300,
    position: "relative",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  map: { flex: 1 },
  liveBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  liveDot: { fontSize: 8, color: "#86efac" },
  liveText: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  detailRow: { flexDirection: "row", gap: spacing.sm },
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
  lastUpdate: { fontSize: 12, color: palette.inkFaint, marginTop: spacing.xs },
  driverRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  driverAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  driverAvatarText: { fontSize: 15, fontWeight: "900", color: "#fff" },
  driverName: { fontSize: 15, fontWeight: "800", color: palette.ink },
  driverVehicle: { fontSize: 12, color: palette.inkSoft, marginTop: 1 },
  callBtn: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
