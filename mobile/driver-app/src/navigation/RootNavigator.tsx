import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  AlertTriangle,
  FileText,
  Home,
  Map,
  Smartphone,
  Users,
} from "lucide-react-native";
import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BreakdownScreen } from "../screens/BreakdownScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DevicesScreen } from "../screens/DevicesScreen";
import { DriverSignupScreen } from "../screens/DriverSignupScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { NavigateScreen } from "../screens/NavigateScreen";
import { PendingApprovalScreen } from "../screens/PendingApprovalScreen";
import { QRScanScreen } from "../screens/QRScanScreen";
import { RenewalsScreen } from "../screens/RenewalsScreen";
import { RosterScreen } from "../screens/RosterScreen";
import { SOSScreen } from "../screens/SOSScreen";
import { useDriverActions } from "../hooks/useDriverDashboard";
import { useDriverSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

type TabConfig = {
  name: string;
  component: React.ComponentType<any>;
  icon: (focused: boolean) => React.ReactNode;
  label: string;
  isEmergency?: boolean;
};

const ICON_SIZE = 22;
const ICON_STROKE = 2;

const TABS: TabConfig[] = [
  {
    name: "Dashboard",
    component: DashboardScreen,
    label: "Home",
    icon: (focused) => (
      <Home
        size={ICON_SIZE}
        color={focused ? palette.brand : palette.inkFaint}
        strokeWidth={focused ? 2.5 : ICON_STROKE}
      />
    ),
  },
  {
    name: "Navigate",
    component: NavigateScreen,
    label: "Map",
    icon: (focused) => (
      <Map
        size={ICON_SIZE}
        color={focused ? palette.brand : palette.inkFaint}
        strokeWidth={focused ? 2.5 : ICON_STROKE}
      />
    ),
  },
  {
    name: "Roster",
    component: RosterScreen,
    label: "Roster",
    icon: (focused) => (
      <Users
        size={ICON_SIZE}
        color={focused ? palette.brand : palette.inkFaint}
        strokeWidth={focused ? 2.5 : ICON_STROKE}
      />
    ),
  },
  {
    name: "SOS",
    component: SOSScreen,
    label: "Emergency",
    isEmergency: true,
    icon: (focused) => (
      <AlertTriangle
        size={ICON_SIZE}
        color={palette.danger}
        strokeWidth={focused ? 2.5 : ICON_STROKE}
      />
    ),
  },
  {
    name: "Renewals",
    component: RenewalsScreen,
    label: "Docs",
    icon: (focused) => (
      <FileText
        size={ICON_SIZE}
        color={focused ? palette.brand : palette.inkFaint}
        strokeWidth={focused ? 2.5 : ICON_STROKE}
      />
    ),
  },
  {
    name: "Devices",
    component: DevicesScreen,
    label: "Account",
    icon: (focused) => (
      <Smartphone
        size={ICON_SIZE}
        color={focused ? palette.brand : palette.inkFaint}
        strokeWidth={focused ? 2.5 : ICON_STROKE}
      />
    ),
  },
];

// ── TabIcon ───────────────────────────────────────────────────────────────────

function TabIcon({
  icon,
  label,
  focused,
  isEmergency,
}: {
  icon: React.ReactNode;
  label: string;
  focused: boolean;
  isEmergency?: boolean;
}) {
  return (
    <View
      style={[
        styles.tabItem,
        focused && !isEmergency && styles.tabItemActive,
        isEmergency && styles.tabItemSOS,
        isEmergency && focused && styles.tabItemSOSActive,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.tabLabel,
          focused && !isEmergency && styles.tabLabelActive,
          isEmergency && styles.tabLabelSOS,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// ── FloatingSOS ───────────────────────────────────────────────────────────────

function FloatingSOS() {
  const actions = useDriverActions();
  const activeTripId = useDriverSessionStore((s) => s.activeTripId);
  const [overlayVisible, setOverlayVisible] = useState(false);

  if (!activeTripId) return null;

  async function handleFloatingSOS() {
    await actions.triggerSos.mutateAsync();
    setOverlayVisible(true);
  }

  return (
    <>
      <TouchableOpacity
        style={styles.floatBtn}
        onPress={handleFloatingSOS}
        activeOpacity={0.85}
      >
        <AlertTriangle size={18} color="#fff" strokeWidth={2.5} />
        <Text style={styles.floatBtnText}>SOS</Text>
      </TouchableOpacity>

      <Modal visible={overlayVisible} animationType="fade" statusBarTranslucent>
        <View style={styles.sosOverlay}>
          <View style={styles.overlayIconRing}>
            <AlertTriangle size={52} color="#fff" strokeWidth={2} />
          </View>
          <Text style={styles.overlayTitle}>SOS ACTIVE</Text>
          <Text style={styles.overlaySub}>
            Emergency services and all route parents have been notified.{"\n"}
            Stay calm. Help is on the way.
          </Text>
          <View style={styles.overlaySteps}>
            {[
              "Pull over safely if you are driving.",
              "Stay with the students.",
              "Wait for school or emergency services.",
            ].map((s, i) => (
              <View key={i} style={styles.overlayStep}>
                <View style={styles.overlayStepNum}>
                  <Text style={styles.overlayStepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.overlayStepText}>{s}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => setOverlayVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.dismissBtnText}>Dismiss overlay</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

// ── MainTabs ──────────────────────────────────────────────────────────────────

function MainTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
        }}
      >
        {TABS.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabIcon
                  icon={tab.icon(focused)}
                  label={tab.label}
                  focused={focused}
                  isEmergency={tab.isEmergency}
                />
              ),
            }}
          />
        ))}
      </Tab.Navigator>
      <FloatingSOS />
    </View>
  );
}

// ── RootNavigator ─────────────────────────────────────────────────────────────

export function RootNavigator() {
  const isAuthenticated = useDriverSessionStore((s) => s.isAuthenticated);
  const isPendingApproval = useDriverSessionStore((s) => s.isPendingApproval);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="DriverSignup" component={DriverSignupScreen} />
        </>
      ) : isPendingApproval ? (
        <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Breakdown" component={BreakdownScreen} />
          <Stack.Screen
            name="QRScan"
            component={QRScanScreen}
            options={{ presentation: "fullScreenModal" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    height: 76,
    paddingTop: 6,
    paddingBottom: 12,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.stroke,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 3,
    minWidth: 52,
  },
  tabItemActive: { backgroundColor: palette.brandSoft },
  tabItemSOS: { backgroundColor: palette.dangerSoft, borderRadius: 14 },
  tabItemSOSActive: { backgroundColor: "#FECACA" },
  tabLabel: { fontSize: 9, fontWeight: "600", color: palette.inkFaint, letterSpacing: 0.2 },
  tabLabelActive: { color: palette.brand, fontWeight: "800" },
  tabLabelSOS: { color: palette.danger, fontWeight: "700" },

  // Floating SOS
  floatBtn: {
    position: "absolute",
    right: spacing.lg,
    bottom: 92,
    backgroundColor: palette.danger,
    borderRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: palette.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  floatBtnText: { color: "#fff", fontWeight: "900", fontSize: 15, letterSpacing: 0.3 },

  // SOS overlay
  sosOverlay: {
    flex: 1,
    backgroundColor: palette.danger,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  overlayIconRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  overlayTitle: { fontSize: 42, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  overlaySub: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 26,
  },
  overlaySteps: {
    gap: spacing.md,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  overlayStep: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  overlayStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayStepNumText: { fontSize: 14, fontWeight: "900", color: "#fff" },
  overlayStepText: { flex: 1, fontSize: 15, color: "#fff", lineHeight: 22 },
  dismissBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    alignSelf: "stretch",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  dismissBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
