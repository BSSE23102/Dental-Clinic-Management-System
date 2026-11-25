# Dental Clinic API

Express and PostgreSQL API for the React application in `../frontend`. Use fictional patient information: this demonstration does not include authentication or authorization.

## Local setup

Requires Node.js 22.12 or later and PostgreSQL 17 binaries. From `backend` in PowerShell:

```powershell
npm.cmd ci --cache .local/npm-cache
npm.cmd run db:local
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run db:verify
npm.cmd run dev
```

`db:local` creates an isolated cluster in `.local/postgres` on `127.0.0.1:55432`, generates credentials in ignored `.env`, and creates `dental_clinic` and `dental_clinic_test`. It leaves the system PostgreSQL service untouched. Set `PG_BIN` if the PostgreSQL binaries are not discovered. Stop only the project cluster with `npm.cmd run db:local:stop`.

For your own PostgreSQL installation, copy `.env.example` to `.env`, supply connection URLs, and run migrations. Do not run `db:local` against a custom `.env`. The migration role needs permission to install `btree_gist`. Seed data is optional and requires empty tables; it inserts eight fictional doctors and twenty appointments without clearing data. Production seeding additionally requires `DEMO_MODE=true` and `npm.cmd run db:seed -- --allow-demo`.

## Frontend and API

The API defaults to `http://127.0.0.1:3000/api`. Start the frontend separately and open `/dashboard?live=1` to leave its in-memory preview. See the [API contract](../doc/api-contract.md) and [backend guide](../doc/backend-guide.md).

| Resource under `/api` | Methods |
| --- | --- |
| `/health` | GET |
| `/doctors` | GET, POST |
| `/doctors/:id` | GET, PUT, DELETE |
| `/appointments` | GET, POST |
| `/appointments/:id` | GET, PUT, DELETE |
| `/appointments/:id/status` | PATCH |
| `/dashboard/stats` | GET |

Appointments use quarter-hour starts, 15–120 minute durations, doctor availability, and non-overlapping intervals enforced in PostgreSQL. Clinic dates use `Asia/Karachi`; timestamps use UTC. A doctor with appointment history cannot be deleted.

## Checks

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run licenses
```

Integration tests require `TEST_DATABASE_URL` pointing to a separate database whose name ends in `_test`. They truncate clinic tables in that database between tests and refuse the application database. Unit tests can run separately with `npm.cmd run test:unit` without PostgreSQL.

Startup checks connectivity and migration checksums; it does not automatically migrate or seed. Never commit credentials, local database files, or patient records. Deployment is separate and has not been performed. No paid dependency or external AI service is required.
