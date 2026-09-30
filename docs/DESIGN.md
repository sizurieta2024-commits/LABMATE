# Labmate design: iOS 26 Liquid Glass

## Reference lock
- **Primary reference:** Apple's iOS 26 system apps (Settings, Health, App Store) and the Human Interface Guidelines for Materials, Color, Typography and Layout.
- **Preserve:** the grouped system background with white content cards; SF Pro with Apple's text-style scale; semantic system colors (dark mode comes free); Liquid Glass **only** on the control layer (navigation bars, floating actions); SF Symbols instead of emoji.
- **Borrow only:** SF Pro Rounded for big numbers (like Fitness and Health) on the grant amount and fit scores.
- **Role rules (HIG):** "Don't use Liquid Glass in the content layer." Glass is for things you press that float over content: the bottom action bar and header buttons. Content cards use the grouped background, not glass. Green (systemGreen) means fresh funding only; blue (systemBlue) is the tint for actions.
- **Reject:** custom web-style cards with thick borders, emoji icons, uppercase letter-spaced labels on every section, mono fonts, gradients, glass on everything.

## Tokens (`app/src/ui/theme.ts`)
| Token | Value | Role |
|---|---|---|
| Background | `systemGroupedBackground` (#F2F2F7) | every screen |
| Card | `secondarySystemGroupedBackground` (#FFF), radius 26, continuous corners | content groups |
| Text | `label`, `secondaryLabel`, `tertiaryLabel` | hierarchy by color, not by boxes |
| Tint | `systemBlue` | buttons, links, selection |
| Fresh money | `systemGreen` | grant signal only |
| Warning | `systemOrange` | free-brief limit, follow-up due |
| Type | Large Title 34 bold, Title2 22 bold, Headline 17 semibold, Body 17, Subheadline 15, Footnote 13 | Apple text styles |
| Numbers | SF Pro Rounded (`ui-rounded`), heavy | $843K, ranks, counts |
| Spacing | 16 pt screen margin, 20 pt card padding, 8-pt grid | |
| Glass | `GlassView` (`expo-glass-effect`), regular; blue-tinted for the primary action | floating action bar, paywall CTA |

## Screens
- **Welcome:** Apple-style "What's new" sheet: icon, title, three SF Symbol feature rows, one Continue button on glass.
- **Setup:** inset grouped form (like Settings), school search as a native list.
- **Lab Radar:** native large title; each lab is a card with rank, name, latest paper, and a green "Funded" capsule.
- **Lab:** header with stats in rounded numerals; grant card; papers as a grouped list.
- **Brief:** reading layout; quiz as selectable rows with checkmarks; floating glass action bar that becomes "Write my email".
- **Paywall:** form sheet with grabber; plan picker with radio checkmarks; glass Continue button.
