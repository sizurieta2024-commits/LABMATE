import { Alert, Platform } from "react-native";

// react-native-web's Alert.alert is a no-op, so the web build uses the browser's own dialogs.

export function notify(title: string, message?: string): void {
  if (Platform.OS === "web") window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

/** Two-button question; resolves true for the confirm button. */
export function ask(title: string, message: string, confirm: string, cancel: string): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: cancel, style: "cancel", onPress: () => resolve(false) },
      { text: confirm, onPress: () => resolve(true) },
    ]),
  );
}
