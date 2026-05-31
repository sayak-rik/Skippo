// ---------------------------------------------------------------------------
// RootNavigator – top-level navigation structure.
//
// Stack layout:
//   Unauthenticated  → Login  (default)
//                    → InviteSignup  (teacher registration via invite link)
//   Authenticated    → Main (bottom tabs)
//
// The InviteSignupScreen is accessible from the Login screen without being
// authenticated — it's part of the pre-auth onboarding flow.
// ---------------------------------------------------------------------------

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import { AIAssistantScreen } from "../screens/AIAssistantScreen";
import { AssistRequestsScreen } from "../screens/AssistRequestsScreen";
import { BroadcastScreen } from "../screens/BroadcastScreen";
import { InviteSignupScreen } from "../screens/InviteSignupScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { ParentSummaryScreen } from "../screens/ParentSummaryScreen";
import { ScheduleScreen } from "../screens/ScheduleScreen";
import { SessionScreen } from "../screens/SessionScreen";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { radius } from "../theme/spacing";

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// Bottom tab configuration
const TABS = [
  { name: "Schedule",  component: ScheduleScreen,        icon: "📅", label: "Schedule"  },
  { name: "Class",     component: SessionScreen,          icon: "✏️", label: "Attendance" },
  { name: "Broadcast", component: BroadcastScreen,        icon: "📢", label: "Broadcast"  },
  { name: "Assist",    component: AssistRequestsScreen,   icon: "🙋", label: "Requests"   },
  { name: "Reports",   component: ParentSummaryScreen,    icon: "📊", label: "Reports"   },
  { name: "AI",        component: AIAssistantScreen,      icon: "✨", label: "AI"         },
];

// ── TabIcon ───────────────────────────────────────────────────────────────────

function TabIcon({
  emoji,
  label,
  focused,
}: {
  emoji: string;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

// ── MainTabs ──────────────────────────────────────────────────────────────────

function MainTabs() {
  return (
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
              <TabIcon emoji={tab.icon} label={tab.label} focused={focused} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

// ── RootNavigator ─────────────────────────────────────────────────────────────

export function RootNavigator() {
  const isAuthenticated = useTeacherSessionStore((s) => s.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // Authenticated: show the main tab shell
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        // Unauthenticated: login + invite signup are both accessible
        <>
          <Stack.Screen name="Login"        component={LoginScreen} />
          <Stack.Screen name="InviteSignup" component={InviteSignupScreen} />
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
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: radius.md,
    gap: 2,
  },
  tabItemActive:  { backgroundColor: palette.brandSoft },
  tabEmoji:       { fontSize: 18 },
  tabLabel:       { fontSize: 10, fontWeight: "600", color: palette.inkSoft, letterSpacing: 0.2 },
  tabLabelActive: { color: palette.brandDeep, fontWeight: "800" },
});
