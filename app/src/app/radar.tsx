import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { latestGrant } from "../lib/grants";
import { searchWorksAtInstitution } from "../lib/openalex";
import { rankResearchers } from "../lib/ranking";
import type { Grant, Researcher } from "../lib/types";
import { useApp } from "../state/AppState";
import { Card, Chip, ErrorBox, Loading } from "../ui/components";
import { GrantBadge } from "../ui/GrantBadge";
import { colors, space, type } from "../ui/theme";

const GRANT_LOOKUPS = 15; // top N researchers get a grant check

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

  const header = (
    <View style={{ gap: space.sm, marginBottom: space.md }}>
      <Text style={type.title}>{profile.school.name}</Text>
      <Text style={type.small}>
        {researchers ? `${researchers.length} researchers ranked for ` : "Ranking researchers for "}
        {profile.interests.join(" · ")}
      </Text>
      <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
        <Chip label="📬 Outreach" onPress={() => router.push("/tracker")} />
        <Chip label="✏️ Profile" onPress={() => router.push("/onboarding")} />
        {isPro ? <Chip label="⭐ Pro" tone="fresh" /> : <Chip label={`${briefsLeft} free briefs left · Go Pro`} tone="warn" onPress={() => router.push("/paywall")} />}
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: "Lab Radar" }} />
      <FlatList
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 }}
        data={researchers ?? []}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={header}
        ListEmptyComponent={
          error ? <ErrorBox message={error} onRetry={() => { setError(null); load(); }} /> : researchers ? (
            <Text style={type.body}>No active researchers found for these interests. Try broader terms.</Text>
          ) : (
            <Loading label="Reading 3 years of papers from your school…" />
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        renderItem={({ item, index }) => {
          const grant = grants[item.id];
          return (
            <Card onPress={() => router.push({ pathname: "/lab/[id]", params: { id: item.id, name: item.name } })}>
              <View style={{ flexDirection: "row", gap: space.md }}>
                <Text style={[type.h2, { color: colors.muted, width: 28 }]}>{index + 1}</Text>
                <View style={{ flex: 1, gap: space.xs }}>
                  <Text style={type.h3}>{item.name}</Text>
                  <Text style={type.small} numberOfLines={2}>Latest: {item.latestPaper.title}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginTop: space.xs }}>
                    {grant && <GrantBadge grant={grant} locked={!isPro} />}
                    <Chip label={`${item.matchedPapers} matching papers`} />
                    {item.lastAuthorPapers > 0 && <Chip label="Lab lead" />}
                    {item.matchedInterests.map((i) => <Chip key={i} label={i} />)}
                  </View>
                </View>
              </View>
            </Card>
          );
        }}
        ListFooterComponent={
          researchers?.length ? (
            <Text style={[type.small, { textAlign: "center", marginTop: space.lg }]}>Ranked by recent papers in your interests, weighted toward lab leads (last author).</Text>
          ) : null
        }
      />
    </>
  );
}
