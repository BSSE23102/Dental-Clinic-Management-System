# Dental Clinic Management System

Dentra is a responsive clinic workspace for managing doctors and appointments. The current milestone implements the **React frontend first**, inspired by the supplied blue medical-site reference. Backend and PostgreSQL work are planned separately.

## Start the frontend

Requires Node 22.12 or a newer compatible release.

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run dev
```

Open the printed URL at `/dashboard?preview=1` to explore the frontend using clearly labeled fictional, in-memory development records. Refresh resets that data. Production builds exclude preview fixtures.

Normal development mode uses `http://localhost:3000/api`; configure `VITE_API_URL` in `frontend/.env` using the provided example. The API has not been implemented yet, so live mode displays a recoverable connection error until the backend is running.

## Included

- Reference-inspired blue hero, medical imagery, responsive sidebar/mobile navigation.
- Dashboard summaries and upcoming appointments.
- Doctor directory, details, add/edit forms, availability and delete confirmation.
- Appointment list/details/forms, filters, status transitions and scheduling feedback.
- Redux Toolkit / RTK Query services for the documented REST API.
- Accessible controls, inline errors, toasts, skeletons and empty/error states.
- Frontend behavior tests and production preview-exclusion checks.

## Checks

```powershell
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run licenses
npm.cmd --prefix frontend run build
npm.cmd --prefix frontend run verify:production
```

## Documentation

Read the [implementation plan](doc/implementation-plan.md), [design system](doc/design-system.md), [API contract](doc/api-contract.md), [dependency and cost assessment](doc/dependency-assessment.md), and [frontend guide](doc/frontend-guide.md).

Additional budget is **$0 / PKR 0**. No paid template, AI API, premium component package, card details, or billing is required. See [third-party notices](THIRD_PARTY_NOTICES.md).

This is a public assessment demo with fictional data, not an authenticated system for real patient information. PostgreSQL persistence, concurrency-safe API rules, Render deployment, and final evidence remain later milestones. The selected free Render database expires after 30 days.
