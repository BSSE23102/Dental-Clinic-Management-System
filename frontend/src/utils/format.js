export const CLINIC_TIMEZONE = 'Asia/Karachi';
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const STATUS_LABELS = { pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' };

export function clinicInput(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: CLINIC_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

export function clinicDate(value = new Date()) { return clinicInput(value).slice(0, 10); }
export function toApiDateTime(value) { return value ? `${value}:00+05:00` : ''; }
export function formatDate(value, options = {}) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: CLINIC_TIMEZONE, day: 'numeric', month: 'short', ...options }).format(new Date(value));
}
export function formatTime(value) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: CLINIC_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(value));
}
export function initials(name = '') { return name.replace(/^Dr\.?\s*/i, '').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }
export function friendlyError(error) {
  if (error?.data?.error?.message) return error.data.error.message;
  if (error?.status === 'TIMEOUT_ERROR') return 'This is taking longer than usual. Please try again shortly.';
  if (error?.status === 'FETCH_ERROR' || error?.status === 'PARSING_ERROR') return 'We couldn’t reach the clinic service. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}
export function validTransitions(appointment, now = new Date()) {
  if (appointment.status === 'pending') return new Date(appointment.startsAt) > now ? ['confirmed', 'cancelled'] : ['cancelled'];
  if (appointment.status === 'confirmed') return new Date(appointment.endsAt) <= now ? ['completed', 'cancelled'] : ['cancelled'];
  return [];
}
export function canEditAppointment(appointment) { return ['pending', 'confirmed'].includes(appointment.status) && new Date(appointment.startsAt) > new Date(); }
