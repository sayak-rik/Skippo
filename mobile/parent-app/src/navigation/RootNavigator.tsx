// ---------------------------------------------------------------------------
// RootNavigator – top-level navigation for the parent app.
//
// Unauthenticated:  Login  (default)
//                   Signup (3-step parent + bus onboarding)
//                   NewParent
// Authenticated:    MainTabs (5 bottom tabs with Lucide icons, no labels)
// ---------------------------------------------------------------------------

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BookOpen, Bus, GraduationCap, Home, User } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AcademicsScreen } from "../screens/AcademicsScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LiveTrackScreen } from "../screens/LiveTrackScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { NewParentScreen } from "../screens/NewParentScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ProgressScreen } from "../screens/ProgressScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { useSessionStore } from "../store/session";
import { palette } from "../theme/palette";

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Tab configuration ─────────────────────────────────────────────────────────

type LucideIcon = typeof Home;

const TABS: { name: string; component: unknown; Icon: LucideIcon }[] = [
  { name: "Home",      component: HomeScreen,       Icon: Home          },
  { name: "Track",     component: LiveTrackScreen,  Icon: Bus           },
  { name: "Academics", component: AcademicsScreen,  Icon: BookOpen      },
  { name: "Progress",  component: ProgressScreen,   Icon: GraduationCap },
  { name: "Profile",   component: ProfileScreen,    Icon: User          },
];

// ── TabIcon ───────────────────────────────────────────────────────────────────

function TabIcon({
  Icon,
  focused,
}: {
  Icon: LucideIcon;
  focused: boolean;
}) {
  return (
    <View style={styles.tabItem}>
      <Icon
        size={24}
        color={focused ? palette.brand : palette.inkFaint}
        strokeWidth={focused ? 2.2 : 1.8}
      />
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

// ── MainTabs ──────────────────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:    false,
        tabBarShowLabel: false,
        tabBarStyle:    styles.tabBar,
      }}
    >
      {TABS.map(({ name, component, Icon }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon Icon={Icon} focused={focused} />,
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
          <Stack.Screen name="Login"     component={LoginScreen}     />
          <Stack.Screen name="Signup"    component={SignupScreen}    />
          <Stack.Screen name="NewParent" component={NewParentScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.stroke,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.brand,
  },
});
