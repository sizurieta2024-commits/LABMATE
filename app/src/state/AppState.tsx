import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { FREE_BRIEFS } from "../lib/config";
import {
  configurePurchases,
  getCustomerInfo,
  hasPro,
  onCustomerInfo,
  revenueCatEnabled,
} from "../lib/purchases";
import { incrementBriefsUsed, loadBriefsUsed, loadProfile, saveProfile } from "../lib/storage";
import type { Profile } from "../lib/types";

type AppState = {
  ready: boolean;
  profile: Profile | null;
  setProfile: (p: Profile) => Promise<void>;
  isPro: boolean;
  /** Only used when RevenueCat isn't configured (local demo without keys). */
  unlockDemoPro: () => void;
  refreshPro: () => Promise<void>;
  briefsUsed: number;
  briefsLeft: number; // Infinity for Pro
  recordBrief: () => Promise<void>;
};

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [briefsUsed, setBriefsUsed] = useState(0);

  const refreshPro = useCallback(async () => {
    try {
      const info = await getCustomerInfo();
      if (info) setIsPro(hasPro(info));
    } catch (e) {
      console.warn("RevenueCat customer info failed", e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [p, used] = await Promise.all([loadProfile(), loadBriefsUsed()]);
        setProfileState(p);
        setBriefsUsed(used);
        if (p) {
          configurePurchases(p.userId);
          await refreshPro();
        }
      } catch (e) {
        // A storage or RevenueCat failure must not leave the app on its loading screen.
        console.warn("Startup failed", e);
      } finally {
        setReady(true);
      }
    })();
  }, [refreshPro]);

  useEffect(() => {
    if (!profile) return;
    // Fires after purchases, restores, and web purchases made by a parent.
    return onCustomerInfo((info) => setIsPro(hasPro(info)));
  }, [profile]);

  const setProfile = useCallback(
    async (p: Profile) => {
      await saveProfile(p);
      setProfileState(p);
      configurePurchases(p.userId);
      await refreshPro();
    },
    [refreshPro],
  );

  const recordBrief = useCallback(async () => {
    setBriefsUsed(await incrementBriefsUsed());
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      profile,
      setProfile,
      isPro,
      unlockDemoPro: () => {
        if (!revenueCatEnabled()) setIsPro(true);
      },
      refreshPro,
      briefsUsed,
      briefsLeft: isPro ? Infinity : Math.max(0, FREE_BRIEFS - briefsUsed),
      recordBrief,
    }),
    [ready, profile, setProfile, isPro, refreshPro, briefsUsed, recordBrief],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppStateProvider");
  return v;
}
