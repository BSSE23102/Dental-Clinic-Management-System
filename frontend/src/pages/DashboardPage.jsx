import { Link, useOutletContext } from "react-router-dom";
import { CalendarCheck2, Plus, UsersRound } from "lucide-react";
import { Button, ErrorState, LoadingState } from "../components/common";
import AppointmentTable from "../features/appointments/AppointmentTable";
import ClinicStats from "../features/dashboard/ClinicStats";
import { useGetDashboardQuery } from "../services/dashboardApi";
import { friendlyError } from "../utils/format";

export default function DashboardPage() {
  const actions = useOutletContext();
  const query = useGetDashboardQuery();
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Karachi",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );
  const greeting =
    hour < 12
      ? "Good morning."
      : hour < 17
        ? "Good afternoon."
        : "Good evening.";
  return (
    <div className="dashboard-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-kicker">
            <span /> A connected clinic. A considered day.
          </p>
          <h1>
            {greeting}
            <br />
            <span>Care starts here.</span>
          </h1>
          <p className="hero-description">
            Your team, your appointments, and a little more room
            <br className="desktop-break" /> to focus on what matters. Welcome
            to your workspace.
          </p>
          <div className="hero-actions">
            <Button
              variant="white"
              icon={Plus}
              onClick={() => actions.openAppointment()}
            >
              Create an appointment
            </Button>
            <Link className="hero-link" to="/doctors">
              Meet your team
            </Link>
          </div>
          <div className="hero-bottom">
            <span className="hero-mark">
              <UsersRound size={19} strokeWidth={1.4} />
            </span>
            <p>
              A shared space for
              <br />
              <strong>thoughtful dental care.</strong>
            </p>
          </div>
        </div>
        <div className="hero-portrait">
          <img
            src="/images/clinic-doctor.jpg"
            alt=""
            width="1100"
            height="733"
            fetchPriority="high"
          />
          <div className="portrait-label">
            <span className="portrait-icon">
              <CalendarCheck2 size={20} />
            </span>
            <div>
              <strong>Better days. Brighter smiles.</strong>
              <span>Care that feels connected.</span>
            </div>
          </div>
        </div>
        <span className="hero-watermark" aria-hidden="true">
          care.
        </span>
      </section>
      <ClinicStats data={query.data} loading={query.isLoading} />
      <section className="appointments-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A look ahead</p>
            <h2>
              Your next appointments<span className="heading-period">.</span>
            </h2>
            <p>The people and moments coming up next.</p>
          </div>
          <Link to="/appointments" className="button button--secondary">
            View all appointments
          </Link>
        </div>
        {query.isLoading ? (
          <LoadingState rows={4} />
        ) : query.isError ? (
          <ErrorState
            message={friendlyError(query.error)}
            onRetry={query.refetch}
          />
        ) : (
          <AppointmentTable
            appointments={query.data?.upcoming || []}
            actions={actions}
            compact
            emptyAction={
              <Button icon={Plus} onClick={() => actions.openAppointment()}>
                Add an appointment
              </Button>
            }
          />
        )}
      </section>
      <section className="care-strip">
        <span className="care-strip-icon">
          <UsersRound size={27} strokeWidth={1.3} />
        </span>
        <div>
          <h2>Great care is a team effort.</h2>
          <p>Keep your doctors’ details and working hours up to date.</p>
        </div>
        <Button
          variant="secondary"
          icon={Plus}
          onClick={() => actions.openDoctor()}
        >
          Add a doctor
        </Button>
      </section>
    </div>
  );
}
