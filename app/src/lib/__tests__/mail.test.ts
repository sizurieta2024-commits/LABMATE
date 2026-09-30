import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({ Linking: {}, Platform: { OS: "ios" }, Share: {}, Alert: {} }));
vi.mock("expo-clipboard", () => ({}));

const { composeUrls } = await import("../mail");

describe("composeUrls", () => {
  it("prefills Gmail with the professor, subject and body", () => {
    const { web, native } = composeUrls("gmail", "Research & you", "Hi\nthere", "akil@umich.edu");
    expect(web).toBe("https://mail.google.com/mail/?view=cm&fs=1&to=akil%40umich.edu&su=Research%20%26%20you&body=Hi%0Athere");
    expect(native.startsWith("googlegmail://co?to=akil%40umich.edu")).toBe(true);
  });

  it("prefills Outlook on the web and in the app", () => {
    const { web, native } = composeUrls("outlook", "S", "B", "a@b.edu");
    expect(web).toBe("https://outlook.office.com/mail/deeplink/compose?to=a%40b.edu&subject=S&body=B");
    expect(native).toBe("ms-outlook://compose?to=a%40b.edu&subject=S&body=B");
  });
});
