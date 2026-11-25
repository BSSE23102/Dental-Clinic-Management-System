import { transaction } from '../config/database.js';
import * as doctors from '../repositories/doctorsRepository.js';
import { AppError, notFound } from '../utils/errors.js';
import { fitsAvailability } from '../utils/time.js';

export function doctorsService(pool) {
  return {
    list: (query) => transaction(pool, (db) => doctors.listDoctors(db, query), { readOnly: true }),
    async get(id) { const record = await doctors.findDoctor(pool, id); if (!record) throw notFound('doctor'); return record; },
    create: (body) => transaction(pool, (db) => doctors.insertDoctor(db, body)),
    update: (id, body) => transaction(pool, async (db) => {
      await doctors.lockDoctors(db, [id]); if (!await doctors.findDoctor(db, id)) throw notFound('doctor');
      const bookings = await doctors.unfinishedAppointments(db, id, new Date());
      if (bookings.some((booking) => !fitsAvailability(booking.starts_at, booking.ends_at, body.availability))) throw new AppError(409, 'AVAILABILITY_CONFLICT', 'These hours would affect an existing appointment. Reschedule it first.');
      return doctors.updateDoctor(db, id, body);
    }),
    delete: (id) => transaction(pool, async (db) => {
      await doctors.lockDoctors(db, [id]); if (!await doctors.findDoctor(db, id)) throw notFound('doctor');
      if (await doctors.hasAppointments(db, id)) throw new AppError(409, 'DOCTOR_HAS_APPOINTMENTS', 'This doctor has appointments. Mark them inactive to preserve those records.');
      await doctors.deleteDoctor(db, id);
    }),
  };
}
