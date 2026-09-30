// iOS 26 design tokens. See docs/DESIGN.md for the reference lock.
// Semantic system colors adapt to dark mode and accessibility settings on iOS;
// other platforms get the light-mode values.
import { Platform, PlatformColor, type ColorValue, type TextStyle } from "react-native";

const sys = (name: string, fallback: string): ColorValue =>
  Platform.OS === "ios" ? PlatformColor(name) : fallback;

export const colors = {
  bg: sys("systemGroupedBackground", "#F2F2F7"),
  card: sys("secondarySystemGroupedBackground", "#FFFFFF"),
  fill: sys("tertiarySystemFill", "#7676801F"),
  fillStrong: sys("secondarySystemFill", "#78788029"),
  label: sys("label", "#000000"),
  secondary: sys("secondaryLabel", "#3C3C4399"),
  tertiary: sys("tertiaryLabel", "#3C3C434D"),
  separator: sys("separator", "#3C3C434A"),
  tint: sys("systemBlue", "#007AFF"),
  green: sys("systemGreen", "#34C759"),
  orange: sys("systemOrange", "#FF9500"),
  red: sys("systemRed", "#FF3B30"),
  indigo: sys("systemIndigo", "#5856D6"),
  // Fixed values for places that need a literal (glass tint, text on tint).
  tintHex: "#007AFF",
  greenHex: "#34C759",
  onTint: "#FFFFFF",
  greenSoft: "#34C7591F",
  tintSoft: "#007AFF1A",
  orangeSoft: "#FF95001F",
};

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 };
export const radius = { sm: 10, md: 14, card: 26, pill: 999 };

// Apple's iOS text styles (Dynamic Type "Large" size).
const t = (size: number, lineHeight: number, weight: TextStyle["fontWeight"], extra: TextStyle = {}): TextStyle => ({
  fontSize: size,
  lineHeight,
  fontWeight: weight,
  color: colors.label as string,
  ...extra,
});

export const type = {
  largeTitle: t(34, 41, "700", { letterSpacing: 0.4 }),
  title1: t(28, 34, "700", { letterSpacing: 0.36 }),
  title2: t(22, 28, "700", { letterSpacing: -0.26 }),
  title3: t(20, 25, "600", { letterSpacing: -0.45 }),
  headline: t(17, 22, "600"),
  // No negative tracking below title sizes: React Native iOS mis-measures wrapped text with it and clips the last word.
  body: t(17, 22, "400"),
  callout: t(16, 21, "400"),
  subhead: t(15, 20, "400", { color: colors.secondary as string }),
  footnote: t(13, 18, "400", { color: colors.secondary as string }),
  caption: t(12, 16, "400", { color: colors.secondary as string }),
  // Grouped-list section header, the way Settings does it.
  section: t(13, 18, "400", { color: colors.secondary as string, textTransform: "uppercase" }),
};

// SF Pro Rounded for big numbers, like Fitness and Health.
export const rounded: TextStyle = Platform.OS === "ios" ? { fontFamily: "ui-rounded" } : {};

// Continuous (squircle) corners, the iOS shape.
export const squircle = { borderCurve: "continuous" as const };
