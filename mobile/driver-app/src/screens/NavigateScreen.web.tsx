// ---------------------------------------------------------------------------
// NavigateScreen.web.tsx – web-safe version of the navigation screen.
// react-native-maps and expo-location have no web implementation, so Metro
// resolves this file instead when bundling for the web platform.
// ---------------------------------------------------------------------------

import { StyleSheet, Text, View } from "react-native";

import { InfoCard } from "../components/InfoCard";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { useDriverDashboard } from "../hooks/useDriverDashboard";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

const DEMO_STOPS = [
  { name: "Greenfield School", isSchool: true,  done: true  },
  { name: "Lakeview Stop",     isSchool: false, done: true  },
  { name: "Pine Street",       isSchool: false, done: false },
  { name: "Metro Corner",      isSchool: false, done: false },
  { name: "City Center",       isSchool: false, done: false },
];

export function NavigateScreen() {
  const { data } = useDriverDashboard();

  const nextStop   = data?.trip?.nextStop   ?? "Pine Street";
  const routeName  = data?.vehicle?.routeName ?? "Route";
  const etaMinutes = data?.trip?.etaMinutes ?? "–";
  const shift      = data?.trip?.shift      ?? "";

  return (
    <Screen>
      <SectionTitle title="Navigation" subtitle={`${routeName} · ${shift} shift`} />

      {/* ── Map placeholder ─────────────────────────────────────────────── */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapPinRing}>
          <Text style={styles.mapEmoji}>🗺</Text>
        </View>
        <Text style={styles.mapTitle}>Map view</Text>
        <Text style={styles.mapSub}>
          Interactive navigation is available in the mobile app.{"\n"}
          Next stop: {nextStop}
        </Text>
        <View style={styles.etaPill}>
          <Text style={styles.etaText}>ETA  {etaMinutes} min</Text>
        </View>
      </View>

      {/* ── Route stop list ─────────────────────────────────────────────── */}
      <InfoCard title="Route stops" subtitle="Tap the mobile app to navigate">
        <View style={styles.stopList}>
          {DEMO_STOPS.map((stop, idx) => (
            <View key={stop.name} style={styles.stopRow}>
              <View style={styles.stopLineCol}>
                <View style={[
                  styles.stopDot,
                  stop.isSchool ? styles.stopDotSchool
                    : stop.done ? styles.stopDotDone
                    : stop.name === nextStop ? styles.stopDotNext
                    : styles.stopDotPending,
                ]} />
                {idx < DEMO_STOPS.length - 1 && <View style={styles.stopLine} />}
              </View>
              <View style={styles.stopInfo}>
                <Text style={[
                  styles.stopName,
                  stop.name === nextStop && styles.stopNameNext,
                  stop.isSchool && styles.stopNameSchool,
                ]}>
                  {stop.name}
                  {stop.isSchool && "  🏫"}
                  {stop.name === nextStop && "  ← next"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </InfoCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapPlaceholder: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.stroke,
    minHeight: 220,
    backgroundColor: palette.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  mapPinRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.brandMid,
    alignItems: "center",
    justifyContent: "center",
  },
  mapEmoji:  { fontSize: 26 },
  mapTitle:  { fontSize: 18, fontWeight: "800", color: palette.brand },
  mapSub: {
    fontSize: 13,
    color: palette.inkSoft,
    textAlign: "center",
    lineHeight: 20,
  },
  etaPill: {
    backgroundColor: palette.brand,
    borderRadius: 99,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginTop: spacing.xs,
  },
  etaText: { fontSize: 13, fontWeight: "800", color: "#fff" },

  stopList:    { gap: 0 },
  stopRow:     { flexDirection: "row", alignItems: "flex-start", minHeight: 40 },
  stopLineCol: { width: 28, alignItems: "center" },
  stopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 2,
    borderColor: palette.stroke,
    backgroundColor: palette.stroke,
  },
  stopDotSchool:  { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  stopDotDone:    { backgroundColor: palette.brand, borderColor: palette.brand },
  stopDotNext:    { backgroundColor: palette.accent, borderColor: palette.accent, width: 14, height: 14, borderRadius: 7 },
  stopDotPending: { backgroundColor: palette.surface, borderColor: palette.stroke },
  stopLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: palette.stroke,
    marginTop: 2,
  },
  stopInfo: { flex: 1, paddingLeft: spacing.sm, paddingBottom: spacing.sm },
  stopName: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.inkSoft,
    paddingTop: 2,
  },
  stopNameNext:   { color: palette.accent, fontWeight: "800" },
  stopNameSchool: { color: "#6366f1", fontWeight: "800" },
});
