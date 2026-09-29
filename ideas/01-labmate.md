# Labmate — get into a research lab in 14 days (bookmarked)

**Status:** bookmarked frontrunner (Shipaton 2026, Next Gen Award)

## Problem
- Undergrad research is close to required for med school / PhD applications and a big edge for ML/CS jobs.
- The only way in is cold-emailing professors; typical reply rate is roughly 1 in 10 generic emails.
- Parents pay $2,895–$8,900 for Polygence / Lumiere just to get a research mentor.
- Competitor search (Sep 29, 2026): no software product found; only university "how to email a professor" guides.

## Product
1. **Lab Radar** — pick your university + interests; rank every active researcher there using OpenAlex (free, 250M+ works).
2. **"Money just landed" signal** — cross-check NIH RePORTER and NSF award APIs; a lab with a fresh large grant is likely hiring.
3. **Paper → 5-minute brief** — plain-English summary of their latest paper + 3 smart questions.
4. **Understanding gate** — must pass a 3-question quiz on the paper before drafting an email (anti-spam, professor-friendly).
5. **Outreach tracker** — personalized draft (opens in mail app), day-7 follow-up reminder, status board; max 5 sends/week.
6. **Interview prep** — mock lab interview built from that lab's papers.

## Monetization (RevenueCat)
| Tier | Price | Includes |
|---|---|---|
| Free | $0 | Lab Radar + 3 briefs |
| Research Season Pass (non-renewing) | $39 / 3 months | Everything |
| Pro monthly | $12.99 | Everything |
| Parent link (RevenueCat Web Billing) | same | Parent pays on web |

## Audience
Pre-meds, future PhD applicants, CS students targeting ML labs, high schoolers seeking mentors.

## Real risks
- Professor backlash to AI email → understanding gate + send cap.
- Stale data (moved faculty) → show "last published", user flagging.
- Grant signal is a heuristic → label "likely hiring".

## Demo video (2 min)
Hook ("40 emails to get into a lab") → school picked, 1,200 researchers ranked live → "$2.1M NIH grant, 19 days ago" → brief + quiz → email quoting the paper → paywall + parent link → tracker.

## Stack
Expo + react-native-purchases, Vercel function holding the Claude API key, MIT-licensed public repo.

## Sources
- https://www.globalresearchfellowship.com/blog/how-much-do-high-school-research-programs-cost-in-2026-lumiere-polygence-ccir-and-grf-compared
- https://developers.openalex.org/api-reference/introduction
