// ---------------------------------------------------------------------------
// RootNavigator – top-level navigation for the driver app.
//
// Unauthenticated:
//   Login           – OTP login screen
//   DriverSignup    – invite or self-signup (req 6)
//
// Authenticated, pending approval:
//   PendingApproval – shown until admin approves self-signup (req 6)
//
// Authenticated, approved:
//   MainTabs        – 5 tabs with emoji icons
//   Breakdown       – accessible from SOSScreen (emergency flow)
//   + FloatingSOS   – persistent SOS button overlaid on all tab screens (req 10)
// ---------------------------------------------------------------------------

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";

import { BreakdownScreen } from "../screens/BreakdownScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DevicesScreen } from "../screens/DevicesScreen";
import { DriverSignupScreen } from "../screens/DriverSignupScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { PendingApprovalScreen } from "../screens/PendingApprovalScreen";
import { RenewalsScreen } from "../screens/RenewalsScreen";
import { RosterScreen } from "../screens/RosterScreen";
import { SOSScreen } from "../screens/SOSScreen";
import { useDriverActions } from "../hooks/useDriverDashboard";
import { useDriverSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab configuration — emoji icons for clean visual language
const TABS = [
  { name: "Dashboard", component: DashboardScreen, emoji: "🚌", label: "Dashboard" },
  { name: "Roster",    component: RosterScreen,    emoji: "📋", label: "Roster"    },
  { name: "SOS",       component: SOSScreen,        emoji: "🚨", label: "Emergency" },
  { name: "Renewals",  component: RenewalsScreen,   emoji: "📄", label: "Renewals"  },
  { name: "Devices",   component: DevicesScreen,    emoji: "📱", label: "Devices"   },
];

// ── TabIcon ───────────────────────────────────────────────────────────────────

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  const isEmergency = label === "Emergency";
  return (
    <View style={[
      styles.tabItem,
      focused && styles.tabItemActive,
      isEmergency && styles.tabItemSOS,
      isEmergency && focused && styles.tabItemSOSActive,
    ]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive, isEmergency && styles.tabLabelSOS]}>
        {label}
      </Text>
    </View>
  );
}

// ── FloatingSOS ───────────────────────────────────────────────────────────────
// A floating SOS button always visible above the tab bar regardless of which
// tab is active.  Tapping it triggers the SOS action and shows the full-screen
// red overlay without navigating away (req 10).

function FloatingSOS() {
  const actions = useDriverActions();
  const activeTripId = useDriverSessionStore((s) => s.activeTripId);
  const [overlayVisible, setOverlayVisible] = useState(false);

  if (!activeTripId) return null; // Only visible during an active trip

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
        <Text style={styles.floatBtnText}>SOS</Text>
      </TouchableOpacity>

      {/* Full-screen SOS overlay — covers everything when triggered */}
      <Modal visible={overlayVisible} animationType="fade" statusBarTranslucent>
        <View style={styles.sosOverlay}>
          <Text style={styles.overlayIcon}>🚨</Text>
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
                <Text style={styles.overlayStepNum}>{i + 1}</Text>
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
                <TabIcon emoji={tab.emoji} label={tab.label} focused={focused} />
              ),
            }}
          />
        ))}
      </Tab.Navigator>

      {/* FloatingSOS sits on top of the tab content during active trips */}
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
        // Pre-auth screens
        <>
          <Stack.Screen name="Login"        component={LoginScreen}       />
          <Stack.Screen name="DriverSignup" component={DriverSignupScreen} />
        </>
      ) : isPendingApproval ? (
        // Self-signup waiting for admin approval
        <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      ) : (
        // Full app
        <>
          <Stack.Screen name="Main"      component={MainTabs}      />
          <Stack.Screen name="Breakdown" component={BreakdownScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    paddingTop: 6,
    paddingBottom: 10,
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
    paddingVertical: 5,
    borderRadius: 12,
    gap: 2,
  },
  tabItemActive:    { backgroundColor: palette.brandSoft },
  tabItemSOS:       { backgroundColor: "rgba(197,48,48,0.08)", borderRadius: 12 },
  tabItemSOSActive: { backgroundColor: "rgba(197,48,48,0.18)" },
  tabEmoji:         { fontSize: 17 },
  tabLabel:         { fontSize: 9, fontWeight: "600", color: palette.inkSoft, letterSpacing: 0.2 },
  tabLabelActive:   { color: palette.brandDeep, fontWeight: "800" },
  tabLabelSOS:      { color: palette.danger },

  // Floating SOS button — always above tab content during active trips
  floatBtn: {
    position: "absolute",
    right: spacing.lg,
    bottom: 88, // sits above the 72px tab bar with some gap
    backgroundColor: palette.danger,
    borderRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    shadowColor: palette.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  floatBtnText: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 0.5 },

  // Full-screen SOS overlay
  sosOverlay: {
    flex: 1,
    backgroundColor: palette.danger,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  overlayIcon: { fontSize: 72 },
  overlayTitle: { fontSize: 42, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  overlaySub: { fontSize: 16, color: "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 24 },
  overlaySteps: {
    gap: spacing.md,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: spacing.lg,
  },
  overlayStep: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  overlayStepNum: { fontSize: 20, fontWeight: "900", color: "rgba(255,255,255,0.6)", width: 24 },
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
