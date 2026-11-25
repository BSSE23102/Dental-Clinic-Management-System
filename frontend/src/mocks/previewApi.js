// Temporary, development-only fixtures. This module is eliminated from production builds.
import { clinicDate, validTransitions } from "../utils/format";

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
const availability = [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: "09:00",
  endTime: "18:00",
}));
const createdAt = new Date().toISOString();
let doctors = names.map((fullName, index) => ({
  id: index + 1,
  fullName,
  specialization: specialties[index],
  phone: `+92300123456${index}`,
  email: `doctor${index + 1}@example.com`,
  isActive: index !== 7,
  availability: structuredClone(availability),
  createdAt,
  updatedAt: createdAt,
}));
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
let appointments = Array.from({ length: 20 }, (_, index) => {
  const day = new Date(`${clinicDate()}T12:00:00+05:00`);
  day.setUTCDate(day.getUTCDate() + Math.floor(index / 4) - 1);
  const startsAt = new Date(
    `${clinicDate(day)}T${String(9 + (index % 4) * 2).padStart(2, "0")}:00:00+05:00`,
  ).toISOString();
  const status =
    index < 4
      ? index === 3
        ? "cancelled"
        : "completed"
      : index % 3 === 0
        ? "pending"
        : "confirmed";
  return {
    id: index + 1,
    patientName: patients[index % patients.length],
    patientPhone: `+9230098765${String(index).padStart(2, "0")}`,
    patientEmail: null,
    doctorId: (index % 7) + 1,
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + 30 * 60_000).toISOString(),
    durationMinutes: 30,
    reason: [
      "Routine examination",
      "Teeth alignment consultation",
      "Dental cleaning",
      "Follow-up visit",
    ][index % 4],
    status,
    createdAt,
    updatedAt: createdAt,
  };
});
let nextDoctorId = 9;
let nextAppointmentId = 21;
const error = (status, code, message, fieldErrors) => ({
  error: {
    status,
    data: { error: { code, message, ...(fieldErrors && { fieldErrors }) } },
  },
});
const success = (data) => ({ data: { data: structuredClone(data) } });
const enrich = (appointment) => {
  const doctor = doctors.find((item) => item.id === appointment.doctorId);
  return {
    ...appointment,
    doctor: doctor && {
      id: doctor.id,
      fullName: doctor.fullName,
      specialization: doctor.specialization,
      isActive: doctor.isActive,
    },
  };
};
function paginate(items, params) {
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 10);
  return {
    data: {
      data: structuredClone(items.slice((page - 1) * limit, page * limit)),
      meta: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
      },
    },
  };
}
function scheduleError(body, ignoreId) {
  const doctor = doctors.find((item) => item.id === Number(body.doctorId));
  if (!doctor)
    return error(400, "INVALID_DOCTOR", "Choose an existing doctor.");
  if (!doctor.isActive)
    return error(
      409,
      "INACTIVE_DOCTOR",
      "Choose an active doctor for this appointment.",
    );
  const start = new Date(body.startsAt);
  const end = new Date(start.getTime() + Number(body.durationMinutes) * 60_000);
  if (!Number.isFinite(start.getTime()) || start <= new Date())
    return error(400, "INVALID_DATE", "Choose a time in the future.");
  const local = new Date(start.getTime() + 5 * 60 * 60_000);
  const day = local.getUTCDay() || 7;
  const hours = doctor.availability.find((item) => item.dayOfWeek === day);
  const startTime = local.toISOString().slice(11, 16);
  const endTime = new Date(end.getTime() + 5 * 60 * 60_000)
    .toISOString()
    .slice(11, 16);
  if (
    !hours ||
    clinicDate(start) !== clinicDate(end) ||
    startTime < hours.startTime ||
    endTime > hours.endTime
  )
    return error(
      409,
      "OUTSIDE_AVAILABILITY",
      "This time falls outside the doctor’s working hours.",
    );
  if (
    appointments.some(
      (item) =>
        item.id !== ignoreId &&
        item.doctorId === doctor.id &&
        item.status !== "cancelled" &&
        new Date(item.startsAt) < end &&
        new Date(item.endsAt) > start,
    )
  )
    return error(
      409,
      "APPOINTMENT_CONFLICT",
      "This doctor already has an appointment during that time.",
    );
  return null;
}
export async function previewQuery(args) {
  await new Promise((resolve) => setTimeout(resolve, 220));
  const {
    url,
    method = "GET",
    body,
    params = {},
  } = typeof args === "string" ? { url: args } : args;
  const [, resource, rawId, action] = url.split("/");
  const id = Number(rawId);
  if (resource === "dashboard") {
    const upcoming = appointments
      .filter(
        (item) =>
          ["pending", "confirmed"].includes(item.status) &&
          new Date(item.startsAt) >= new Date(),
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return success({
      totalDoctors: doctors.length,
      upcomingAppointments: upcoming.length,
      todayAppointments: appointments.filter(
        (item) =>
          clinicDate(item.startsAt) === clinicDate() &&
          item.status !== "cancelled",
      ).length,
      pendingAppointments: appointments.filter(
        (item) => item.status === "pending",
      ).length,
      upcoming: upcoming.slice(0, 5).map(enrich),
      timezone: "Asia/Karachi",
      asOf: new Date().toISOString(),
    });
  }
  if (resource === "doctors") {
    const record = doctors.find((item) => item.id === id);
    if (rawId && !record)
      return error(404, "DOCTOR_NOT_FOUND", "This doctor could not be found.");
    if (method === "GET")
      return rawId
        ? success(record)
        : paginate(
            doctors
              .filter(
                (item) =>
                  (!params.q ||
                    `${item.fullName} ${item.specialization}`
                      .toLowerCase()
                      .includes(params.q.toLowerCase())) &&
                  (params.active === undefined ||
                    String(item.isActive) === String(params.active)),
              )
              .sort((a, b) => a.fullName.localeCompare(b.fullName)),
            params,
          );
    if (method === "DELETE") {
      if (appointments.some((item) => item.doctorId === id))
        return error(
          409,
          "DOCTOR_HAS_APPOINTMENTS",
          "This doctor has appointments. Mark them inactive to preserve those records.",
        );
      doctors = doctors.filter((item) => item.id !== id);
      return { data: null };
    }
    if (
      doctors.some(
        (item) =>
          item.id !== id &&
          item.email.toLowerCase() === body.email.toLowerCase(),
      )
    )
      return error(
        409,
        "DOCTOR_EMAIL_EXISTS",
        "A doctor with this email already exists.",
        { email: "This email is already in use." },
      );
    if (method === "PUT") {
      const affected = appointments.some((item) => {
        if (
          item.doctorId !== id ||
          !["pending", "confirmed"].includes(item.status) ||
          new Date(item.endsAt) <= new Date()
        )
          return false;
        const date = new Date(
          new Date(item.startsAt).getTime() + 5 * 3_600_000,
        );
        const hours = body.availability.find(
          (slot) => slot.dayOfWeek === (date.getUTCDay() || 7),
        );
        return (
          !hours ||
          date.toISOString().slice(11, 16) < hours.startTime ||
          new Date(new Date(item.endsAt).getTime() + 5 * 3_600_000)
            .toISOString()
            .slice(11, 16) > hours.endTime
        );
      });
      if (affected)
        return error(
          409,
          "AVAILABILITY_CONFLICT",
          "These hours would affect an existing appointment. Reschedule it first.",
        );
      Object.assign(record, body, { updatedAt: new Date().toISOString() });
      return success(record);
    }
    const doctor = {
      ...body,
      id: nextDoctorId++,
      createdAt,
      updatedAt: new Date().toISOString(),
    };
    doctors.push(doctor);
    return success(doctor);
  }
  if (resource === "appointments") {
    const record = appointments.find((item) => item.id === id);
    if (rawId && !record)
      return error(
        404,
        "APPOINTMENT_NOT_FOUND",
        "This appointment could not be found.",
      );
    if (method === "GET")
      return rawId
        ? success(enrich(record))
        : paginate(
            appointments
              .filter(
                (item) =>
                  (!params.q ||
                    item.patientName
                      .toLowerCase()
                      .includes(params.q.toLowerCase())) &&
                  (!params.doctorId ||
                    item.doctorId === Number(params.doctorId)) &&
                  (!params.status || item.status === params.status) &&
                  (!params.date || clinicDate(item.startsAt) === params.date),
              )
              .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
              .map(enrich),
            params,
          );
    if (method === "DELETE") {
      appointments = appointments.filter((item) => item.id !== id);
      return { data: null };
    }
    if (action === "status") {
      if (
        body.status !== record.status &&
        !validTransitions(record).includes(body.status)
      )
        return error(
          409,
          "INVALID_STATUS_TRANSITION",
          "That status change is not available for this appointment.",
        );
      record.status = body.status;
      record.updatedAt = new Date().toISOString();
      return success(enrich(record));
    }
    if (
      record &&
      (!["pending", "confirmed"].includes(record.status) ||
        new Date(record.startsAt) <= new Date())
    )
      return error(
        409,
        "APPOINTMENT_NOT_EDITABLE",
        "Only upcoming, unfinished appointments can be edited.",
      );
    const conflict = scheduleError(body, id);
    if (conflict) return conflict;
    const values = {
      ...body,
      doctorId: Number(body.doctorId),
      startsAt: new Date(body.startsAt).toISOString(),
      endsAt: new Date(
        new Date(body.startsAt).getTime() +
          Number(body.durationMinutes) * 60_000,
      ).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (record) {
      Object.assign(record, values);
      return success(enrich(record));
    }
    const appointment = {
      ...values,
      id: nextAppointmentId++,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    appointments.push(appointment);
    return success(enrich(appointment));
  }
  return error(404, "NOT_FOUND", "This page could not be found.");
}
