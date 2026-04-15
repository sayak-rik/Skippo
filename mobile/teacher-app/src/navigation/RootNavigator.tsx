import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import { LoginScreen } from "../screens/LoginScreen";
import { ParentSummaryScreen } from "../screens/ParentSummaryScreen";
import { ScheduleScreen } from "../screens/ScheduleScreen";
import { SessionScreen } from "../screens/SessionScreen";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";
import { radius } from "../theme/spacing";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TABS = [
  {
    name: "Schedule",
    component: ScheduleScreen,
    icon: "📅",
    label: "Schedule",
  },
  {
    name: "Class",
    component: SessionScreen,
    icon: "✏️",
    label: "Attendance",
  },
  {
    name: "Reports",
    component: ParentSummaryScreen,
    icon: "📊",
    label: "Reports",
  },
];

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
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

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
              <TabIcon
                emoji={tab.icon}
                label={tab.label}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const isAuthenticated = useTeacherSessionStore((s) => s.isAuthenticated);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.md,
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: palette.brandSoft,
  },
  tabEmoji: { fontSize: 18 },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: palette.inkSoft,
    letterSpacing: 0.2,
  },
  tabLabelActive: { color: palette.brandDeep, fontWeight: "800" },
});
