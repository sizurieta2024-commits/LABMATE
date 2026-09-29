# Hometown — scholarship money hiding in public tax filings

**Status:** new #1 candidate (Shipaton 2026, Next Gen Award)

## Insight
- Private foundations must e-file Form 990-PF. Its "Supplementary Information" section states how to apply for grants and scholarships: the contact person and address, the application form, deadlines, and restrictions (e.g. "graduates of Lakewood High"). There is also a checkbox for foundations that give only to preselected recipients, which lets us filter those out.
- Charities, civic clubs and community foundations report scholarships on Form 990 Schedule I Part III: type of grant, **number of recipients** and total amount. That gives a rough sense of the odds.
- The IRS publishes all e-filed 990 XML every month (https://www.irs.gov/charities-non-profits/form-990-series-downloads). ProPublica's Nonprofit Explorer API is free and needs no key.
- Many tiny family foundations have no website. They aren't on scholarship sites and receive few applications.

## Competitor check (Sep 29, 2026)
- Scholarship sites (Fastweb, Scholarships360, Bold, Scholarships.com) rely on listings that providers submit. None found that mine 990 filings.
- Candid's "Foundation Grants to Individuals" is a professional or library database of about 10k curated foundations. It isn't a consumer app, uses no AI, and doesn't help you apply.
- Advice articles tell families to read 990s by hand, which confirms the need and the gap.

## Product
1. Enter your ZIP, high school, intended major, and your parents' employers and unions.
2. Map of every organization nearby that paid students last year, e.g. "$3.8M from 214 organizations, 61 with no website".
3. Each card shows who to write to, how, the deadline, the restrictions and last year's number of recipients. Restrictions are matched against your profile, and preselected-only foundations are hidden.
4. Parent-employer scholarships (company foundations) and civic clubs (Rotary, Elks, Lions) are included.
5. Application kit: a tailored letter to the named trustee, a checklist and deadline reminders.
6. Optional "we mail it for you": a printed letter sent by post. That's a physical service, so it's paid through web billing, not in-app purchase.

## Monetization (RevenueCat)
- Free: the map with totals, plus 3 fully revealed opportunities.
- Scholarship Season Pass: $29–$49, non-renewing until application season ends.
- Parent web purchase link (RevenueCat Web Billing).
- Mail credits through web billing (physical service).

## Real risks
- **Data pipeline in 30h** is the main risk. Mitigation: preprocess only 1–2 states (your own) from the IRS monthly zips tonight.
- **Stale data:** filings lag 1–2 years. Show "as of tax year X" and use AI plus web search to find a current page.
- **Free-text restrictions:** Claude parses them into structured eligibility fields.

## Platform vision
"Unlisted": opportunities nobody posts, found in public money flows. It starts with scholarships (990s) and grows into research labs with fresh grants (NIH and NSF, see Labmate) and more.
