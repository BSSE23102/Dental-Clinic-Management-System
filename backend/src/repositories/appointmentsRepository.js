import { literalSearch } from './doctorsRepository.js';

const selectAppointment = `SELECT a.*, d.full_name AS doctor_name, d.specialization AS doctor_specialization, d.is_active AS doctor_active FROM appointments a JOIN doctors d ON d.id = a.doctor_id`;
export const mapAppointment = (row) => row && ({ id: row.id, patientName: row.patient_name, patientPhone: row.patient_phone, patientEmail: row.patient_email, doctorId: row.doctor_id, doctor: { id: row.doctor_id, fullName: row.doctor_name, specialization: row.doctor_specialization, isActive: row.doctor_active }, startsAt: row.starts_at.toISOString(), endsAt: row.ends_at.toISOString(), durationMinutes: (row.ends_at - row.starts_at) / 60000, reason: row.reason, status: row.status, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() });
export async function findAppointment(db, id, { lock = false } = {}) { return mapAppointment((await db.query(`${selectAppointment} WHERE a.id=$1${lock ? ' FOR UPDATE OF a' : ''}`, [id])).rows[0]); }
export async function listAppointments(db, { q, doctorId, date, status, page, limit }) {
  const values = []; const filters = [];
  if (q) { values.push(literalSearch(q)); filters.push(`a.patient_name ILIKE $${values.length}`); }
  if (doctorId) { values.push(doctorId); filters.push(`a.doctor_id=$${values.length}`); }
  if (status) { values.push(status); filters.push(`a.status=$${values.length}`); }
  if (date) { values.push(date); const key = `$${values.length}`; filters.push(`a.starts_at >= (${key}::date::timestamp AT TIME ZONE 'Asia/Karachi') AND a.starts_at < ((${key}::date + 1)::timestamp AT TIME ZONE 'Asia/Karachi')`); }
  const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : '';
  const total = Number((await db.query(`SELECT count(*) FROM appointments a${where}`, values)).rows[0].count);
  const { rows } = await db.query(`${selectAppointment}${where} ORDER BY a.starts_at, a.id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, limit, (page - 1) * limit]);
  return { data: rows.map(mapAppointment), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
export async function overlaps(db, doctorId, startsAt, endsAt, ignoreId = null) { return (await db.query("SELECT EXISTS (SELECT 1 FROM appointments WHERE doctor_id=$1 AND status <> 'cancelled' AND starts_at < $3 AND ends_at > $2 AND ($4::integer IS NULL OR id<>$4)) AS found", [doctorId, startsAt, endsAt, ignoreId])).rows[0].found; }
export async function insertAppointment(db, body, endsAt) {
  const { rows } = await db.query('INSERT INTO appointments (patient_name, patient_phone, patient_email, doctor_id, starts_at, ends_at, reason) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id', [body.patientName, body.patientPhone, body.patientEmail, body.doctorId, body.startsAt, endsAt, body.reason]);
  return findAppointment(db, rows[0].id);
}
export async function updateAppointment(db, id, body, endsAt) {
  await db.query('UPDATE appointments SET patient_name=$2, patient_phone=$3, patient_email=$4, doctor_id=$5, starts_at=$6, ends_at=$7, reason=$8, updated_at=now() WHERE id=$1', [id, body.patientName, body.patientPhone, body.patientEmail, body.doctorId, body.startsAt, endsAt, body.reason]);
  return findAppointment(db, id);
}
export async function changeStatus(db, id, status) { await db.query('UPDATE appointments SET status=$2, updated_at=now() WHERE id=$1', [id, status]); return findAppointment(db, id); }
export async function deleteAppointment(db, id) { await db.query('DELETE FROM appointments WHERE id=$1', [id]); }
export async function upcomingAppointments(db, asOf) { return (await db.query(`${selectAppointment} WHERE a.status IN ('pending','confirmed') AND a.starts_at >= $1 ORDER BY a.starts_at, a.id LIMIT 5`, [asOf])).rows.map(mapAppointment); }
