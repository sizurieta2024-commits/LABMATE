import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useApp } from "../state/AppState";
import { colors } from "../ui/theme";

export default function Index() {
  const { ready, profile } = useApp();
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={profile ? "/radar" : "/welcome"} />;
}
