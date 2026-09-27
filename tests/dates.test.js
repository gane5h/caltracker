import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addDays, formatWeekRange, fromDayKey, startOfWeek, toDayKey, weekDays } from '../js/dates.js';

test('toDayKey / fromDayKey round-trip in local time', () => {
  assert.equal(toDayKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(toDayKey(fromDayKey('2026-12-31')), '2026-12-31');
});

test('startOfWeek returns Monday', () => {
  assert.equal(toDayKey(startOfWeek(new Date(2026, 8, 27))), '2026-09-21'); // Sunday
  assert.equal(toDayKey(startOfWeek(new Date(2026, 8, 21))), '2026-09-21'); // Monday
  assert.equal(toDayKey(startOfWeek(new Date(2026, 0, 1))), '2025-12-29'); // across a year
});

test('addDays steps calendar days across DST changes', () => {
  // US DST starts 2026-03-08 and ends 2026-11-01; either way each step is exactly one day.
  let d = new Date(2026, 2, 6);
  const keys = [];
  for (let i = 0; i < 4; i++) {
    keys.push(toDayKey(d));
    d = addDays(d, 1);
  }
  assert.deepEqual(keys, ['2026-03-06', '2026-03-07', '2026-03-08', '2026-03-09']);
  assert.equal(toDayKey(addDays(new Date(2026, 9, 31), 1)), '2026-11-01');
});

test('weekDays gives Mon..Sun', () => {
  const days = weekDays(new Date(2026, 8, 21)).map(toDayKey);
  assert.equal(days.length, 7);
  assert.equal(days[0], '2026-09-21');
  assert.equal(days[6], '2026-09-27');
});

test('formatWeekRange', () => {
  assert.equal(formatWeekRange(new Date(2026, 8, 21)), 'Sep 21 – 27');
  assert.equal(formatWeekRange(new Date(2026, 8, 28)), 'Sep 28 – Oct 4');
});
