import { router } from "expo-router";
import type { SFSymbol } from "expo-symbols";
import { Image, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ACTION_BAR_SPACE, ActionBar, Icon } from "../ui/components";
import { colors, space, squircle, type } from "../ui/theme";

// Apple's "welcome / what's new" pattern: icon, title, three feature rows, one button.
const FEATURES: { icon: SFSymbol; color: string; title: string; body: string }[] = [
  {
    icon: "list.number",
    color: "#007AFF",
    title: "Every lab, ranked for you",
    body: "Labmate reads three years of papers from your school and ranks the researchers who work on what you care about.",
  },
  {
    icon: "dollarsign.circle.fill",
    color: "#34C759",
    title: "See who just got funded",
    body: "New NIH and NSF grants show which labs have money, and usually need hands, right now.",
  },
  {
    icon: "checkmark.seal.fill",
    color: "#5856D6",
    title: "Emails professors answer",
    body: "Understand the paper first, then write in your own words. Five emails a week, never spam.",
  },
];

export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 56, paddingHorizontal: 36, paddingBottom: ACTION_BAR_SPACE + 40, gap: 44 }}
      >
        <View style={{ alignItems: "center", gap: space.xl }}>
          <Image source={require("../../assets/icon.png")} style={{ width: 88, height: 88, borderRadius: 21, ...squircle }} />
          <Text style={[type.largeTitle, { textAlign: "center", fontWeight: "800" }]}>Welcome to Labmate</Text>
        </View>
        <View style={{ gap: 30 }}>
          {FEATURES.map((f) => (
            <View key={f.title} style={{ flexDirection: "row", gap: space.lg, alignItems: "flex-start" }}>
              <View style={{ width: 44, alignItems: "center", paddingTop: 2 }}>
                <Icon name={f.icon} size={32} color={f.color} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={type.headline}>{f.title}</Text>
                <Text style={[type.subhead, { lineHeight: 20 }]}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={[type.footnote, { textAlign: "center" }]}>Built on public research data from OpenAlex, NIH RePORTER and NSF.</Text>
      </ScrollView>
      <ActionBar title="Continue" onPress={() => router.push("/onboarding")} />
    </View>
  );
}
