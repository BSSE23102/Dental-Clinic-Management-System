import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { createStore } from "../app/store";
import { baseApi } from "../services/baseApi";
import AppRoutes from "../routes/AppRoutes";
import DoctorForm from "../features/doctors/DoctorForm";
import { Button } from "../components/common";
import { clinicDate } from "../utils/format";

let stores = [];
let doctors;
let appointments;
let calls;
const nextDate = () => {
  const day = new Date();
  day.setUTCDate(day.getUTCDate() + 2);
  return clinicDate(day);
};
const response = (data, status = 200, meta) =>
  new Response(
    status === 204 ? null : JSON.stringify({ data, ...(meta && { meta }) }),
    { status, headers: { "content-type": "application/json" } },
  );
const listResponse = (items, params) => {
  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || 10);
  return response(items.slice((page - 1) * limit, page * limit), 200, {
    page,
    limit,
    total: items.length,
    totalPages: Math.ceil(items.length / limit),
  });
};
function renderPage(path) {
  const store = createStore();
  stores.push(store);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>,
  );
}
beforeEach(() => {
  calls = [];
  doctors = [
    {
      id: 1,
      fullName: "Dr. Test Doctor",
      specialization: "General Dentistry",
      phone: "+923001234567",
      email: "test@example.com",
      isActive: true,
      availability: [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  appointments = [
    {
      id: 1,
      patientName: "Test Patient",
      patientPhone: "+923009876543",
      patientEmail: null,
      doctorId: 1,
      doctor: doctors[0],
      startsAt: `${nextDate()}T09:00:00+05:00`,
      endsAt: `${nextDate()}T09:30:00+05:00`,
      durationMinutes: 30,
      reason: "Routine examination",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request) => {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;
      calls.push({ path, method, search: url.search });
      if (path.endsWith("/dashboard/stats"))
        return response({
          totalDoctors: doctors.length,
          todayAppointments: 0,
          upcomingAppointments: appointments.length,
          pendingAppointments: appointments.filter(
            (item) => item.status === "pending",
          ).length,
          upcoming: appointments,
        });
      if (path.endsWith("/doctors") && method === "GET")
        return listResponse(
          doctors.filter(
            (doctor) =>
              !url.searchParams.get("q") ||
              doctor.fullName
                .toLowerCase()
                .includes(url.searchParams.get("q").toLowerCase()),
          ),
          url.searchParams,
        );
      if (path.endsWith("/doctors") && method === "POST") {
        const body = await request.json();
        const doctor = { ...body, id: 2, createdAt: new Date().toISOString() };
        doctors.push(doctor);
        return response(doctor, 201);
      }
      if (/\/doctors\/\d+$/.test(path) && method === "GET")
        return response(
          doctors.find(
            (doctor) => doctor.id === Number(path.split("/").at(-1)),
          ),
        );
      if (/\/doctors\/\d+$/.test(path) && method === "DELETE")
        return new Response(
          JSON.stringify({
            error: {
              code: "DOCTOR_HAS_APPOINTMENTS",
              message:
                "This doctor has appointments. Mark them inactive instead.",
            },
          }),
          { status: 409, headers: { "content-type": "application/json" } },
        );
      if (path.endsWith("/appointments") && method === "GET")
        return listResponse(appointments, url.searchParams);
      if (path.endsWith("/appointments") && method === "POST") {
        const body = await request.json();
        const appointment = {
          ...body,
          id: 2,
          doctor: doctors[0],
          endsAt: new Date(
            new Date(body.startsAt).getTime() + body.durationMinutes * 60000,
          ).toISOString(),
          status: "pending",
        };
        appointments.push(appointment);
        return response(appointment, 201);
      }
      if (path.endsWith("/status") && method === "PATCH") {
        const body = await request.json();
        appointments[0] = { ...appointments[0], status: body.status };
        return response(appointments[0]);
      }
      if (/\/appointments\/\d+$/.test(path) && method === "DELETE") {
        appointments = [];
        return response(null, 204);
      }
      return response(null, 404);
    }),
  );
});
afterEach(() => {
  for (const store of stores) store.dispatch(baseApi.util.resetApiState());
  stores = [];
  vi.unstubAllGlobals();
});

describe("clinic interface", () => {
  it("loads every doctor option across API pages", async () => {
    const original = doctors[0];
    doctors = Array.from({ length: 101 }, (_, index) => ({
      ...original,
      id: index + 1,
      fullName: `Dr. Test Doctor ${index + 1}`,
      email: `doctor${index + 1}@example.com`,
    }));
    const user = userEvent.setup();
    renderPage("/appointments");
    await screen.findAllByText("Test Patient");
    await user.click(screen.getByRole("button", { name: "Add appointment" }));
    const dialog = screen.getByRole("dialog");
    expect(
      await within(dialog).findByRole("option", {
        name: "Dr. Test Doctor 101 · General Dentistry",
      }),
    ).toBeInTheDocument();
    expect(
      calls.some(
        (call) =>
          call.path.endsWith("/doctors") && call.search.includes("page=2"),
      ),
    ).toBe(true);
  });
  it("opens an accessible mobile navigation dialog and closes it on navigation", async () => {
    const user = userEvent.setup();
    renderPage("/dashboard");
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const dialog = screen.getByRole("dialog", { name: "Your workspace" });
    await user.click(within(dialog).getByRole("link", { name: "Doctors" }));
    expect(
      await screen.findByRole("heading", { name: "People behind the care." }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("renders persisted API statistics and navigable appointment records", async () => {
    renderPage("/dashboard");
    expect(
      await screen.findByRole("heading", { name: /Care starts here/ }),
    ).toBeInTheDocument();
    expect(await screen.findAllByText("Test Patient")).toHaveLength(2);
    expect(calls.some((call) => call.path.endsWith("/dashboard/stats"))).toBe(
      true,
    );
  });
  it("shows an actionable service failure instead of fictional live records", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Network unavailable")),
    );
    renderPage("/doctors");
    expect(
      await screen.findByText(/We couldn’t reach the clinic service/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
  it("submits a doctor and refreshes the doctor list through cache invalidation", async () => {
    const user = userEvent.setup();
    renderPage("/doctors");
    await screen.findByText("Dr. Test Doctor");
    await user.click(screen.getByRole("button", { name: "Add doctor" }));
    const dialog = screen.getByRole("dialog");
    await user.type(
      within(dialog).getByLabelText("Full name"),
      "Dr. New Doctor",
    );
    await user.type(
      within(dialog).getByLabelText("Specialization"),
      "Orthodontics",
    );
    await user.type(
      within(dialog).getByLabelText("Phone number"),
      "+923001234568",
    );
    await user.type(
      within(dialog).getByLabelText("Email address"),
      "new@example.com",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Add doctor" }),
    );
    expect(await screen.findByText("Dr. New Doctor")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      calls.some(
        (call) => call.method === "POST" && call.path.endsWith("/doctors"),
      ),
    ).toBe(true);
  });
  it("requires confirmation and keeps relational deletion errors visible", async () => {
    const user = userEvent.setup();
    renderPage("/doctors");
    await screen.findByText("Dr. Test Doctor");
    await user.click(screen.getByLabelText("Delete Dr. Test Doctor"));
    expect(calls.some((call) => call.method === "DELETE")).toBe(false);
    await user.click(screen.getByRole("button", { name: "Delete record" }));
    expect(
      await screen.findByText(/This doctor has appointments/),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it("syncs debounced search to the API and offers recovery from empty results", async () => {
    const user = userEvent.setup();
    renderPage("/doctors");
    await screen.findByText("Dr. Test Doctor");
    await user.type(
      screen.getByRole("searchbox", { name: "Search doctors" }),
      "missing",
    );
    expect(await screen.findByText("No doctors found.")).toBeInTheDocument();
    expect(calls.some((call) => call.search.includes("q=missing"))).toBe(true);
    await user.click(
      screen.getAllByRole("button", { name: "Reset filters" })[0],
    );
    expect(await screen.findByText("Dr. Test Doctor")).toBeInTheDocument();
  });
  it("creates an appointment using actual doctor options and clinic time", async () => {
    const user = userEvent.setup();
    renderPage("/appointments");
    await screen.findAllByText("Test Patient");
    await user.click(screen.getByRole("button", { name: "Add appointment" }));
    const dialog = screen.getByRole("dialog");
    await waitFor(() =>
      expect(within(dialog).getByLabelText("Doctor")).toBeEnabled(),
    );
    await user.type(
      within(dialog).getByLabelText("Patient name"),
      "New Patient",
    );
    await user.type(
      within(dialog).getByLabelText("Phone number"),
      "03001234567",
    );
    await user.selectOptions(within(dialog).getByLabelText("Doctor"), "1");
    const date = within(dialog).getByLabelText("Date and time");
    await user.type(date, `${nextDate()}T10:15`);
    await user.type(
      within(dialog).getByLabelText("Reason for visit"),
      "Dental cleaning",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Create appointment" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(await screen.findAllByText("New Patient")).toHaveLength(2);
    expect(appointments[1].doctorId).toBe(1);
    expect(appointments[1].startsAt).toContain("+05:00");
  });
  it("confirms a permitted status change and refreshes the record", async () => {
    const user = userEvent.setup();
    renderPage("/appointments");
    await screen.findAllByText("Test Patient");
    await user.selectOptions(
      screen.getAllByLabelText("Change status for Test Patient")[0],
      "confirmed",
    );
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Confirm change" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(await screen.findAllByText("Confirmed")).toHaveLength(3);
    expect(appointments[0].status).toBe("confirmed");
  });
  it("renders unknown and invalid record routes safely", () => {
    renderPage("/doctors/not-an-id");
    expect(
      screen.getByRole("heading", { name: "A little off the schedule." }),
    ).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });
});
describe("form resilience", () => {
  it("retains input and exposes a failed save without closing the form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({
      data: {
        error: {
          message: "This email is already in use.",
          fieldErrors: { email: "Choose another email." },
        },
      },
    });
    render(
      <DoctorForm
        initialValues={doctors[0]}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(
      await screen.findByText("This email is already in use."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toHaveValue(
      "test@example.com",
    );
    expect(screen.getByText("Choose another email.")).toBeInTheDocument();
  });
  it("prevents repeat submissions while a save is pending", () => {
    render(
      <Button loading disabled={false}>
        Save changes
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });
});
