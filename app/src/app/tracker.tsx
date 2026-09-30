import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { WEEKLY_SEND_CAP } from "../lib/config";
import { composeEmail } from "../lib/mail";
import { followUpDue, nextStatus, sentThisWeek, STATUS_LABEL, STATUS_ORDER } from "../lib/outreach";
import { loadOutreach, saveOutreach } from "../lib/storage";
import type { Outreach, OutreachStatus } from "../lib/types";
import { Capsule, Card, Group, Icon, Row, Screen } from "../ui/components";
import { colors, rounded, space, type } from "../ui/theme";

const STATUS_ICON: Record<OutreachStatus, "pencil" | "paperplane.fill" | "arrowshape.turn.up.left.fill" | "person.2.fill" | "star.fill"> = {
  drafted: "pencil",
  sent: "paperplane.fill",
  replied: "arrowshape.turn.up.left.fill",
  interview: "person.2.fill",
  joined: "star.fill",
};
const STATUS_COLOR: Record<OutreachStatus, string> = {
  drafted: "#8E8E93",
  sent: "#007AFF",
  replied: "#5856D6",
  interview: "#FF9500",
  joined: "#34C759",
};

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
    composeEmail(
      `Re: ${o.subject}`,
      `Hi Professor ${o.researcherName.split(" ").pop()},\n\nI wanted to follow up on my note from last week about your work on "${o.paperTitle}". I'd still love to learn whether there's a way I could contribute to the lab.\n\nThank you,\n`,
    );

  const sent = sentThisWeek(list);

  return (
    <Screen>
      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
          <Text style={[rounded, { fontSize: 44, lineHeight: 48, fontWeight: "800", color: colors.tint }]}>{sent}</Text>
          <Text style={[type.title3, { color: colors.secondary }]}>of {WEEKLY_SEND_CAP} this week</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {Array.from({ length: WEEKLY_SEND_CAP }, (_, i) => (
            <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < sent ? colors.tint : colors.fillStrong }} />
          ))}
        </View>
        <Text style={type.footnote}>Five emails a week, so every professor gets a real one. Tap a status to move it forward.</Text>
      </Card>

      {list.length === 0 && (
        <View style={{ alignItems: "center", gap: space.md, paddingVertical: space.xxxl }}>
          <Icon name="tray" size={40} color={colors.tertiary} weight="regular" />
          <Text style={type.headline}>No outreach yet</Text>
          <Text style={[type.subhead, { textAlign: "center" }]}>Brief a paper and write your first email.</Text>
        </View>
      )}

      {STATUS_ORDER.map((status) => {
        const items = list.filter((o) => o.status === status);
        if (items.length === 0) return null;
        return (
          <Group key={status} header={`${STATUS_LABEL[status].replace(" 🎉", "")} · ${items.length}`}>
            {items.map((o) => (
              <View key={o.id}>
                <Row
                  icon={STATUS_ICON[o.status]}
                  iconBg={STATUS_COLOR[o.status]}
                  title={o.researcherName}
                  subtitle={o.subject}
                  accessory={
                    followUpDue(o) ? <Capsule label="Follow up" tone="orange" icon="clock.fill" /> : <Capsule label={`${STATUS_LABEL[nextStatus(o.status)].replace(" 🎉", "")} →`} tone="blue" />
                  }
                  onPress={() => (followUpDue(o) ? followUp(o) : advance(o))}
                />
              </View>
            ))}
          </Group>
        );
      })}
    </Screen>
  );
}
