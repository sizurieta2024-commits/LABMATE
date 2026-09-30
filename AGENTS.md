# Labmate: guide for coding agents (Claude Code, Codex)

Labmate helps students get into research labs: rank every active researcher at their university by fit (OpenAlex), flag labs with fresh NIH/NSF grants, brief a paper in plain English, gate email drafting behind a 3-question understanding quiz, and track outreach. Built for RevenueCat Shipaton 2026 (Next Gen Award). Deadline: Sep 30, 2026, 11:45 PM PT.

## Layout
- `app/`: Expo (SDK 57) + Expo Router app. Routes in `app/src/app/`; logic in `app/src/lib/`; UI kit in `app/src/ui/`; global state in `app/src/state/AppState.tsx`.
  - Data: `lib/openalex.ts` (researchers and papers), `lib/grants.ts` (NIH RePORTER + NSF awards), `lib/ranking.ts` (pure ranking).
  - Money: `lib/purchases.ts` (RevenueCat, entitlement `pro`), `app/paywall.tsx`.
  - Rules: `lib/config.ts` (3 free briefs, 5 sends/week, 7-day follow-up).
- `server/`: Vercel functions: `api/brief.ts`, `api/draft.ts` (Claude, structured outputs) and `api/openalex.ts` (OpenAlex proxy: OpenAlex requires an API key since Feb 2026, keyless ≈ 10 searches/day, so the key lives server-side with a 1h cache). `dev.ts` runs them locally on :8787. All secrets live only here.
- `ideas/`: hackathon idea research.

## Commands
```bash
# app
cd app && npm install            # .npmrc sets legacy-peer-deps
npx expo install <pkg>           # always use this for Expo/RN packages (EXPO_OFFLINE=1 if api.expo.dev is blocked)
npx expo start                   # run (Expo Go works; RevenueCat runs in preview mode there)
npx eslint . && npx tsc --noEmit && npx vitest run

# server
cd server && npm install
npm run dev                      # needs server/.env with ANTHROPIC_API_KEY + OPENALEX_API_KEY
npx tsc && npx vitest run
```
Run lint, typecheck and tests for whichever package you touch before committing. CI (`.github/workflows/ci.yml`) runs the same.

## Conventions
- TypeScript strict. Keep network code in `lib/`, keep ranking and date logic pure and unit-tested (`app/src/lib/__tests__`).
- Never commit secrets. `EXPO_PUBLIC_*` values ship inside the app bundle.
- AI calls: `server/lib/claude.ts`. If `OPENROUTER_API_KEY` is set it routes to OpenRouter instead (`lib/openrouter.ts`, default `qwen/qwen3-235b-a22b-2507`, override with `OPENROUTER_MODEL`). `lib/normalize.ts` trims briefs to exactly 3 terms/questions/quiz items (the app's quiz gate needs 3) and shuffles quiz options. Claude path: Model `claude-opus-5-5`, `effort: "low"` for speed, structured outputs via `betaZodOutputFormat`, `fallbacks: "default"`. Schemas in `server/lib/schemas.ts`; the app mirrors the output types in `app/src/lib/types.ts`, so keep them in sync.
- Product ethics are features: never let the model invent student experience; keep the quiz gate and the weekly send cap.
- Expo changes fast: check versioned docs for SDK 57 rather than memory.
