import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { fetchBrief, fetchDraft } from "../lib/api";
import { getPaper } from "../lib/openalex";
import { composeEmail } from "../lib/mail";
import { canSend, markSent, sentThisWeek } from "../lib/outreach";
import { FREE_BRIEFS, WEEKLY_SEND_CAP } from "../lib/config";
import { cacheBrief, loadBriefsUsed, loadCachedBrief, loadOutreach, newId, upsertOutreach } from "../lib/storage";
import type { Brief, Draft, Outreach, Paper } from "../lib/types";
import { useApp } from "../state/AppState";
import { Button, Card, Chip, ErrorBox, Field, Loading, Screen, Section } from "../ui/components";
import { colors, space, type } from "../ui/theme";

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
  const quizDone = answers.every((a) => a != null);

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

  if (needsPro) {
    return (
      <Screen>
        <Card style={{ gap: space.md }}>
          <Text style={type.h2}>You’ve used your free briefs</Text>
          <Text style={type.body}>Labmate Pro gives you unlimited paper briefs, the fresh-grant signal, and email drafts for the whole research season.</Text>
          <Button title="See Pro" onPress={() => router.push("/paywall")} />
          <Button title="I have Pro, reload" variant="ghost" onPress={retry} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      {error && <ErrorBox message={error} onRetry={brief ? undefined : retry} />}
      {!brief && !error && <Loading label="Reading the paper so you don't have to…" />}

      {paper && brief && (
        <>
          <View style={{ gap: space.xs }}>
            <Text style={type.label}>{authorName}</Text>
            <Text style={type.h2}>{paper.title}</Text>
          </View>

          <Card style={{ gap: space.md }}>
            <Section title="In plain English">
              <Text style={type.body}>{brief.summary}</Text>
            </Section>
            <Section title="Why it matters">
              <Text style={type.body}>{brief.whyItMatters}</Text>
            </Section>
          </Card>

          <Section title="Key terms">
            {brief.keyTerms.map((k) => (
              <Text key={k.term} style={type.body}>
                <Text style={{ fontWeight: "700" }}>{k.term}: </Text>
                {k.definition}
              </Text>
            ))}
          </Section>

          <Section title="Smart questions to ask">
            {brief.smartQuestions.map((q, i) => <Text key={i} style={type.body}>• {q}</Text>)}
          </Section>

          <Card style={{ gap: space.md, borderColor: colors.accent }}>
            <Text style={type.h3}>Understanding check</Text>
            <Text style={type.small}>Answer all 3 correctly to unlock your email. Professors can tell who actually read their work.</Text>
            {brief.quiz.map((q, qi) => (
              <View key={qi} style={{ gap: space.sm }}>
                <Text style={[type.body, { fontWeight: "600" }]}>{qi + 1}. {q.question}</Text>
                {q.options.map((opt, oi) => {
                  const chosen = answers[qi] === oi;
                  const reveal = answers[qi] != null;
                  const correct = oi === q.answerIndex;
                  return (
                    <Chip
                      key={oi}
                      label={opt}
                      selected={chosen && !reveal}
                      tone={reveal && correct && chosen ? "fresh" : reveal && chosen ? "warn" : "default"}
                      onPress={() => setAnswers(answers.map((a, i) => (i === qi ? oi : a)))}
                    />
                  );
                })}
                {answers[qi] != null && (
                  <Text style={[type.small, { color: answers[qi] === q.answerIndex ? colors.fresh : colors.warn }]}>
                    {answers[qi] === q.answerIndex ? "✓ " : "✗ Try another answer. "}
                    {q.explanation}
                  </Text>
                )}
              </View>
            ))}
            {quizDone && !quizPassed && <Text style={[type.small, { color: colors.warn }]}>Re-read the summary and fix the ones marked ✗.</Text>}
          </Card>

          {quizPassed && (
            <Card style={{ gap: space.md }}>
              <Text style={type.h3}>✓ Unlocked. Now, in your own words</Text>
              <Field
                label="What caught your interest in this paper?"
                value={takeaway}
                onChangeText={setTakeaway}
                placeholder="One or two sentences. This is what makes the email yours."
                multiline
              />
              <Button title={draft ? "Rewrite email" : "Write my email"} onPress={makeDraft} disabled={takeaway.trim().length < 20} loading={drafting} />
            </Card>
          )}

          {draft && (
            <Card style={{ gap: space.md }}>
              <Field label="Subject" value={draft.subject} onChangeText={(subject) => setDraft({ ...draft, subject })} />
              <Field label="Email" value={draft.body} onChangeText={(body) => setDraft({ ...draft, body })} multiline style={{ minHeight: 260 }} />
              <Button title="Open in Mail" onPress={send} />
              <Text style={type.small}>Tip: tap “Find their email” on the lab page, then paste the address.</Text>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
