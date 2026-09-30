import { Redirect } from "expo-router";

// A mistyped or stale link (for example a shared web URL) goes back to the start
// instead of Expo's developer "Unmatched Route" page.
export default function NotFound() {
  return <Redirect href="/" />;
}
