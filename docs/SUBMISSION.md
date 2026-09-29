# Shipaton 2026 submission kit (Next Gen Award)

Everything to paste into Devpost, plus the demo video script. Deadline Sep 30, 11:45 PM PT; we submit by 9 PM PT.

## Checklist
- [ ] Repo is **public** and has `LICENSE` (MIT ✅)
- [ ] Demo video < 2:00, **Public** on YouTube, recorded on a real phone
- [ ] Devpost: category **Next Gen Award**, both teammates joined, both school emails verified
- [ ] Fields below pasted; screenshots uploaded (1179×2556, no device frame)
- [ ] Links: repo, video

---

## Devpost fields

**Project name:** Labmate

**Tagline (≤ 200 chars):** Get into a research lab in 14 days. Labmate finds the professors at your school who fit you, flags labs that just got funded, and makes sure you actually read their work before you email.

**Inspiration**
Research experience is close to required for med school and PhD applications, and a big edge for internships. But the only way in is cold-emailing professors, and most emails go unanswered because they're generic. Families pay research-mentorship programs $2,900 to $8,900 just to get a foot in the door. We're students who went through this, and we wanted to build the tool we wished we'd had.

**What it does**
1. **Lab Radar:** pick your university and interests. Labmate reads three years of papers from your school (OpenAlex) and ranks every active researcher by fit, weighted toward lab heads.
2. **🟢 Money just landed:** Labmate cross-checks NIH RePORTER and NSF awards. A lab that got a new grant weeks ago probably needs hands now, and almost no student knows to look for this.
3. **Paper brief:** any recent paper explained in plain English, with key terms and smart questions to ask.
4. **Understanding gate:** before Labmate writes anything, you pass a 3-question quiz on the paper and write your own takeaway in your own words. The email is built around that, and it never invents experience you don't have.
5. **Outreach tracker:** drafts open in your mail app, with follow-up reminders at day 7 and a cap of 5 emails a week, so professors get fewer, better emails.

**How we built it**
- Expo (SDK 57) + Expo Router + TypeScript mobile app.
- Data: OpenAlex (researchers and papers), NIH RePORTER and NSF Awards APIs (grants). The ranking is a pure, unit-tested function.
- AI: Claude via Vercel functions with structured outputs (zod schemas) for briefs, quizzes and drafts. The keys stay server-side; OpenAlex is proxied with caching.
- **RevenueCat:** entitlement `pro`, an offering with a 3-month **Research Season Pass** and a monthly plan, restore purchases, and a **Web Purchase Link** so a parent can pay from a shared link and unlock the student's account instantly. Free tier: 3 briefs.
- Tooling: ESLint, Vitest (app + server tests), GitHub Actions CI, EAS build profiles.

**How it uses RevenueCat**
- Seasonal pricing that matches how students actually search for labs: a Research Season Pass instead of a forever subscription.
- The fresh-grant signal and unlimited briefs are gated behind `pro`, and free users see that a grant exists, which is a natural upsell.
- **Parent checkout:** "Ask a parent to pay 💌" shares a RevenueCat Web Purchase Link tied to the student's app user ID. Parents (who already pay for prep) can buy on the web without the app, and the student's entitlement updates live via the customer-info listener.

**Challenges**
- OpenAlex started requiring API keys in 2026, so we moved all calls behind a caching proxy.
- Matching researchers across three databases (OpenAlex, NIH, NSF) with different name and organization formats.
- Making an AI email tool that professors won't hate. The quiz gate and weekly cap are product decisions, not only features.

**Accomplishments**
- Works for any university on day one, with no partnerships and no scraping, using only open data.
- The "money just landed" signal: public data turned into an unfair advantage for students.

**What we learned**
Monetization design is product design: who pays (parents), when (application season) and what feels fair (a season pass).

**What's next**
- Mock lab interviews generated from the lab's own papers.
- High-school edition: summer research programs and mentor matching.
- Publish to the App Store and Google Play before spring research season.

**Built with:** expo, react-native, typescript, revenuecat, claude, anthropic, openalex, nih-reporter, nsf, vercel, vitest

---

## Demo video script (1:55)

Record on a real phone (screen recording) and add the voiceover afterwards. Use your **real university**. Subtitles on.

| Time | On screen | Voiceover |
|---|---|---|
| 0:00–0:08 | Your face, or an inbox full of unanswered emails | "I emailed 40 professors to get into a research lab. One replied." |
| 0:08–0:18 | App opens, setup: pick your school, add 2 interests | "Labmate fixes that. Pick your school and what you're curious about." |
| 0:18–0:35 | Lab Radar loads; scroll the ranked list | "It reads three years of papers from your university and ranks every researcher who actually works on your interests." |
| 0:35–0:50 | Zoom on a 🟢 grant badge → lab page, grant card | "And this is the secret: this lab got a new $2.1 million NIH grant 19 days ago. Fresh money means they need people now." |
| 0:50–1:05 | Tap a paper → brief | "Tap any paper, and you get it in plain English: what they did, why it matters, what to ask." |
| 1:05–1:20 | Answer the quiz; one wrong, then right; ✓ Unlocked | "But you can't just spam. Pass a quick check that you actually understood it." |
| 1:20–1:35 | Type your takeaway → Write my email → draft → Open in Mail | "Then say what caught your interest in your own words, and Labmate turns it into an email a professor will actually read." |
| 1:35–1:48 | Paywall → Season Pass; tap "Ask a parent to pay" → share sheet | "Three free briefs, then a Research Season Pass, and a parent can pay from a link. Powered by RevenueCat." |
| 1:48–1:55 | Tracker board, then logo | "Built by two students in 48 hours. Labmate: get into a lab this semester." |

**Recording tips:** clean the phone status bar (full battery, no notifications), bump the font a little, cut every loading wait, and zoom in on the grant badge and quiz moments.
