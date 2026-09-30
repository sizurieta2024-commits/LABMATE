import { router } from "expo-router";
import type { SFSymbol } from "expo-symbols";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, Share, Text, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { buy, getPackages, parentPayLink, restore, revenueCatEnabled } from "../lib/purchases";
import { useApp } from "../state/AppState";
import { ACTION_BAR_SPACE, ActionBar, Button, Group, Icon, Loading, Row, Screen, tap } from "../ui/components";
import { colors, radius, rounded, space, squircle, type } from "../ui/theme";

const PERKS: { icon: SFSymbol; color: string; title: string }[] = [
  { icon: "doc.text.magnifyingglass", color: "#007AFF", title: "Unlimited plain-English paper briefs" },
  { icon: "dollarsign.circle.fill", color: "#34C759", title: "Grant amounts and timing for every lab" },
  { icon: "envelope.fill", color: "#5856D6", title: "Email drafts built on your own takeaway" },
  { icon: "bell.badge.fill", color: "#FF9500", title: "Follow-up reminders and outreach tracker" },
];

function packageLabel(p: PurchasesPackage): { name: string; period: string } {
  if (p.packageType === "MONTHLY") return { name: "Monthly", period: "per month" };
  if (p.packageType === "THREE_MONTH") return { name: "Research Season Pass", period: "3 months · one research season" };
  return { name: p.product.title || p.identifier, period: "" };
}

export default function Paywall() {
  const { ready, profile, isPro, refreshPro, unlockDemoPro } = useApp();
  const [packages, setPackages] = useState<PurchasesPackage[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // RevenueCat is configured once the profile has loaded; opening the paywall
    // straight from a link can land here before that.
    if (!ready) return;
    getPackages()
      .then((p) => {
        setPackages(p);
        setSelected((p.find((x) => x.packageType === "THREE_MONTH") ?? p[0])?.identifier ?? null);
      })
      .catch(() => setPackages([]));
  }, [ready]);

  const purchase = async () => {
    const p = packages?.find((x) => x.identifier === selected);
    if (!p) return;
    setBusy(true);
    try {
      if (await buy(p)) {
        await refreshPro();
        router.back();
      }
    } catch (e) {
      Alert.alert("Purchase failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const askParent = async () => {
    const link = profile && parentPayLink(profile.userId);
    if (!link) {
      Alert.alert("Not set up yet", "Add a RevenueCat Web Purchase Link to enable parent checkout.");
      return;
    }
    await Share.share({ message: `I'm using Labmate to get a research position this semester. Could you unlock Pro for me? ${link}` });
  };

  if (isPro) {
    return (
      <Screen contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingTop: 80, alignItems: "center" }}>
        <Icon name="checkmark.seal.fill" size={64} color={colors.green} />
        <Text style={type.title1}>You’re Pro</Text>
        <Button title="Back to My Labs" onPress={() => router.back()} />
      </Screen>
    );
  }

  const demo = !revenueCatEnabled();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen bottomInset={ACTION_BAR_SPACE + 20} contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingTop: 76 }}>
        <View style={{ alignItems: "center", gap: space.md }}>
          <Image source={require("../../assets/icon.png")} style={{ width: 76, height: 76, borderRadius: 18, ...squircle }} />
          <Text style={[type.largeTitle, { fontWeight: "800", textAlign: "center" }]}>Labmate Pro</Text>
          <Text style={[type.subhead, { textAlign: "center", maxWidth: 300 }]}>Research mentorship programs cost $2,900 or more. Do it yourself this season.</Text>
        </View>

        <Group>
          {PERKS.map((p) => <Row key={p.title} icon={p.icon} iconBg={p.color} title={p.title} />)}
        </Group>

        {demo ? (
          <Group footer="RevenueCat key not configured, so this runs in local demo mode.">
            <Row icon="hammer.fill" iconBg="#8E8E93" title="Unlock Pro (demo)" accessory="chevron" onPress={() => { unlockDemoPro(); router.back(); }} />
          </Group>
        ) : packages == null ? (
          <Loading label="Loading plans…" />
        ) : packages.length === 0 ? (
          <Text style={type.subhead}>No plans available. Check the RevenueCat offering setup.</Text>
        ) : (
          <View style={{ gap: space.md }}>
            {packages.map((p) => {
              const on = p.identifier === selected;
              const { name, period } = packageLabel(p);
              return (
                <Pressable
                  key={p.identifier}
                  onPress={() => { tap(); setSelected(p.identifier); }}
                  style={{
                    backgroundColor: colors.card, borderRadius: radius.card, padding: space.xl, flexDirection: "row", alignItems: "center", gap: space.md,
                    borderWidth: 2, borderColor: on ? colors.tint : "transparent", ...squircle,
                  }}
                >
                  <Icon name={on ? "checkmark.circle.fill" : "circle"} size={24} color={on ? colors.tint : colors.tertiary} weight="regular" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={type.headline}>{name}</Text>
                    <Text style={type.footnote}>{period}</Text>
                  </View>
                  <Text style={[type.title3, rounded, { fontWeight: "800" }]}>{p.product.priceString}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ alignItems: "center", gap: space.xs }}>
          <Text style={[type.footnote, { textAlign: "center" }]}>Cancel anytime. Payments by RevenueCat.</Text>
          <Button title="Ask a Parent to Pay" kind="plain" size="small" icon="heart.fill" onPress={askParent} />
          {!demo && (
            <Button
              title="Restore Purchases"
              kind="plain"
              size="small"
              onPress={async () => {
                const ok = await restore().catch(() => false);
                await refreshPro();
                Alert.alert(ok ? "Restored" : "Nothing to restore");
              }}
            />
          )}
        </View>
      </Screen>
      {!demo && packages && packages.length > 0 && (
        <ActionBar title="Continue" onPress={purchase} loading={busy} />
      )}
    </View>
  );
}
