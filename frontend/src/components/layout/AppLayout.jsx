import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { addToast } from "../../app/uiSlice";
import { Button, ConfirmDialog, Modal, ToastHost } from "../common";
import DoctorForm from "../../features/doctors/DoctorForm";
import AppointmentForm from "../../features/appointments/AppointmentForm";
import {
  useAddDoctorMutation,
  useDeleteDoctorMutation,
  useUpdateDoctorMutation,
} from "../../services/doctorsApi";
import {
  useAddAppointmentMutation,
  useDeleteAppointmentMutation,
  useUpdateAppointmentMutation,
  useUpdateAppointmentStatusMutation,
} from "../../services/appointmentsApi";
import { formatDate, friendlyError } from "../../utils/format";
import { previewMode } from "../../utils/environment";

const navigation = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/doctors", label: "Doctors", icon: UsersRound },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [addDoctor, addDoctorState] = useAddDoctorMutation();
  const [updateDoctor, updateDoctorState] = useUpdateDoctorMutation();
  const [removeDoctor, removeDoctorState] = useDeleteDoctorMutation();
  const [addAppointment, addAppointmentState] = useAddAppointmentMutation();
  const [updateAppointment, updateAppointmentState] =
    useUpdateAppointmentMutation();
  const [removeAppointment, removeAppointmentState] =
    useDeleteAppointmentMutation();
  const [updateStatus, updateStatusState] =
    useUpdateAppointmentStatusMutation();
  useEffect(() => {
    const warn = (event) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const close = () => {
    setDialog(null);
    setDirty(false);
    setActionError("");
  };
  const cancel = () => {
    if (!dirty || window.confirm("Discard your unsaved changes?")) close();
  };
  const open = (type, record, status) => {
    setDialog({ type, record, status });
    setDirty(false);
    setActionError("");
    setMobileOpen(false);
  };
  const actions = {
    openDoctor: (record) => open("doctor", record),
    openAppointment: (record) => open("appointment", record),
    deleteDoctor: (record) => open("deleteDoctor", record),
    deleteAppointment: (record) => open("deleteAppointment", record),
    changeStatus: (record, status) => open("status", record, status),
  };
  const saveDoctor = async (body) => {
    await (
      dialog.record
        ? updateDoctor({ id: dialog.record.id, ...body })
        : addDoctor(body)
    ).unwrap();
    dispatch(
      addToast(
        dialog.record
          ? "Doctor details updated."
          : "Doctor added to your team.",
      ),
    );
    close();
  };
  const saveAppointment = async (body) => {
    await (
      dialog.record
        ? updateAppointment({ id: dialog.record.id, ...body })
        : addAppointment(body)
    ).unwrap();
    dispatch(
      addToast(dialog.record ? "Appointment updated." : "Appointment created."),
    );
    close();
  };
  const confirm = async () => {
    try {
      if (dialog.type === "deleteDoctor")
        await removeDoctor(dialog.record.id).unwrap();
      else if (dialog.type === "deleteAppointment")
        await removeAppointment(dialog.record.id).unwrap();
      else
        await updateStatus({
          id: dialog.record.id,
          status: dialog.status,
        }).unwrap();
      dispatch(
        addToast(
          dialog.type === "status"
            ? "Appointment status updated."
            : "Record deleted.",
        ),
      );
      if (
        dialog.type.startsWith("delete") &&
        location.pathname ===
          `/${dialog.type === "deleteDoctor" ? "doctors" : "appointments"}/${dialog.record.id}`
      )
        navigate(dialog.type === "deleteDoctor" ? "/doctors" : "/appointments");
      close();
    } catch (error) {
      setActionError(friendlyError(error));
    }
  };
  const section =
    navigation.find((item) => location.pathname.startsWith(item.to))?.label ||
    "Workspace";
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <NavLink to="/dashboard" className="brand" aria-label="Dentra overview">
          <span className="brand-symbol">
            <Stethoscope size={25} strokeWidth={1.65} />
          </span>
          <span>
            Dentra<span className="brand-period">.</span>
            <small>Dental care, connected.</small>
          </span>
        </NavLink>
        <p className="nav-label">Workspace</p>
        <nav aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "is-active" : ""}`
              }
            >
              <Icon size={20} strokeWidth={1.7} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="sidebar-note-icon">
            <ShieldCheck size={22} strokeWidth={1.5} />
          </span>
          <h3>
            A little more clarity.
            <br />A lot more care.
          </h3>
          <p>A thoughtful space for your team and every appointment.</p>
        </div>
        <div className="sidebar-footer">
          <span className="clinic-monogram">D</span>
          <div>
            <strong>Dentra clinic</strong>
            <span>Clinic administration</span>
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <Modal
          title="Your workspace"
          className="navigation-modal"
          onClose={() => setMobileOpen(false)}
        >
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "is-active" : ""}`
                }
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={20} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </Modal>
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={23} />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span> <strong>{section}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <form
              className="global-search"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                if (search.trim()) {
                  navigate(
                    `/appointments?q=${encodeURIComponent(search.trim())}`,
                  );
                  setSearch("");
                }
              }}
            >
              <Search size={17} aria-hidden="true" />
              <input
                aria-label="Search appointments by patient"
                placeholder="Find a patient…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                maxLength={100}
              />
              <kbd>Enter</kbd>
            </form>
            <span className="topbar-date">
              <CalendarDays size={16} aria-hidden="true" />
              {formatDate(new Date(), { year: "numeric" })}
            </span>
            <Button icon={Plus} onClick={() => actions.openAppointment()}>
              New appointment
            </Button>
          </div>
        </header>
        {previewMode && (
          <div className="preview-banner">
            <span>
              <strong>Development preview</strong> · Fictional records, stored
              in memory. Refresh to reset.
            </span>
            <a href="/dashboard?live=1">Connect to API</a>
          </div>
        )}
        <main id="main-content" tabIndex="-1">
          <Outlet context={actions} />
        </main>
        <footer className="workspace-footer">
          <span>Thoughtful care starts with a connected clinic.</span>
          <span>
            <Clock3 size={13} aria-hidden="true" /> All times in Asia/Karachi
          </span>
        </footer>
      </div>
      <ToastHost />
      {dialog?.type === "doctor" && (
        <Modal
          title={dialog.record ? "Edit doctor" : "A new face on your team."}
          description="Keep your care team’s details and availability in one place."
          onClose={close}
          dirty={dirty}
          busy={addDoctorState.isLoading || updateDoctorState.isLoading}
        >
          <DoctorForm
            initialValues={dialog.record}
            onSubmit={saveDoctor}
            onCancel={cancel}
            loading={addDoctorState.isLoading || updateDoctorState.isLoading}
            onDirty={setDirty}
          />
        </Modal>
      )}
      {dialog?.type === "appointment" && (
        <Modal
          title={
            dialog.record ? "Edit appointment" : "Make room for better care."
          }
          description="Create a visit that works for your patient and your team."
          onClose={close}
          dirty={dirty}
          busy={addAppointmentState.isLoading || updateAppointmentState.isLoading}
        >
          <AppointmentForm
            initialValues={dialog.record}
            onSubmit={saveAppointment}
            onCancel={cancel}
            loading={
              addAppointmentState.isLoading || updateAppointmentState.isLoading
            }
            onDirty={setDirty}
          />
        </Modal>
      )}
      {dialog?.type.startsWith("delete") && (
        <ConfirmDialog
          title={
            dialog.type === "deleteDoctor"
              ? "Delete this doctor?"
              : "Delete this appointment?"
          }
          description={
            dialog.type === "deleteDoctor"
              ? `Remove ${dialog.record.fullName}? Doctors with appointments must be marked inactive instead.`
              : `Permanently remove the appointment for ${dialog.record.patientName}? You can cancel it instead to keep its history.`
          }
          onClose={close}
          onConfirm={confirm}
          loading={
            removeDoctorState.isLoading || removeAppointmentState.isLoading
          }
          error={actionError}
        />
      )}
      {dialog?.type === "status" && (
        <Modal
          title={`${dialog.status === "cancelled" ? "Cancel" : "Update"} this appointment?`}
          description={`${dialog.record.patientName}’s appointment will be marked ${dialog.status}.${["cancelled", "completed"].includes(dialog.status) ? " This status cannot be reopened." : ""}`}
          onClose={close}
          className="modal--small"
          busy={updateStatusState.isLoading}
        >
          {actionError && (
            <div role="alert" className="inline-error">
              {actionError}
            </div>
          )}
          <div className="form-actions">
            <Button variant="secondary" onClick={close} disabled={updateStatusState.isLoading}>
              Keep current status
            </Button>
            <Button
              variant={dialog.status === "cancelled" ? "danger" : "primary"}
              onClick={confirm}
              loading={updateStatusState.isLoading}
            >
              Confirm change
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
