import assert from 'node:assert/strict';
import { test } from 'node:test';

import { backupFileName, describeBackup, makeBackup, parseBackup } from '../js/backup.js';
import { fitnessTab } from '../js/data.js';

const data = { tabs: { fitness: fitnessTab }, checkIns: { squat: { '2026-09-27': true } }, celebrated: ['2026-09-21/7'] };

test('a backup round-trips', () => {
  const text = JSON.stringify(makeBackup(data, new Date(2026, 8, 27)));
  assert.deepEqual(parseBackup(text), data);
});

test('file names carry the local date', () => {
  assert.equal(backupFileName(new Date(2026, 0, 5)), 'chain-backup-2026-01-05.json');
});

test('junk check-ins are dropped', () => {
  const text = JSON.stringify(makeBackup({ ...data, checkIns: { a: { '2026-09-27': true, nope: true, '2026-09-26': 1 }, b: 'x' } }));
  assert.deepEqual(parseBackup(text).checkIns, { a: { '2026-09-27': true } });
});

test('bad files are rejected with a readable reason', () => {
  assert.throws(() => parseBackup('{oops'), /valid JSON/);
  assert.throws(() => parseBackup('{"hello":1}'), /isn’t a Chain backup/);
  assert.throws(() => parseBackup(JSON.stringify({ ...makeBackup(data), version: 9 })), /newer version/);
  const broken = makeBackup({ ...data, tabs: { fitness: { sections: [{ id: 's', name: 'S', items: [{ id: '' }] }] } } });
  assert.throws(() => parseBackup(JSON.stringify(broken)), /incomplete/);
});

test('describeBackup counts items and check-ins', () => {
  assert.equal(describeBackup(data), '11 items and 1 check-in');
});
