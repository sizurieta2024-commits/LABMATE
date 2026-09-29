# Handoff: context for a new Claude session

Read this, `AGENTS.md`, `TEAM.md` and `docs/SUBMISSION.md` to pick up where the first (cloud) session left off.

## The situation
- Two students entering **RevenueCat Shipaton 2026, Next Gen Award** (student category: demo video < 2 min, public open-source repo with LICENSE, and a description; no App Store release needed).
- **Deadline: Wed Sep 30, 2026, 11:45 PM PT.** Internal target: submit by 9 PM PT; feature freeze 5 PM PT.
- We picked **Labmate** after researching ~30 ideas (see `ideas/`). Runner-up: Hometown (scholarships from IRS 990 filings).
- Repo: github.com/sizurieta2024-commits/labmate (renamed from FIRST). Teammate added as collaborator.
- Live status page with countdown: https://claude.ai/artifact/KWA6otDHtP1eFgzEUqeB2U

## What's built (all merged to main, CI green)
- Expo SDK 57 app: onboarding → Lab Radar (OpenAlex ranking) → lab page with 🟢 fresh NIH/NSF grant signal → paper brief → 3-question quiz gate + own takeaway → email draft → outreach tracker (5/week cap, 7-day follow-up) → RevenueCat paywall (entitlement `pro`, Season Pass + monthly, "Ask a parent to pay" web purchase link, labeled demo mode without keys).
- Server (Vercel functions): `/api/brief`, `/api/draft` (Claude structured outputs) and `/api/openalex` (proxy; **OpenAlex requires an API key since Feb 2026**, keyless ≈ 10 searches/day).
- Tooling: ESLint, Vitest (app 11 + server 10 tests), GitHub Actions CI, EAS profiles, env templates.

## Never tested with real data
The cloud sandbox blocked OpenAlex, NIH, NSF and had no API keys. First job on a real computer:
1. `server/.env`: `ANTHROPIC_API_KEY`, `OPENALEX_API_KEY` (free: openalex.org/settings/api) → `cd server && npm install && npm run dev`
2. `app/.env`: `EXPO_PUBLIC_API_URL=http://<LAN-IP>:8787` → `cd app && npm install && npx expo start` → Expo Go on a phone
3. Try our real university; fix anything wrong. Things to watch:
   - Ranking quality in `lib/ranking.ts`.
   - Grant name-matching false positives in `lib/grants.ts` (NIH `pi_names` first/last and NSF `pdPIName`, filtered by `orgMatches`).
   - Brief and prompt quality in `server/lib/prompts.ts`.
   - RevenueCat web purchase link format (`parentPayLink`).

## Remaining (see TEAM.md for owners)
- Person A (repo owner): make the repo public, get keys, deploy `server/` to Vercel (Root Directory `server`), test on phone, record video.
- Person B (teammate): RevenueCat dashboard + Test Store key, Web Purchase Link, `eas build --profile preview --platform android`, app icon.
- Both: Devpost (all text pre-written in docs/SUBMISSION.md), video script in the same file.

## How the user likes to work
Act autonomously: merge PRs, fix and push without asking. Only ask when something truly needs the user (their accounts, keys, phone, voice). Explain in simple language.
