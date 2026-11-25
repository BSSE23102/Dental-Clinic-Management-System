import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(2, "Enter at least 2 characters.")
  .max(120, "Use 120 characters or fewer.");
const phone = z
  .string()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .pipe(
    z.string().regex(/^\+?\d{7,15}$/, "Enter a phone number with 7–15 digits."),
  );
const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);
const time = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):(00|15|30|45)$/,
    "Choose a time in 15-minute increments.",
  );

export const doctorSchema = z
  .object({
    fullName: name,
    specialization: z
      .string()
      .trim()
      .min(2, "Enter a specialization.")
      .max(100),
    phone,
    email,
    isActive: z.boolean(),
    availability: z.array(
      z
        .object({
          dayOfWeek: z.number().int().min(1).max(7),
          startTime: time,
          endTime: time,
        })
        .refine((value) => value.startTime < value.endTime, {
          message: "End time must be after start time.",
          path: ["endTime"],
        }),
    ),
  })
  .superRefine((value, context) => {
    if (value.isActive && !value.availability.length)
      context.addIssue({
        code: "custom",
        path: ["availability"],
        message: "Add at least one working day for an active doctor.",
      });
    if (
      new Set(value.availability.map((item) => item.dayOfWeek)).size !==
      value.availability.length
    )
      context.addIssue({
        code: "custom",
        path: ["availability"],
        message: "Use each working day once.",
      });
  });

export const appointmentSchema = z.object({
  patientName: name,
  patientPhone: phone,
  patientEmail: z
    .union([email, z.literal(""), z.null()])
    .transform((value) => value || null),
  doctorId: z.coerce.number().int().positive("Choose a doctor."),
  startsAt: z
    .string()
    .datetime({ offset: true, message: "Choose a valid date and time." })
    .refine(
      (value) => new Date(value) > new Date(),
      "Choose a time in the future.",
    )
    .refine((value) => {
      const date = new Date(value);
      return date.getUTCMinutes() % 15 === 0 && date.getUTCSeconds() === 0;
    }, "Choose a time in 15-minute increments."),
  durationMinutes: z.coerce.number().int().min(15).max(120).multipleOf(15),
  reason: z
    .string()
    .trim()
    .min(2, "Enter a reason for the visit.")
    .max(500, "Use 500 characters or fewer."),
});

export function validationErrors(result) {
  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
