import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dietTab, fitnessTab } from '../js/data.js';
import * as layout from '../js/layout.js';

const tab = () => ({
  id: 't',
  sections: [
    { id: 'a', name: 'A', subtitle: '', emoji: '⭐', items: [{ id: 'x', name: 'X' }, { id: 'y', name: 'Y' }, { id: 'z', name: 'Z' }] },
    { id: 'b', name: 'B', subtitle: '', emoji: '⭐', items: [] },
  ],
});
const ids = (list) => list.map((it) => it.id);

test('newId slugs the name and avoids taken ids', () => {
  assert.equal(layout.newId('Push-ups!', new Set()), 'push-ups');
  assert.equal(layout.newId('Push ups', new Set(['push-ups', 'push-ups-2'])), 'push-ups-3');
  assert.equal(layout.newId('🔥🔥', new Set()), 'item');
});

test('edits never change the input tab', () => {
  const before = tab();
  const copy = structuredClone(before);
  layout.moveItem(before, 'x', 1);
  layout.addItem(before, 'a', { name: 'New' });
  layout.setArchived(before, 'item', 'x', true);
  assert.deepEqual(before, copy);
});

test('moving items swaps neighbours and stops at the ends', () => {
  assert.deepEqual(ids(layout.moveItem(tab(), 'x', 1).sections[0].items), ['y', 'x', 'z']);
  assert.deepEqual(ids(layout.moveItem(tab(), 'x', -1).sections[0].items), ['x', 'y', 'z']);
  assert.deepEqual(ids(layout.moveSection(tab(), 'b', -1).sections), ['b', 'a']);
});

test('moving skips over archived items', () => {
  const t = layout.setArchived(tab(), 'item', 'y', true);
  assert.deepEqual(ids(layout.moveItem(t, 'x', 1).sections[0].items), ['z', 'y', 'x']);
});

test('adding an item gives it a fresh id and optional animation', () => {
  let t = layout.addItem(tab(), 'b', { name: 'X' });
  t = layout.addItem(t, 'b', { name: 'Squat', exercise: 'squat' });
  assert.deepEqual(t.sections[1].items, [{ id: 'x-2', name: 'X' }, { id: 'squat', name: 'Squat', exercise: 'squat' }]);
});

test('updating an item can rename, clear its animation and move it to another section', () => {
  let t = layout.updateItem(tab(), 'x', { name: 'Ex', exercise: 'squat' });
  t = layout.updateItem(t, 'x', { exercise: '', sectionId: 'b' });
  assert.deepEqual(ids(t.sections[0].items), ['y', 'z']);
  assert.deepEqual(t.sections[1].items, [{ id: 'x', name: 'Ex' }]);
});

test('archiving hides but keeps things, and restoring brings them back', () => {
  const t = layout.setArchived(tab(), 'section', 'a', true);
  assert.deepEqual(ids(layout.activeSections(t)), ['b']);
  assert.equal(layout.everyItem(t).length, 3);
  assert.deepEqual(layout.setArchived(t, 'section', 'a', false), tab());
});

test('every seed animation is a known exercise', async () => {
  const { EXERCISES } = await import('../js/exercises.js');
  for (const item of layout.everyItem(fitnessTab).filter((it) => it.exercise)) assert.ok(EXERCISES[item.exercise], item.id);
});

test('seed item ids are unique across tabs', () => {
  const all = [fitnessTab, dietTab].flatMap(layout.everyItem).map((it) => it.id);
  assert.equal(new Set(all).size, all.length);
});

test('addItem avoids ids reserved by other tabs', () => {
  const t = layout.addItem(tab(), 'b', { name: 'Squat' }, ['squat']);
  assert.equal(t.sections[1].items[0].id, 'squat-2');
});
