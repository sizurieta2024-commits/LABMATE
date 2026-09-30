# Shipaton 2026 submission kit (Next Gen Award)

Everything to paste into Devpost, plus the demo video script. Deadline Sep 30, 11:45 PM PT; we submit by 9 PM PT.

## Checklist
- [ ] Repo is **public** and has `LICENSE` (MIT ✅)
- [x] Demo video < 2:00, **Public** on YouTube: https://youtu.be/EVx0YR8PCg0 (1:23, 1080p)
- [ ] Devpost: category **Next Gen Award**, both teammates joined, both school emails verified
- [ ] Fields below pasted; gallery uploaded: `docs/gallery/*.jpg` (8 slides, 1800×1200, 3:2). Raw screens: `docs/screenshots/*.png`
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
- Expo (SDK 57) + Expo Router + TypeScript, for iOS, Android and the web.
- **Designed to Apple's Human Interface Guidelines for iOS 26:** Liquid Glass (`expo-glass-effect`) on the controls only, SF Symbols (`expo-symbols`), SF Pro and SF Pro Rounded, system colors with free dark mode, native large-title headers, haptics. The design system is in `docs/DESIGN.md`.
- Data: OpenAlex (researchers and papers), NIH RePORTER and NSF Awards APIs (grants). The ranking is a pure, unit-tested function.
- AI: structured outputs (zod schemas → JSON Schema) for briefs, quizzes and drafts, served from Vercel functions. It runs on Qwen through OpenRouter for about $0.0006 per brief (Claude is supported as a drop-in). A slow or broken answer is retried on a different provider and a smaller model, and a brief is prefetched when the lab page opens so it's usually ready by the tap. The keys stay server-side; OpenAlex and NIH are proxied, with caching, a parameter allowlist and a per-IP rate limit.
- **RevenueCat:** entitlement `pro`, an offering with a 3-month **Research Season Pass** ($27.99) and a monthly plan ($9.99), a plan picker, restore purchases, and the customer-info listener so Pro unlocks instantly. Free tier: 3 briefs. The same RevenueCat setup runs in the web build.
- Tooling: ESLint, Vitest (app + server tests), GitHub Actions CI, EAS build profiles.

**How it uses RevenueCat**
- Seasonal pricing that matches how students actually search for labs: a Research Season Pass instead of a forever subscription.
- The fresh-grant signal and unlimited briefs are gated behind `pro`, and free users see that a grant exists, which is a natural upsell.
- **Parent checkout (built, switched on with a Web Purchase Link):** "Ask a Parent to Pay" shares a RevenueCat Web Purchase Link tied to the student's app user ID, so a parent can buy on the web and the student's entitlement updates live. The button stays hidden until the link is configured.

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

**Built with:** expo, react-native, react-native-web, typescript, revenuecat, liquid-glass, sf-symbols, openrouter, qwen, openalex, nih-reporter, nsf, vercel, vitest

---

## Demo video (made)

`labmate-film-vo.mp4`, 1:23, 1080p (not in the repo, 44 MB): real iOS-simulator footage of the redesigned app, SF Pro kinetic type, camera punch-ins on the key numbers, locally generated music, and a Kokoro AI voiceover. Upload to YouTube as **Public** and paste the link above. The project that renders it is a HyperFrames composition (`~/videos/labmate-film`).

| Time | Scene | Voiceover |
|---|---|---|
| 0:00 | hook | "Forty cold emails. One reply. Meanwhile, a lab at your school just got eight hundred forty-three thousand dollars." |
| 0:08 | brand | "This is Labmate." |
| 0:11 | setup | "Tell it your university, your year, and up to three research interests. It works for any school, on day one." |
| 0:20 | radar | "Labmate reads three years of papers from your school, and ranks every researcher by fit. Right now, eight of these labs just got funded." |
| 0:28 | grant | "Labmate checks every lab for new N.I.H. and N.S.F. grants." |
| 0:33 | pro | "The details come with Labmate Pro. A season pass is thirty-nine dollars, with checkout by RevenueCat." |
| 0:40 | money | "This lab got eight hundred forty-three thousand dollars from the N.I.H., sixty-nine days ago." |
| 0:46 | brief | "Tap any paper to get it in plain English: a summary, the key terms, and smart questions to ask." |
| 0:52 | quiz | "But you can't just spam. Answer three questions first. Get all three right, and your email unlocks." |
| 1:00 | email | "Then say what caught your interest, in your own words. Labmate turns it into a short email built on your takeaway, and never invents experience." |
| 1:09 | track | "Send it, and Labmate tracks it, with a follow-up on day seven, and at most five emails a week." |
| 1:15 | outro | "Labmate. Get into a research lab this semester." |
