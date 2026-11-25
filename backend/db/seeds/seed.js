import path from "node:path";
import { pathToFileURL } from "node:url";
import { createPool, transaction } from "../../src/config/database.js";
import { readConfig } from "../../src/config/env.js";
import { insertDoctor } from "../../src/repositories/doctorsRepository.js";
import { clinicParts, durationEnd } from "../../src/utils/time.js";

const names = [
  "Dr. Amina Farooq",
  "Dr. Hassan Ali",
  "Dr. Sara Ahmed",
  "Dr. Omar Khan",
  "Dr. Noor Fatima",
  "Dr. Bilal Shah",
  "Dr. Hira Malik",
  "Dr. Zain Raza",
];
const specialties = [
  "General Dentistry",
  "Orthodontics",
  "Cosmetic Dentistry",
  "Oral Surgery",
  "Pediatric Dentistry",
  "Endodontics",
  "Periodontics",
  "General Dentistry",
];
const patients = [
  "Ayesha Mir",
  "Ahmed Usman",
  "Fatima Noor",
  "Ibrahim Shah",
  "Mariam Ali",
  "Hamza Khalid",
  "Zoya Hassan",
  "Yusuf Khan",
  "Sana Malik",
  "Ali Raza",
];
export async function seed(
  pool,
  {
    production = false,
    allowDemo = false,
    demoMode = false,
    now = new Date(),
  } = {},
) {
  if (production && !(allowDemo && demoMode))
    throw new Error(
      "Production seeding requires DEMO_MODE=true and --allow-demo.",
    );
  return transaction(pool, async (db) => {
    // Serialize seed attempts and block all concurrent application writes while checking emptiness.
    await db.query(
      "LOCK TABLE doctors, doctor_availability, appointments IN SHARE ROW EXCLUSIVE MODE",
    );
    const counts = await db.query(
      "SELECT (SELECT count(*) FROM doctors) + (SELECT count(*) FROM appointments) AS count",
    );
    if (Number(counts.rows[0].count) !== 0)
      throw new Error(
        "Seed refused: application tables are not empty. Existing records were preserved.",
      );
    const doctors = [];
    for (let index = 0; index < names.length; index++)
      doctors.push(
        await insertDoctor(db, {
          fullName: names[index],
          specialization: specialties[index],
          phone: `+92300123456${index}`,
          email: `doctor${index + 1}@example.com`,
          isActive: index !== 7,
          availability: [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
            dayOfWeek,
            startTime: "09:00",
            endTime: "18:00",
          })),
        }),
      );
    for (let index = 0; index < 20; index++) {
      const day = new Date(`${clinicParts(now).date}T12:00:00+05:00`);
      day.setUTCDate(day.getUTCDate() + Math.floor(index / 4) - 1);
      const startsAt = new Date(
        `${clinicParts(day).date}T${String(9 + (index % 4) * 2).padStart(2, "0")}:00:00+05:00`,
      );
      const endsAt = durationEnd(startsAt, 30);
      const status =
        index % 7 === 0
          ? "cancelled"
          : endsAt <= now
            ? "completed"
            : index % 3 === 0
              ? "pending"
              : "confirmed";
      await db.query(
        "INSERT INTO appointments (doctor_id, patient_name, patient_phone, patient_email, starts_at, ends_at, reason, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          doctors[index % 7].id,
          patients[index % patients.length],
          `+9230098765${String(index).padStart(2, "0")}`,
          null,
          startsAt,
          endsAt,
          [
            "Routine examination",
            "Teeth alignment consultation",
            "Dental cleaning",
            "Follow-up visit",
          ][index % 4],
          status,
        ],
      );
    }
    return { doctors: 8, appointments: 20 };
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const config = readConfig();
  const pool = createPool(config.databaseUrl);
  try {
    const result = await seed(pool, {
      production: config.nodeEnv === "production",
      allowDemo: process.argv.includes("--allow-demo"),
      demoMode: config.demoMode,
    });
    console.log(
      `Seeded ${result.doctors} fictional doctors and ${result.appointments} appointments.`,
    );
  } catch (error) {
    console.error(
      error.code
        ? `Seed failed (${error.code}). No partial seed was committed.`
        : error.message,
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
