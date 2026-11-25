export async function dashboardCounts(db, asOf) {
  const { rows } = await db.query(`SELECT
    (SELECT count(*)::integer FROM doctors) AS "totalDoctors",
    count(*) FILTER (WHERE status IN ('pending','confirmed') AND starts_at >= $1)::integer AS "upcomingAppointments",
    count(*) FILTER (WHERE status <> 'cancelled' AND (starts_at AT TIME ZONE 'Asia/Karachi')::date = ($1::timestamptz AT TIME ZONE 'Asia/Karachi')::date)::integer AS "todayAppointments",
    count(*) FILTER (WHERE status = 'pending')::integer AS "pendingAppointments"
    FROM appointments`, [asOf]);
  return rows[0];
}
