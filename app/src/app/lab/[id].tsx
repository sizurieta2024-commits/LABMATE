import * as WebBrowser from "expo-web-browser";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { formatMoney, latestGrant } from "../../lib/grants";
import { getAuthor, getRecentPapers } from "../../lib/openalex";
import type { AuthorDetails, Grant, Paper } from "../../lib/types";
import { useApp } from "../../state/AppState";
import { Button, Card, Chip, ErrorBox, Loading, Screen, Section } from "../../ui/components";
import { colors, space, type } from "../../ui/theme";

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
        <View style={{ gap: space.xs }}>
          <Text style={type.title}>{author.name}</Text>
          {!!author.institution && <Text style={type.small}>{author.institution}</Text>}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginTop: space.sm }}>
            <Chip label={`${author.worksCount} papers`} />
            <Chip label={`${author.citedBy.toLocaleString()} citations`} />
            {author.hIndex != null && <Chip label={`h-index ${author.hIndex}`} />}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginTop: space.xs }}>
            {author.topics.map((t) => <Chip key={t} label={t} />)}
          </View>
        </View>
      )}

      {grant && (
        <Card style={{ backgroundColor: colors.freshSoft, borderColor: colors.freshSoft, gap: space.xs }}>
          <Text style={[type.label, { color: colors.fresh }]}>🟢 Money just landed · likely hiring</Text>
          {isPro ? (
            <>
              <Text style={type.h3}>
                {formatMoney(grant.amount)} {grant.source} award · {grant.daysAgo} days ago
              </Text>
              <Text style={type.small}>{grant.title}</Text>
              <Button title="View the award" variant="ghost" onPress={() => WebBrowser.openBrowserAsync(grant.url)} />
            </>
          ) : (
            <>
              <Text style={type.body}>This lab received a new {grant.source} grant recently. Labs with fresh funding often need help now.</Text>
              <Button title="See amount & timing with Pro" variant="secondary" onPress={() => router.push("/paywall")} />
            </>
          )}
        </Card>
      )}

      {papers && (
        <Section title="Recent papers: pick one to brief">
          {papers.length === 0 && <Text style={type.body}>No recent articles found.</Text>}
          {papers.map((p) => (
            <Card key={p.id} style={{ gap: space.sm }}>
              <Text style={type.h3}>{p.title}</Text>
              <Text style={type.small}>
                {[p.venue, p.year, `${p.citedBy} citations`].filter(Boolean).join(" · ")}
                {!p.abstract && " · no abstract"}
              </Text>
              <Button
                title="Brief me on this paper"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: "/brief",
                    params: { workId: p.id, authorId: id, authorName: displayName, ...(grantNote ? { grantNote } : {}) },
                  })
                }
              />
            </Card>
          ))}
        </Section>
      )}

      {author && <Button title="Find their email" variant="ghost" onPress={findEmail} />}
    </Screen>
  );
}
