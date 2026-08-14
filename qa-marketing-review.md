# Marketing Pricing and Comparison Review

## Verified status

| Area | Desktop | Mobile | Result |
|---|---|---|---|
| Expanded sponsorship positioning | The home page clearly presents project and campaign sponsorship, six campaign types, public fundraising, social sharing, Stripe-backed contribution options, and project updates. | Content reflows into readable single-column sections. | Pass |
| Pricing tiers | Starter correctly excludes project fundraising; Growth, Scale, and Enterprise explicitly include the expanded sponsorship offer. | The four cards stack in a readable vertical sequence. | Pass |
| Annual pricing | The existing control changes the paid-tier prices by 20% and displays an annual billing note. | The control remains visible and operable. | Pass |
| Comparison table | The expanded project sponsorship, public fundraising, and recurring-contribution rows are present and visually highlighted. | The table compresses into narrow columns rather than retaining a readable horizontal-scroll width. | Defect |

## Planned repair

The comparison table will retain an explicit minimum width inside its horizontal scroll container and display a concise mobile scroll hint, preserving readable column labels and feature names without changing its desktop layout.

## Repair verification

The table now has a 720px minimum content width inside an accessible, keyboard-focusable horizontal scroll region. The mobile page provides a visible scroll instruction. Playwright verifies the expanded project-sponsorship rows and confirms that the mobile comparison region has horizontal overflow rather than compressed columns.
