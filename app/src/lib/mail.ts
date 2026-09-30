import * as Clipboard from "expo-clipboard";
import { Linking, Platform, Share } from "react-native";
import { notify } from "./dialog";
import { mailtoUrl } from "./outreach";

export type MailApp = "mail" | "gmail" | "outlook";

const q = encodeURIComponent;

/** Compose links with the professor's address, subject and body filled in. */
export function composeUrls(app: Exclude<MailApp, "mail">, subject: string, body: string, to = "") {
  if (app === "gmail") {
    return {
      native: `googlegmail://co?to=${q(to)}&subject=${q(subject)}&body=${q(body)}`,
      web: `https://mail.google.com/mail/?view=cm&fs=1&to=${q(to)}&su=${q(subject)}&body=${q(body)}`,
    };
  }
  return {
    native: `ms-outlook://compose?to=${q(to)}&subject=${q(subject)}&body=${q(body)}`,
    // Office 365, which most universities use for student email.
    web: `https://outlook.office.com/mail/deeplink/compose?to=${q(to)}&subject=${q(subject)}&body=${q(body)}`,
  };
}

/**
 * Opens the drafted email, ready to send from the student's own account (their
 * .edu address is what professors answer). Gmail and Outlook open their app when
 * installed, otherwise their website. Nothing is ever sent by Labmate.
 */
export async function composeEmail(subject: string, body: string, to = "", app: MailApp = "mail"): Promise<void> {
  if (app !== "mail") {
    const { native, web } = composeUrls(app, subject, body, to);
    if (Platform.OS !== "web") {
      try {
        await Linking.openURL(native);
        return;
      } catch {
        // app not installed: use the website
      }
    }
    await Linking.openURL(web);
    return;
  }
  if (Platform.OS === "web") {
    // Browsers never report whether a mail app opened, so also put the email on the clipboard.
    await Clipboard.setStringAsync(`${to ? `To: ${to}\n` : ""}Subject: ${subject}\n\n${body}`).catch(() => {});
    await Linking.openURL(mailtoUrl(subject, body, to));
    notify("Email copied", "Your email opened in your mail app and is on your clipboard too.");
    return;
  }
  try {
    await Linking.openURL(mailtoUrl(subject, body, to));
  } catch {
    await Share.share({ title: subject, message: `${to ? `To: ${to}\n` : ""}Subject: ${subject}\n\n${body}` });
  }
}
