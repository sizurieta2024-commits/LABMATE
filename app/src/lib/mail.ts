import * as Clipboard from "expo-clipboard";
import { Linking, Platform, Share } from "react-native";
import { notify } from "./dialog";
import { mailtoUrl } from "./outreach";

/**
 * Opens the email in the mail app. Many students have no Mail app set up (Gmail
 * only), and then mailto: throws, so fall back to the share sheet, where they can
 * pick Gmail or copy the text.
 */
export async function composeEmail(subject: string, body: string, to = ""): Promise<void> {
  if (Platform.OS === "web") {
    // Browsers never report whether a mail app opened, so also put the email on the clipboard.
    await Clipboard.setStringAsync(`${to ? `To: ${to}\n` : ""}Subject: ${subject}\n\n${body}`).catch(() => {});
    await Linking.openURL(mailtoUrl(subject, body, to));
    notify("Email copied", "Your email opened in your mail app and is on your clipboard, in case you use Gmail in the browser.");
    return;
  }
  try {
    await Linking.openURL(mailtoUrl(subject, body, to));
  } catch {
    await Share.share({ title: subject, message: `${to ? `To: ${to}\n` : ""}Subject: ${subject}\n\n${body}` });
  }
}
