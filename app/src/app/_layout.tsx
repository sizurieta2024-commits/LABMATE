import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppStateProvider } from "../state/AppState";
import { colors } from "../ui/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
            headerTintColor: colors.ink,
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ title: "Set up Labmate" }} />
          <Stack.Screen name="radar" options={{ title: "Lab Radar", headerBackVisible: false }} />
          <Stack.Screen name="lab/[id]" options={{ title: "Lab" }} />
          <Stack.Screen name="brief" options={{ title: "Paper brief" }} />
          <Stack.Screen name="tracker" options={{ title: "Outreach" }} />
          <Stack.Screen name="paywall" options={{ presentation: "modal", title: "Labmate Pro" }} />
        </Stack>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
