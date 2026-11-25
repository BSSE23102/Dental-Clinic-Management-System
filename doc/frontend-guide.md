# Frontend milestone

## Run locally

From the repository root:

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run dev
```

Open the printed localhost URL. For a visual, interactive development preview before the backend exists, open `/dashboard?preview=1` on that server. A banner explicitly identifies fictional in-memory data. CRUD, filters, details, status transitions and scheduling feedback can be tried without provisioning a database. Refresh resets records. The selected mode stays in this tab's session; use the banner's **Connect to API** link (`?live=1`) to exit it.

Normal mode sends REST requests to `http://localhost:3000/api` in development. To change this, copy frontend/.env.example to frontend/.env and set VITE_API_URL. No secret belongs in a VITE_ variable. The backend is intentionally not implemented in this milestone, so normal mode shows a retryable service error until a backend is available.

## Verify

```powershell
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run licenses
npm.cmd --prefix frontend run build
npm.cmd --prefix frontend run verify:production
```

The current automated suite covers form normalization and errors, scheduling input validation, clinic-date boundaries, allowed transitions, dashboard API rendering, service failures, doctor creation/cache invalidation, confirmation before deletion, foreign-key error messages, URL-backed search/empty results, appointment creation using queried doctors, status updates, invalid routes, failed-save draft retention and duplicate-submission prevention.

The production verifier rejects fixture names, the development preview flag and a localhost API fallback in the compiled JavaScript. Production builds use only real REST integration. Configure an actual deployed API URL when deploying the separate frontend service.

## Current limits and pending work

- Frontend only: no Express server, PostgreSQL persistence, authentication, or deployment is claimed.
- Preview validation is temporary UX feedback, not authoritative scheduling or concurrency enforcement. The database must implement the documented constraints later.
- Browser automation was attempted, but the in-app browser host was unavailable and Windows browser automation stopped because it could not reliably determine the current URL. Automated DOM tests and build checks do not establish pixel-level responsive correctness. Visual/keyboard QA remains pending in a real browser.
- Manually review 360, 390, 768, 1024 and 1440px; 200% zoom; keyboard navigation; native dialog focus; mobile navigation; reduced motion; loading/empty/error states; and text contrast over the actual hero image.
- No commit, push, database provisioning, or hosting change was performed.
