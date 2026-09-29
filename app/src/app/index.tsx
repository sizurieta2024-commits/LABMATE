import { Redirect } from "expo-router";
import { View } from "react-native";
import { useApp } from "../state/AppState";
import { Loading } from "../ui/components";
import { colors } from "../ui/theme";

export default function Index() {
  const { ready, profile } = useApp();
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.bg }}>
        <Loading label="Loading…" />
      </View>
    );
  }
  return <Redirect href={profile ? "/radar" : "/onboarding"} />;
}
