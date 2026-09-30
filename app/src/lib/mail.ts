import { Linking, Share } from "react-native";
import { mailtoUrl } from "./outreach";

/**
 * Opens the email in the mail app. Many students have no Mail app set up (Gmail
 * only), and then mailto: throws, so fall back to the share sheet, where they can
 * pick Gmail or copy the text.
 */
export async function composeEmail(subject: string, body: string): Promise<void> {
  try {
    await Linking.openURL(mailtoUrl(subject, body));
  } catch {
    await Share.share({ title: subject, message: `Subject: ${subject}\n\n${body}` });
  }
}
