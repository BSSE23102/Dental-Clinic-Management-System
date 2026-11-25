export const CLINIC_TIMEZONE = 'Asia/Karachi';
export function clinicParts(value) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: CLINIC_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type).value;
  const day = `${get('year')}-${get('month')}-${get('day')}`;
  return { date: day, time: `${get('hour')}:${get('minute')}`, dayOfWeek: new Date(`${day}T12:00:00Z`).getUTCDay() || 7 };
}
export function fitsAvailability(startsAt, endsAt, availability) {
  const start = clinicParts(startsAt); const end = clinicParts(endsAt);
  const slot = availability.find((item) => item.dayOfWeek === start.dayOfWeek);
  return !!slot && start.date === end.date && start.time >= slot.startTime && end.time <= slot.endTime;
}
export function isQuarterHour(value) { return new Date(value).getTime() % 900000 === 0; }
export function durationEnd(startsAt, minutes) { return new Date(new Date(startsAt).getTime() + minutes * 60000); }
