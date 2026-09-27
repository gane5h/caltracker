/** A calendar day in the device's local timezone, formatted `YYYY-MM-DD`. */
export type DayKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function toDayKey(d: Date): DayKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Adds calendar days (not 24h blocks), so DST shifts never skip or repeat a day. */
export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Local midnight of the Monday that starts `d`'s week. */
export function startOfWeek(d: Date): Date {
  const mondayIndex = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  return addDays(d, -mondayIndex);
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Sep 21 – 27", or "Sep 29 – Oct 5" when the week spans two months. */
export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const startLabel = `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}`;
  const endLabel =
    end.getMonth() === weekStart.getMonth()
      ? String(end.getDate())
      : `${MONTHS[end.getMonth()]} ${end.getDate()}`;
  return `${startLabel} – ${endLabel}`;
}

export const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
