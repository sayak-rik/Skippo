// ---------------------------------------------------------------------------
// NavigateScreen – live map navigation for the driver.
// Shows current GPS location, route polyline, and all stops.
// Next stop is highlighted in teal; school in indigo; others in grey.
// Uses expo-location for live position updates every 10 s / 20 m.
// ---------------------------------------------------------------------------

import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useDriverDashboard } from "../hooks/useDriverDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

// Demo route stops for North Route A – Kolkata area coordinates.
// A real implementation would fetch these from the backend route API.
const DEMO_STOPS = [
  { name: "Greenfield School",  lat: 22.5726, lng: 88.3639, isSchool: true  },
  { name: "Lakeview Stop",      lat: 22.5780, lng: 88.3710, isSchool: false },
  { name: "Pine Street",        lat: 22.5840, lng: 88.3785, isSchool: false },
  { name: "Metro Corner",       lat: 22.5905, lng: 88.3845, isSchool: false },
  { name: "City Center",        lat: 22.5965, lng: 88.3910, isSchool: false },
];

const ROUTE_COORDS = DEMO_STOPS.map((s) => ({ latitude: s.lat, longitude: s.lng }));

type Coords = { latitude: number; longitude: number };

export function NavigateScreen() {
  const { data } = useDriverDashboard();
  const mapRef = useRef<MapView>(null);

  const [myLocation, setMyLocation] = useState<Coords | null>(null);
  const [permStatus, setPermStatus] = useState<"unknown" | "granted" | "denied">("unknown");

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermStatus("denied");
        return;
      }
      setPermStatus("granted");

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setMyLocation(coords);

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10_000, distanceInterval: 20 },
        (update) => {
          setMyLocation({ latitude: update.coords.latitude, longitude: update.coords.longitude });
        }
      );
    })();

    return () => sub?.remove();
  }, []);

  const nextStop = data?.trip?.nextStop ?? "Lakeview Stop";
  const routeName = data?.vehicle?.routeName ?? "Route";
  const etaMinutes = data?.trip?.etaMinutes ?? "–";
  const shift = data?.trip?.shift ?? "";

  // Center: use live position when available, else first stop
  const center: Coords = myLocation ?? { latitude: 22.5726, longitude: 88.3639 };

  function handleRecenter() {
    mapRef.current?.animateToRegion({
      ...center,
      latitudeDelta: 0.035,
      longitudeDelta: 0.035,
    }, 500);
  }

  return (
    <Screen scroll={false}>
      <SectionTitle
        title="Navigation"
        subtitle={`${routeName} · ${shift} shift`}
      />

      {/* ── Map ────────────────────────────────────────────────────────── */}
      <View style={styles.mapShell}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: center.latitude,
            longitude: center.longitude,
            latitudeDelta: 0.035,
            longitudeDelta: 0.035,
          }}
        >
          {/* Route polyline */}
          <Polyline
            coordinates={ROUTE_COORDS}
            strokeColor="#0d9488"
            strokeWidth={3}
            lineDashPattern={undefined}
          />

          {/* Route stop markers */}
          {DEMO_STOPS.map((stop) => {
            const isNext = stop.name === nextStop;
            const color = stop.isSchool
              ? "#4f46e5"
              : isNext
              ? "#0d9488"
              : "#94a3b8";
            return (
              <Marker
                key={stop.name}
                coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                title={stop.name}
                description={isNext ? "← Next stop" : stop.isSchool ? "School" : undefined}
                pinColor={color}
              />
            );
          })}

          {/* Driver's live position */}
          {myLocation && (
            <Marker
              coordinate={myLocation}
              title="You are here"
              description="Your live GPS position"
              pinColor="#f59e0b"
            />
          )}
        </MapView>

        {/* Live badge */}
        {permStatus === "granted" && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>GPS LIVE</Text>
          </View>
        )}

        {/* Recenter button */}
        <TouchableOpacity style={styles.recenterBtn} onPress={handleRecenter} activeOpacity={0.8}>
          <Text style={styles.recenterIcon}>⊕</Text>
        </TouchableOpacity>

        {/* Location pending overlay */}
        {permStatus === "granted" && !myLocation && (
          <View style={styles.locatingOverlay}>
            <ActivityIndicator color={palette.brand} size="small" />
            <Text style={styles.locatingText}>Getting GPS fix…</Text>
          </View>
        )}
      </View>

      {/* ── Trip metrics strip ────────────────────────────────────────── */}
      <View style={styles.metricsBar}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>NEXT STOP</Text>
          <Text style={styles.metricValue} numberOfLines={1}>{nextStop}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>ETA</Text>
          <Text style={[styles.metricValue, { color: palette.brand }]}>{etaMinutes} min</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>STOPS</Text>
          <Text style={styles.metricValue}>{DEMO_STOPS.length - 1}</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: "#f59e0b", label: "Your position" },
          { color: "#0d9488", label: "Next stop"     },
          { color: "#4f46e5", label: "School"        },
          { color: "#94a3b8", label: "Other stops"   },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Permission denied notice */}
      {permStatus === "denied" && (
        <View style={styles.permDenied}>
          <Text style={styles.permText}>
            📍 Location permission denied. Enable it in device Settings to show your live position on the map.
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    flex: 1,
    minHeight: 340,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.stroke,
    position: "relative",
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 4,
  },
  map: { flex: 1 },

  liveBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.62)",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#86efac",
  },
  liveText: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.8 },

  recenterBtn: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  recenterIcon: { fontSize: 22, color: "#fff" },

  locatingOverlay: {
    position: "absolute",
    bottom: spacing.sm,
    left: "50%",
    transform: [{ translateX: -70 }],
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  locatingText: { fontSize: 12, color: "#fff", fontWeight: "600" },

  metricsBar: {
    flexDirection: "row",
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.stroke,
    overflow: "hidden",
  },
  metric: { flex: 1, alignItems: "center", paddingVertical: spacing.md, gap: 4, paddingHorizontal: 4 },
  metricDivider: { width: 1, backgroundColor: palette.stroke, marginVertical: spacing.sm },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: palette.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.3,
    textAlign: "center",
  },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11.5, color: palette.inkSoft, fontWeight: "500" },

  permDenied: {
    backgroundColor: "rgba(255,77,106,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,77,106,0.2)",
    padding: spacing.md,
  },
  permText: { fontSize: 13, color: palette.danger, lineHeight: 20 },
});
