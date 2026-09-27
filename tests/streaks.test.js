import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addDays, toDayKey } from '../js/dates.js';
import { currentStreak, milestoneCrossed } from '../js/streaks.js';

const doneOn = (...keys) => {
  const set = new Set(keys);
  return (day) => set.has(day);
};

/** Day keys for `count` consecutive local days starting at (y, m, d). */
const run = (y, m, d, count) => Array.from({ length: count }, (_, i) => toDayKey(addDays(new Date(y, m - 1, d), i)));

test('no check-ins means no streak', () => {
  assert.deepEqual(currentStreak(doneOn(), '2026-09-27'), { length: 0, start: null, todayDone: false });
});

test('counts back from today when today is done', () => {
  const s = currentStreak(doneOn('2026-09-25', '2026-09-26', '2026-09-27'), '2026-09-27');
  assert.deepEqual(s, { length: 3, start: '2026-09-25', todayDone: true });
});

test('an unfinished today keeps the chain ending yesterday alive', () => {
  const s = currentStreak(doneOn('2026-09-25', '2026-09-26'), '2026-09-27');
  assert.deepEqual(s, { length: 2, start: '2026-09-25', todayDone: false });
});

test('a missed day breaks the chain', () => {
  assert.equal(currentStreak(doneOn('2026-09-24', '2026-09-25'), '2026-09-27').length, 0);
  assert.equal(currentStreak(doneOn('2026-09-24', '2026-09-26', '2026-09-27'), '2026-09-27').length, 2);
});

test('filling in a past gap joins two chains', () => {
  const days = ['2026-09-20', '2026-09-21', '2026-09-23', '2026-09-24'];
  assert.equal(currentStreak(doneOn(...days), '2026-09-24').length, 2);
  assert.equal(currentStreak(doneOn(...days, '2026-09-22'), '2026-09-24').length, 5);
});

test('streaks run across month and year ends', () => {
  assert.equal(currentStreak(doneOn(...run(2025, 12, 29, 5)), '2026-01-02').length, 5);
  assert.equal(currentStreak(doneOn(...run(2028, 2, 27, 4)), '2028-03-01').length, 4); // leap day
});

test('milestoneCrossed', () => {
  assert.equal(milestoneCrossed(6, 7), 7);
  assert.equal(milestoneCrossed(7, 8), null);
  assert.equal(milestoneCrossed(7, 6), null); // undo never celebrates
  assert.equal(milestoneCrossed(5, 31), 30); // a filled gap can jump several
  assert.equal(milestoneCrossed(0, 150), 100);
});

// Day keys come from local time, so the same streak must hold in any timezone,
// including on days that are 23 or 25 hours long.
const ZONES = [
  ['America/New_York', [2026, 3, 8], [2026, 11, 1]], // DST at 02:00
  ['Europe/London', [2026, 3, 29], [2026, 10, 25]], // DST at 01:00
  ['Australia/Sydney', [2026, 10, 4], [2026, 4, 5]], // southern hemisphere
  ['America/Santiago', [2026, 9, 6], [2026, 4, 5]], // midnight doesn't exist on Sep 6
  ['Pacific/Kiritimati', [2026, 1, 1], [2026, 6, 1]], // UTC+14, far from UTC
  ['Asia/Kolkata', [2026, 1, 1], [2026, 6, 1]], // half-hour offset, no DST
];

for (const [zone, ...transitions] of ZONES) {
  test(`streaks across DST changes in ${zone}`, () => {
    process.env.TZ = zone;
    for (const [y, m, d] of transitions) {
      const days = run(y, m, d - 3, 7);
      assert.equal(new Set(days).size, 7, 'each step is a new calendar day');
      const today = days.at(-1);
      assert.equal(currentStreak(doneOn(...days), today).length, 7);
      assert.equal(currentStreak(doneOn(...days.slice(0, -1)), today).length, 6);
    }
  });

  test(`check-ins near midnight count for the local day in ${zone}`, () => {
    process.env.TZ = zone;
    const lateSat = toDayKey(new Date(2026, 8, 26, 23, 59));
    const earlySun = toDayKey(new Date(2026, 8, 27, 0, 30));
    assert.deepEqual([lateSat, earlySun], ['2026-09-26', '2026-09-27']);
    assert.equal(currentStreak(doneOn(lateSat, earlySun), earlySun).length, 2);
  });
}

test('longest streak finds the best run, across month and DST boundaries', async () => {
  const { longestStreak } = await import('../js/streaks.js');
  assert.equal(longestStreak([]), 0);
  assert.equal(longestStreak(['2026-09-01']), 1);
  assert.equal(longestStreak([...run(2026, 3, 1, 4), ...run(2026, 3, 27, 9)].sort()), 9); // spans Mar 29 (EU DST)
  assert.equal(longestStreak(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-03']), 3);
});
