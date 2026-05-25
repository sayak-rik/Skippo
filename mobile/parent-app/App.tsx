import "react-native-gesture-handler";

import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNavigationContainerRef } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { getScreenFromNotification, setupPushNotifications } from "./src/lib/push";
import { useSessionStore } from "./src/store/session";
import { palette } from "./src/theme/palette";

const queryClient = new QueryClient();

const navigationRef = createNavigationContainerRef<Record<string, object | undefined>>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.canvas,
    card: palette.surface,
    text: palette.ink,
    border: palette.stroke,
    primary: palette.brand,
  },
};

function AppInner() {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Register device for push on login
    setupPushNotifications();

    // Listener: notification received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // QueryClient re-fetch on next focus will pick up new data
        queryClient.invalidateQueries({ queryKey: ["parent-academics"] });
      }
    );

    // Listener: user taps a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        const screen = getScreenFromNotification(data);
        if (navigationRef.isReady()) {
          // Navigate to the Main stack then to the target tab
          (navigationRef as ReturnType<typeof createNavigationContainerRef>).reset({
            index: 0,
            routes: [{ name: "Main", state: { routes: [{ name: screen }] } }],
          });
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated]);

  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer theme={navigationTheme} ref={navigationRef}>
          <StatusBar style="dark" />
          <AppInner />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
