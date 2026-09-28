// Exercise figures: chunky SVG characters built from simple limbs, animated with
// CSS keyframes generated from the poses in exercises.js. Everything here returns
// strings, so it works in Node too (tests, previews).
//
// Every segment is drawn from its joint pointing "down" in local space, then rotated
// so it points the way the pose says. A child segment rotates relative to its parent.
// Standing figures keep their feet planted: each keyframe moves the hips so the
// ankle stays in the same spot.
import { EXERCISES } from './exercises.js';

const INK = '#12082B';
const OUTLINE = 2.2; // outline thickness on each side of a shape
const COLORS = {
  skin: '#FFC48A', skinFar: '#D08A55',
  shirt: '#FF3D7F',
  shorts: '#2FD8FF', shortsFar: '#1C98BD',
  shoe: '#FFFFFF', shoeFar: '#B3ACD6',
  steel: '#C9CDE6', steelFar: '#8A8EB5',
  bench: '#4A2FBD',
};

// Segment lengths for side views (front views use FRONT).
const SIDE = { torso: 27, ua: 15, fa: 14, th: 21, sh: 21, foot: 7, head: 7 };
const FRONT = { torso: 26, ua: 14, fa: 13, leg: 36 };
const PLANT = [46, 90]; // where a standing figure's ankle stays
const ROOTS = { lying: [60, 68], front: [50, 58], 'front-lying': [50, 64] };
const STAND = { torso: 180, ua: 0, fa: 0, th: 0, sh: 0 };

export const DURATION = 2.6; // seconds per rep
// [time 0–1, pose index]: hold, move, hold, return, hold.
const TIMELINE = [[0, 0], [0.1, 0], [0.45, 1], [0.6, 1], [0.95, 0], [1, 0]];
const STEPS = 8; // samples per move, so eased motion and planted feet stay in sync

const rad = (d) => (d * Math.PI) / 180;
const vec = (dir, len) => [len * Math.sin(rad(dir)), len * Math.cos(rad(dir))];
const num = (n) => String(Math.round(n * 100) / 100);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const isSide = (ex) => ex.view === 'side' || ex.view === 'lying';

/** Joint rotations (SVG degrees, relative to the parent) and hip position for a pose. */
export function rig(ex, pose) {
  const tilt = ex.dbTilt ?? 0;
  if (!isSide(ex)) {
    return { ua: -pose.ua, fa: -(pose.fa - pose.ua), db: pose.fa - tilt, root: ROOTS[ex.view] };
  }
  const p = { ...STAND, ...pose };
  let root = ROOTS.lying;
  if (ex.view === 'side') {
    const [kx, ky] = vec(p.th, SIDE.th);
    const [ax, ay] = vec(p.sh, SIDE.sh);
    root = [PLANT[0] - kx - ax, PLANT[1] - ky - ay];
  }
  return {
    torso: -p.torso,
    ua: -(p.ua - p.torso),
    fa: -(p.fa - p.ua),
    db: -(tilt - p.fa),
    th: -p.th,
    sh: -(p.sh - p.th),
    ft: -(90 - p.sh),
    root,
  };
}

const lerpPose = (a, b, t) => Object.fromEntries(Object.keys(a).map((k) => [k, a[k] + (b[k] - a[k]) * t]));

/** Rig states along one rep: [[time 0–1, rig], …]. */
export function frames(ex) {
  const poses = isSide(ex) ? ex.poses.map((p) => ({ ...STAND, ...p })) : ex.poses;
  const out = [];
  TIMELINE.forEach(([t0, i0], n) => {
    out.push([t0, rig(ex, poses[i0])]);
    const next = TIMELINE[n + 1];
    if (!next || next[1] === i0) return;
    for (let k = 1; k < STEPS; k++) {
      const u = k / STEPS;
      out.push([t0 + (next[0] - t0) * u, rig(ex, lerpPose(poses[i0], poses[next[1]], ease(u)))]);
    }
  });
  return out;
}

const transformFor = (joint, value) =>
  joint === 'root' ? `translate(${num(value[0])}px, ${num(value[1])}px)` : `rotate(${num(value)}deg)`;

/** CSS keyframes that animate every figure. Only joints that move get an animation. */
export function figureCss(exercises = EXERCISES) {
  let css = `.fig .j { animation: ${DURATION}s linear infinite; }\n`;
  for (const [id, ex] of Object.entries(exercises)) {
    const fs = frames(ex);
    for (const joint of Object.keys(fs[0][1])) {
      const values = fs.map(([, r]) => transformFor(joint, r[joint]));
      if (values.every((v) => v === values[0])) continue;
      const name = `fig-${id}-${joint}`;
      const steps = fs.map(([t], i) => `${num(t * 100)}%{transform:${values[i]}}`).join('');
      css += `@keyframes ${name}{${steps}}\n.fig-${id} .j-${joint}{animation-name:${name}}\n`;
    }
  }
  return css;
}

// ---- Drawing ----
// Figures are painted in layers so the outline wraps the whole body as one shape:
// 'back' (bench, shadow), then the far limbs (outline, fill), then the body (outline, fill).
const LAYERS = ['back', 'farOutline', 'farFill', 'outline', 'fill'];

/**
 * One shape in the current layer, or '' if it belongs to another layer.
 * `detail` markup draws only in the fill pass; `back` markup only in the back pass.
 */
function paint(layer, s) {
  if (s.back) return layer === 'back' ? s.back : '';
  if (layer === 'back' || Boolean(s.far) !== layer.startsWith('far')) return '';
  const outline = layer.endsWith('utline');
  if (s.detail) return outline ? '' : s.detail;
  const fill = outline ? INK : s.color;
  if (s.t === 'seg') {
    const [x1, y1, x2, y2] = s.pts ?? [0, 0, 0, s.len];
    const w = outline ? s.w + 2 * OUTLINE : s.w;
    return `<line x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" stroke="${fill}" stroke-width="${num(w)}" stroke-linecap="${s.cap ?? 'round'}"/>`;
  }
  if (s.t === 'circle') {
    return `<circle cx="${num(s.cx)}" cy="${num(s.cy)}" r="${num(outline ? s.r + OUTLINE : s.r)}" fill="${fill}"/>`;
  }
  const stroke = outline ? ` stroke="${INK}" stroke-width="${2 * OUTLINE}" stroke-linejoin="round"` : '';
  return `<path d="${s.d}" fill="${fill}"${stroke}/>`;
}

/** A joint: an unanimated offset, then a rotation that the CSS animation overrides. */
const joint = (name, x, y, rest, inner) => {
  const g = `<g class="j j-${name}" transform="rotate(${num(rest[name])})">${inner}</g>`;
  return x || y ? `<g transform="translate(${num(x)} ${num(y)})">${g}</g>` : g;
};

function dumbbell(ex, far, len, rest) {
  const steel = far ? COLORS.steelFar : COLORS.steel;
  if (ex.db === 'end') {
    return `<circle cx="0" cy="${len}" r="5.5" fill="${steel}" stroke="${INK}" stroke-width="2"/><circle cx="0" cy="${len}" r="1.8" fill="${INK}"/>`;
  }
  const bar =
    `<line x1="-6" y1="0" x2="6" y2="0" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>` +
    [-6.5, 6.5].map((x) => `<rect x="${x - 2.3}" y="-5.5" width="4.6" height="11" rx="1.6" fill="${steel}" stroke="${INK}" stroke-width="2"/>`).join('');
  return joint('db', 0, len, rest, bar);
}

const shadow = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="2.6" fill="${INK}" opacity=".35"/>`;

function sideFigure(ex, rest, layer) {
  const L = SIDE;
  const P = (s) => paint(layer, s);
  const [rx, ry] = rest.root;

  const arm = (far) =>
    joint('ua', far ? 2.5 : 0, L.torso, rest,
      P({ t: 'seg', len: L.ua, w: 8, color: far ? COLORS.skinFar : COLORS.skin, far }) +
      joint('fa', 0, L.ua, rest,
        P({ t: 'seg', len: L.fa, w: 7, color: far ? COLORS.skinFar : COLORS.skin, far }) +
        P({ detail: dumbbell(ex, far, L.fa, rest), far })));

  const leg = (far) =>
    joint('th', far ? 3 : 0, 0, rest,
      P({ t: 'seg', len: L.th, w: 10, color: far ? COLORS.skinFar : COLORS.skin, far }) +
      P({ t: 'seg', len: 9, w: 12, cap: 'square', color: far ? COLORS.shortsFar : COLORS.shorts, far }) +
      joint('sh', 0, L.th, rest,
        P({ t: 'seg', len: L.sh, w: 8, color: far ? COLORS.skinFar : COLORS.skin, far }) +
        joint('ft', 0, L.sh, rest, P({ t: 'seg', len: L.foot, w: 6.5, color: far ? COLORS.shoeFar : COLORS.shoe, far }))));

  const headY = L.torso + 10;
  const body =
    P({ t: 'seg', len: L.torso, w: 14, color: COLORS.shirt }) +
    P({ t: 'circle', cx: 0, cy: headY, r: L.head, color: COLORS.skin }) +
    P({
      detail:
        `<line x1="-6.3" y1="${headY + 3}" x2="6.3" y2="${headY + 3}" stroke="${COLORS.shirt}" stroke-width="2.8"/>` +
        `<circle cx="-3.6" cy="${headY + 0.5}" r="1.4" fill="${INK}"/>`,
    });

  let bench = '';
  if (ex.view === 'lying') {
    bench =
      `<rect x="16" y="77" width="4" height="17" fill="${INK}"/><rect x="62" y="77" width="4" height="17" fill="${INK}"/>` +
      `<rect x="11" y="75.5" width="60" height="6" rx="2.5" fill="${COLORS.bench}" stroke="${INK}" stroke-width="2.2"/>`;
  }

  return (
    P({ back: shadow(ex.view === 'lying' ? 50 : 52, 95, ex.view === 'lying' ? 40 : 20) + bench }) +
    `<g class="j j-root" transform="translate(${num(rx)} ${num(ry)})">` +
    joint('torso', 0, 0, rest, body) +
    leg(true) + leg(false) +
    joint('torso', 0, 0, rest, arm(true) + arm(false)) +
    `</g>`
  );
}

function frontFigure(ex, rest, layer) {
  const F = FRONT;
  const P = (s) => paint(layer, s);
  const [rx, ry] = rest.root;
  const lying = ex.view === 'front-lying';
  const shoulderY = lying ? -3 : -F.torso + 3;
  const headY = lying ? -12 : -F.torso - 10;

  const arm = (side) =>
    `<g transform="translate(${side * (lying ? 11 : 10.5)} ${shoulderY}) scale(${side} 1)">` +
    joint('ua', 0, 0, rest,
      P({ t: 'seg', len: F.ua, w: 8, color: COLORS.skin }) +
      joint('fa', 0, F.ua, rest, P({ t: 'seg', len: F.fa, w: 7, color: COLORS.skin }) + P({ detail: dumbbell(ex, false, F.fa, rest) }))) +
    `</g>`;

  const face =
    `<line x1="-6.3" y1="${headY - 3}" x2="6.3" y2="${headY - 3}" stroke="${COLORS.shirt}" stroke-width="2.8"/>` +
    `<circle cx="-2.7" cy="${headY + 0.5}" r="1.3" fill="${INK}"/><circle cx="2.7" cy="${headY + 0.5}" r="1.3" fill="${INK}"/>`;

  let lower;
  let back;
  if (lying) {
    // Seen from the feet: shins drop to the floor either side of the bench.
    back =
      shadow(50, 95, 26) +
      `<g transform="translate(${rx} ${ry})"><rect x="-3" y="10" width="6" height="18" fill="${INK}"/>` +
      `<rect x="-11" y="26" width="22" height="4.5" rx="2" fill="${INK}"/>` +
      `<rect x="-17" y="5" width="34" height="6.5" rx="2.5" fill="${COLORS.bench}" stroke="${INK}" stroke-width="2.2"/></g>`;
    lower = [-1, 1]
      .map((s) =>
        P({ t: 'seg', pts: [s * 9, 7, s * 15, 25], w: 8, color: COLORS.skin }) +
        P({ t: 'seg', pts: [s * 15, 27.5, s * 17, 27.5], w: 6.5, color: COLORS.shoe }))
      .join('');
  } else {
    back = shadow(50, 96, 20);
    lower =
      [-1, 1]
        .map((s) =>
          P({ t: 'seg', pts: [s * 5, 2, s * 6, F.leg - 2], w: 9, color: COLORS.skin }) +
          P({ t: 'seg', pts: [s * 6, F.leg, s * 9, F.leg], w: 6.5, color: COLORS.shoe }))
        .join('') + P({ t: 'path', d: 'M-9.5,-3 L9.5,-3 L10.5,11 L1.5,11 L0,5 L-1.5,11 L-10.5,11 Z', color: COLORS.shorts });
  }

  const torso = lying
    ? 'M-13,-6 Q0,-9 13,-6 L13,5 Q0,7 -13,5 Z'
    : `M-8.5,0 L8.5,0 L11.5,${-F.torso + 1} Q0,${-F.torso - 2} -11.5,${-F.torso + 1} Z`;

  return (
    P({ back }) +
    `<g transform="translate(${rx} ${ry})">` +
    P({ t: 'circle', cx: 0, cy: headY, r: 7, color: COLORS.skin }) +
    P({ detail: face }) +
    lower +
    P({ t: 'path', d: torso, color: COLORS.shirt }) +
    arm(1) + arm(-1) +
    `</g>`
  );
}

/** The figure for an exercise as an SVG string, resting in its working pose; '' if unknown. */
export function figureSvg(exerciseId, className = '') {
  const ex = EXERCISES[exerciseId];
  if (!ex) return '';
  const rest = rig(ex, isSide(ex) ? { ...STAND, ...ex.poses[1] } : ex.poses[1]);
  const draw = isSide(ex) ? sideFigure : frontFigure;
  const body = LAYERS.map((layer) => draw(ex, rest, layer)).join('');
  return `<svg class="fig fig-${exerciseId} ${className}" viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;
}

// ---- Muscle map ----
// Front and back silhouettes side by side; worked muscles light up.
const SILHOUETTE = [
  { t: 'circle', cx: 30, cy: 10, r: 7 },
  { t: 'path', d: 'M16,20 Q30,15 44,20 L41.5,47 L43,60 L17,60 L18.5,47 Z' },
  ...[-1, 1].flatMap((s) => [
    { t: 'seg', pts: [30 + s * 14, 21, 30 + s * 18, 40], w: 8 },
    { t: 'seg', pts: [30 + s * 18, 40, 30 + s * 20, 57], w: 7 },
    { t: 'seg', pts: [30 + s * 6.5, 58, 30 + s * 7, 82], w: 10.5 },
    { t: 'seg', pts: [30 + s * 7, 82, 30 + s * 7, 104], w: 8 },
  ]),
];

const pair = (id, cx, cy, rx, ry, rot = 0) =>
  [-1, 1].map((s) => ({ id, el: `<ellipse cx="${30 + s * cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${-s * rot} ${30 + s * cx} ${cy})"/>` }));

const MUSCLES = {
  front: [
    ...pair('delts', 14.5, 22, 4.3, 4.5),
    ...pair('chest', 6.6, 27.5, 6.2, 4.6),
    ...pair('biceps', 16.1, 31, 2.8, 5.8, 12),
    ...pair('forearms', 19.1, 49, 2.5, 6, 6),
    { id: 'abs', el: '<rect x="26" y="33.5" width="8" height="14" rx="3"/>' },
    ...pair('quads', 6.8, 70, 4.4, 10, 2),
  ],
  back: [
    { id: 'traps', el: '<path d="M30,15.5 L40,21 L30,31 L20,21 Z"/>' },
    ...pair('delts', 14.5, 22, 4.3, 4.5),
    ...pair('triceps', 16.1, 31, 2.8, 5.8, 12),
    ...pair('lats', 8.6, 35, 4.8, 8.5, -10),
    ...pair('forearms', 19.1, 49, 2.5, 6, 6),
    { id: 'lowerBack', el: '<rect x="26.5" y="39" width="7" height="9" rx="2.5"/>' },
    ...pair('glutes', 5.8, 56, 5.6, 5),
    ...pair('hamstrings', 6.8, 72, 3.9, 8.5),
    ...pair('calves', 7, 91, 3.3, 6),
  ],
};

/** Front and back muscle map; `muscles` is { primary: [ids], secondary: [ids] }. */
export function muscleMapSvg(muscles) {
  const primary = new Set(muscles.primary);
  const secondary = new Set(muscles.secondary);
  const silhouette = ['outline', 'fill'].map((layer) => SILHOUETTE.map((s) => paint(layer, { ...s, color: 'var(--body-fill, #241654)' })).join('')).join('');
  const view = (side, dx) => {
    const shapes = MUSCLES[side]
      .map(({ id, el }) => {
        const role = primary.has(id) ? 'primary' : secondary.has(id) ? 'secondary' : 'idle';
        return el.replace(/^<(\w+)/, `<$1 class="m m-${role}"`);
      })
      .join('');
    return `<g transform="translate(${dx} 0)">${silhouette}${shapes}</g>`;
  };
  return `<svg class="muscle-map" viewBox="-2 -2 128 112" role="img">${view('front', 0)}${view('back', 64)}</svg>`;
}
