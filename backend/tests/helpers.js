import { readConfig } from "../src/config/env.js";
import { clinicParts } from "../src/utils/time.js";

export function testConfig() {
  return {
    ...readConfig(),
    nodeEnv: "test",
    corsOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
  };
}
export function doctorBody(overrides = {}) {
  return {
    fullName: "Dr. Test Doctor",
    specialization: "General Dentistry",
    phone: "+92 (300) 123-4567",
    email: "doctor@example.com",
    isActive: true,
    availability: [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
      dayOfWeek,
      startTime: "09:00",
      endTime: "18:00",
    })),
    ...overrides,
  };
}
export function futureTime(days = 2, time = "10:00") {
  const day = new Date();
  day.setUTCDate(day.getUTCDate() + days);
  return `${clinicParts(day).date}T${time}:00+05:00`;
}
export function appointmentBody(doctorId, overrides = {}) {
  return {
    patientName: "Test Patient",
    patientPhone: "03001234567",
    patientEmail: null,
    doctorId,
    startsAt: futureTime(),
    durationMinutes: 30,
    reason: "Routine dental examination",
    ...overrides,
  };
}
export async function assertTestDatabase(pool, config) {
  if (!config.testDatabaseUrl)
    throw new Error("Set TEST_DATABASE_URL before running integration tests.");
  const test = new URL(config.testDatabaseUrl);
  const application = new URL(config.databaseUrl);
  if (
    !test.pathname.endsWith("_test") ||
    (test.hostname === application.hostname &&
      (test.port || "5432") === (application.port || "5432") &&
      test.pathname === application.pathname)
  )
    throw new Error(
      "Refusing destructive tests: use a separate database ending in _test.",
    );
  const { rows } = await pool.query("SELECT current_database() AS name");
  if (
    !rows[0].name.endsWith("_test") ||
    rows[0].name === decodeURIComponent(application.pathname.slice(1))
  )
    throw new Error(
      "Refusing destructive tests: actual database identity is unsafe.",
    );
}
