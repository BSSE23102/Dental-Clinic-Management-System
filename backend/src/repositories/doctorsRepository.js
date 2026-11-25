const availabilitySql = `COALESCE((SELECT jsonb_agg(jsonb_build_object('dayOfWeek', da.day_of_week, 'startTime', to_char(da.start_time, 'HH24:MI'), 'endTime', to_char(da.end_time, 'HH24:MI')) ORDER BY da.day_of_week) FROM doctor_availability da WHERE da.doctor_id = d.id), '[]'::jsonb) AS availability`;
const selectDoctor = `SELECT d.*, ${availabilitySql} FROM doctors d`;
const mapDoctor = (row) => row && ({ id: row.id, fullName: row.full_name, specialization: row.specialization, phone: row.phone, email: row.email, isActive: row.is_active, availability: row.availability, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() });
export const literalSearch = (value) => `%${value.replace(/[\\%_]/g, '\\$&')}%`;
export async function findDoctor(db, id) { return mapDoctor((await db.query(`${selectDoctor} WHERE d.id = $1`, [id])).rows[0]); }
export async function lockDoctors(db, ids) { await db.query('SELECT id FROM doctors WHERE id = ANY($1::integer[]) ORDER BY id FOR UPDATE', [[...new Set(ids)].sort((a, b) => a - b)]); }
export async function listDoctors(db, { q, active, page, limit }) {
  const values = []; const filters = [];
  if (q) { values.push(literalSearch(q)); filters.push(`(d.full_name ILIKE $${values.length} OR d.specialization ILIKE $${values.length})`); }
  if (active !== undefined) { values.push(active); filters.push(`d.is_active = $${values.length}`); }
  const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : '';
  const total = Number((await db.query(`SELECT count(*) FROM doctors d${where}`, values)).rows[0].count);
  const rows = await db.query(`${selectDoctor}${where} ORDER BY d.full_name, d.id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, limit, (page - 1) * limit]);
  return { data: rows.rows.map(mapDoctor), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
export async function insertDoctor(db, body) {
  const { rows } = await db.query('INSERT INTO doctors (full_name, specialization, phone, email, is_active) VALUES ($1,$2,$3,$4,$5) RETURNING id', [body.fullName, body.specialization, body.phone, body.email, body.isActive]);
  await replaceAvailability(db, rows[0].id, body.availability); return findDoctor(db, rows[0].id);
}
export async function replaceAvailability(db, id, availability) {
  await db.query('DELETE FROM doctor_availability WHERE doctor_id = $1', [id]);
  for (const slot of availability) await db.query('INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES ($1,$2,$3,$4)', [id, slot.dayOfWeek, slot.startTime, slot.endTime]);
}
export async function updateDoctor(db, id, body) {
  await db.query('UPDATE doctors SET full_name=$2, specialization=$3, phone=$4, email=$5, is_active=$6, updated_at=now() WHERE id=$1', [id, body.fullName, body.specialization, body.phone, body.email, body.isActive]);
  await replaceAvailability(db, id, body.availability); return findDoctor(db, id);
}
export async function deleteDoctor(db, id) { await db.query('DELETE FROM doctors WHERE id=$1', [id]); }
export async function hasAppointments(db, id) { return (await db.query('SELECT EXISTS (SELECT 1 FROM appointments WHERE doctor_id=$1) AS found', [id])).rows[0].found; }
export async function unfinishedAppointments(db, id, now) { return (await db.query("SELECT starts_at, ends_at FROM appointments WHERE doctor_id=$1 AND status IN ('pending','confirmed') AND ends_at > $2", [id, now])).rows; }
