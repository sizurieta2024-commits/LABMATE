import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DynamicColorIOS, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppStateProvider } from "../state/AppState";
import { colors } from "../ui/theme";

// Titles use the label color; only buttons get the blue tint.
const titleColor = Platform.OS === "ios" ? DynamicColorIOS({ light: "#000000", dark: "#FFFFFF" }) : "#000000";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="auto" />
        {/* Native iOS headers: large titles that collapse on scroll, Liquid Glass bar buttons on iOS 26. */}
        <Stack
          screenOptions={{
            headerLargeTitle: true,
            headerTransparent: true,
            headerShadowVisible: false,
            headerLargeTitleShadowVisible: false,
            headerTintColor: colors.tintHex,
            headerTitleStyle: { color: titleColor as string },
            headerLargeTitleStyle: { color: titleColor as string },
            headerBackButtonDisplayMode: "minimal",
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ title: "Set Up" }} />
          <Stack.Screen name="radar" options={{ title: "Lab Radar", headerBackVisible: false }} />
          <Stack.Screen name="lab/[id]" options={{ title: "" }} />
          <Stack.Screen name="brief" options={{ title: "Paper Brief", headerLargeTitle: false }} />
          <Stack.Screen name="tracker" options={{ title: "Outreach" }} />
          <Stack.Screen
            name="paywall"
            // Page sheet: the native iOS card that slides up over the lab page.
            options={{ presentation: "modal", headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
          />
        </Stack>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
