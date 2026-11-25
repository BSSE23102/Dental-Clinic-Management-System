import { Link, useOutletContext, useParams } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  Mail,
  Pencil,
  Phone,
  Stethoscope,
  Trash2,
} from "lucide-react";
import {
  Avatar,
  Button,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "../components/common";
import { useGetDoctorQuery } from "../services/doctorsApi";
import { useGetAppointmentQuery } from "../services/appointmentsApi";
import { AppointmentActions } from "../features/appointments/AppointmentTable";
import {
  canEditAppointment,
  formatDate,
  formatTime,
  friendlyError,
  WEEKDAYS,
} from "../utils/format";

export function DoctorDetailsPage() {
  const { id } = useParams();
  const validId = /^[1-9]\d*$/.test(id);
  const query = useGetDoctorQuery(id, { skip: !validId });
  const actions = useOutletContext();
  if (!validId) return <NotFoundPage />;
  if (query.isLoading) return <LoadingState />;
  if (query.isError)
    return (
      <div className="standard-page">
        <Link to="/doctors" className="back-link">
          Back to doctors
        </Link>
        <ErrorState
          message={friendlyError(query.error)}
          onRetry={query.refetch}
        />
      </div>
    );
  const doctor = query.data;
  if (!doctor) return null;
  return (
    <div className="standard-page">
      <Link to="/doctors" className="back-link">
        Back to doctors
      </Link>
      <PageHeader
        title="A closer look."
        description="Everything you need to know about your team member."
      >
        <Button
          variant="secondary"
          icon={Trash2}
          onClick={() => actions.deleteDoctor(doctor)}
        >
          Delete doctor
        </Button>
        <Button icon={Pencil} onClick={() => actions.openDoctor(doctor)}>
          Edit details
        </Button>
      </PageHeader>
      <div className="detail-grid">
        <section className="detail-card profile-card">
          <Avatar name={doctor.fullName} id={doctor.id} large />
          <h2>{doctor.fullName}</h2>
          <p className="profile-specialty">{doctor.specialization}</p>
          <StatusBadge status={doctor.isActive} />
          <dl className="contact-list">
            <div>
              <dt>
                <Mail size={17} /> Email address
              </dt>
              <dd>
                <a href={`mailto:${doctor.email}`}>{doctor.email}</a>
              </dd>
            </div>
            <div>
              <dt>
                <Phone size={17} /> Phone number
              </dt>
              <dd>
                <a href={`tel:${doctor.phone}`}>{doctor.phone}</a>
              </dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={17} /> On the team since
              </dt>
              <dd>{formatDate(doctor.createdAt, { year: "numeric" })}</dd>
            </div>
          </dl>
          <Link
            className="button button--secondary"
            to={`/appointments?doctorId=${doctor.id}`}
          >
            View appointments
          </Link>
        </section>
        <section className="detail-card">
          <div className="detail-section-title">
            <Clock3 size={21} strokeWidth={1.5} />
            <div>
              <h2>Time for care.</h2>
              <p>Weekly availability · Asia/Karachi</p>
            </div>
          </div>
          <dl className="weekly-hours">
            {WEEKDAYS.map((day, index) => {
              const slot = doctor.availability.find(
                (item) => item.dayOfWeek === index + 1,
              );
              return (
                <div key={day}>
                  <dt>{day}</dt>
                  <dd className={slot ? "" : "off-duty"}>
                    {slot
                      ? `${slot.startTime}–${slot.endTime}`
                      : "Not available"}
                  </dd>
                </div>
              );
            })}
          </dl>
          {!doctor.isActive && (
            <p className="notice">
              This doctor is inactive and cannot receive new appointments.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
export function AppointmentDetailsPage() {
  const { id } = useParams();
  const validId = /^[1-9]\d*$/.test(id);
  const query = useGetAppointmentQuery(id, { skip: !validId });
  const actions = useOutletContext();
  if (!validId) return <NotFoundPage />;
  if (query.isLoading) return <LoadingState />;
  if (query.isError)
    return (
      <div className="standard-page">
        <Link to="/appointments" className="back-link">
          Back to appointments
        </Link>
        <ErrorState
          message={friendlyError(query.error)}
          onRetry={query.refetch}
        />
      </div>
    );
  const appointment = query.data;
  if (!appointment) return null;
  return (
    <div className="standard-page">
      <Link to="/appointments" className="back-link">
        Back to appointments
      </Link>
      <PageHeader
        title="A visit, in focus."
        description="The details that make a smoother appointment."
      >
        <Button
          variant="secondary"
          icon={Trash2}
          onClick={() => actions.deleteAppointment(appointment)}
        >
          Delete appointment
        </Button>
        {canEditAppointment(appointment) && (
          <Button
            icon={Pencil}
            onClick={() => actions.openAppointment(appointment)}
          >
            Edit appointment
          </Button>
        )}
      </PageHeader>
      <div className="detail-grid">
        <section className="detail-card profile-card">
          <Avatar name={appointment.patientName} id={appointment.id} large />
          <h2>{appointment.patientName}</h2>
          <p className="profile-specialty">
            Patient · Appointment #{appointment.id}
          </p>
          <StatusBadge status={appointment.status} />
          <dl className="contact-list">
            <div>
              <dt>
                <Phone size={17} /> Phone number
              </dt>
              <dd>
                <a href={`tel:${appointment.patientPhone}`}>
                  {appointment.patientPhone}
                </a>
              </dd>
            </div>
            <div>
              <dt>
                <Mail size={17} /> Email address
              </dt>
              <dd>
                {appointment.patientEmail ? (
                  <a href={`mailto:${appointment.patientEmail}`}>
                    {appointment.patientEmail}
                  </a>
                ) : (
                  "Not provided"
                )}
              </dd>
            </div>
          </dl>
        </section>
        <section className="detail-card">
          <div className="detail-section-title">
            <CalendarDays size={22} strokeWidth={1.5} />
            <div>
              <h2>
                {formatDate(appointment.startsAt, {
                  weekday: "long",
                  year: "numeric",
                })}
              </h2>
              <p>
                {formatTime(appointment.startsAt)}–
                {formatTime(appointment.endsAt)} · {appointment.durationMinutes}{" "}
                minutes
              </p>
            </div>
          </div>
          <p className="timezone-note">Asia/Karachi (UTC+05:00)</p>
          <div className="appointment-doctor">
            <Stethoscope size={22} />
            <div>
              <small>Your doctor</small>
              <Link to={`/doctors/${appointment.doctorId}`}>
                {appointment.doctor?.fullName || "View doctor"}
              </Link>
              <p>{appointment.doctor?.specialization}</p>
            </div>
          </div>
          <div className="reason-block">
            <h3>Reason for visit</h3>
            <p>{appointment.reason}</p>
          </div>
          <div className="detail-status-actions">
            <h3>Manage this visit</h3>
            <AppointmentActions appointment={appointment} actions={actions} />
            {["completed", "cancelled"].includes(appointment.status) && (
              <p className="muted">
                This appointment is {appointment.status} and cannot be reopened.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
export function NotFoundPage() {
  return (
    <div className="not-found">
      <span className="not-found-number">
        404<span>.</span>
      </span>
      <h1>A little off the schedule.</h1>
      <p>We couldn’t find that page. Let’s get you back to your workspace.</p>
      <Link className="button button--primary" to="/dashboard">
        Back to overview
      </Link>
    </div>
  );
}
