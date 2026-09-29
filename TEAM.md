# Team plan: Labmate for Shipaton 2026 (Next Gen Award)

**Deadline: Wed Sep 30, 2026, 11:45 PM PT.** Our internal deadline is **9:00 PM PT**, leaving a buffer.
Submit on Devpost: demo video (<2 min, public YouTube), this public repo (MIT `LICENSE` ✅), description.

## How we work
- `main` is always working. Each task gets its own branch off `main`, e.g. `feat/revenuecat`, `fix/ranking`.
- Small PRs, merged quickly. Pull `main` often: `git pull origin main`.
- Before any PR: `cd app && npx eslint . && npx tsc --noEmit && npx vitest run` and/or `cd server && npx tsc && npx vitest run`. CI checks the same.
- **Ownership (to avoid merge conflicts):** Person A owns `server/`, `app/src/lib/openalex.ts`, `grants.ts`, `ranking.ts`, `app/src/app/brief.tsx`. Person B owns `app/src/lib/purchases.ts`, `app/src/app/paywall.tsx`, `app/app.json`, `app/eas.json`, `app/assets/`. Anything else: say in chat before editing.
- Secrets never go in git. Share keys privately (not in the repo, not in Devpost).

## Task board (tick when done)

### Person A: data + AI quality + video
- [ ] `server/.env` with `ANTHROPIC_API_KEY`; run `npm run dev`; app `.env` → `EXPO_PUBLIC_API_URL=http://<LAN-IP>:8787`
- [ ] Run on a phone with **our real university**; check the ranking, grant badges and briefs make sense; fix anything off
- [ ] Tune prompts in `server/lib/prompts.ts` on 5 real papers
- [ ] Deploy `server/` to Vercel (Root Directory `server`, env `ANTHROPIC_API_KEY`, `LABMATE_APP_KEY`); share the URL with B
- [ ] Record the demo video (script in chat); upload to YouTube as **Public**

### Person B: money + build + submission
- [ ] RevenueCat: project, entitlement `pro`, products (3-month Season Pass $39, Monthly $12.99), default offering, **Test Store** key → `EXPO_PUBLIC_RC_TEST_KEY`
- [ ] Web Purchase Link for "Ask a parent to pay" → `EXPO_PUBLIC_RC_WEB_PURCHASE_URL`; confirm the link format matches `lib/purchases.ts#parentPayLink`
- [ ] `eas build --profile preview --platform android` (installable APK with real purchase UI) and/or `development` build; test buy + restore
- [ ] Branding: app icon + splash in `app/assets/`, name "Labmate" in `app.json`
- [ ] Devpost: select **Next Gen Award**, verify student emails, both on the team, description + screenshots, repo link
- [ ] README: add screenshots and the video link at the end

### Stretch (only if everything above is done)
- [ ] Interview prep: mock questions generated from the lab's papers (new `/api/interview`)
- [ ] Onboarding polish: suggested interests by major

## Status / notes
(write short updates here or in the group chat)
