import { FRESH_GRANT_DAYS } from "../lib/config";
import { formatMoney } from "../lib/grants";
import type { Grant } from "../lib/types";
import { Capsule } from "./components";

export function GrantBadge({ grant, locked }: { grant: Grant; locked?: boolean }) {
  const fresh = grant.daysAgo <= FRESH_GRANT_DAYS;
  if (locked) return <Capsule tone={fresh ? "green" : "neutral"} icon="lock.fill" label={`${fresh ? "New " : ""}${grant.source} grant`} />;
  const money = formatMoney(grant.amount);
  const when = grant.daysAgo === 0 ? "today" : `${grant.daysAgo}d ago`;
  return (
    <Capsule
      tone={fresh ? "green" : "neutral"}
      icon="dollarsign.circle.fill"
      label={`${money ? `${money} ` : ""}${grant.source} · ${when}`}
    />
  );
}
