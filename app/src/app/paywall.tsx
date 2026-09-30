import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Share, Text, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { buy, getPackages, parentPayLink, restore, revenueCatEnabled } from "../lib/purchases";
import { useApp } from "../state/AppState";
import { Button, Card, Loading, Screen } from "../ui/components";
import { colors, space, type } from "../ui/theme";

const PERKS = [
  "Unlimited plain-English paper briefs",
  "🟢 Fresh-grant signal: see which labs just got funded",
  "Email drafts built from your own takeaway",
  "Follow-up reminders and outreach tracker",
];

function packageLabel(p: PurchasesPackage): string {
  if (p.packageType === "MONTHLY") return "Monthly";
  if (p.packageType === "THREE_MONTH") return "Research Season Pass · 3 months";
  return p.product.title || p.identifier;
}

export default function Paywall() {
  const { profile, isPro, refreshPro, unlockDemoPro } = useApp();
  const [packages, setPackages] = useState<PurchasesPackage[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Purchases are configured once the saved profile loads; on a cold start
  // (e.g. reloading /paywall on web) wait for it before asking for plans.
  const userId = profile?.userId;
  useEffect(() => {
    if (!userId) return;
    getPackages()
      .then(setPackages)
      .catch(() => setPackages([]));
  }, [userId]);

  const purchase = async (p: PurchasesPackage) => {
    setBusy(p.identifier);
    try {
      if (await buy(p)) {
        await refreshPro();
        router.back();
      }
    } catch (e) {
      Alert.alert("Purchase failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const askParent = async () => {
    const link = profile && parentPayLink(profile.userId);
    if (!link) {
      Alert.alert("Not set up yet", "Add a RevenueCat Web Purchase Link to enable parent checkout.");
      return;
    }
    await Share.share({
      message: `I'm using Labmate to get a research position this semester. Could you unlock Pro for me? ${link}`,
    });
  };

  if (isPro) {
    return (
      <Screen>
        <Text style={type.title}>You’re Pro ⭐</Text>
        <Button title="Back to my labs" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Text style={type.title}>Land a lab this season.</Text>
        <Text style={type.small}>Research mentorship programs cost $2,900+. Labmate helps you do it yourself.</Text>
      </View>

      <Card style={{ gap: space.sm }}>
        {PERKS.map((p) => <Text key={p} style={type.body}>✓ {p}</Text>)}
      </Card>

      {!revenueCatEnabled() ? (
        <Card style={{ gap: space.sm, borderColor: colors.warn }}>
          <Text style={type.small}>RevenueCat key not configured: running in local demo mode.</Text>
          <Button title="Unlock Pro (demo)" onPress={() => { unlockDemoPro(); router.back(); }} />
        </Card>
      ) : packages == null ? (
        <Loading label="Loading plans…" />
      ) : packages.length === 0 ? (
        <Text style={type.small}>No plans available. Check the RevenueCat offering setup.</Text>
      ) : (
        packages.map((p) => (
          <Card key={p.identifier} style={{ gap: space.sm }}>
            <Text style={type.h3}>{packageLabel(p)}</Text>
            <Text style={type.body}>{p.product.priceString}</Text>
            <Button title={`Get ${packageLabel(p)}`} onPress={() => purchase(p)} loading={busy === p.identifier} />
          </Card>
        ))
      )}

      <Button title="Ask a parent to pay 💌" variant="secondary" onPress={askParent} />
      {revenueCatEnabled() && (
        <Button
          title="Restore purchases"
          variant="ghost"
          onPress={async () => {
            const ok = await restore().catch(() => false);
            await refreshPro();
            Alert.alert(ok ? "Restored" : "Nothing to restore");
          }}
        />
      )}
    </Screen>
  );
}
