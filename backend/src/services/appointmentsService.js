import { transaction } from '../config/database.js';
import * as doctors from '../repositories/doctorsRepository.js';
import * as appointments from '../repositories/appointmentsRepository.js';
import { AppError, OwnershipChanged, notFound } from '../utils/errors.js';
import { durationEnd, fitsAvailability, isQuarterHour } from '../utils/time.js';

export function allowedTransition(record, status, now = new Date()) {
  if (record.status === status) return true;
  if (record.status === 'pending') return status === 'cancelled' || (status === 'confirmed' && new Date(record.startsAt) > now);
  if (record.status === 'confirmed') return status === 'cancelled' || (status === 'completed' && new Date(record.endsAt) <= now);
  return false;
}
async function validateSchedule(db, body, ignoreId, { requireActive = true } = {}) {
  const doctor = await doctors.findDoctor(db, body.doctorId);
  if (!doctor) throw new AppError(400, 'INVALID_DOCTOR', 'Choose an existing doctor.', { doctorId: 'This doctor no longer exists.' });
  if (requireActive && !doctor.isActive) throw new AppError(409, 'INACTIVE_DOCTOR', 'Choose an active doctor for this appointment.');
  if (new Date(body.startsAt) <= new Date()) throw new AppError(400, 'INVALID_DATE', 'Choose a time in the future.', { startsAt: 'Choose a future appointment time.' });
  if (!isQuarterHour(body.startsAt)) throw new AppError(400, 'INVALID_DATE', 'Choose a time in 15-minute increments.', { startsAt: 'Choose a quarter-hour time.' });
  const end = durationEnd(body.startsAt, body.durationMinutes);
  if (!fitsAvailability(body.startsAt, end, doctor.availability)) throw new AppError(409, 'OUTSIDE_AVAILABILITY', 'This time falls outside the doctor’s working hours.', { startsAt: 'Choose a time within the doctor’s working hours.' });
  if (await appointments.overlaps(db, body.doctorId, body.startsAt, end, ignoreId)) throw new AppError(409, 'APPOINTMENT_CONFLICT', 'This doctor already has an appointment during that time.');
  return end;
}
async function withLockedAppointment(pool, id, targetDoctorId, operation) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await transaction(pool, async (db) => {
        const initial = await appointments.findAppointment(db, id); if (!initial) throw notFound('appointment');
        const ids = [initial.doctorId, ...(targetDoctorId ? [targetDoctorId] : [])];
        await doctors.lockDoctors(db, ids);
        const record = await appointments.findAppointment(db, id, { lock: true }); if (!record) throw notFound('appointment');
        if (!ids.includes(record.doctorId)) throw new OwnershipChanged();
        return operation(db, record);
      });
    } catch (error) { if (!(error instanceof OwnershipChanged)) throw error; }
  }
  throw new AppError(409, 'CONCURRENT_CHANGE', 'This appointment changed during your request. Refresh and try again.');
}
export function appointmentsService(pool) {
  return {
    list: (query) => transaction(pool, (db) => appointments.listAppointments(db, query), { readOnly: true }),
    async get(id) { const record = await appointments.findAppointment(pool, id); if (!record) throw notFound('appointment'); return record; },
    create: (body) => transaction(pool, async (db) => { await doctors.lockDoctors(db, [body.doctorId]); const end = await validateSchedule(db, body, null); return appointments.insertAppointment(db, body, end); }),
    update: (id, body) => withLockedAppointment(pool, id, body.doctorId, async (db, record) => {
      if (!['pending', 'confirmed'].includes(record.status) || new Date(record.startsAt) <= new Date()) throw new AppError(409, 'APPOINTMENT_NOT_EDITABLE', 'Only upcoming, unfinished appointments can be edited.');
      const scheduleChanged = record.doctorId !== body.doctorId || new Date(record.startsAt).getTime() !== new Date(body.startsAt).getTime() || record.durationMinutes !== body.durationMinutes;
      const end = await validateSchedule(db, body, id, { requireActive: scheduleChanged });
      return appointments.updateAppointment(db, id, body, end);
    }),
    changeStatus: (id, status) => withLockedAppointment(pool, id, null, (db, record) => {
      if (!allowedTransition(record, status)) throw new AppError(409, 'INVALID_STATUS_TRANSITION', 'That status change is not available for this appointment.');
      return record.status === status ? record : appointments.changeStatus(db, id, status);
    }),
    delete: (id) => withLockedAppointment(pool, id, null, (db) => appointments.deleteAppointment(db, id)),
  };
}
