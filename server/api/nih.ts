// Proxy for NIH RePORTER. Its API sends no CORS headers, so the web build of the
// app can't call it directly (the native app can). We build the search here from
// a validated PI name instead of forwarding an arbitrary body.
import { z } from "zod";
import { json, preflight, requireAppKey } from "../lib/http.js";

const UPSTREAM = "https://api.reporter.nih.gov/v2/projects/search";

const Input = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  fiscalYears: z.array(z.number().int().min(1990).max(2100)).min(1).max(5),
});

export async function POST(request: Request): Promise<Response> {
  const denied = requireAppKey(request);
  if (denied) return denied;

  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid request" }, 400);
  const { firstName, lastName, fiscalYears } = parsed.data;

  let res: Response;
  try {
    res = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        criteria: {
          pi_names: [{ first_name: firstName, last_name: lastName }],
          fiscal_years: fiscalYears,
        },
        offset: 0,
        limit: 25,
        sort_field: "award_notice_date",
        sort_order: "desc",
      }),
    });
  } catch (e) {
    console.error("NIH RePORTER unreachable", e);
    return json({ error: "NIH RePORTER unreachable" }, 502);
  }
  if (!res.ok)
    return json({ error: `NIH RePORTER returned ${res.status}` }, 502);
  return json(await res.json());
}

export const OPTIONS = preflight;
