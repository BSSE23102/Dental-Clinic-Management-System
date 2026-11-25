import { describe, expect, it } from "vitest";
import { appointmentSchema, doctorSchema } from "../utils/validation";
import {
  clinicDate,
  clinicInput,
  toApiDateTime,
  validTransitions,
} from "../utils/format";

const doctor = {
  fullName: "Demo Doctor",
  specialization: "General Dentistry",
  phone: "+92 (300) 123-4567",
  email: " DOCTOR@EXAMPLE.COM ",
  isActive: true,
  availability: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
};
const future = () => {
  const day = new Date();
  day.setUTCDate(day.getUTCDate() + 2);
  return `${clinicDate(day)}T10:00:00+05:00`;
};
const appointment = () => ({
  patientName: "Demo Patient",
  patientPhone: "03001234567",
  patientEmail: "",
  doctorId: "1",
  startsAt: future(),
  durationMinutes: "30",
  reason: "Dental cleaning",
});

describe("doctor validation", () => {
  it("normalizes email and phone without rejecting local leading zeros", () => {
    const result = doctorSchema.parse(doctor);
    expect(result.email).toBe("doctor@example.com");
    expect(result.phone).toBe("+923001234567");
    expect(doctorSchema.parse({ ...doctor, phone: "03001234567" }).phone).toBe(
      "03001234567",
    );
  });
  it("requires weekly availability for active doctors", () => {
    expect(
      doctorSchema.safeParse({ ...doctor, availability: [] }).success,
    ).toBe(false);
    expect(
      doctorSchema.safeParse({ ...doctor, isActive: false, availability: [] })
        .success,
    ).toBe(true);
  });
  it("rejects duplicate days, reversed hours, and non-quarter hours", () => {
    expect(
      doctorSchema.safeParse({
        ...doctor,
        availability: [doctor.availability[0], doctor.availability[0]],
      }).success,
    ).toBe(false);
    expect(
      doctorSchema.safeParse({
        ...doctor,
        availability: [{ dayOfWeek: 1, startTime: "17:00", endTime: "09:00" }],
      }).success,
    ).toBe(false);
    expect(
      doctorSchema.safeParse({
        ...doctor,
        availability: [{ dayOfWeek: 1, startTime: "09:05", endTime: "17:00" }],
      }).success,
    ).toBe(false);
  });
});
describe("appointment validation", () => {
  it("normalizes optional email and numeric form values", () => {
    const result = appointmentSchema.parse(appointment());
    expect(result.patientEmail).toBeNull();
    expect(result.doctorId).toBe(1);
    expect(result.durationMinutes).toBe(30);
  });
  it("rejects past dates, missing doctors, malformed email, and invalid durations", () => {
    for (const change of [
      { startsAt: "2020-01-01T09:00:00+05:00" },
      { doctorId: "" },
      { patientEmail: "bad-email" },
      { durationMinutes: 20 },
      { durationMinutes: 135 },
    ])
      expect(
        appointmentSchema.safeParse({ ...appointment(), ...change }).success,
      ).toBe(false);
  });
  it("rejects malformed and non-quarter start times", () => {
    expect(
      appointmentSchema.safeParse({ ...appointment(), startsAt: "not-a-date" })
        .success,
    ).toBe(false);
    expect(
      appointmentSchema.safeParse({
        ...appointment(),
        startsAt: future().replace("10:00", "10:07"),
      }).success,
    ).toBe(false);
  });
});
describe("clinic time and transitions", () => {
  it("converts clinic inputs independently of the browser timezone", () => {
    expect(clinicInput("2026-12-07T04:30:00Z")).toBe("2026-12-07T09:30");
    expect(toApiDateTime("2026-12-07T09:30")).toBe("2026-12-07T09:30:00+05:00");
  });
  it("handles the clinic date at UTC midnight boundaries", () => {
    expect(clinicDate("2026-11-25T19:01:00Z")).toBe("2026-11-26");
    expect(clinicDate("2026-11-25T18:59:00Z")).toBe("2026-11-25");
  });
  it("offers only permitted transitions at the current appointment time", () => {
    const now = new Date("2026-12-07T08:00Z");
    expect(
      validTransitions(
        { status: "pending", startsAt: "2026-12-07T09:00Z" },
        now,
      ),
    ).toEqual(["confirmed", "cancelled"]);
    expect(
      validTransitions(
        { status: "pending", startsAt: "2026-12-07T07:00Z" },
        now,
      ),
    ).toEqual(["cancelled"]);
    expect(
      validTransitions(
        { status: "confirmed", endsAt: "2026-12-07T07:30Z" },
        now,
      ),
    ).toEqual(["completed", "cancelled"]);
    expect(validTransitions({ status: "cancelled" }, now)).toEqual([]);
  });
});
