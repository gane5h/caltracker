import { fitnessTab } from './data.js';
import { addDays, formatWeekRange, fromDayKey, startOfWeek, toDayKey, weekDays, WEEKDAY_LETTERS } from './dates.js';
import { isChecked, toggle } from './store.js';

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const starSvg = (className) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#star');
  svg.append(use);
  return svg;
};

// ---- Fitness screen state ----
const screen = document.getElementById('screen-fitness');
const board = screen.querySelector('.board');
const state = { todayKey: toDayKey(new Date()), weekOffset: 0, collapsed: new Set() };

const weekStart = () => addDays(startOfWeek(fromDayKey(state.todayKey)), state.weekOffset * 7);

function render() {
  const days = weekDays(weekStart()).map(toDayKey);
  const showsToday = days.includes(state.todayKey);
  const isCurrent = state.weekOffset === 0;

  screen.querySelector('.caption').textContent = isCurrent ? 'THIS WEEK' : 'WEEK OF';
  screen.querySelector('.range').textContent = formatWeekRange(weekStart());
  screen.querySelector('.to-today').hidden = isCurrent;
  screen.querySelector('.next-week').disabled = isCurrent;

  const grid = el('div', { className: 'grid' });
  grid.append(el('div'));
  days.forEach((day, i) => {
    const head = el(
      'div',
      { className: 'day-head' + (day === state.todayKey ? ' today' : '') },
      el('span', { className: 'day-letter' }, WEEKDAY_LETTERS[i]),
      el('span', { className: 'day-num' }, String(fromDayKey(day).getDate())),
    );
    grid.append(head);
  });

  for (const section of fitnessTab.sections) {
    const collapsed = state.collapsed.has(section.id);
    const badge = el('span', { className: 'badge' });
    badge.hidden = !showsToday;
    const ribbon = el(
      'button',
      { className: 'ribbon' },
      el('span', { className: 'emoji' }, section.emoji),
      el(
        'span',
        { className: 'ribbon-text' },
        el('span', { className: 'ribbon-name' }, section.name.toUpperCase()),
        el('span', { className: 'ribbon-sub' }, section.subtitle),
      ),
      badge,
      el('span', { className: 'chevron game-text', ariaHidden: 'true' }, '▼'),
    );
    ribbon.setAttribute('aria-expanded', String(!collapsed));
    ribbon.addEventListener('click', () => {
      state.collapsed[collapsed ? 'delete' : 'add'](section.id);
      render();
    });
    grid.append(ribbon);

    const updateBadge = () => {
      const done = section.items.filter((it) => isChecked(it.id, state.todayKey)).length;
      badge.textContent = `${done}/${section.items.length}`;
      badge.classList.toggle('cleared', done === section.items.length);
    };
    updateBadge();

    if (collapsed) continue;
    for (const item of section.items) {
      grid.append(el('div', { className: 'item-name' }, item.name));
      for (const day of days) grid.append(makeCell(item, day, updateBadge));
    }
  }

  board.replaceChildren(grid);
  updateWeekTotal(days, false);
}

function makeCell(item, day, onChange) {
  const cell = el('button', { className: 'cell' + (day === state.todayKey ? ' today' : '') }, starSvg('star-mark'));
  cell.setAttribute('role', 'checkbox');
  cell.setAttribute('aria-checked', String(isChecked(item.id, day)));
  cell.setAttribute('aria-label', `${item.name} on ${day}`);
  cell.disabled = day > state.todayKey; // future days are locked

  cell.addEventListener('click', () => {
    const nowChecked = toggle(item.id, day);
    cell.setAttribute('aria-checked', String(nowChecked));
    cell.classList.remove('pop');
    void cell.offsetWidth; // restart the animation
    cell.classList.add('pop');
    if (nowChecked) burst(cell);
    navigator.vibrate?.(nowChecked ? 25 : 8);
    onChange();
    updateWeekTotal(weekDays(weekStart()).map(toDayKey), true);
  });
  return cell;
}

function burst(cell) {
  const count = 6;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const p = el('span', { className: 'particle' });
    p.style.setProperty('--dx', `${Math.cos(angle) * 250}%`);
    p.style.setProperty('--dy', `${Math.sin(angle) * 250}%`);
    const star = starSvg('');
    star.style.fill = i % 2 ? '#fff' : 'var(--accent)';
    p.append(star);
    p.addEventListener('animationend', () => p.remove());
    cell.append(p);
  }
}

function updateWeekTotal(days, animate) {
  const total = fitnessTab.sections
    .flatMap((s) => s.items)
    .reduce((n, it) => n + days.filter((d) => isChecked(it.id, d)).length, 0);
  const counter = screen.querySelector('.counter');
  counter.querySelector('.week-total').textContent = String(total);
  counter.setAttribute('aria-label', `${total} check-ins this week`);
  if (animate) {
    counter.classList.remove('bump');
    void counter.offsetWidth;
    counter.classList.add('bump');
  }
}

function changeWeek(delta) {
  const next = Math.min(0, state.weekOffset + delta);
  if (next === state.weekOffset) return;
  state.weekOffset = next;
  render();
}

screen.querySelector('.prev-week').addEventListener('click', () => changeWeek(-1));
screen.querySelector('.next-week').addEventListener('click', () => changeWeek(1));
screen.querySelector('.to-today').addEventListener('click', () => changeWeek(-state.weekOffset));

// Horizontal swipe on the board changes week.
let touchStart = null;
board.addEventListener('touchstart', (e) => (touchStart = e.touches[0]), { passive: true });
board.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.clientX;
  const dy = e.changedTouches[0].clientY - touchStart.clientY;
  touchStart = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) changeWeek(dx > 0 ? -1 : 1);
});

// The day may roll over while the app sits in the background.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const today = toDayKey(new Date());
  if (today !== state.todayKey) {
    state.todayKey = today;
    render();
  }
});

// ---- Tabs (hash-based so the Android back button works) ----
const TABS = ['fitness', 'diet', 'money'];

function showTab() {
  const current = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'fitness';
  document.querySelectorAll('.screen').forEach((s) => (s.hidden = s.dataset.tab !== current));
  document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === current)));
  window.scrollTo(0, 0);
}

document.querySelectorAll('.tab').forEach((t) =>
  t.addEventListener('click', () => {
    if (location.hash.slice(1) !== t.dataset.tab) location.hash = t.dataset.tab;
  }),
);
window.addEventListener('hashchange', showTab);

showTab();
render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service worker not registered', err));
}
