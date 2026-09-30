import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { FRESH_GRANT_DAYS } from "../lib/config";
import { latestGrant } from "../lib/grants";
import { searchWorksAtInstitution } from "../lib/openalex";
import { rankResearchers } from "../lib/ranking";
import type { Grant, Researcher } from "../lib/types";
import { useApp } from "../state/AppState";
import { Capsule, Card, ErrorBox, Icon, Loading, Stat, tap } from "../ui/components";
import { GrantBadge } from "../ui/GrantBadge";
import { colors, rounded, space, type } from "../ui/theme";

const GRANT_LOOKUPS = 15; // top N researchers get a grant check

function HeaderButton({ icon, onPress, label }: { icon: "tray.full" | "person.crop.circle"; onPress: () => void; label: string }) {
  return (
    <Pressable accessibilityLabel={label} hitSlop={10} onPress={() => { tap(); onPress(); }} style={{ paddingHorizontal: 6 }}>
      <Icon name={icon} size={20} color={colors.label} weight="medium" />
    </Pressable>
  );
}

export default function Radar() {
  const { profile, isPro, briefsLeft } = useApp();
  const [researchers, setResearchers] = useState<Researcher[] | null>(null);
  const [grants, setGrants] = useState<Record<string, Grant | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const batches = await Promise.all(
        profile.interests.map(async (interest) =>
          (await searchWorksAtInstitution(profile.school.id, interest)).map((work) => ({ work, interest })),
        ),
      );
      const ranked = rankResearchers(batches.flat(), profile.school.id);
      setError(null);
      setResearchers(ranked);

      // Grant checks run after the list renders, a few at a time.
      const top = ranked.slice(0, GRANT_LOOKUPS);
      for (let i = 0; i < top.length; i += 3) {
        const chunk = top.slice(i, i + 3);
        const found = await Promise.all(chunk.map((r) => latestGrant(r.name, profile.school.name).catch(() => null)));
        setGrants((g) => ({ ...g, ...Object.fromEntries(chunk.map((r, j) => [r.id, found[j]])) }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load researchers");
    }
  }, [profile]);

  useEffect(() => {
    // Fetch on mount: state is only set after awaited network calls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (!profile) return null;

  const funded = Object.values(grants).filter((g) => g && g.daysAgo <= FRESH_GRANT_DAYS).length;

  const header = (
    <View style={{ gap: space.xl, marginBottom: space.sm }}>
      <Card style={{ gap: space.lg }}>
        <View style={{ gap: 2 }}>
          <Text style={type.title3}>{profile.school.name}</Text>
          <Text style={type.subhead}>{profile.interests.join(" · ")}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <Stat value={researchers ? String(researchers.length) : "–"} label="labs ranked" />
          <Stat value={String(funded)} label="just funded" color={colors.green} />
          <Stat value={isPro ? "∞" : String(briefsLeft)} label={isPro ? "briefs" : "free briefs"} />
        </View>
        {!isPro && (
          <Pressable onPress={() => { tap(); router.push("/paywall"); }} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Icon name="sparkles" size={15} color={colors.tint} />
            <Text style={[type.subhead, { color: colors.tint, fontWeight: "600", flex: 1 }]}>Unlock grant details and unlimited briefs</Text>
            <Icon name="chevron.right" size={12} color={colors.tint} weight="bold" />
          </Pressable>
        )}
      </Card>
      <Text style={[type.title2]}>Best fit for you</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 14 }}>
              <HeaderButton icon="tray.full" label="Outreach" onPress={() => router.push("/tracker")} />
              <HeaderButton icon="person.crop.circle" label="Profile" onPress={() => router.push("/onboarding")} />
            </View>
          ),
        }}
      />
      <FlatList
        style={{ backgroundColor: colors.bg }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 60 }}
        data={researchers ?? []}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={header}
        ListEmptyComponent={
          error ? <ErrorBox message={error} onRetry={() => { setError(null); load(); }} /> : researchers ? (
            <Text style={type.subhead}>No active researchers found for these interests. Try broader topics.</Text>
          ) : (
            <Loading label="Reading three years of papers from your school…" />
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        renderItem={({ item, index }) => {
          const grant = grants[item.id];
          return (
            <Card onPress={() => router.push({ pathname: "/lab/[id]", params: { id: item.id, name: item.name } })} style={{ padding: space.lg }}>
              <View style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
                <Text style={[type.title2, rounded, { fontWeight: "800", color: index < 3 ? colors.tint : colors.tertiary, width: 30 }]}>{index + 1}</Text>
                <View style={{ flex: 1, gap: space.xs }}>
                  <Text style={type.headline}>{item.name}</Text>
                  <Text style={type.subhead} numberOfLines={2}>{item.latestPaper.title}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: space.sm }}>
                    {grant && <GrantBadge grant={grant} locked={!isPro} />}
                    {item.lastAuthorPapers > 0 && <Capsule label="Runs a lab" icon="person.2.fill" />}
                    <Capsule label={`${item.matchedPapers} papers`} />
                  </View>
                </View>
                <View style={{ paddingTop: 4 }}><Icon name="chevron.right" size={13} color={colors.tertiary} weight="bold" /></View>
              </View>
            </Card>
          );
        }}
        ListFooterComponent={
          researchers?.length ? (
            <Text style={[type.footnote, { textAlign: "center", marginTop: space.lg }]}>Ranked by recent papers in your interests, weighted toward lab leads.</Text>
          ) : null
        }
      />
    </>
  );
}
