import { useState } from "react";
import { Button, Field, Select } from "../../components/common";
import { useGetDoctorOptionsQuery } from "../../services/doctorsApi";
import { appointmentSchema, validationErrors } from "../../utils/validation";
import {
  clinicInput,
  friendlyError,
  toApiDateTime,
  WEEKDAYS,
} from "../../utils/format";

export default function AppointmentForm({
  initialValues,
  onSubmit,
  onCancel,
  loading,
  onDirty,
}) {
  const [values, setValues] = useState({
    patientName: initialValues?.patientName || "",
    patientPhone: initialValues?.patientPhone || "",
    patientEmail: initialValues?.patientEmail || "",
    doctorId: initialValues?.doctorId || "",
    localStart: initialValues ? clinicInput(initialValues.startsAt) : "",
    durationMinutes: initialValues?.durationMinutes || 30,
    reason: initialValues?.reason || "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const doctors = useGetDoctorOptionsQuery(true);
  const selected = doctors.data?.find(
    (doctor) => doctor.id === Number(values.doctorId),
  );
  const change = (key, value) => {
    onDirty?.(true);
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({
      ...current,
      [key]: undefined,
      ...(key === "localStart" && { startsAt: undefined }),
    }));
  };
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setServerError("");
    const { localStart, ...fields } = values;
    const result = appointmentSchema.safeParse({
      ...fields,
      startsAt: toApiDateTime(localStart),
    });
    if (!result.success) {
      setErrors(validationErrors(result));
      setTimeout(() => form.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    if (!selected) {
      setErrors({ doctorId: "Choose an active doctor." });
      return;
    }
    const start = new Date(result.data.startsAt);
    const end = new Date(
      start.getTime() + result.data.durationMinutes * 60_000,
    );
    const day = new Date(start.getTime() + 5 * 3_600_000).getUTCDay() || 7;
    const hours = selected.availability.find((slot) => slot.dayOfWeek === day);
    if (
      !hours ||
      clinicInput(start).slice(0, 10) !== clinicInput(end).slice(0, 10) ||
      clinicInput(start).slice(11) < hours.startTime ||
      clinicInput(end).slice(11) > hours.endTime
    ) {
      setErrors({
        startsAt: "Choose a time within this doctor’s working hours.",
      });
      return;
    }
    try {
      await onSubmit(result.data);
    } catch (error) {
      setServerError(friendlyError(error));
      setErrors(error?.data?.error?.fieldErrors || {});
    }
  };
  return (
    <form onSubmit={submit} noValidate className="clinic-form">
      {serverError && (
        <div className="inline-error" role="alert">
          {serverError}
        </div>
      )}
      <h3 className="form-section-title">Patient details</h3>
      <div className="form-grid">
        <Field
          label="Patient name"
          name="patientName"
          value={values.patientName}
          onChange={(event) => change("patientName", event.target.value)}
          error={errors.patientName}
          autoComplete="name"
          placeholder="Full name"
          required
          maxLength={120}
        />
        <Field
          label="Phone number"
          name="patientPhone"
          type="tel"
          value={values.patientPhone}
          onChange={(event) => change("patientPhone", event.target.value)}
          error={errors.patientPhone}
          autoComplete="tel"
          placeholder="+92 300 1234567"
          required
        />
        <Field
          className="full-width"
          label="Email address (optional)"
          name="patientEmail"
          type="email"
          value={values.patientEmail}
          onChange={(event) => change("patientEmail", event.target.value)}
          error={errors.patientEmail}
          autoComplete="email"
          spellCheck={false}
          placeholder="patient@example.com"
          maxLength={254}
        />
      </div>
      <h3 className="form-section-title">Appointment details</h3>
      <Select
        label="Doctor"
        value={values.doctorId}
        onChange={(event) => change("doctorId", event.target.value)}
        error={errors.doctorId}
        disabled={doctors.isLoading || doctors.isError}
        required
      >
        <option value="">
          {doctors.isLoading ? "Loading doctors…" : "Select a doctor"}
        </option>
        {initialValues?.doctor &&
          !doctors.data?.some(
            (doctor) => doctor.id === initialValues.doctorId,
          ) && (
            <option value={initialValues.doctorId} disabled>
              {initialValues.doctor.fullName} (inactive)
            </option>
          )}
        {doctors.data?.map((doctor) => (
          <option key={doctor.id} value={doctor.id}>
            {doctor.fullName} · {doctor.specialization}
          </option>
        ))}
      </Select>
      {doctors.isError && (
        <div className="inline-error" role="alert">
          We couldn’t load doctors.{" "}
          <button
            type="button"
            className="text-button"
            onClick={doctors.refetch}
          >
            Try again
          </button>
        </div>
      )}
      {doctors.isSuccess && !doctors.data.length && (
        <p className="notice">
          Add an active doctor before creating an appointment.
        </p>
      )}
      {selected && (
        <div className="availability-note">
          <strong>Working hours</strong>
          <span>
            {selected.availability
              .map(
                (slot) =>
                  `${WEEKDAYS[slot.dayOfWeek - 1].slice(0, 3)} ${slot.startTime}–${slot.endTime}`,
              )
              .join(" · ")}
          </span>
        </div>
      )}
      <div className="form-grid">
        <Field
          label="Date and time"
          name="startsAt"
          type="datetime-local"
          step="900"
          value={values.localStart}
          onChange={(event) => change("localStart", event.target.value)}
          error={errors.startsAt}
          hint="Asia/Karachi (UTC+05:00)"
          required
        />
        <Select
          label="Duration"
          name="durationMinutes"
          value={values.durationMinutes}
          onChange={(event) => change("durationMinutes", event.target.value)}
          error={errors.durationMinutes}
        >
          {[15, 30, 45, 60, 75, 90, 105, 120].map((duration) => (
            <option key={duration} value={duration}>
              {duration} minutes
            </option>
          ))}
        </Select>
      </div>
      <Field label="Reason for visit" error={errors.reason}>
        <textarea
          id="appointment-reason"
          aria-label="Reason for visit"
          name="reason"
          value={values.reason}
          onChange={(event) => change("reason", event.target.value)}
          aria-invalid={!!errors.reason}
          placeholder="What brings the patient in?"
          rows="3"
          maxLength={500}
          required
        />
      </Field>
      <p className="field-hint">
        New appointments start as pending. Scheduling is confirmed by the clinic
        service.
      </p>
      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={
            doctors.isError || doctors.isLoading || !doctors.data?.length
          }
        >
          {initialValues ? "Save changes" : "Create appointment"}
        </Button>
      </div>
    </form>
  );
}
