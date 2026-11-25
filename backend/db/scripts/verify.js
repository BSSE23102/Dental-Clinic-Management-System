import { createPool } from '../../src/config/database.js';
import { assertCurrentSchema } from './migrate.js';

const pool = createPool();
try {
  await assertCurrentSchema(pool);
  const constraints = await pool.query("SELECT conname FROM pg_constraint WHERE conrelid = 'appointments'::regclass AND contype IN ('x','f','c')");
  if (!constraints.rows.some((row) => row.conname === 'appointments_no_overlap')) throw new Error('Appointment exclusion constraint is missing.');
  const counts = await pool.query('SELECT (SELECT count(*)::integer FROM doctors) AS doctors, (SELECT count(*)::integer FROM appointments) AS appointments');
  console.log(`Schema current; appointment integrity constraints present. Doctors: ${counts.rows[0].doctors}; appointments: ${counts.rows[0].appointments}.`);
} catch (error) { console.error(error.code ? `Database verification failed (${error.code}).` : error.message); process.exitCode = 1; }
finally { await pool.end(); }
