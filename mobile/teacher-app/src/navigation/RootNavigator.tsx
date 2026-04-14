import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";

import { LoginScreen } from "../screens/LoginScreen";
import { ParentSummaryScreen } from "../screens/ParentSummaryScreen";
import { ScheduleScreen } from "../screens/ScheduleScreen";
import { SessionScreen } from "../screens/SessionScreen";
import { useTeacherSessionStore } from "../store/session";
import { palette } from "../theme/palette";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.brand,
        tabBarInactiveTintColor: palette.inkSoft,
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: palette.surface,
        },
      }}
    >
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ tabBarIcon: Icon("C") }} />
      <Tab.Screen name="Class" component={SessionScreen} options={{ tabBarIcon: Icon("A") }} />
      <Tab.Screen name="Reports" component={ParentSummaryScreen} options={{ tabBarIcon: Icon("R") }} />
    </Tab.Navigator>
  );
}

function Icon(label: string) {
  return ({ color }: { color: string }) => <Text style={{ color, fontWeight: "800" }}>{label}</Text>;
}

export function RootNavigator() {
  const isAuthenticated = useTeacherSessionStore((state) => state.isAuthenticated);
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
