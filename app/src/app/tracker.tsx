import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, Text, View } from "react-native";
import { WEEKLY_SEND_CAP } from "../lib/config";
import { followUpDue, mailtoUrl, nextStatus, sentThisWeek, STATUS_LABEL, STATUS_ORDER } from "../lib/outreach";
import { loadOutreach, saveOutreach } from "../lib/storage";
import type { Outreach } from "../lib/types";
import { Button, Card, Chip, Screen, Section } from "../ui/components";
import { space, type } from "../ui/theme";

export default function Tracker() {
  const [list, setList] = useState<Outreach[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadOutreach().then(setList);
    }, []),
  );

  const advance = async (o: Outreach) => {
    const next = list.map((x) => (x.id === o.id ? { ...x, status: nextStatus(x.status) } : x));
    setList(next);
    await saveOutreach(next);
  };

  const followUp = (o: Outreach) =>
    Linking.openURL(
      mailtoUrl(
        `Re: ${o.subject}`,
        `Hi Professor ${o.researcherName.split(" ").pop()},\n\nI wanted to follow up on my note from last week about your work on "${o.paperTitle}". I'd still love to learn whether there's a way I could contribute to the lab.\n\nThank you,\n`,
      ),
    );

  return (
    <Screen>
      <Text style={type.small}>
        {sentThisWeek(list)}/{WEEKLY_SEND_CAP} emails sent this week · tap a status to move it forward
      </Text>
      {list.length === 0 && <Text style={type.body}>No outreach yet. Brief a paper and write your first email.</Text>}
      {STATUS_ORDER.map((status) => {
        const items = list.filter((o) => o.status === status);
        if (items.length === 0) return null;
        return (
          <Section key={status} title={`${STATUS_LABEL[status]} (${items.length})`}>
            {items.map((o) => (
              <Card key={o.id} style={{ gap: space.sm }}>
                <Text style={type.h3}>{o.researcherName}</Text>
                <Text style={type.small} numberOfLines={1}>{o.subject}</Text>
                <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
                  <Chip label={`${STATUS_LABEL[o.status]} →`} onPress={() => advance(o)} />
                  {followUpDue(o) && <Chip label="⏰ Follow-up due" tone="warn" />}
                </View>
                {followUpDue(o) && <Button title="Send follow-up" variant="secondary" onPress={() => followUp(o)} />}
              </Card>
            ))}
          </Section>
        );
      })}
    </Screen>
  );
}
