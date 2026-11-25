import { useState } from "react";
import { Button, Field } from "../../components/common";
import { doctorSchema, validationErrors } from "../../utils/validation";
import { friendlyError, WEEKDAYS } from "../../utils/format";

export default function DoctorForm({
  initialValues,
  onSubmit,
  onCancel,
  loading,
  onDirty,
}) {
  const [values, setValues] = useState(
    initialValues || {
      fullName: "",
      specialization: "",
      phone: "",
      email: "",
      isActive: true,
      availability: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
      })),
    },
  );
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const change = (key, value) => {
    onDirty?.(true);
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const changeDay = (dayOfWeek, key, value) => {
    onDirty?.(true);
    setValues((current) => ({
      ...current,
      availability: current.availability.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, [key]: value } : item,
      ),
    }));
  };
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setServerError("");
    const result = doctorSchema.safeParse({
      fullName: values.fullName,
      specialization: values.specialization,
      phone: values.phone,
      email: values.email,
      isActive: values.isActive,
      availability: values.availability,
    });
    if (!result.success) {
      setErrors(validationErrors(result));
      setTimeout(() => form.querySelector('[aria-invalid="true"]')?.focus(), 0);
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
      <div className="form-grid">
        <Field
          label="Full name"
          name="fullName"
          value={values.fullName}
          onChange={(event) => change("fullName", event.target.value)}
          error={errors.fullName}
          autoComplete="name"
          placeholder="Dr. Full name"
          required
          maxLength={120}
        />
        <Field
          label="Specialization"
          name="specialization"
          value={values.specialization}
          onChange={(event) => change("specialization", event.target.value)}
          error={errors.specialization}
          placeholder="e.g. General Dentistry"
          required
          maxLength={100}
        />
        <Field
          label="Phone number"
          name="phone"
          type="tel"
          value={values.phone}
          onChange={(event) => change("phone", event.target.value)}
          error={errors.phone}
          autoComplete="tel"
          placeholder="+92 300 1234567"
          required
        />
        <Field
          label="Email address"
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => change("email", event.target.value)}
          error={errors.email}
          autoComplete="email"
          spellCheck={false}
          placeholder="doctor@example.com"
          required
          maxLength={254}
        />
      </div>
      <div className="form-section-heading">
        <div>
          <h3>Weekly availability</h3>
          <p>Working hours in Asia/Karachi. One interval per day.</p>
        </div>
      </div>
      {errors.availability && (
        <p className="field-error" role="alert">
          {errors.availability}
        </p>
      )}
      <fieldset className="availability-editor">
        <legend className="sr-only">Working days and hours</legend>
        {WEEKDAYS.map((day, index) => {
          const slot = values.availability.find(
            (item) => item.dayOfWeek === index + 1,
          );
          const slotIndex = values.availability.indexOf(slot);
          return (
            <div
              className={`availability-row ${slot ? "is-working" : ""}`}
              key={day}
            >
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!!slot}
                  onChange={(event) =>
                    change(
                      "availability",
                      event.target.checked
                        ? [
                            ...values.availability,
                            {
                              dayOfWeek: index + 1,
                              startTime: "09:00",
                              endTime: "17:00",
                            },
                          ].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                        : values.availability.filter(
                            (item) => item.dayOfWeek !== index + 1,
                          ),
                    )
                  }
                />
                {day}
              </label>
              {slot ? (
                <div className="time-pair">
                  <input
                    aria-label={`${day} start time`}
                    type="time"
                    step="900"
                    value={slot.startTime}
                    onChange={(event) =>
                      changeDay(index + 1, "startTime", event.target.value)
                    }
                    aria-invalid={
                      !!errors[`availability.${slotIndex}.startTime`]
                    }
                  />
                  <span>to</span>
                  <input
                    aria-label={`${day} end time`}
                    type="time"
                    step="900"
                    value={slot.endTime}
                    onChange={(event) =>
                      changeDay(index + 1, "endTime", event.target.value)
                    }
                    aria-invalid={!!errors[`availability.${slotIndex}.endTime`]}
                  />
                  {(errors[`availability.${slotIndex}.startTime`] ||
                    errors[`availability.${slotIndex}.endTime`]) && (
                    <span className="field-error">
                      {errors[`availability.${slotIndex}.startTime`] ||
                        errors[`availability.${slotIndex}.endTime`]}
                    </span>
                  )}
                </div>
              ) : (
                <span className="off-duty">Not available</span>
              )}
            </div>
          );
        })}
      </fieldset>
      <label className="checkbox-label active-toggle">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(event) => change("isActive", event.target.checked)}
        />
        <span>
          Active doctor<small>Available for new appointments</small>
        </span>
      </label>
      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initialValues ? "Save changes" : "Add doctor"}
        </Button>
      </div>
    </form>
  );
}
