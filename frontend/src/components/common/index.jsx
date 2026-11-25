import { cloneElement, useEffect, useId, useRef } from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
  X,
  CalendarDays,
  UsersRound,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { removeToast } from "../../app/uiSlice";
import { STATUS_LABELS, initials } from "../../utils/format";

export function Button({
  children,
  variant = "primary",
  icon: Icon,
  loading,
  className = "",
  ...props
}) {
  return (
    <button
      className={`button button--${variant} ${className}`}
      {...props}
      disabled={loading || props.disabled}
    >
      {loading ? (
        <LoaderCircle size={17} className="spin" aria-hidden="true" />
      ) : (
        Icon && <Icon size={17} aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
export function Field({
  label,
  error,
  hint,
  children,
  className = "",
  ...props
}) {
  const generatedId = useId();
  const id = props.id || generatedId;
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children ? (
        cloneElement(children, {
          id,
          "aria-invalid": !!error,
          "aria-describedby": error || hint ? `${id}-message` : undefined,
        })
      ) : (
        <input
          {...props}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-message` : undefined}
        />
      )}
      {(error || hint) && (
        <p
          className={error ? "field-error" : "field-hint"}
          id={`${id}-message`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
export function Select({ label, error, hint, children, ...props }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-message` : undefined}
      >
        {children}
      </select>
      {(error || hint) && (
        <p
          id={`${id}-message`}
          className={error ? "field-error" : "field-hint"}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
export function Modal({
  title,
  description,
  onClose,
  children,
  dirty = false,
  busy = false,
  className = "",
}) {
  const dialog = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      previous?.focus();
    };
  }, []);
  const requestClose = () => {
    if (busy) return;
    if (!dirty || window.confirm("Discard your unsaved changes?")) onClose();
  };
  return (
    <dialog
      ref={dialog}
      className={`modal ${className}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            requestClose();
        }
      }}
    >
      <div className="modal-heading">
        <div>
          <p className="eyebrow">Dentra workspace</p>
          <h2 id={titleId}>{title}</h2>
          {description && (
            <p id={descriptionId} className="muted">
              {description}
            </p>
          )}
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          disabled={busy}
          onClick={requestClose}
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ConfirmDialog({
  title,
  description,
  onClose,
  onConfirm,
  loading,
  error,
}) {
  return (
    <Modal
      title={title}
      description={description}
      onClose={onClose}
      className="modal--small"
      busy={loading}
    >
      <div className="confirm-symbol">
        <AlertCircle size={25} />
      </div>
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Keep record
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          Delete record
        </Button>
      </div>
    </Modal>
  );
}
export function PageHeader({ title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">Your clinic, connected</p>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="page-heading-actions">{children}</div>
    </div>
  );
}
export function Avatar({ name, id = 0, large = false }) {
  return (
    <span
      className={`avatar avatar--${Number(id) % 4} ${large ? "avatar--large" : ""}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
export function StatusBadge({ status }) {
  const key =
    typeof status === "boolean" ? (status ? "active" : "inactive") : status;
  return (
    <span className={`badge badge--${key}`}>
      <span className="badge-dot" aria-hidden="true" />
      {STATUS_LABELS[key] ||
        (key === "active" ? "Active" : key === "inactive" ? "Inactive" : key)}
    </span>
  );
}
export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search records",
}) {
  return (
    <div className="search-control">
      <Search size={18} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        maxLength={100}
      />
      {value && (
        <button
          className="icon-button"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title = "A fresh start.",
  description = "Your records will appear here.",
  action,
  type = "appointments",
}) {
  const Icon = type === "doctors" ? UsersRound : CalendarDays;
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={27} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function LoadingState({ rows = 4 }) {
  return (
    <div className="loading-state" role="status" aria-label="Loading records">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="skeleton-row">
          <span className="skeleton skeleton-avatar" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-short" />
        </div>
      ))}
    </div>
  );
}
export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={28} strokeWidth={1.5} />
      <h3>We couldn’t load this just yet.</h3>
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function Pagination({ meta, onPage }) {
  if (!meta || !meta.total) return null;
  const start = (meta.page - 1) * meta.limit + 1;
  return (
    <nav className="pagination" aria-label="Record pagination">
      <p>
        Showing{" "}
        <strong>
          {start}–{Math.min(meta.page * meta.limit, meta.total)}
        </strong>{" "}
        of <strong>{meta.total}</strong>
      </p>
      <div>
        <Button
          variant="secondary"
          icon={ChevronLeft}
          disabled={meta.page <= 1}
          onClick={() => onPage(meta.page - 1)}
        >
          Previous
        </Button>
        <span className="page-number">
          {meta.page} / {Math.max(1, meta.totalPages)}
        </span>
        <Button
          variant="secondary"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
        >
          Next <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
export function DataTable({ columns, rows, caption, empty, mobileRender }) {
  if (!rows.length) return empty;
  return (
    <>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mobileRender && (
        <div className="mobile-records">
          {rows.map((row) => (
            <div key={row.id} className="mobile-record">
              {mobileRender(row)}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
function Toast({ toast }) {
  const dispatch = useDispatch();
  useEffect(() => {
    const timer = setTimeout(
      () => dispatch(removeToast(toast.id)),
      toast.tone === "error" ? 8000 : 5000,
    );
    return () => clearTimeout(timer);
  }, [dispatch, toast.id, toast.tone]);
  return (
    <div className={`toast toast--${toast.tone}`} role="status">
      {toast.tone === "error" ? <AlertCircle size={19} /> : <Check size={19} />}
      <p>{toast.message}</p>
      <button
        aria-label="Dismiss notification"
        className="icon-button"
        onClick={() => dispatch(removeToast(toast.id))}
      >
        <X size={17} />
      </button>
    </div>
  );
}
export function ToastHost() {
  const toasts = useSelector((state) => state.ui.toasts);
  return (
    <div className="toast-host" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
