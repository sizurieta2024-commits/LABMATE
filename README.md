# Labmate: get into a research lab in 14 days

Undergrad research is close to required for med school and PhD applications, and the only way in is cold-emailing professors, who rarely reply to generic emails. Parents pay $2,900+ for mentorship programs just to get a foot in the door.

**Labmate does it for $39:**

1. **Lab Radar.** Pick your university and interests. Labmate reads three years of papers from your school ([OpenAlex](https://openalex.org)) and ranks every active researcher by fit, weighted toward lab leads.
2. **🟢 Money just landed.** Cross-checks [NIH RePORTER](https://reporter.nih.gov) and [NSF](https://www.nsf.gov/awardsearch/) for fresh grants. A lab that got funded weeks ago probably needs hands now.
3. **Paper brief.** Any recent paper, explained in plain English with key terms and smart questions to ask.
4. **Understanding gate.** You must pass a 3-question quiz on the paper and write your own takeaway before Labmate drafts an email. Professors get fewer, better emails.
5. **Outreach tracker.** Drafts open in your mail app. Follow-up reminders at day 7, and a cap of 5 sends a week.

Monetized with **RevenueCat**: 3 free briefs, then Labmate Pro (Research Season Pass or monthly). A parent can pay through a RevenueCat Web Purchase Link from "Ask a parent to pay".

Built by two students for RevenueCat Shipaton 2026 (Next Gen Award). MIT licensed.

## Architecture

```
app/     Expo SDK 57 + Expo Router (TypeScript)
  └─ calls OpenAlex, NIH RePORTER, NSF directly (free, keyless)
  └─ calls server/ for AI (brief, draft)
server/  Vercel functions → Claude (structured outputs)
```

## Run it

**1. Server (AI)**
```bash
cd server
cp .env.example .env        # add ANTHROPIC_API_KEY
npm install
npm run dev                 # http://0.0.0.0:8787
```

**2. App**
```bash
cd app
cp .env.example .env        # EXPO_PUBLIC_API_URL=http://<your-laptop-LAN-IP>:8787
npm install
npx expo start              # scan the QR code with Expo Go (same Wi-Fi)
```
Without RevenueCat keys the paywall runs in a clearly labeled local demo mode.

## RevenueCat setup (about 15 minutes)
1. Create a project at app.revenuecat.com.
2. Add an **entitlement** named `pro`.
3. Add products and attach them to `pro`: a 3-month "Research Season Pass" ($39) and a monthly plan ($12.99).
4. Create the **default offering** with packages *Three month* and *Monthly*.
5. For the demo without store accounts, use the **Test Store** and put its public key in `EXPO_PUBLIC_RC_TEST_KEY`. Real purchase UI needs a development build (`eas build --profile development`); Expo Go runs RevenueCat in preview mode.
6. Optional: create a **Web Purchase Link** (Web Billing, Stripe) for the same offering and put its URL in `EXPO_PUBLIC_RC_WEB_PURCHASE_URL`. The app appends the user's app user ID so the parent's purchase unlocks the student's account. Check the link format in the dashboard.

## Deploy the server
Import the repo in Vercel, set **Root Directory** to `server`, and add `ANTHROPIC_API_KEY` (and optionally `LABMATE_APP_KEY`, matching `EXPO_PUBLIC_LABMATE_APP_KEY` in the app). Endpoints: `/api/brief`, `/api/draft`.

## Builds
`app/eas.json` has `development` (dev client, Android APK), `preview` (installable APK) and `production` profiles:
```bash
npm i -g eas-cli && cd app && eas build --profile preview --platform android
```

## Quality
```bash
cd app && npx eslint . && npx tsc --noEmit && npx vitest run
cd server && npx tsc && npx vitest run
```
CI runs both on every PR.
