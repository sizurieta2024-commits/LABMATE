import { router, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { DynamicColorIOS, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppStateProvider, useApp } from "../state/AppState";
import { colors } from "../ui/theme";

// Titles use the label color; only buttons get the blue tint.
const titleColor = Platform.OS === "ios" ? DynamicColorIOS({ light: "#000000", dark: "#FFFFFF" }) : "#000000";

// Screens that work before setup. Anything else (e.g. a shared /radar link on a
// fresh device) goes to the welcome screen instead of rendering empty.
const OPEN_ROUTES = new Set(["/", "/welcome", "/onboarding"]);

function ProfileGate() {
  const { ready, profile } = useApp();
  const pathname = usePathname();
  useEffect(() => {
    if (ready && !profile && !OPEN_ROUTES.has(pathname)) router.replace("/welcome");
  }, [ready, profile, pathname]);
  return null;
}

const webPage = { flex: 1, backgroundColor: "#E5E5EA" } as const;

const webFrame = {
  flex: 1,
  width: "100%",
  maxWidth: 520,
  alignSelf: "center",
  overflow: "hidden",
  backgroundColor: colors.bg,
  boxShadow: "0 0 24px rgba(0, 0, 0, 0.08)",
} as const;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="auto" />
        <ProfileGate />
        {/* On the web, show the app at phone width in the middle of the window. */}
        <View style={Platform.OS === "web" ? webPage : { flex: 1 }}>
        <View style={Platform.OS === "web" ? webFrame : { flex: 1 }}>
        {/* Native iOS headers: large titles that collapse on scroll, Liquid Glass bar buttons on iOS 26. */}
        <Stack
          screenOptions={{
            headerLargeTitle: true,
            // iOS pads content under a transparent bar; the web would overlap it.
            headerTransparent: Platform.OS === "ios",
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
        </View>
        </View>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
