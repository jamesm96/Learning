// The streak: days in a row with at least five minutes of practice.
// One missed day per week is forgiven, so a single busy day never breaks it.

import { addDays, daysBetween, type DayKey } from "./dates";

/** Seconds of activity that make a day count. */
export const ACTIVE_DAY_SECONDS = 5 * 60;
/** The daily goal on the Today screen. */
export const DAILY_GOAL_SECONDS = 15 * 60;
/** A forgiven missed day must be at least this many days after the last one. */
const FORGIVE_EVERY_DAYS = 7;

export interface Streak {
  days: number; // practice days in the current streak
  todayDone: boolean; // today already counts
  forgivenDay: DayKey | null; // the most recent missed day that was forgiven, if any
}

/** Work out the current streak from seconds of activity per day. */
export function currentStreak(activity: Record<DayKey, number>, today: DayKey): Streak {
  const active = (day: DayKey) => (activity[day] ?? 0) >= ACTIVE_DAY_SECONDS;
  const activeDays = Object.keys(activity).filter(active).sort();
  const first = activeDays[0];
  const todayDone = active(today);
  if (!first) return { days: 0, todayDone, forgivenDay: null };

  // Today only counts once it is done; until then the streak runs to yesterday.
  let day = todayDone ? today : addDays(today, -1);
  let days = 0;
  let forgiven: DayKey | null = null;
  let latestForgiven: DayKey | null = null;

  while (day >= first) {
    if (active(day)) {
      days += 1;
    } else {
      // A second miss within a week of the last forgiven one ends the streak.
      if (forgiven !== null && daysBetween(day, forgiven) < FORGIVE_EVERY_DAYS) break;
      forgiven = day;
      latestForgiven ??= day;
    }
    day = addDays(day, -1);
  }
  return { days, todayDone, forgivenDay: days > 0 ? latestForgiven : null };
}
