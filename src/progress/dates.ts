// Calendar days as plain strings ("2026-11-14"), in the phone's own time zone.
// Days, not timestamps, so "due tomorrow" means tomorrow wherever you are.

/** A calendar day, written YYYY-MM-DD. */
export type DayKey = string;

/** The local calendar day of a moment. */
export function dayKey(date: Date): DayKey {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The day `count` days after `key` (or before, when negative). */
export function addDays(key: DayKey, count: number): DayKey {
  const [year, month, day] = key.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day + count));
  return date.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: DayKey, to: DayKey): number {
  const toTime = (key: DayKey) => {
    const [year, month, day] = key.split("-").map(Number) as [number, number, number];
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toTime(to) - toTime(from)) / 86_400_000);
}
