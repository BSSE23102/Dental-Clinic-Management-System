# REST API contract — backend implementation target

The frontend implements these requests through RTK Query. The backend has not been created in the current frontend-first milestone.

## Conventions

Base `/api`. Positive integer IDs. camelCase JSON. JSON request bodies. Required strings are trimmed. Doctor emails are normalized lowercase. Unknown body fields are rejected by the future server. Date/time input must include an offset; output is UTC ISO. Filters use Asia/Karachi calendar dates.

Success `{ "data": record }`; collection `{ "data": [], "meta": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 } }`. Defaults page 1 / limit 10, maximum 100. Doctor order name/id; appointment order startsAt/id. Delete 204 has no body.

Error example:

```json
{"error":{"code":"VALIDATION_ERROR","message":"Please check the highlighted fields.","fieldErrors":{"email":"Enter a valid email address."}}}
```

Non-field errors omit fieldErrors. Unexpected failures use sanitized 500 INTERNAL_ERROR; unavailable database uses 503 DATABASE_UNAVAILABLE. Middleware may return 413, 415, or 429 for oversized input, wrong content type or rate limits.

## Doctor input and output

POST/PUT input:

```json
{"fullName":"Demo Doctor One","specialization":"General Dentistry","phone":"+923001234567","email":"doctor.one@example.com","isActive":true,"availability":[{"dayOfWeek":1,"startTime":"09:00","endTime":"17:00"}]}
```

Output adds id, createdAt and updatedAt. Names 2–120 characters, specialization 2–100, phone 7–15 digits with optional + after stripping spaces/parentheses/hyphens, valid email ≤254, explicit boolean, unique weekdays 1–7 and increasing quarter-hour working times. An active doctor needs a working day. PUT replaces editable fields and the complete availability array transactionally.

| Endpoint / purpose | Request example | Success | Error examples |
| --- | --- | --- | --- |
| GET /doctors — list | /doctors?q=dentistry&active=true&page=1&limit=10; no body | 200 list envelope of doctors | 400 VALIDATION_ERROR for invalid query |
| GET /doctors/:id — details | /doctors/1; no body/query | 200 data: doctor | 400 invalid ID; 404 DOCTOR_NOT_FOUND |
| POST /doctors — create | Input above | 201 data: doctor, Location header | 400 invalid fields; 409 DOCTOR_EMAIL_EXISTS |
| PUT /doctors/:id — edit | /doctors/1, input above | 200 data: doctor | 400 invalid fields; 404 missing; 409 duplicate email or AVAILABILITY_CONFLICT |
| DELETE /doctors/:id — delete unused doctor | /doctors/1, no body | 204 empty body | 400 invalid ID; 404 missing; 409 DOCTOR_HAS_APPOINTMENTS |

## Appointment input and output

POST/PUT input:

```json
{"patientName":"Demo Patient One","patientPhone":"03001234567","patientEmail":null,"doctorId":1,"startsAt":"2026-12-07T09:00:00+05:00","durationMinutes":30,"reason":"Routine dental examination"}
```

Response example (inside data):

```json
{"id":1,"patientName":"Demo Patient One","patientPhone":"03001234567","patientEmail":null,"doctorId":1,"doctor":{"id":1,"fullName":"Demo Doctor One","specialization":"General Dentistry","isActive":true},"startsAt":"2026-12-07T04:00:00.000Z","endsAt":"2026-12-07T04:30:00.000Z","durationMinutes":30,"reason":"Routine dental examination","status":"pending","createdAt":"2026-11-25T07:00:00.000Z","updatedAt":"2026-11-25T07:00:00.000Z"}
```

Patient names 2–120, normalized phone, valid optional email/null, existing positive doctor ID, future quarter-hour start with timezone offset, duration 15–120 in 15-minute steps, reason 2–500. The interval must fit availability. The backend owns doctor/overlap/concurrency checks. New bookings start pending; PUT preserves status.

| Endpoint / purpose | Request example | Success | Error examples |
| --- | --- | --- | --- |
| GET /appointments — list | /appointments?q=demo&doctorId=1&date=2026-12-07&status=pending&page=1&limit=10 | 200 list envelope | 400 invalid query/date/status; unmatched valid filters return [] |
| GET /appointments/:id — details | /appointments/1; no body | 200 data: appointment | 400 invalid ID; 404 APPOINTMENT_NOT_FOUND |
| POST /appointments — create | Input above | 201 data: appointment, Location header | 400 invalid fields/past time/INVALID_DOCTOR; 409 INACTIVE_DOCTOR/OUTSIDE_AVAILABILITY/APPOINTMENT_CONFLICT |
| PUT /appointments/:id — edit | /appointments/1, input above | 200 data: appointment | 400 invalid input; 404 missing; 409 scheduling conflict or APPOINTMENT_NOT_EDITABLE |
| PATCH /appointments/:id/status — transition | /appointments/1/status, {"status":"confirmed"} | 200 data: updated appointment | 400 unsupported status; 404 missing; 409 INVALID_STATUS_TRANSITION |
| DELETE /appointments/:id — delete | /appointments/1, no body | 204 empty body | 400 invalid ID; 404 missing |

Transitions: pending → confirmed before start, or cancelled; confirmed → completed after end, or cancelled. Repeating the current status succeeds. Completed/cancelled cannot reopen. Editing is limited to future pending/confirmed bookings. A cancelled slot may be reused; adjacent intervals are allowed.

Conflict example:

```json
{"error":{"code":"APPOINTMENT_CONFLICT","message":"This doctor already has an appointment during that time."}}
```

## Dashboard and health

| Endpoint | Request | Success example | Failure |
| --- | --- | --- | --- |
| GET /dashboard/stats | No body/query | {"data":{"totalDoctors":8,"upcomingAppointments":12,"todayAppointments":4,"pendingAppointments":5,"upcoming":[],"timezone":"Asia/Karachi","asOf":"2026-11-25T07:00:00.000Z"}} | 503 DATABASE_UNAVAILABLE; 500 INTERNAL_ERROR |
| GET /health | No body/query | {"data":{"status":"ok","database":"up"}} | 503 DATABASE_UNAVAILABLE without connection details |

Dashboard counts are calculated from persisted rows using one captured server time and database snapshot. Total doctors includes inactive; upcoming means future pending/confirmed; today excludes cancelled; pending counts all pending. upcoming contains the next five enriched appointment records (the empty array above is shape shorthand, not a claimed result).

## Postman plan

Folders: health, doctors, appointments, dashboard, negative cases. Environment template includes baseUrl and generated record IDs; no credentials. Assert HTTP statuses, envelope shapes, errors, filter behavior, conflicts, and persistence. Destructive collection runs target local/test only. Examples are illustrative; actual results must be recorded after backend implementation.
