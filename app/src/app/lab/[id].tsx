import * as WebBrowser from "expo-web-browser";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { formatMoney, latestGrant } from "../../lib/grants";
import { getAuthor, getRecentPapers } from "../../lib/openalex";
import type { AuthorDetails, Grant, Paper } from "../../lib/types";
import { useApp } from "../../state/AppState";
import { Button, Capsule, Card, ErrorBox, Group, Icon, Loading, Row, Screen, Stat } from "../../ui/components";
import { colors, rounded, space, type } from "../../ui/theme";

function compact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

export default function Lab() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { profile, isPro } = useApp();
  const [author, setAuthor] = useState<AuthorDetails | null>(null);
  const [papers, setPapers] = useState<Paper[] | null>(null);
  const [grant, setGrant] = useState<Grant | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const [a, p] = await Promise.all([getAuthor(id), getRecentPapers(id, 5)]);
      setAuthor(a);
      setPapers(p);
      setGrant(await latestGrant(a.name, profile.school.name).catch(() => null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load this lab");
    }
  }, [id, profile]);

  useEffect(() => {
    // Fetch on mount: state is only set after awaited network calls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const displayName = author?.name ?? name ?? "Researcher";
  const grantNote = grant ? `Recently awarded a new ${grant.source} grant: "${grant.title}"` : undefined;

  const findEmail = () =>
    WebBrowser.openBrowserAsync(
      `https://www.google.com/search?q=${encodeURIComponent(`"${displayName}" ${profile?.school.name ?? ""} email`)}`,
    );

  return (
    <Screen>
      <Stack.Screen options={{ title: displayName }} />
      {error && <ErrorBox message={error} onRetry={() => { setError(null); load(); }} />}
      {!author && !error && <Loading label="Loading lab…" />}

      {author && (
        <Card style={{ gap: space.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Icon name="building.columns.fill" size={15} color={colors.secondary} />
            <Text style={type.subhead}>{author.institution ?? profile?.school.name}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: space.lg }}>
            <Stat value={compact(author.worksCount)} label="papers" />
            <Stat value={compact(author.citedBy)} label="citations" />
            {author.hIndex != null && <Stat value={String(author.hIndex)} label="h-index" />}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {author.topics.map((t) => <Capsule key={t} label={t} />)}
          </View>
        </Card>
      )}

      {grant && (
        <Card style={{ gap: space.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Icon name="dollarsign.circle.fill" size={20} color={colors.green} />
            <Text style={[type.headline, { color: colors.green }]}>Money just landed</Text>
          </View>
          {isPro ? (
            <>
              <Text style={[rounded, { fontSize: 56, lineHeight: 60, fontWeight: "800", color: colors.green, letterSpacing: -1 }]}>
                {formatMoney(grant.amount) || "New award"}
              </Text>
              <Text style={type.headline}>{grant.source} award · {grant.daysAgo} days ago</Text>
              <Text style={type.subhead}>{grant.title}</Text>
              <View style={{ alignItems: "flex-start" }}>
                <Button title="View Award" kind="tinted" size="small" icon="arrow.up.right" onPress={() => WebBrowser.openBrowserAsync(grant.url)} />
              </View>
            </>
          ) : (
            <>
              <Text style={type.body}>This lab received a new {grant.source} grant recently. Labs with fresh funding often need help now.</Text>
              <Button title="See Amount and Timing" kind="prominent" icon="lock.open.fill" onPress={() => router.push("/paywall")} />
            </>
          )}
        </Card>
      )}

      {papers && (
        <Group header="Recent papers" footer="Pick one to get a plain-English brief.">
          {papers.length === 0 ? <Row title="No recent articles found." /> : null}
          {papers.map((p) => (
            <Row
              key={p.id}
              title={p.title}
              subtitle={[p.venue, p.year, p.abstract ? null : "no abstract"].filter(Boolean).join(" · ")}
              titleStyle={{ fontWeight: "600" }}
              accessory="chevron"
              onPress={() =>
                router.push({
                  pathname: "/brief",
                  params: { workId: p.id, authorId: id, authorName: displayName, ...(grantNote ? { grantNote } : {}) },
                })
              }
            />
          ))}
        </Group>
      )}

      {author && (
        <Group>
          <Row icon="envelope.fill" title="Find Their Email" accessory="chevron" onPress={findEmail} />
        </Group>
      )}
    </Screen>
  );
}
