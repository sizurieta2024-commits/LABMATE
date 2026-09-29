import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { searchInstitutions } from "../lib/openalex";
import { newId } from "../lib/storage";
import type { Institution } from "../lib/types";
import { useApp } from "../state/AppState";
import { Button, Card, Chip, Field, Screen, Section } from "../ui/components";
import { colors, space, type } from "../ui/theme";

const YEARS = ["High school", "1st year", "2nd year", "3rd year", "4th year", "Grad"];
const SUGGESTED = ["neuroscience", "cancer biology", "machine learning", "climate", "immunology", "robotics"];

export default function Onboarding() {
  const { profile, setProfile } = useApp();
  const [name, setName] = useState(profile?.name ?? "");
  const [school, setSchool] = useState<Institution | null>(profile?.school ?? null);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolResults, setSchoolResults] = useState<Institution[]>([]);
  const [year, setYear] = useState(profile?.year ?? "");
  const [major, setMajor] = useState(profile?.major ?? "");
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [interestDraft, setInterestDraft] = useState("");
  const [experience, setExperience] = useState(profile?.experience ?? "");
  const [saving, setSaving] = useState(false);

  const searching = !school && schoolQuery.trim().length >= 2;
  useEffect(() => {
    if (!searching) return;
    const t = setTimeout(() => {
      searchInstitutions(schoolQuery).then(setSchoolResults).catch(() => setSchoolResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [schoolQuery, searching]);

  const addInterest = (raw: string) => {
    const v = raw.trim().toLowerCase();
    if (v && !interests.includes(v) && interests.length < 3) setInterests([...interests, v]);
    setInterestDraft("");
  };

  const canSave = name.trim() && school && interests.length > 0;

  const save = async () => {
    if (!school) return;
    setSaving(true);
    await setProfile({
      userId: profile?.userId ?? newId("user"),
      name: name.trim(),
      school,
      year,
      major: major.trim(),
      interests,
      experience: experience.trim(),
    });
    setSaving(false);
    router.replace("/radar");
  };

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Text style={type.title}>Get into a research lab.</Text>
        <Text style={type.small}>We rank every active researcher at your school by fit, flag labs with fresh funding, and help you write an email professors actually answer.</Text>
      </View>

      <Field label="Your name" value={name} onChangeText={setName} placeholder="Alex Rivera" autoComplete="name" />

      <Section title="Your university">
        {school ? (
          <Card style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={type.h3}>{school.name}</Text>
              {!!school.city && <Text style={type.small}>{school.city}</Text>}
            </View>
            <Chip label="Change" onPress={() => { setSchool(null); setSchoolQuery(""); }} />
          </Card>
        ) : (
          <>
            <Field label="Search" value={schoolQuery} onChangeText={setSchoolQuery} placeholder="e.g. University of Michigan" autoCorrect={false} />
            {(searching ? schoolResults : []).map((s) => (
              <Card key={s.id} onPress={() => setSchool(s)} style={{ paddingVertical: space.md }}>
                <Text style={type.h3}>{s.name}</Text>
                <Text style={type.small}>{[s.city, s.country].filter(Boolean).join(", ")}</Text>
              </Card>
            ))}
          </>
        )}
      </Section>

      <Section title="Year">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {YEARS.map((y) => <Chip key={y} label={y} selected={year === y} onPress={() => setYear(y)} />)}
        </View>
      </Section>

      <Field label="Major (or intended)" value={major} onChangeText={setMajor} placeholder="Biology" />

      <Section title={`Research interests (${interests.length}/3)`}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {interests.map((i) => <Chip key={i} label={`${i}  ✕`} selected onPress={() => setInterests(interests.filter((x) => x !== i))} />)}
        </View>
        <Field
          label="Add an interest"
          value={interestDraft}
          onChangeText={setInterestDraft}
          onSubmitEditing={() => addInterest(interestDraft)}
          placeholder="type and press return"
          returnKeyType="done"
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {SUGGESTED.filter((s) => !interests.includes(s)).map((s) => <Chip key={s} label={`+ ${s}`} onPress={() => addInterest(s)} />)}
        </View>
      </Section>

      <Field
        label="Relevant experience (optional)"
        value={experience}
        onChangeText={setExperience}
        placeholder="Courses, lab skills, projects. We never invent anything you don't write here."
        multiline
      />

      <Button title="Find my labs" onPress={save} disabled={!canSave} loading={saving} />
      <Text style={[type.small, { textAlign: "center", color: colors.muted }]}>Research data from OpenAlex, NIH RePORTER and NSF. All free and public.</Text>
    </Screen>
  );
}
