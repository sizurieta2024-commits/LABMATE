import { Platform } from "react-native";
import Purchases, { type CustomerInfo, type PurchasesPackage } from "react-native-purchases";
import { ENTITLEMENT_ID } from "./config";

// Keys come from the RevenueCat dashboard (Project settings → API keys).
// A Test Store key works for demos without App Store / Play accounts.
const API_KEY =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
    android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
  }) || process.env.EXPO_PUBLIC_RC_TEST_KEY;

// RevenueCat Web Purchase Link (dashboard → Web → Web Purchase Links), e.g. https://pay.rev.cat/abc123
const WEB_PURCHASE_URL = process.env.EXPO_PUBLIC_RC_WEB_PURCHASE_URL;

let configured = false;

export const revenueCatEnabled = () => !!API_KEY;

/** Configure once with our own stable user id, so a parent's web purchase lands on this account. */
export function configurePurchases(appUserID: string): void {
  if (configured || !API_KEY) return;
  Purchases.configure({ apiKey: API_KEY, appUserID });
  configured = true;
}

export const hasPro = (info: CustomerInfo) => ENTITLEMENT_ID in info.entitlements.active;

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  return Purchases.getCustomerInfo();
}

export async function getPackages(): Promise<PurchasesPackage[]> {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

/** Returns true if the purchase unlocked Pro, false if the user cancelled. */
export async function buy(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return hasPro(customerInfo);
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return false;
    throw e;
  }
}

export async function restore(): Promise<boolean> {
  if (!configured) return false;
  return hasPro(await Purchases.restorePurchases());
}

export function onCustomerInfo(cb: (info: CustomerInfo) => void): () => void {
  if (!configured) return () => {};
  Purchases.addCustomerInfoUpdateListener(cb);
  return () => Purchases.removeCustomerInfoUpdateListener(cb);
}

export function parentPayLink(appUserID: string): string | null {
  if (!WEB_PURCHASE_URL) return null;
  return `${WEB_PURCHASE_URL.replace(/\/$/, "")}/${encodeURIComponent(appUserID)}`;
}
