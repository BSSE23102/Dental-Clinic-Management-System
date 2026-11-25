import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  Avatar,
  DataTable,
  EmptyState,
  StatusBadge,
} from "../../components/common";
import {
  canEditAppointment,
  formatDate,
  formatTime,
  STATUS_LABELS,
  validTransitions,
} from "../../utils/format";

export function AppointmentActions({ appointment, actions, compact = false }) {
  const transitions = validTransitions(appointment);
  return (
    <div className="row-actions">
      {!compact && (
        <Link
          className="icon-button"
          to={`/appointments/${appointment.id}`}
          aria-label={`View appointment for ${appointment.patientName}`}
          title="View appointment"
        >
          <Eye size={17} />
        </Link>
      )}
      {canEditAppointment(appointment) && (
        <button
          className="icon-button"
          onClick={() => actions.openAppointment(appointment)}
          aria-label={`Edit appointment for ${appointment.patientName}`}
          title="Edit appointment"
        >
          <Pencil size={16} />
        </button>
      )}
      {!compact && transitions.length > 0 && (
        <select
          className="status-action"
          aria-label={`Change status for ${appointment.patientName}`}
          value=""
          onChange={(event) => {
            if (event.target.value)
              actions.changeStatus(appointment, event.target.value);
          }}
        >
          <option value="">Update status</option>
          {transitions.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      )}
      {!compact && (
        <button
          className="icon-button destructive"
          onClick={() => actions.deleteAppointment(appointment)}
          aria-label={`Delete appointment for ${appointment.patientName}`}
          title="Delete appointment"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
export default function AppointmentTable({
  appointments,
  actions,
  compact = false,
  emptyAction,
}) {
  const columns = [
    {
      key: "patient",
      label: "Patient",
      render: (row) => (
        <Link to={`/appointments/${row.id}`} className="person-cell">
          <Avatar name={row.patientName} id={row.id} />
          <span>
            <strong>{row.patientName}</strong>
            <small>{row.reason}</small>
          </span>
        </Link>
      ),
    },
    {
      key: "doctor",
      label: "Doctor",
      render: (row) => (
        <span className="doctor-cell">
          <strong>{row.doctor?.fullName || "Doctor unavailable"}</strong>
          <small>{row.doctor?.specialization || ""}</small>
        </span>
      ),
    },
    {
      key: "date",
      label: "Date & time",
      render: (row) => (
        <span className="date-cell">
          <strong>{formatDate(row.startsAt)}</strong>
          <small>
            {formatTime(row.startsAt)} · {row.durationMinutes} min
          </small>
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <AppointmentActions
          appointment={row}
          actions={actions}
          compact={compact}
        />
      ),
    },
  ];
  return (
    <DataTable
      rows={appointments}
      columns={columns}
      caption="Clinic appointments, all times in Asia/Karachi"
      empty={
        <EmptyState
          title="A little space in the schedule."
          description="Appointments will appear here as your clinic gets busy."
          action={emptyAction}
        />
      }
      mobileRender={(row) => (
        <>
          <div className="mobile-record-heading">
            <Link to={`/appointments/${row.id}`} className="person-cell">
              <Avatar name={row.patientName} id={row.id} />
              <strong>{row.patientName}</strong>
            </Link>
            <StatusBadge status={row.status} />
          </div>
          <p className="mobile-record-detail">
            {row.doctor?.fullName}
            <span>
              {formatDate(row.startsAt)} · {formatTime(row.startsAt)}
            </span>
          </p>
          <AppointmentActions
            appointment={row}
            actions={actions}
            compact={compact}
          />
        </>
      )}
    />
  );
}
