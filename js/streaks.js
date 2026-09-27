// Streaks are computed from check-ins on demand, never stored, so editing a
// past day always gives the right answer. `done(dayKey)` says whether a day counts.
import { addDays, fromDayKey, toDayKey } from './dates.js';

export const MILESTONES = [7, 30, 100];

const shift = (key, n) => toDayKey(addDays(fromDayKey(key), n));

/**
 * The run of consecutive done days ending today. If today isn't done yet, the
 * run ending yesterday still counts: the chain only breaks once a day passes.
 */
export function currentStreak(done, todayKey) {
  const todayDone = done(todayKey);
  let day = todayDone ? todayKey : shift(todayKey, -1);
  let length = 0;
  let start = null;
  while (done(day)) {
    length++;
    start = day;
    day = shift(day, -1);
  }
  return { length, start, todayDone };
}

/** The biggest milestone passed going from `before` to `after` days, or null. */
export function milestoneCrossed(before, after, milestones = MILESTONES) {
  const passed = milestones.filter((m) => before < m && m <= after);
  return passed.length ? Math.max(...passed) : null;
}
