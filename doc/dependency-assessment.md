# Dependencies and zero-cost assessment

Additional project budget: **$0 / PKR 0**. No card, paid template, premium component package, AI API, subscription, automatic billing, or image generation is required.

Versions were read from the public npm registry before installation. Selected releases are pinned in frontend/package.json and package-lock.json. npm installation reported zero known vulnerabilities. The complete resolved license inventory is [third-party-packages.json](third-party-packages.json); regenerate after any dependency change with `npm.cmd --prefix frontend run licenses`.

## Frontend runtime

| Package | Version | License | Required purpose | Required payment |
| --- | --- | --- | --- | --- |
| react / react-dom | 19.3.1 | MIT | Component rendering | $0 |
| react-router-dom | 7.18.7 | MIT | Nested routing and detail URLs | $0 |
| @reduxjs/toolkit | 2.15.0 | MIT | Requested store and RTK Query | $0 |
| react-redux | 9.3.1 | MIT | Store integration | $0 |
| lucide-react | 1.80.0 | ISC + inherited MIT notices | Requested icons | $0 |
| zod | 4.6.7 | MIT | Authoritative frontend schema validation | $0 |

## Development-only packages

| Package | Version | License | Purpose |
| --- | --- | --- | --- |
| vite | 8.3.8 | MIT | Dev server/build |
| @vitejs/plugin-react | 6.3.0 | MIT | React transformation |
| vitest | 5.1.2 | MIT | Meaningful behavior/unit tests |
| @testing-library/react | 16.3.3 | MIT | Component tests |
| @testing-library/dom | 10.4.2 | MIT | DOM queries and peer requirement |
| @testing-library/user-event | 14.6.13 | MIT | User interactions |
| @testing-library/jest-dom | 8.0.0 | MIT | DOM assertions |
| jsdom | 26.1.0 | MIT | Test DOM compatible with Node 22.12 |
| eslint / @eslint/js | 9.39.1 | MIT | JavaScript checks compatible with local Node |
| eslint-plugin-react-hooks | 7.1.1 | MIT | Hooks rules |
| eslint-plugin-react-refresh | 0.5.8 | MIT | Refresh-safe component exports |
| globals | 17.14.0 | MIT | Accurate lint environments |

All require $0. Latest ESLint 10 and jsdom 31 require a newer Node patch than the installed 22.12, so compatible versions were selected. npm marks ESLint 9 unsupported; upgrade that development tool when the local Node runtime is upgraded. This is not a runtime application dependency. Prettier 3.6.2 (MIT, $0) was verified and run as a one-time formatter without adding a project dependency.

## Transitive-license exceptions

Runtime dependencies use permissive licenses. The resolved development tool tree additionally includes Python-2.0 (argparse), CC-BY-4.0 (caniuse-lite data), and MPL-2.0 (Lightning CSS and platform binaries used by Vite). These are free/open-source build resources. Lightning CSS is unmodified; its file-level license applies to it, not to the React source. Retain upstream licenses and attribution. The generated inventory includes optional platform packages even when not installed on this machine.

Never assume that the root package's MIT license covers its dependencies. The license script rejects unknown license identifiers so new exceptions receive explicit review.

## Assets

- Public Sans is self-hosted under SIL OFL 1.1; original notice ships in public/licenses/PublicSans-OFL.txt. No font CDN is required.
- Free Unsplash medical portrait photo-1559839734-2b71ea197ec2 is downloaded locally. Source/photographer credit and the Unsplash license link are in THIRD_PARTY_NOTICES.md. It is a decorative stock image, not a seeded doctor's photograph or endorsement. No Unsplash+ asset or API key is used.
- Lucide/Feather notices are included in the runtime notice file.
- No purchased/generated image or premium template.

## Design tools

UI/UX Pro Max: MIT; Anthropic frontend-design: Apache-2.0; Impeccable: Apache-2.0; Vercel React best practices: MIT. Guidance requires no new paid account or application AI API. The UI/UX Pro Max source archive was inspected and its local search used. Archive SHA-256: `7CD50556E1A5AA732C06BB485BD431B6F3BFD424CBD620CD86AD66D382F30944`. Resources remain in the ignored frontend/.cache directory; no new runtime package is needed.

## Later backend and hosting

Planned Express, pg, Zod, CORS, Helmet, express-rate-limit and Supertest are MIT; dotenv is BSD-2-Clause; PostgreSQL uses its permissive PostgreSQL license. Reverify exact versions before adding them. Native SQL migrations avoid an extra migration dependency.

Render Free was selected by the user: static site, free web service and expiring free PostgreSQL. No payment method or paid features. Its free database expires after 30 days; export before expiry. Recheck current quotas and card requirements before provisioning. GitHub/Render/Loom/Drive have separate hosted-service terms and are not application libraries. Use only their required free capabilities. No hosting account has been provisioned.

Registry source: https://registry.npmjs.org/ . Asset licenses: https://github.com/google/fonts/blob/main/ofl/publicsans/OFL.txt ; https://github.com/lucide-icons/lucide/blob/main/LICENSE ; https://unsplash.com/license . Hosting source: https://render.com/docs/free .
