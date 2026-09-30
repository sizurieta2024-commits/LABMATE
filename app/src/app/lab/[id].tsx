import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { fetchEmail } from "../../lib/api";
import { formatMoney, latestGrant } from "../../lib/grants";
import { getAuthor, getRecentPapers } from "../../lib/openalex";
import type { AuthorDetails, EmailLookup, Grant, Paper } from "../../lib/types";
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
  // Looked up in the background as soon as the lab loads; revealed on tap.
  const [emailLookup, setEmailLookup] = useState<EmailLookup | "error" | undefined>(undefined);
  const [showEmail, setShowEmail] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const [a, p] = await Promise.all([getAuthor(id), getRecentPapers(id, 5)]);
      setAuthor(a);
      setPapers(p);
      fetchEmail(a.name, profile.school.name)
        .then(setEmailLookup)
        .catch(() => setEmailLookup("error"));
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

  const foundEmail = emailLookup && emailLookup !== "error" && emailLookup.email ? emailLookup : null;

  const copyEmail = async (address: string) => {
    await Clipboard.setStringAsync(address);
    Alert.alert("Email copied", `${address} is on your clipboard. It's also filled in when you open your draft in Mail.`);
  };

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

      {author && (
        <Group footer={showEmail && foundEmail ? `Listed in their paper "${foundEmail.source.title}"${foundEmail.source.year ? ` (${foundEmail.source.year})` : ""}.` : undefined}>
          {!showEmail ? (
            <Row icon="envelope.fill" title="Find Their Email" accessory="chevron" onPress={() => setShowEmail(true)} />
          ) : emailLookup === undefined ? (
            <Row icon="envelope.fill" title="Looking through their papers…" />
          ) : foundEmail ? (
            <Row
              icon="envelope.fill"
              iconBg={colors.green}
              title={foundEmail.email}
              subtitle="Tap to copy"
              titleStyle={{ fontWeight: "600" }}
              accessory={<Icon name="doc.on.doc" size={16} color={colors.tint} />}
              onPress={() => copyEmail(foundEmail.email)}
            />
          ) : emailLookup === "error" ? (
            <Row
              icon="envelope.fill"
              iconBg={colors.orange}
              title="Couldn't reach the email search"
              subtitle="Tap to try again"
              onPress={() => {
                setEmailLookup(undefined);
                fetchEmail(displayName, profile?.school.name ?? "")
                  .then(setEmailLookup)
                  .catch(() => setEmailLookup("error"));
              }}
            />
          ) : (
            <Row
              icon="envelope.fill"
              iconBg={colors.secondary}
              title="No public email in their papers"
              subtitle="Their lab or department page usually lists it."
            />
          )}
        </Group>
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
                  params: {
                    workId: p.id,
                    authorId: id,
                    authorName: displayName,
                    ...(grantNote ? { grantNote } : {}),
                    ...(foundEmail ? { email: foundEmail.email } : {}),
                  },
                })
              }
            />
          ))}
        </Group>
      )}
    </Screen>
  );
}
