# Dental Clinic Management System

Dentra is a responsive clinic workspace for managing doctors and appointments, with a React frontend and an Express/PostgreSQL backend. The interface follows the supplied blue medical-site reference.

## Start the frontend

Requires Node 22.12 or a newer compatible release.

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run dev
```

Open the printed URL at `/dashboard?preview=1` to explore the frontend using clearly labeled fictional, in-memory development records. Refresh resets that data. Production builds exclude preview fixtures.

Normal development mode uses `http://localhost:3000/api`; configure `VITE_API_URL` in `frontend/.env` using the provided example. Open `/dashboard?live=1` to exit the temporary preview and connect to the backend.

## Start the backend

Requires PostgreSQL 17 binaries. Run once from the repository root:

```powershell
npm.cmd --prefix backend ci --cache backend/.local/npm-cache
npm.cmd --prefix backend run db:local
npm.cmd --prefix backend run db:migrate
npm.cmd --prefix backend run db:seed
npm.cmd --prefix backend run dev
```

The optional local setup creates a password-protected project database on port 55432 and writes ignored credentials to `backend/.env`. It does not alter the system database service. Seeding requires empty tables and inserts fictional data. For a custom database, use `.env.example` and skip `db:local`. See the [backend guide](doc/backend-guide.md) for tests and operations.

## Included

- Reference-inspired blue hero, medical imagery, responsive sidebar/mobile navigation.
- Dashboard summaries and upcoming appointments.
- Doctor directory, details, add/edit forms, availability and delete confirmation.
- Appointment list/details/forms, filters, status transitions and scheduling feedback.
- Redux Toolkit / RTK Query services for the documented REST API.
- Accessible controls, inline errors, toasts, skeletons and empty/error states.
- Frontend behavior tests and production preview-exclusion checks.
- Persisted doctor and appointment APIs, dashboard queries, and database health checks.
- Transactional scheduling rules and database-enforced overlap prevention.

## Checks

```powershell
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run licenses
npm.cmd --prefix frontend run build
npm.cmd --prefix frontend run verify:production
npm.cmd --prefix backend run lint
npm.cmd --prefix backend test
npm.cmd --prefix backend run db:verify
npm.cmd --prefix backend run licenses
```

## Documentation

Read the [implementation plan](doc/implementation-plan.md), [design system](doc/design-system.md), [API contract](doc/api-contract.md), [dependency and cost assessment](doc/dependency-assessment.md), [frontend guide](doc/frontend-guide.md), and [backend guide](doc/backend-guide.md).

Additional budget is **$0 / PKR 0**. No paid template, AI API, premium component package, card details, or billing is required. See [third-party notices](THIRD_PARTY_NOTICES.md).

This is a public assessment demo with fictional data, not an authenticated system for real patient information. Deployment and final visual/submission evidence remain later milestones. Recheck free hosting limitations before provisioning; the Render free database selected during planning expires after 30 days.
