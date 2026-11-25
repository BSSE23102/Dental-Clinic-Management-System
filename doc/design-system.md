# Design system — Dentra

## Direction

The user supplied a healthcare-site screenshot and asked for this style. Translate its muted blue medical hero, large clean typography, navy details, bright white surfaces, careful spacing and photo-led composition into a clinic administration dashboard. Preserve the assessment's desktop sidebar, mobile navigation, doctor management and appointment workflows. Dentra is a working project name, not a claim about an actual clinic.

The dashboard leads with a blue hero and medical portrait, then a four-column white statistics strip and upcoming appointment table. Doctor pages use quiet directory cards; appointment pages use readable tables/cards. No marketing testimonials, fabricated clinical claims, decorative charts, or unnecessary navigation destinations.

## Tokens

| Role | Value |
| --- | --- |
| Ink | #153f53 |
| Primary / hover | #124e66 / #0d3b50 |
| Hero blue | #88aebd |
| Canvas / surface | #f5f7f8 / #ffffff |
| Secondary text | #657983 |
| Borders | #e1e8ec |
| Error | #a5333d |
| Font | Public Sans, local variable TTF, system sans fallback |
| Geometry | 4–8px UI radii, 8px spacing rhythm, restrained shadows |
| Motion | Short interaction feedback; disabled for reduced motion |

## Resources and process

Primary planning: UI/UX Pro Max, MIT, https://github.com/nextlevelbuilder/ui-ux-pro-max-skill . Implementation guidance: Anthropic frontend-design, Apache-2.0. Audit and refinement: Impeccable, Apache-2.0. React/accessibility: Vercel agent-skills and Web Interface Guidelines. These are development instructions, not runtime AI dependencies. Record actual search and audit results separately; do not claim an audit before running it.

Public Sans: SIL OFL 1.1, https://github.com/google/fonts/tree/main/ofl/publicsans ; full notice ships in frontend/public/licenses/PublicSans-OFL.txt. Lucide: ISC plus inherited Feather MIT notices. Stock portrait: free Unsplash image photo-1559839734-2b71ea197ec2, attributed to Humberto Chávez; https://unsplash.com/photos/FVh_yqLR9eA ; license https://unsplash.com/license . No paid Unsplash+ asset, API key, image generation, or runtime image request. The decorative portrait does not represent a seeded doctor or claim endorsement.

## Responsive and accessibility contract

- 1024px+: desktop sidebar, four statistics, full table.
- 768–1023px: navigation drawer, adaptive summaries and filters.
- Below 768px: stacked controls, two statistics per row, record cards and one-column forms.
- Verify 360, 390, 768, 1024 and 1440px without document overflow.
- Buttons/actions 44px minimum, meaningful labels, visible focus, logical headings, native dialog behavior, keyboard navigation, text plus status colors, reduced-motion support.
- Every query has loading, empty, error and retry behavior. Never substitute fictional counts for unavailable live data.
