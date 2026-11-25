import { transaction } from '../config/database.js';
import { dashboardCounts } from '../repositories/dashboardRepository.js';
import { upcomingAppointments } from '../repositories/appointmentsRepository.js';
import { CLINIC_TIMEZONE } from '../utils/time.js';

export function dashboardService(pool) {
  return { stats: () => transaction(pool, async (db) => { const asOf = new Date(); const counts = await dashboardCounts(db, asOf); const upcoming = await upcomingAppointments(db, asOf); return { ...counts, upcoming, timezone: CLINIC_TIMEZONE, asOf: asOf.toISOString() }; }, { readOnly: true }) };
}
