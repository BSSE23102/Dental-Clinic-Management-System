import { z } from 'zod';

export const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
const name = z.string().trim().min(2, 'Enter at least 2 characters.').max(120);
const phone = z.string().transform((value) => value.replace(/[\s()-]/g, '')).pipe(z.string().regex(/^[+]?\d{7,15}$/, 'Enter a phone number with 7–15 digits.'));
const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254);
const time = z.string().regex(/^([01]\d|2[0-3]):(00|15|30|45)$/, 'Choose a quarter-hour time.');
const queryInteger = z.string().regex(/^[1-9]\d*$/, 'Use a positive integer.').transform(Number).pipe(z.number().int().max(2147483647));
const positiveId = z.number().int().positive().max(2147483647);
export const idParams = z.strictObject({ id: queryInteger });
export const emptyQuery = z.strictObject({});
const pagination = { page: queryInteger.default(1), limit: queryInteger.pipe(z.number().max(100)).default(10), q: z.string().trim().max(100).default('') };
export const doctorQuery = z.strictObject({ ...pagination, active: z.enum(['true', 'false']).transform((value) => value === 'true').optional() });
export const appointmentQuery = z.strictObject({ ...pagination, doctorId: queryInteger.optional(), date: z.iso.date().optional(), status: z.enum(statuses).optional() });
export const doctorBody = z.strictObject({
  fullName: name,
  specialization: z.string().trim().min(2).max(100),
  phone, email, isActive: z.boolean(),
  availability: z.array(z.strictObject({ dayOfWeek: z.number().int().min(1).max(7), startTime: time, endTime: time }).refine((slot) => slot.startTime < slot.endTime, { path: ['endTime'], message: 'End time must be after start time.' })).max(7),
}).superRefine((value, context) => {
  if (value.isActive && !value.availability.length) context.addIssue({ code: 'custom', path: ['availability'], message: 'An active doctor needs at least one working day.' });
  if (new Set(value.availability.map((slot) => slot.dayOfWeek)).size !== value.availability.length) context.addIssue({ code: 'custom', path: ['availability'], message: 'Use each working day once.' });
});
export const appointmentBody = z.strictObject({
  patientName: name, patientPhone: phone,
  patientEmail: z.union([email, z.literal(''), z.null()]).optional().transform((value) => value || null),
  doctorId: positiveId,
  startsAt: z.iso.datetime({ offset: true }),
  durationMinutes: z.number().int().min(15).max(120).multipleOf(15),
  reason: z.string().trim().min(2).max(500),
});
export const statusBody = z.strictObject({ status: z.enum(statuses) });
