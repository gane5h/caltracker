import { fitnessTab } from './data.js';
import { addDays, formatWeekRange, fromDayKey, startOfWeek, toDayKey, weekDays, WEEKDAY_LETTERS } from './dates.js';
import { claimCelebration, isChecked, toggle } from './store.js';
import { currentStreak, milestoneCrossed } from './streaks.js';

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
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const allItems = fitnessTab.sections.flatMap((s) => s.items);

const weekStart = () => addDays(startOfWeek(fromDayKey(state.todayKey)), state.weekOffset * 7);
const itemDone = (item) => (day) => isChecked(item.id, day);
const sectionDone = (section) => (day) => section.items.every((it) => isChecked(it.id, day));
const tabDone = (day) => allItems.some((it) => isChecked(it.id, day));
const chain = () => currentStreak(tabDone, state.todayKey);

/** Restarts a one-shot CSS animation class. */
function replay(node, className) {
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
}

/** A small "🔥 n" chip; dimmed while today isn't done yet, hidden at 0. */
function makeStreakChip(className) {
  const chip = el('span', { className: `streak ${className}` }, el('span', { className: 'emoji', ariaHidden: 'true' }, '🔥'), el('span'));
  let shown = -1;
  chip.update = ({ length, todayDone }, animate) => {
    chip.hidden = length === 0;
    chip.lastChild.textContent = String(length);
    chip.classList.toggle('pending', !todayDone);
    chip.title = `${length}-day streak${todayDone ? '' : ' · check in today to keep it'}`;
    if (animate && length > shown) replay(chip, 'bump');
    shown = length;
  };
  return chip;
}

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
    const sectionStreak = makeStreakChip('section-streak');
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
      sectionStreak,
      badge,
      el('span', { className: 'chevron game-text', ariaHidden: 'true' }, '▼'),
    );
    ribbon.setAttribute('aria-expanded', String(!collapsed));
    ribbon.addEventListener('click', () => {
      state.collapsed[collapsed ? 'delete' : 'add'](section.id);
      render();
    });
    grid.append(ribbon);

    const updateSection = (animate) => {
      const done = section.items.filter((it) => isChecked(it.id, state.todayKey)).length;
      badge.textContent = `${done}/${section.items.length}`;
      badge.classList.toggle('cleared', done === section.items.length);
      sectionStreak.update(currentStreak(sectionDone(section), state.todayKey), animate);
    };
    updateSection(false);

    const onToggle = (day, nowChecked) => {
      updateSection(true);
      if (nowChecked && sectionDone(section)(day)) sectionClear(ribbon);
    };

    if (collapsed) continue;
    for (const item of section.items) {
      const itemStreak = makeStreakChip('item-streak');
      itemStreak.update(currentStreak(itemDone(item), state.todayKey), false);
      grid.append(el('div', { className: 'item-name' }, el('span', {}, item.name), itemStreak));
      const onItemToggle = (day, nowChecked) => {
        itemStreak.update(currentStreak(itemDone(item), state.todayKey), true);
        onToggle(day, nowChecked);
      };
      for (const day of days) grid.append(makeCell(item, day, onItemToggle));
    }
  }

  board.replaceChildren(grid);
  updateWeekTotal(days, false);
  updateChain(false);
}

function makeCell(item, day, onToggle) {
  const cell = el('button', { className: 'cell' + (day === state.todayKey ? ' today' : '') }, starSvg('star-mark'));
  cell.setAttribute('role', 'checkbox');
  cell.setAttribute('aria-checked', String(isChecked(item.id, day)));
  cell.setAttribute('aria-label', `${item.name} on ${day}`);
  cell.disabled = day > state.todayKey; // future days are locked

  cell.addEventListener('click', () => {
    const before = chain();
    const nowChecked = toggle(item.id, day);
    cell.setAttribute('aria-checked', String(nowChecked));
    cell.classList.remove('pop', 'unpop');
    replay(cell, nowChecked ? 'pop' : 'unpop');
    if (nowChecked) burst(cell);
    navigator.vibrate?.(nowChecked ? 30 : 8);
    onToggle(day, nowChecked);
    updateWeekTotal(weekDays(weekStart()).map(toDayKey), true);
    const after = updateChain(true);
    const milestone = milestoneCrossed(before.length, after.length);
    if (milestone && claimCelebration(`${after.start}/${milestone}`)) {
      setTimeout(() => showTrophy(milestone), 450);
    }
  });
  return cell;
}

function burst(cell) {
  if (reduceMotion.matches) return;
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

const announcer = document.getElementById('announcer');
const announce = (text) => {
  announcer.textContent = '';
  setTimeout(() => (announcer.textContent = text), 50);
};

function sectionClear(ribbon) {
  replay(ribbon, 'shine');
  ribbon.querySelector('.stamp')?.remove();
  const stamp = el('span', { className: 'stamp', ariaHidden: 'true' }, 'SECTION CLEAR!');
  ribbon.append(stamp);
  setTimeout(() => stamp.remove(), 1500); // not animationend: reduced motion has no animation
  navigator.vibrate?.([30, 50, 30, 50, 60]);
  announce('Section clear!');
}

// ---- Milestone trophy card ----
const trophy = document.querySelector('.trophy');
const TROPHY_MESSAGES = {
  7: 'A whole week without a break. Keep it rolling!',
  30: 'A month straight. That’s a habit now.',
  100: 'Triple digits. Absolutely unstoppable.',
};

function showTrophy(days) {
  if (trophy.open) return;
  trophy.querySelector('.trophy-days').textContent = String(days);
  trophy.querySelector('.trophy-msg').textContent = TROPHY_MESSAGES[days];
  trophy.showModal();
  navigator.vibrate?.([40, 60, 40, 60, 140]);
  if (reduceMotion.matches) return;
  const card = trophy.querySelector('.trophy-card');
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2;
    const p = el('span', { className: 'particle confetti' });
    p.style.setProperty('--dx', `${Math.cos(angle) * 520}%`);
    p.style.setProperty('--dy', `${Math.sin(angle) * 520}%`);
    const star = starSvg('');
    star.style.fill = ['var(--yellow)', 'var(--pink)', 'var(--cyan)', 'var(--lime)'][i % 4];
    p.append(star);
    p.addEventListener('animationend', () => p.remove());
    card.append(p);
  }
}

trophy.querySelector('.trophy-close').addEventListener('click', () => trophy.close());
trophy.addEventListener('click', (e) => e.target === trophy && trophy.close()); // tap outside the card
trophy.addEventListener('close', () => trophy.querySelectorAll('.confetti').forEach((p) => p.remove()));

function updateChain(animate) {
  const current = chain();
  const counter = screen.querySelector('.flame-counter');
  const label = counter.querySelector('.chain-length');
  const grew = current.length > Number(label.textContent);
  label.textContent = String(current.length);
  counter.classList.toggle('cold', !current.todayDone);
  counter.setAttribute(
    'aria-label',
    `${current.length}-day chain` + (current.todayDone || current.length === 0 ? '' : ', check in today to keep it'),
  );
  if (animate && grew) replay(counter, 'bump');
  return current;
}

function updateWeekTotal(days, animate) {
  const total = allItems.reduce((n, it) => n + days.filter((d) => isChecked(it.id, d)).length, 0);
  const counter = screen.querySelector('.week-counter');
  counter.querySelector('.week-total').textContent = String(total);
  counter.setAttribute('aria-label', `${total} check-ins this week`);
  if (animate) replay(counter, 'bump');
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
