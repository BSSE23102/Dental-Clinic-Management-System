# Backend implementation and operations

The backend lives in `backend/`. Express routes validate strict Zod schemas, controllers translate HTTP requests, services own transactions and booking rules, and repositories issue parameterized PostgreSQL queries. The existing frontend consumes this API through RTK Query.

## Persistence and consistency

The migration creates doctors, weekly availability, appointments, and a migration ledger. Doctor email addresses are unique regardless of case. Foreign keys preserve appointment history. A `btree_gist` exclusion constraint prevents overlapping non-cancelled appointments per doctor using half-open intervals: an appointment ending at 10:00 can be followed by one starting at 10:00.

Writes lock doctors in ascending ID order before locking appointments. Reassignments recheck ownership after acquiring locks. Services validate availability and overlap within transactions; the database constraint also protects against concurrent conflicts. Availability edits cannot invalidate pending or confirmed appointments that have not ended.

Clinic time is fixed to `Asia/Karachi`. Input timestamps require offsets; output timestamps are UTC. Date filters use clinic-local dates. Pending appointments can be confirmed before the start or cancelled. Confirmed appointments can be completed after the end or cancelled. Completed and cancelled statuses are terminal; repeating the current status is idempotent.

## Development and database operations

Follow [backend setup](../backend/README.md). The optional local setup script creates a separate password-protected cluster on port 55432 using installed PostgreSQL binaries. Credentials and database files stay in ignored paths. It does not change the installed service on 5432.

Numbered SQL migrations have SHA-256 checksums. The runner holds an advisory lock and applies each file transactionally. Editing an applied migration is rejected; add a new migration instead. Startup checks the ledger. Seeding is explicit, fictional, and allowed only on empty tables.

Integration tests require a separate `_test` database and truncate its clinic tables. They exercise CRUD, concurrent booking conflicts, database constraints, status transitions, persistence through new application instances, clinic-date boundaries, migration rollback, and seed safeguards. HTTP unit tests cover validation, headers, CORS, rate limiting, and sanitized failures.

## Verification recorded on 25 November 2026

- Backend lint passed and all 48 tests passed: 24 unit/HTTP tests and 24 PostgreSQL integration tests.
- Migration, fictional seeding, and schema verification completed on the local PostgreSQL 17.4 cluster. The application database contains eight doctors and twenty appointments; tests use a separate database.
- All 18 exported collection requests passed against the running API using a Node HTTP runner. The runner checked recorded status expectations and removed only the records it created. The Postman desktop application itself was not used.
- `/api/health` returned HTTP 200 with `database: up`. Persisted rows remained available after restarting the API.
- npm installation reported zero vulnerabilities. The license command reviewed 257 locked packages, including optional platform dependencies, and generated installed package notices.
- No hosted deployment or browser integration QA is claimed by these backend checks.

## Configuration and security boundaries

Configure `DATABASE_URL`, `TEST_DATABASE_URL` for tests, `CORS_ORIGIN`, `PORT`, `HOST`, `NODE_ENV`, and `DEMO_MODE` using `.env.example`. Production defaults to host `0.0.0.0`; development defaults to loopback. Use the provider's documented TLS connection settings without disabling certificate verification.

This demonstration has no user authentication or role authorization. Use fictional records only. It includes security headers, explicit CORS origins, JSON size limits, request IDs, rate limits, strict schemas, parameterized queries, and sanitized errors. Logs omit request bodies, connection strings, and raw database errors. Authentication and access controls are required before handling real patient records.

## Dependency and cost assessment

| Dependency | Necessity | License | Additional cost |
| --- | --- | --- | --- |
| Express | HTTP routes and middleware | MIT | PKR 0 |
| pg | PostgreSQL connections and SQL | MIT | PKR 0 |
| Zod | Input and environment validation | MIT | PKR 0 |
| cors | Browser origin policy | MIT | PKR 0 |
| Helmet | Security headers | MIT | PKR 0 |
| express-rate-limit | Request throttling | MIT | PKR 0 |
| dotenv | Local environment configuration | BSD-2-Clause | PKR 0 |
| ESLint, @eslint/js, globals | Development linting | MIT | PKR 0 |
| Vitest | Test runner | MIT | PKR 0 |
| Supertest | HTTP assertions | MIT | PKR 0 |
| PostgreSQL | Database and constraints | PostgreSQL License | PKR 0 |

Direct package versions are pinned; registry license and engine metadata were checked before selection. `npm.cmd run licenses` checks the lockfile against reviewed license expressions and writes `backend/THIRD_PARTY_LICENSES.txt` plus `doc/backend-third-party-packages.json`. The full tree includes optional platform packages and development tooling; notices collect license texts for installed packages. Retain notices when redistributing. MPL-2.0, if present in development tooling, has file-level conditions; CC-BY-4.0 requires attribution. Neither is a paid runtime requirement.

No ORM, external AI API, date library, paid service SDK, subscription, or billing setup is required. JavaScript `Intl` handles clinic-time conversion; PostgreSQL provides transactions and overlap guarantees. Total additional software budget is **$0 / PKR 0**.

Deployment has not been performed. Recheck current free hosting limits before selecting a service. Expiring free databases require a retention plan. The project plan records Render's previously verified limits; it does not authorize a paid upgrade or make this demo suitable for durable patient records.
