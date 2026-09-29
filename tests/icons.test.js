import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dietTab } from '../js/data.js';
import { iconForName, ICONS, iconSvg } from '../js/icons.js';
import { everyItem } from '../js/layout.js';

test('every seed icon is a known icon', () => {
  for (const item of everyItem(dietTab).filter((it) => it.icon)) assert.ok(ICONS[item.icon], item.id);
});

test('iconSvg draws known icons and nothing for unknown ones', () => {
  assert.match(iconSvg('pill'), /^<svg class="ic ic-pill"/);
  assert.equal(iconSvg('nope'), '');
});

test('each water glass gets its own clip path id', () => {
  const ids = [iconSvg('water'), iconSvg('water')].map((svg) => svg.match(/clipPath id="([^"]+)"/)[1]);
  assert.notEqual(ids[0], ids[1]);
});

test('iconForName guesses from the habit name', () => {
  assert.equal(iconForName('Vitamin D'), 'pill');
  assert.equal(iconForName('Drink 2L'), 'water');
  assert.equal(iconForName('Veggies'), undefined);
});
