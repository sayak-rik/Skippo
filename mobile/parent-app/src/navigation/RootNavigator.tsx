// ---------------------------------------------------------------------------
// RootNavigator – top-level navigation for the parent app.
//
// Unauthenticated:  Login  (default)
//                   Signup (3-step parent + bus onboarding)
// Authenticated:    MainTabs (6 bottom tabs with emoji icons)
// ---------------------------------------------------------------------------

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import { DismissalScreen } from "../screens/DismissalScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LiveTrackScreen } from "../screens/LiveTrackScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { MessagesScreen } from "../screens/MessagesScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ProgressScreen } from "../screens/ProgressScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { useSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { spacing } from "../theme/spacing";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab configuration — emoji icons replace the single-letter placeholders for
// a more polished, minimalist look (req 5).
const TABS = [
  { name: "Home",          component: HomeScreen,          emoji: "🏠", label: "Home"      },
  { name: "Track",         component: LiveTrackScreen,     emoji: "📍", label: "Track"     },
  { name: "Pickup",        component: DismissalScreen,     emoji: "🚗", label: "Pickup"    },
  { name: "Progress",      component: ProgressScreen,      emoji: "📚", label: "Progress"  },
  { name: "Messages",      component: MessagesScreen,      emoji: "✉️", label: "Messages"  },
  { name: "Notifications", component: NotificationsScreen, emoji: "🔔", label: "Alerts"    },
  { name: "Profile",       component: ProfileScreen,       emoji: "👤", label: "Profile"   },
];

// ── TabIcon ───────────────────────────────────────────────────────────────────

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
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
              <TabIcon emoji={tab.emoji} label={tab.label} focused={focused} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

// ── RootNavigator ─────────────────────────────────────────────────────────────

export function RootNavigator() {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login"  component={LoginScreen}  />
          <Stack.Screen name="Signup" component={SignupScreen} />
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
  tabItemActive:  { backgroundColor: palette.brandSoft },
  tabEmoji:       { fontSize: 17 },
  tabLabel:       { fontSize: 9, fontWeight: "600", color: palette.inkSoft, letterSpacing: 0.2 },
  tabLabelActive: { color: palette.brandDeep, fontWeight: "800" },
});
