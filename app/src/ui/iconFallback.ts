import type Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

type IonName = ComponentProps<typeof Ionicons>["name"];

// SF Symbols only exist on iOS. Off iOS (web, Android) we draw the closest
// Ionicon so rows, buttons and the welcome list keep their icons.
const MAP: Record<string, IonName> = {
  "arrow.clockwise": "refresh",
  "arrow.up.right": "open-outline",
  "bell.badge.fill": "notifications",
  "building.columns": "business-outline",
  "building.columns.fill": "business",
  checkmark: "checkmark",
  "checkmark.circle.fill": "checkmark-circle",
  "checkmark.seal.fill": "ribbon",
  "chevron.right": "chevron-forward",
  circle: "ellipse-outline",
  "clock.fill": "time",
  "doc.on.doc": "copy-outline",
  "doc.text.magnifyingglass": "document-text",
  "dollarsign.circle.fill": "cash",
  "envelope.fill": "mail",
  "exclamationmark.triangle.fill": "warning",
  "hammer.fill": "hammer",
  "heart.fill": "heart",
  "list.number": "list",
  "lock.fill": "lock-closed",
  "lock.open.fill": "lock-open",
  magnifyingglass: "search",
  "paperplane.fill": "paper-plane",
  "person.2.fill": "people",
  "person.crop.circle": "person-circle",
  plus: "add",
  "questionmark.bubble.fill": "help-circle",
  sparkles: "sparkles",
  tray: "file-tray-outline",
  "tray.full": "file-tray-full",
  xmark: "close",
  "xmark.circle.fill": "close-circle",
};

export function ionFor(symbol: string): IonName {
  return MAP[symbol] ?? "ellipse";
}
