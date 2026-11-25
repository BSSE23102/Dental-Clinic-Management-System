import { useOutletContext } from "react-router-dom";
import { Plus, UsersRound } from "lucide-react";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Pagination,
  SearchBar,
  Select,
} from "../components/common";
import DoctorTable from "../features/doctors/DoctorTable";
import { useGetDoctorsQuery } from "../services/doctorsApi";
import { useListFilters } from "../hooks/useListFilters";
import { friendlyError } from "../utils/format";

export default function DoctorsPage() {
  const actions = useOutletContext();
  const list = useListFilters(["q", "active"]);
  const query = useGetDoctorsQuery(list.apiParams);
  return (
    <div className="standard-page">
      <PageHeader
        title="People behind the care."
        description="A connected team. A healthier clinic."
      >
        <Button icon={Plus} onClick={() => actions.openDoctor()}>
          Add doctor
        </Button>
      </PageHeader>
      <div className="page-summary">
        <span className="page-summary-icon">
          <UsersRound size={22} strokeWidth={1.5} />
        </span>
        <div>
          <strong>{query.data?.meta?.total ?? "—"}</strong>
          <span>
            {list.filters.q || list.filters.active
              ? "doctors matching your filters"
              : "doctors in your care team"}
          </span>
        </div>
        <p>Good care begins with great people.</p>
      </div>
      <section aria-label="Doctor management">
        <div className="filter-bar">
          <SearchBar
            value={list.filters.q}
            onChange={(value) => list.update("q", value)}
            placeholder="Search name or specialization…"
            label="Search doctors"
          />
          <div className="filter-controls">
            <Select
              label="Status"
              value={list.filters.active}
              onChange={(event) => list.update("active", event.target.value)}
            >
              <option value="">All doctors</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
            {(list.filters.q || list.filters.active) && (
              <Button variant="text" onClick={list.reset}>
                Reset filters
              </Button>
            )}
          </div>
        </div>
        <div aria-busy={query.isFetching}>
          {query.isLoading ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState
              message={friendlyError(query.error)}
              onRetry={query.refetch}
            />
          ) : query.data?.data.length ? (
            <DoctorTable doctors={query.data.data} actions={actions} />
          ) : (
            <EmptyState
              type="doctors"
              title={
                list.filters.q || list.filters.active
                  ? "No doctors found."
                  : "Your care team starts here."
              }
              description={
                list.filters.q || list.filters.active
                  ? "Try a different name or reset your filters."
                  : "Add your first doctor and their working hours."
              }
              action={
                <Button
                  variant="secondary"
                  onClick={
                    list.filters.q || list.filters.active
                      ? list.reset
                      : () => actions.openDoctor()
                  }
                >
                  {list.filters.q || list.filters.active
                    ? "Reset filters"
                    : "Add doctor"}
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
