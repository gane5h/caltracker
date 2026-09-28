import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EXERCISES } from '../js/exercises.js';
import { figureCss, figureSvg, frames, muscleMapSvg, rig } from '../js/figures.js';

const ankle = (r) => {
  // Forward kinematics back from the rig: hip + thigh + shin.
  const toWorld = (rot) => -rot;
  const th = toWorld(r.th);
  const sh = th + toWorld(r.sh);
  const v = (dir, len) => [len * Math.sin((dir * Math.PI) / 180), len * Math.cos((dir * Math.PI) / 180)];
  const [kx, ky] = v(th, 21);
  const [ax, ay] = v(sh, 21);
  return [r.root[0] + kx + ax, r.root[1] + ky + ay];
};

test('standing figures keep their feet planted through the whole rep', () => {
  for (const [id, ex] of Object.entries(EXERCISES)) {
    if (ex.view !== 'side') continue;
    for (const [, r] of frames(ex)) {
      const [x, y] = ankle(r);
      assert.ok(Math.abs(x - 46) < 1e-6 && Math.abs(y - 90) < 1e-6, `${id} foot moved to ${x},${y}`);
    }
  }
});

test('a rep starts and ends in the same pose so the loop is seamless', () => {
  for (const ex of Object.values(EXERCISES)) {
    const fs = frames(ex);
    assert.equal(fs[0][0], 0);
    assert.equal(fs.at(-1)[0], 1);
    assert.deepEqual(fs[0][1], fs.at(-1)[1]);
  }
});

test('child rotations are relative to the parent', () => {
  const r = rig(EXERCISES['bicep-curl'], { torso: 180, ua: 10, fa: 150, th: 0, sh: 0 });
  assert.equal(r.ua, -(10 - 180));
  assert.equal(r.fa, -(150 - 10));
});

test('every exercise draws a figure and gets keyframes for its moving joints', () => {
  const css = figureCss();
  for (const id of Object.keys(EXERCISES)) {
    assert.match(figureSvg(id), new RegExp(`class="fig fig-${id}`));
    assert.match(css, new RegExp(`@keyframes fig-${id}-\\w+\\{`));
  }
  assert.doesNotMatch(css, /NaN/);
  assert.equal(figureSvg('nope'), '');
});

test('muscle map marks primary and secondary muscles', () => {
  const svg = muscleMapSvg({ primary: ['chest'], secondary: ['triceps'] });
  assert.equal((svg.match(/m-primary/g) ?? []).length, 2);
  assert.equal((svg.match(/m-secondary/g) ?? []).length, 2);
  for (const ex of Object.values(EXERCISES)) {
    for (const id of [...ex.muscles.primary, ...ex.muscles.secondary]) {
      assert.match(muscleMapSvg({ primary: [id], secondary: [] }), /m-primary/, id);
    }
  }
});
