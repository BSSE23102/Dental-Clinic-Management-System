import {
  CalendarCheck2,
  CalendarClock,
  Clock3,
  UsersRound,
} from "lucide-react";

const metrics = [
  {
    key: "totalDoctors",
    label: "Doctors on your team",
    icon: UsersRound,
    note: "Working together for better care",
  },
  {
    key: "todayAppointments",
    label: "Appointments today",
    icon: CalendarCheck2,
    note: "A clear view of the day ahead",
  },
  {
    key: "upcomingAppointments",
    label: "Upcoming appointments",
    icon: CalendarClock,
    note: "Every next step, in one place",
  },
  {
    key: "pendingAppointments",
    label: "Awaiting confirmation",
    icon: Clock3,
    note: "A little attention goes a long way",
  },
];

export default function ClinicStats({ data, loading }) {
  return (
    <section className="metrics-section" aria-label="Clinic statistics">
      {metrics.map(({ key, label, note, icon: Icon }) => (
        <div className="metric" key={key}>
          <div className="metric-top">
            <p>{label}</p>
            <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <strong className="metric-number">
            {loading ? (
              <span
                className="skeleton metric-skeleton"
                aria-label="Loading statistic"
              />
            ) : data ? (
              String(data[key]).padStart(2, "0")
            ) : (
              "—"
            )}
          </strong>
          <p className="metric-note">{note}</p>
        </div>
      ))}
    </section>
  );
}
