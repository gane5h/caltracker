// Looping SVG icons for habit rows (Diet), drawn in the same chunky style as
// the exercise figures. The keyframes live in css/app.css under "Habit icons".
// `cell` names the check-in effect the icon's rows get (see makeCell in app.js).

const INK = '#12082B';
let uid = 0;

/** A glass that fills with a sloshing wave, splashes, then gets a sip taken. */
function water() {
  const clip = `glass-${++uid}`;
  const glass = '24,14 76,14 69,90 31,90';
  return `
    <defs><clipPath id="${clip}"><polygon points="${glass}" /></clipPath></defs>
    <polygon points="${glass}" fill="rgba(255,255,255,.14)" />
    <g clip-path="url(#${clip})">
      <g class="ic-level">
        <rect x="0" y="40" width="100" height="60" fill="#2FD8FF" />
        <path class="ic-wave" fill="#8AF0FF"
          d="M-50,42 q12.5,-7 25,0 t25,0 t25,0 t25,0 t25,0 t25,0 V48 H-50 Z" />
      </g>
    </g>
    <polygon points="${glass}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round" />
    <path d="M32,24 L36,78" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55" />
    <circle class="ic-drop ic-drop-1" cx="40" cy="30" r="4" fill="#2FD8FF" stroke="${INK}" stroke-width="2" />
    <circle class="ic-drop ic-drop-2" cx="60" cy="30" r="3" fill="#2FD8FF" stroke="${INK}" stroke-width="2" />`;
}

/** A two-tone capsule that rocks and bounces with a squash on landing. */
function pill() {
  return `
    <ellipse class="ic-shadow" cx="50" cy="86" rx="24" ry="5" fill="${INK}" opacity=".35" />
    <g class="ic-pill">
      <g transform="rotate(-30 50 54)">
        <path d="M50,37 H33 a17,17 0 0 0 0,34 H50 Z" fill="#FF3D7F" />
        <path d="M50,37 H67 a17,17 0 0 1 0,34 H50 Z" fill="#fff" />
        <rect x="14" y="37" width="72" height="34" rx="17" fill="none" stroke="${INK}" stroke-width="6" />
        <path d="M50,37 V71" stroke="${INK}" stroke-width="5" />
        <path d="M28,46 H40" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7" />
      </g>
    </g>`;
}

export const ICONS = {
  water: { name: 'Water glass', draw: water, cell: 'water', match: /water|hydrat|drink/i },
  pill: { name: 'Pill', draw: pill, cell: 'pill', match: /med|pill|vitamin|tablet|supplement/i },
};

/** The icon's SVG markup, or '' for an unknown id. */
export function iconSvg(id) {
  const icon = ICONS[id];
  return icon ? `<svg class="ic ic-${id}" viewBox="0 0 100 100" aria-hidden="true">${icon.draw()}</svg>` : '';
}

/** The icon a new habit gets from its name, e.g. "Vitamins" → pill. */
export function iconForName(name) {
  return Object.keys(ICONS).find((id) => ICONS[id].match.test(name));
}
