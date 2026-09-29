import { FRESH_GRANT_DAYS } from "../lib/config";
import { formatMoney } from "../lib/grants";
import type { Grant } from "../lib/types";
import { Chip } from "./components";

export function GrantBadge({ grant, locked }: { grant: Grant; locked?: boolean }) {
  const fresh = grant.daysAgo <= FRESH_GRANT_DAYS;
  if (locked) return <Chip tone="fresh" label={`🟢 New ${grant.source} grant · Pro`} />;
  const money = formatMoney(grant.amount);
  const when = grant.daysAgo === 0 ? "today" : `${grant.daysAgo}d ago`;
  return <Chip tone={fresh ? "fresh" : "default"} label={`${fresh ? "🟢 " : ""}${money ? `${money} ` : ""}${grant.source} · ${when}`} />;
}
