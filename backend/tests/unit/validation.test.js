import { describe, expect, it } from 'vitest';
import { doctorBody, appointmentBody, appointmentQuery, doctorQuery, idParams } from '../../src/schemas/clinic.js';
import { doctorBody as validDoctor, appointmentBody as validAppointment } from '../helpers.js';
import { allowedTransition } from '../../src/services/appointmentsService.js';
import { clinicParts, fitsAvailability, isQuarterHour } from '../../src/utils/time.js';
import { readConfig } from '../../src/config/env.js';
import { assertTestDatabase } from '../helpers.js';

describe('request schemas', () => {
  it('normalizes contacts and rejects unknown fields', () => { const result = doctorBody.parse(validDoctor({ email: ' DOCTOR@EXAMPLE.COM ' })); expect(result.email).toBe('doctor@example.com'); expect(result.phone).toBe('+923001234567'); expect(doctorBody.safeParse(validDoctor({ password: 'not-supported' })).success).toBe(false); });
  it('requires unique working days and valid quarter-hour intervals', () => { const valid = validDoctor(); for (const availability of [[], [valid.availability[0], valid.availability[0]], [{ dayOfWeek: 1, startTime: '17:00', endTime: '09:00' }], [{ dayOfWeek: 1, startTime: '09:05', endTime: '17:00' }]]) expect(doctorBody.safeParse({ ...valid, availability }).success).toBe(false); });
  it('allows an inactive doctor without working days', () => { expect(doctorBody.safeParse(validDoctor({ isActive: false, availability: [] })).success).toBe(true); });
  it('requires numeric doctor IDs and supported durations in JSON', () => { expect(appointmentBody.safeParse(validAppointment(1)).success).toBe(true); for (const changes of [{ doctorId: '1' }, { doctorId: 0 }, { durationMinutes: 20 }, { durationMinutes: 135 }, { patientPhone: 'abc' }, { patientEmail: 'bad' }, { status: 'completed' }]) expect(appointmentBody.safeParse(validAppointment(1, changes)).success).toBe(false); });
  it('normalizes omitted or blank optional patient email', () => { expect(appointmentBody.parse(validAppointment(1, { patientEmail: undefined })).patientEmail).toBeNull(); expect(appointmentBody.parse(validAppointment(1, { patientEmail: '' })).patientEmail).toBeNull(); });
  it('rejects invalid calendar dates and timestamps without offsets', () => { expect(appointmentQuery.safeParse({ date: '2026-02-30' }).success).toBe(false); expect(appointmentBody.safeParse(validAppointment(1, { startsAt: '2026-12-07T10:00:00' })).success).toBe(false); });
  it('uses bounded numeric query parameters and exact booleans', () => { expect(doctorQuery.parse({ active: 'false' }).active).toBe(false); expect(doctorQuery.parse({}).limit).toBe(10); for (const query of [{ page: '0' }, { limit: '101' }, { active: 'yes' }, { q: 'a'.repeat(101) }, { page: ['1', '2'] }]) expect(doctorQuery.safeParse(query).success).toBe(false); });
  it('rejects malformed and overflowing record IDs', () => { for (const id of ['0', '-1', '1abc', '2147483648', '1 OR 1=1']) expect(idParams.safeParse({ id }).success).toBe(false); });
});
describe('clinic scheduling helpers', () => {
  it('handles clinic dates across UTC midnight', () => { expect(clinicParts('2026-11-25T19:01Z')).toEqual({ date: '2026-11-26', time: '00:01', dayOfWeek: 4 }); });
  it('checks the entire interval and rejects cross-day appointments', () => { const hours = validDoctor().availability; expect(fitsAvailability('2026-12-07T04:00Z', '2026-12-07T04:30Z', hours)).toBe(true); expect(fitsAvailability('2026-12-07T12:45Z', '2026-12-07T13:15Z', hours)).toBe(false); expect(fitsAvailability('2026-12-07T18:45Z', '2026-12-07T19:15Z', [{ dayOfWeek: 1, startTime: '00:00', endTime: '23:45' }])).toBe(false); });
  it('rejects seconds and non-quarter-hour starts', () => { expect(isQuarterHour('2026-12-07T04:15:00Z')).toBe(true); expect(isQuarterHour('2026-12-07T04:15:01Z')).toBe(false); expect(isQuarterHour('2026-12-07T04:07:00Z')).toBe(false); });
  it('enforces terminal and time-dependent status transitions', () => { const now = new Date('2026-12-07T08:00Z'); expect(allowedTransition({ status: 'pending', startsAt: '2026-12-07T09:00Z' }, 'confirmed', now)).toBe(true); expect(allowedTransition({ status: 'pending', startsAt: '2026-12-07T07:00Z' }, 'confirmed', now)).toBe(false); expect(allowedTransition({ status: 'confirmed', endsAt: '2026-12-07T09:00Z' }, 'completed', now)).toBe(false); expect(allowedTransition({ status: 'confirmed', endsAt: '2026-12-07T07:00Z' }, 'completed', now)).toBe(true); expect(allowedTransition({ status: 'cancelled' }, 'pending', now)).toBe(false); expect(allowedTransition({ status: 'cancelled' }, 'cancelled', now)).toBe(true); });
});
describe('configuration and test safety', () => {
  it('validates database URLs and exact CORS origins without printing credentials', () => { expect(() => readConfig({ DATABASE_URL: 'not-a-url' })).toThrow('DATABASE_URL'); expect(() => readConfig({ DATABASE_URL: 'postgres://user:secret@localhost/app', CORS_ORIGIN: '*' })).toThrow('CORS_ORIGIN'); expect(readConfig({ DATABASE_URL: 'postgres://user:secret@localhost/app', NODE_ENV: 'production' }).host).toBe('0.0.0.0'); });
  it('refuses destructive test setup for the application database', async () => { const pool = { query: async () => ({ rows: [{ name: 'app' }] }) }; await expect(assertTestDatabase(pool, { databaseUrl: 'postgres://localhost/app', testDatabaseUrl: 'postgres://localhost/app' })).rejects.toThrow('Refusing destructive tests'); });
});
