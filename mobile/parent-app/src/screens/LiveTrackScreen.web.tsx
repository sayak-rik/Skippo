// ---------------------------------------------------------------------------
// LiveTrackScreen.web.tsx – web-safe version of the live tracking screen.
// react-native-maps has no web implementation so this file is resolved
// instead when Metro bundles for the web platform.
// ---------------------------------------------------------------------------

import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Bus, Navigation, Phone } from "lucide-react-native";

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

  if (!data.trip || !data.trip.busLocation) {
    return (
      <Screen>
        <SectionTitle title="Live Tracking" subtitle="No active trip right now" />
        <View style={webStyles.emptyState}>
          <View style={webStyles.emptyIconRing}>
            <Bus size={32} color={palette.inkSoft} strokeWidth={1.5} />
          </View>
          <Text style={webStyles.emptyTitle}>Bus isn't on the road</Text>
          <Text style={webStyles.emptySub}>
            Live tracking will appear here once your child's bus starts a trip.
          </Text>
        </View>
      </Screen>
    );
  }

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
        <View style={styles.busIconRing}>
          <Bus size={32} color={palette.brand} strokeWidth={2} />
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
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* ── Trip info overlay card ────────────────────────────────────────── */}
      <View style={styles.overlayCard}>
        <View style={styles.detailRow}>
          <View style={styles.etaBadge}>
            <Navigation size={13} color="#fff" strokeWidth={2.5} />
            <Text style={styles.etaBadgeText}>{data.trip.etaMinutes} min away</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, isLive && styles.statusDotLive]} />
            <Text style={styles.statusPillText}>{data.trip.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.trip.etaMinutes} min</Text>
            <Text style={styles.statLabel}>ETA</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{location.speed ?? 0} km/h</Text>
            <Text style={styles.statLabel}>Speed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.trip.busLabel}</Text>
            <Text style={styles.statLabel}>Bus</Text>
          </View>
        </View>

        <Text style={styles.lastUpdate}>
          Last update: {location.created_at ?? location.updatedAt}
        </Text>
      </View>

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
              <Phone size={15} color="#fff" strokeWidth={2.5} />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        </InfoCard>
      )}
    </Screen>
  );
}

const webStyles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1.5,
    borderColor: palette.stroke,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: palette.ink, textAlign: "center" },
  emptySub:   { fontSize: 13, color: palette.inkSoft, textAlign: "center", lineHeight: 20 },
});

const styles = StyleSheet.create({
  // Map placeholder
  mapPlaceholder: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.brandMid,
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.brandSoft,
    gap: spacing.sm,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  busIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.brandMid,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: spacing.xs,
  },
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
    backgroundColor: "rgba(37,99,235,0.12)",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: palette.brandMid,
    marginTop: spacing.xs,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  liveText: { fontSize: 11, fontWeight: "800", color: palette.brand, letterSpacing: 1 },

  // Overlay card
  overlayCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.stroke,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  etaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.brand,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  etaBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.brandSoft,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: palette.brandMid,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.inkFaint,
  },
  statusDotLive: { backgroundColor: "#22c55e" },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.brand,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: 16,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: palette.stroke },
  statValue: { fontSize: 17, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  statLabel: {
    fontSize: 10,
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "600",
  },
  lastUpdate: { fontSize: 12, color: palette.inkFaint },

  // Driver row
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: palette.brand,
    shadowColor: palette.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
