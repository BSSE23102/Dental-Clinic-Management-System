import { useOutletContext } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  Button,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  Pagination,
  SearchBar,
  Select,
} from "../components/common";
import AppointmentTable from "../features/appointments/AppointmentTable";
import { useGetAppointmentsQuery } from "../services/appointmentsApi";
import { useGetDoctorOptionsQuery } from "../services/doctorsApi";
import { useListFilters } from "../hooks/useListFilters";
import { friendlyError, STATUS_LABELS } from "../utils/format";

export default function AppointmentsPage() {
  const actions = useOutletContext();
  const list = useListFilters(["q", "doctorId", "date", "status"]);
  const query = useGetAppointmentsQuery(list.apiParams);
  const doctors = useGetDoctorOptionsQuery();
  const hasFilters = Object.values(list.filters).some(Boolean);
  return (
    <div className="standard-page">
      <PageHeader
        title="Every visit matters."
        description="Make space for your patients. Keep the day moving."
      >
        <Button icon={Plus} onClick={() => actions.openAppointment()}>
          Add appointment
        </Button>
      </PageHeader>
      <div className="list-heading">
        <h2>
          Appointments{" "}
          <span className="count-chip">{query.data?.meta?.total ?? "—"}</span>
        </h2>
        <p>All times in Asia/Karachi (UTC+05:00)</p>
      </div>
      <section
        className="appointments-panel full-panel"
        aria-label="Appointment management"
      >
        <div className="filter-bar appointment-filter-bar">
          <SearchBar
            value={list.filters.q}
            onChange={(value) => list.update("q", value)}
            placeholder="Search patient name…"
            label="Search appointments"
          />
          <div className="filter-controls">
            <Select
              label="Doctor"
              value={list.filters.doctorId}
              onChange={(event) => list.update("doctorId", event.target.value)}
              disabled={doctors.isLoading}
            >
              <option value="">All doctors</option>
              {doctors.data?.map((doctor) => (
                <option value={doctor.id} key={doctor.id}>
                  {doctor.fullName}
                </option>
              ))}
            </Select>
            <Field
              label="Date"
              type="date"
              value={list.filters.date}
              onChange={(event) => list.update("date", event.target.value)}
            />
            <Select
              label="Status"
              value={list.filters.status}
              onChange={(event) => list.update("status", event.target.value)}
            >
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </Select>
            {hasFilters && (
              <Button variant="text" onClick={list.reset}>
                Reset
              </Button>
            )}
          </div>
        </div>
        {doctors.isError && (
          <p className="filter-error">
            Doctor filters are unavailable.{" "}
            <button className="text-button" onClick={doctors.refetch}>
              Retry
            </button>
          </p>
        )}
        <div aria-busy={query.isFetching}>
          {query.isLoading ? (
            <LoadingState rows={6} />
          ) : query.isError ? (
            <ErrorState
              message={friendlyError(query.error)}
              onRetry={query.refetch}
            />
          ) : (
            <AppointmentTable
              appointments={query.data?.data || []}
              actions={actions}
              emptyAction={
                <Button
                  variant="secondary"
                  onClick={
                    hasFilters ? list.reset : () => actions.openAppointment()
                  }
                >
                  {hasFilters ? "Reset filters" : "Add appointment"}
                </Button>
              }
            />
          )}
        </div>
        <Pagination
          meta={query.data?.meta}
          onPage={(page) => list.update("page", page)}
        />
      </section>
    </div>
  );
}
