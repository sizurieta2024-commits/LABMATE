// Product rules in one place.
export const FREE_BRIEFS = 3;
export const WEEKLY_SEND_CAP = 5; // anti-spam: professors should never get blasted
export const FOLLOW_UP_DAYS = 7;
export const FRESH_GRANT_DAYS = 120;
export const ENTITLEMENT_ID = "pro";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787").replace(/\/$/, "");
export const APP_KEY = process.env.EXPO_PUBLIC_LABMATE_APP_KEY ?? "";

// React Native defines __DEV__; tests and Node do not.
export const DEV = typeof __DEV__ !== "undefined" && __DEV__;
