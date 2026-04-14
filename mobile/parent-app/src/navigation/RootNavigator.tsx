import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";

import { HomeScreen } from "../screens/HomeScreen";
import { LiveTrackScreen } from "../screens/LiveTrackScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { MessagesScreen } from "../screens/MessagesScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ProgressScreen } from "../screens/ProgressScreen";
import { useSessionStore } from "../store/session";
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: Icon("H") }} />
      <Tab.Screen name="Track" component={LiveTrackScreen} options={{ tabBarIcon: Icon("T") }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarIcon: Icon("P") }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ tabBarIcon: Icon("M") }} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarIcon: Icon("N") }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: Icon("U") }} />
    </Tab.Navigator>
  );
}

function Icon(label: string) {
  return ({ color }: { color: string }) => <Text style={{ color, fontWeight: "800" }}>{label}</Text>;
}

export function RootNavigator() {
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);

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
