// All dates here are plain YYYY-MM-DD day-keys, treated as UTC-midnight to
// match the backend's `@db.Date` columns — never local-timezone Date math,
// since a naive local Date could shift the calendar day at UTC boundaries.

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayKey(): string {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function formatDisplayDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export interface MonthCell {
  key: string;
  day: number;
}

export interface MonthGridData {
  year: number;
  month: number;
  label: string;
  weeks: (MonthCell | null)[][];
}

export function buildMonthGrid(year: number, month: number): MonthGridData {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startWeekday = firstDay.getUTCDay();

  const cells: (MonthCell | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push({ key: toDateKey(year, month, d), day: d });
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (MonthCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return { year, month, label: `${MONTH_LABELS[month]} ${year}`, weeks };
}

export function nextMonth(year: number, month: number): { year: number; month: number } {
  return month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
}
