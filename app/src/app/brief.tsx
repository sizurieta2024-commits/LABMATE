import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { fetchBrief, fetchDraft } from "../lib/api";
import { getPaper } from "../lib/openalex";
import { composeEmail } from "../lib/mail";
import { canSend, markSent, sentThisWeek } from "../lib/outreach";
import { FREE_BRIEFS, WEEKLY_SEND_CAP } from "../lib/config";
import { cacheBrief, loadBriefsUsed, loadCachedBrief, loadOutreach, newId, upsertOutreach } from "../lib/storage";
import type { Brief, Draft, Outreach, Paper } from "../lib/types";
import { useApp } from "../state/AppState";
import { ACTION_BAR_SPACE, ActionBar, Button, Card, ErrorBox, FieldRow, Group, Icon, Loading, Row, Screen, tap } from "../ui/components";
import { colors, rounded, space, type } from "../ui/theme";

type Params = { workId: string; authorId: string; authorName: string; grantNote?: string };

export default function BriefScreen() {
  const { workId, authorId, authorName, grantNote } = useLocalSearchParams<Params>();
  const { profile, isPro, recordBrief } = useApp();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [needsPro, setNeedsPro] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [takeaway, setTakeaway] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [outreachId] = useState(() => newId("out"));

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const p = await getPaper(workId);
      setPaper(p);
      const cached = await loadCachedBrief(workId);
      if (cached) {
        setBrief(cached);
        return;
      }
      // Read usage fresh from storage so this effect doesn't re-run when the count changes.
      if (!isPro && (await loadBriefsUsed()) >= FREE_BRIEFS) {
        setNeedsPro(true);
        return;
      }
      setNeedsPro(false);
      const b = await fetchBrief(authorName, p, profile);
      await cacheBrief(workId, b);
      await recordBrief();
      setBrief(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't build the brief");
    }
  }, [workId, authorName, profile, isPro, recordBrief]);

  useEffect(() => {
    // Fetch on mount: state is only set after awaited network calls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const retry = () => {
    setError(null);
    load();
  };

  const quizPassed = !!brief && brief.quiz.every((q, i) => answers[i] === q.answerIndex);

  const makeDraft = async () => {
    if (!profile || !paper || !brief) return;
    setDrafting(true);
    setError(null);
    try {
      const d = await fetchDraft({
        professorName: authorName,
        paper,
        profile,
        briefSummary: brief.summary,
        studentTakeaway: takeaway.trim(),
        grantNote,
      });
      setDraft(d);
      await upsertOutreach(outreachRecord(d, "drafted"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't write the draft");
    } finally {
      setDrafting(false);
    }
  };

  const outreachRecord = (d: Draft, status: Outreach["status"]): Outreach => ({
    id: outreachId,
    researcherId: authorId,
    researcherName: authorName,
    paperTitle: paper?.title ?? "",
    subject: d.subject,
    body: d.body,
    status,
    createdAt: new Date().toISOString(),
  });

  const send = async () => {
    if (!draft) return;
    const list = await loadOutreach();
    if (!canSend(list)) {
      Alert.alert(
        "Weekly limit reached",
        `You've sent ${sentThisWeek(list)} emails this week. Labmate caps outreach at ${WEEKLY_SEND_CAP} a week so every email gets real attention, and professors keep answering Labmate students.`,
      );
      return;
    }
    await composeEmail(draft.subject, draft.body);
    Alert.alert("Did you send it?", "We'll remind you to follow up in 7 days.", [
      { text: "Not yet", style: "cancel" },
      {
        text: "Yes, sent",
        onPress: async () => {
          await upsertOutreach(markSent(outreachRecord(draft, "drafted")));
          router.push("/tracker");
        },
      },
    ]);
  };

  const correct = brief ? brief.quiz.filter((q, i) => answers[i] === q.answerIndex).length : 0;

  if (needsPro) {
    return (
      <Screen>
        <Card style={{ gap: space.lg, alignItems: "center", paddingVertical: space.xxxl }}>
          <Icon name="doc.text.magnifyingglass" size={44} color={colors.tint} />
          <Text style={[type.title2, { textAlign: "center" }]}>You’ve used your free briefs</Text>
          <Text style={[type.subhead, { textAlign: "center" }]}>Labmate Pro gives you unlimited paper briefs, the fresh-grant signal and email drafts for the whole research season.</Text>
          <Button title="See Labmate Pro" onPress={() => router.push("/paywall")} />
          <Button title="I Have Pro, Reload" kind="plain" size="small" onPress={retry} />
        </Card>
      </Screen>
    );
  }

  // One floating glass action that follows the student through the steps.
  const bar = !brief ? null : draft ? (
    <ActionBar title="Open in Mail" icon="paperplane.fill" onPress={send} />
  ) : quizPassed ? (
    <ActionBar
      title="Write My Email"
      icon="envelope.fill"
      onPress={makeDraft}
      loading={drafting}
      disabled={takeaway.trim().length < 20}
    />
  ) : (
    <ActionBar title={`${correct} of 3 correct to unlock`} icon="lock.fill" onPress={() => {}} disabled />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen bottomInset={ACTION_BAR_SPACE}>
        {error && <ErrorBox message={error} onRetry={brief ? undefined : retry} />}
        {!brief && !error && <Loading label="Reading the paper so you don't have to…" />}

        {paper && brief && (
          <>
            <View style={{ gap: space.sm, paddingHorizontal: space.xs }}>
              <Text style={[type.footnote, { fontWeight: "600" }]}>{authorName}{paper.year ? ` · ${paper.year}` : ""}</Text>
              <Text style={[type.title2, { fontSize: 24, lineHeight: 30 }]}>{paper.title}</Text>
            </View>

            <Card style={{ gap: space.lg }}>
              <View style={{ gap: space.sm }}>
                <Text style={[type.headline, { color: colors.tint }]}>In plain English</Text>
                <Text style={[type.body, { lineHeight: 25 }]}>{brief.summary}</Text>
              </View>
              <View style={{ gap: space.sm }}>
                <Text style={[type.headline, { color: colors.tint }]}>Why it matters</Text>
                <Text style={[type.body, { lineHeight: 25 }]}>{brief.whyItMatters}</Text>
              </View>
            </Card>

            <Group header="Key terms">
              {brief.keyTerms.map((k) => <Row key={k.term} title={k.term} subtitle={k.definition} titleStyle={{ fontWeight: "600" }} lines={0} />)}
            </Group>

            <Group header="Smart questions to ask">
              {brief.smartQuestions.map((q, i) => <Row key={i} icon="questionmark.bubble.fill" iconBg={colors.indigo} title={q} lines={0} />)}
            </Group>

            <View style={{ gap: space.lg }}>
              <View style={{ paddingHorizontal: space.xs, gap: 4 }}>
                <Text style={type.title2}>Understanding check</Text>
                <Text style={type.subhead}>Professors can tell who actually read their work. Get all three right to unlock your email.</Text>
              </View>
              {brief.quiz.map((q, qi) => {
                const picked = answers[qi];
                return (
                  <Group key={qi} footer={picked != null ? (picked === q.answerIndex ? q.explanation : "Not quite. Try another answer.") : undefined}>
                    <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm, flexDirection: "row", gap: space.sm }}>
                      <Text style={[type.headline, rounded, { color: colors.tint }]}>{qi + 1}</Text>
                      <Text style={[type.headline, { flex: 1 }]}>{q.question}</Text>
                    </View>
                    {q.options.map((opt, oi) => {
                      const chosen = picked === oi;
                      const right = chosen && oi === q.answerIndex;
                      const wrong = chosen && oi !== q.answerIndex;
                      return (
                        <Pressable key={oi} onPress={() => { tap(); setAnswers(answers.map((a, i) => (i === qi ? oi : a))); }}>
                          {({ pressed }) => (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg, paddingVertical: 13, backgroundColor: pressed ? colors.fill : right ? colors.greenSoft : "transparent" }}>
                              <Text style={[type.body, { flex: 1, color: wrong ? colors.secondary : colors.label }]}>{opt}</Text>
                              {right && <Icon name="checkmark.circle.fill" size={22} color={colors.green} />}
                              {wrong && <Icon name="xmark.circle.fill" size={22} color={colors.red} />}
                              {!chosen && <Icon name="circle" size={22} color={colors.tertiary} weight="regular" />}
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </Group>
                );
              })}
            </View>

            {quizPassed && (
              <Group header="In your own words" footer="What caught your interest? This is what makes the email yours.">
                <FieldRow value={takeaway} onChangeText={setTakeaway} placeholder="One or two sentences" multiline />
              </Group>
            )}

            {draft && (
              <Group header="Your email" footer="Edit anything before you send it.">
                <FieldRow label="Subject" value={draft.subject} onChangeText={(subject) => setDraft({ ...draft, subject })} multiline style={{ minHeight: 0 }} />
                <FieldRow value={draft.body} onChangeText={(body) => setDraft({ ...draft, body })} multiline style={{ minHeight: 280, lineHeight: 23 }} />
              </Group>
            )}
            {draft && (
              <View style={{ alignItems: "center" }}>
                <Button title="Rewrite" kind="plain" size="small" icon="arrow.clockwise" onPress={makeDraft} loading={drafting} />
              </View>
            )}
          </>
        )}
      </Screen>
      {bar}
    </View>
  );
}
