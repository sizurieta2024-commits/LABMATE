import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { searchInstitutions } from "../lib/openalex";
import { newId } from "../lib/storage";
import type { Institution } from "../lib/types";
import { useApp } from "../state/AppState";
import { ACTION_BAR_SPACE, ActionBar, FieldRow, Group, Icon, Row, Screen, tap } from "../ui/components";
import { colors, radius, space, type } from "../ui/theme";

const YEARS = ["High school", "1st year", "2nd year", "3rd year", "4th year", "Grad"];
const SUGGESTED = ["neuroscience", "cancer biology", "machine learning", "climate", "immunology", "robotics"];

function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress: () => void; icon?: "plus" | "xmark" }) {
  return (
    <Pressable
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 8,
        backgroundColor: selected ? colors.tint : colors.fill, opacity: pressed ? 0.7 : 1,
      })}
    >
      {icon && <Icon name={icon} size={11} color={selected ? "#FFFFFF" : colors.tint} weight="bold" />}
      <Text style={{ fontSize: 15, fontWeight: "600", color: selected ? "#FFFFFF" : colors.label }}>{label}</Text>
    </Pressable>
  );
}

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

  const canSave = !!name.trim() && !!school && interests.length > 0;
  const missing = !name.trim() ? "Add your name" : !school ? "Choose your university" : interests.length === 0 ? "Add at least one interest" : undefined;

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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen bottomInset={ACTION_BAR_SPACE}>
        <Group header="About you">
          <FieldRow label="Name" value={name} onChangeText={setName} placeholder="Alex Rivera" autoComplete="name" maxLength={80} />
          <FieldRow label="Major" value={major} onChangeText={setMajor} placeholder="Biology" maxLength={80} />
          <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.md }}>
            <Text style={type.body}>Year</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
              {YEARS.map((y) => <Chip key={y} label={y} selected={year === y} onPress={() => setYear(y)} />)}
            </View>
          </View>
        </Group>

        <Group header="University">
          {school ? (
            <Row
              icon="building.columns.fill"
              title={school.name}
              subtitle={[school.city, school.country].filter(Boolean).join(", ")}
              accessory={<Text style={[type.body, { color: colors.tint }]}>Change</Text>}
              onPress={() => { setSchool(null); setSchoolQuery(""); }}
            />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: space.lg }}>
              <Icon name="magnifyingglass" size={16} color={colors.secondary} />
              <View style={{ flex: 1 }}>
                <FieldRow value={schoolQuery} onChangeText={setSchoolQuery} placeholder="Search your university" autoCorrect={false} />
              </View>
            </View>
          )}
          {(searching ? schoolResults : []).map((s) => (
            <Row
              key={s.id}
              icon="building.columns"
              iconBg={colors.indigo}
              title={s.name}
              subtitle={[s.city, s.country].filter(Boolean).join(", ")}
              onPress={() => setSchool(s)}
            />
          ))}
        </Group>

        <Group header={`Research interests · ${interests.length} of 3`} footer="Pick up to three. Broad topics find more labs.">
          {interests.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, padding: space.lg }}>
              {interests.map((i) => <Chip key={i} label={i} selected icon="xmark" onPress={() => setInterests(interests.filter((x) => x !== i))} />)}
            </View>
          )}
          <FieldRow
            value={interestDraft}
            onChangeText={setInterestDraft}
            onSubmitEditing={() => addInterest(interestDraft)}
            placeholder="Add a topic and press return"
            maxLength={60}
            returnKeyType="done"
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, padding: space.lg }}>
            {SUGGESTED.filter((s) => !interests.includes(s)).map((s) => <Chip key={s} label={s} icon="plus" onPress={() => addInterest(s)} />)}
          </View>
        </Group>

        <Group header="Experience (optional)" footer="Courses, lab skills, projects. Labmate never invents anything you don't write here.">
          <FieldRow value={experience} onChangeText={setExperience} placeholder="e.g. Intro to Neuroscience, Python" multiline maxLength={600} />
        </Group>
      </Screen>
      <ActionBar title={missing ?? "Find My Labs"} icon={missing ? undefined : "sparkle.magnifyingglass"} onPress={save} disabled={!canSave} loading={saving} />
    </View>
  );
}
