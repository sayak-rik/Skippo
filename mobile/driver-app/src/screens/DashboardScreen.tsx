import { LinearGradient } from "expo-linear-gradient";
import {
  AlertTriangle,
  Bus,
  ClipboardList,
  MapPin,
  Navigation,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react-native";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Screen } from "../components/Screen";
import {
  useDriverActions,
  useDriverDashboard,
  useDriverVehicles,
  useSwitchVehicle,
} from "../hooks/useDriverDashboard";
import { useDriverSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";
import { AssignedVehicle } from "../types";

type ActionItem = {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onPress: () => void;
  accent?: string;
};

export function DashboardScreen({ navigation }: { navigation?: any }) {
  const { data } = useDriverDashboard();
  const actions = useDriverActions();
  const activeTripId = useDriverSessionStore((s) => s.activeTripId);
  const startTripLocal = useDriverSessionStore((s) => s.startTrip);
  const endTripLocal = useDriverSessionStore((s) => s.endTrip);
  const driverName = useDriverSessionStore((s) => s.driverName);

  const { data: driverVehicles = [] } = useDriverVehicles();
  const switchVehicle = useSwitchVehicle();
  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);

  if (!data) return null;

  const isTripActive = activeTripId === data.trip.id;
  const vehicles: AssignedVehicle[] = data.driverVehicles ?? driverVehicles;
  const firstName = driverName?.split(" ")[0] ?? "Driver";

  async function handleSwitchVehicle(vehicleId: number) {
    await switchVehicle.mutateAsync(vehicleId);
    setVehiclePickerOpen(false);
  }

  const quickActions: ActionItem[] = [
    {
      icon: <Bus size={26} color={palette.accent} strokeWidth={2} />,
      label: isTripActive ? "End Trip" : "Start Trip",
      sub: isTripActive ? "Currently on route" : "Begin your route",
      accent: palette.accent,
      onPress: async () => {
        if (isTripActive) {
          await actions.endTrip.mutateAsync(data.trip.id);
          endTripLocal();
        } else {
          await actions.startTrip.mutateAsync(data.trip.id);
          startTripLocal(data.trip.id);
        }
      },
    },
    {
      icon: <ClipboardList size={26} color="#5B5FEF" strokeWidth={2} />,
      label: "Roster",
      sub: `${data.students?.length ?? 0} students`,
      accent: "#5B5FEF",
      onPress: () => navigation?.navigate?.("Roster"),
    },
    {
      icon: <Navigation size={26} color="#E67E22" strokeWidth={2} />,
      label: "Navigate",
      sub: data.trip.nextStop ?? "No stop",
      accent: "#E67E22",
      onPress: () => navigation?.navigate?.("Navigate"),
    },
    {
      icon: <AlertTriangle size={26} color={palette.danger} strokeWidth={2} />,
      label: "Emergency",
      sub: "SOS & Breakdown",
      accent: palette.danger,
      onPress: () => navigation?.navigate?.("SOS"),
    },
  ];

  return (
    <Screen>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi {firstName} 👋</Text>
          <Text style={styles.headerSub}>{data.vehicle.routeName}</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
        </View>
      </View>

      {/* ── Hero card ─────────────────────────────────────────────── */}
      <LinearGradient
        colors={[palette.heroTop, palette.heroBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroOrb1} />
        <View style={styles.heroOrb2} />

        <Text style={styles.heroLabel}>ASSIGNED VEHICLE</Text>
        <Text style={styles.heroVehicle}>{data.vehicle.label}</Text>
        <Text style={styles.heroReg}>{data.vehicle.registrationNumber}</Text>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{data.trip.boardedCount}</Text>
            <Text style={styles.heroStatLabel}>Boarded</Text>
          </View>
          <View style={styles.heroStatDiv} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{data.trip.totalCount}</Text>
            <Text style={styles.heroStatLabel}>Total</Text>
          </View>
          <View style={styles.heroStatDiv} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{data.trip.etaMinutes}m</Text>
            <Text style={styles.heroStatLabel}>ETA</Text>
          </View>
        </View>

        <View style={styles.heroFooter}>
          <View style={[styles.statusPill, isTripActive && styles.statusPillActive]}>
            <View style={[styles.statusDot, isTripActive && styles.statusDotActive]} />
            <Text style={styles.statusText}>{isTripActive ? "ON ROUTE" : "STANDBY"}</Text>
          </View>
          {vehicles.length > 1 && (
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => setVehiclePickerOpen((v) => !v)}
              activeOpacity={0.8}
            >
              <RefreshCw size={12} color="#fff" strokeWidth={2.5} />
              <Text style={styles.switchBtnText}>Switch</Text>
            </TouchableOpacity>
          )}
        </View>

        {vehiclePickerOpen && (
          <View style={styles.vehiclePicker}>
            {vehicles.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.vehicleRow, v.isActive && styles.vehicleRowActive]}
                onPress={() => handleSwitchVehicle(v.id)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.vehicleLabel, v.isActive && { color: "#fff" }]}>{v.label}</Text>
                  <Text style={[styles.vehicleMeta, v.isActive && { color: "rgba(255,255,255,0.6)" }]}>
                    {v.registrationNumber} · {v.routeName}
                  </Text>
                </View>
                {v.isActive && <Text style={styles.vehicleCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </LinearGradient>

      {/* ── Quick actions grid ─────────────────────────────────────── */}
      <View style={styles.grid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionCard}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: action.accent + "18" }]}>
              {action.icon}
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{action.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── GPS status banner ─────────────────────────────────────── */}
      <View style={[styles.gpsBanner, isTripActive ? styles.gpsBannerActive : styles.gpsBannerIdle]}>
        {isTripActive
          ? <Wifi size={16} color={palette.success} strokeWidth={2} />
          : <WifiOff size={16} color={palette.inkFaint} strokeWidth={2} />
        }
        <View style={{ flex: 1 }}>
          <Text style={[styles.gpsTitle, isTripActive && { color: palette.success }]}>
            {isTripActive ? "Location sharing active" : "Location sharing paused"}
          </Text>
          <Text style={styles.gpsSub}>
            {isTripActive
              ? "Parents receive GPS pings every 60 seconds."
              : "Starts automatically when you begin the trip."}
          </Text>
        </View>
      </View>

      {/* ── Next stop info ────────────────────────────────────────── */}
      {isTripActive && data.trip.nextStop ? (
        <View style={styles.nextStopCard}>
          <MapPin size={18} color={palette.brand} strokeWidth={2} />
          <View>
            <Text style={styles.nextStopLabel}>Next stop</Text>
            <Text style={styles.nextStopName}>{data.trip.nextStop}</Text>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: palette.ink,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 13,
    color: palette.inkSoft,
    marginTop: 2,
    fontWeight: "500",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
  },
  heroCard: {
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: "hidden",
    shadowColor: palette.heroTop,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  heroOrb1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  heroOrb2: {
    position: "absolute",
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  heroVehicle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },
  heroReg: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatDiv: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },
  heroStatNum: { fontSize: 22, fontWeight: "900", color: "#fff" },
  heroStatLabel: { fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2, fontWeight: "500" },
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusPillActive: {
    backgroundColor: "rgba(134,239,172,0.18)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  statusDotActive: { backgroundColor: "#86efac" },
  statusText: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.9)" },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  switchBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  vehiclePicker: {
    marginTop: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: spacing.sm,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  vehicleRowActive: { borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.15)" },
  vehicleLabel: { fontSize: 14, fontWeight: "800", color: "rgba(255,255,255,0.85)" },
  vehicleMeta: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 1 },
  vehicleCheck: { fontSize: 16, color: "#86efac", fontWeight: "900" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionCard: {
    width: "47.5%",
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: "#4449CC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 15, fontWeight: "800", color: palette.ink, letterSpacing: -0.2 },
  actionSub: { fontSize: 12, color: palette.inkSoft, fontWeight: "400" },
  gpsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
  },
  gpsBannerActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  gpsBannerIdle: {
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.stroke,
  },
  gpsTitle: { fontSize: 13, fontWeight: "700", color: palette.inkSoft },
  gpsSub: { fontSize: 12, color: palette.inkFaint, marginTop: 1 },
  nextStopCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: palette.brandSoft,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.brandMid,
  },
  nextStopLabel: { fontSize: 11, fontWeight: "600", color: palette.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 },
  nextStopName: { fontSize: 15, fontWeight: "800", color: palette.brand, letterSpacing: -0.2 },
});
