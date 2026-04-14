import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";

import { DashboardScreen } from "../screens/DashboardScreen";
import { DevicesScreen } from "../screens/DevicesScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { RenewalsScreen } from "../screens/RenewalsScreen";
import { RosterScreen } from "../screens/RosterScreen";
import { SOSScreen } from "../screens/SOSScreen";
import { useDriverSessionStore } from "../store/session";
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: Icon("D") }} />
      <Tab.Screen name="Roster" component={RosterScreen} options={{ tabBarIcon: Icon("R") }} />
      <Tab.Screen name="SOS" component={SOSScreen} options={{ tabBarIcon: Icon("S") }} />
      <Tab.Screen name="Renewals" component={RenewalsScreen} options={{ tabBarIcon: Icon("C") }} />
      <Tab.Screen name="Devices" component={DevicesScreen} options={{ tabBarIcon: Icon("2") }} />
    </Tab.Navigator>
  );
}

function Icon(label: string) {
  return ({ color }: { color: string }) => <Text style={{ color, fontWeight: "800" }}>{label}</Text>;
}

export function RootNavigator() {
  const isAuthenticated = useDriverSessionStore((state) => state.isAuthenticated);

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
