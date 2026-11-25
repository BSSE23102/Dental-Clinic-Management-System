import { Link } from "react-router-dom";
import { Clock3, Eye, Mail, Pencil, Trash2 } from "lucide-react";
import { Avatar, StatusBadge } from "../../components/common";
import { WEEKDAYS } from "../../utils/format";

export function DoctorActions({ doctor, actions }) {
  return (
    <div className="row-actions">
      <Link
        className="icon-button"
        to={`/doctors/${doctor.id}`}
        aria-label={`View ${doctor.fullName}`}
        title="View doctor"
      >
        <Eye size={17} />
      </Link>
      <button
        className="icon-button"
        onClick={() => actions.openDoctor(doctor)}
        aria-label={`Edit ${doctor.fullName}`}
        title="Edit doctor"
      >
        <Pencil size={16} />
      </button>
      <button
        className="icon-button destructive"
        onClick={() => actions.deleteDoctor(doctor)}
        aria-label={`Delete ${doctor.fullName}`}
        title="Delete doctor"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
export default function DoctorTable({ doctors, actions }) {
  return (
    <div className="doctor-grid">
      {doctors.map((doctor) => (
        <article className="doctor-card" key={doctor.id}>
          <div className="doctor-card-top">
            <Avatar name={doctor.fullName} id={doctor.id} large />
            <StatusBadge status={doctor.isActive} />
          </div>
          <Link to={`/doctors/${doctor.id}`} className="doctor-card-title">
            <h2>{doctor.fullName}</h2>
            <p>{doctor.specialization}</p>
          </Link>
          <div className="doctor-card-info">
            <p>
              <Mail size={16} aria-hidden="true" />
              <a href={`mailto:${doctor.email}`}>{doctor.email}</a>
            </p>
            <p>
              <Clock3 size={16} aria-hidden="true" />
              <span>
                {doctor.availability.length
                  ? doctor.availability
                      .map((slot) => WEEKDAYS[slot.dayOfWeek - 1].slice(0, 3))
                      .join(", ")
                  : "No working days"}
              </span>
            </p>
          </div>
          <div className="doctor-card-bottom">
            <span>
              {doctor.availability.length
                ? `${doctor.availability[0].startTime}–${doctor.availability[0].endTime}`
                : "Not available"}
              <small>Clinic time</small>
            </span>
            <DoctorActions doctor={doctor} actions={actions} />
          </div>
        </article>
      ))}
    </div>
  );
}
