import { backupFileName, describeBackup, makeBackup, parseBackup } from './backup.js';
import { dietTab, fitnessTab } from './data.js';
import { addDays, formatWeekRange, fromDayKey, startOfWeek, toDayKey, weekDays, WEEKDAY_LETTERS } from './dates.js';
import { EXERCISES, MUSCLE_NAMES } from './exercises.js';
import { figureCss, figureSvg, muscleMapSvg } from './figures.js';
import * as layout from './layout.js';
import { activeItems, activeSections, everyItem } from './layout.js';
import { checkedDays, claimCelebration, isChecked, loadTab, restore, saveTab, snapshot, toggle } from './store.js';
import { currentStreak, longestStreak, milestoneCrossed } from './streaks.js';

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

/** An element built from an HTML string we generated ourselves (figures, muscle maps). */
const html = (tag, className, markup) => {
  const node = el(tag, { className });
  node.innerHTML = markup;
  return node;
};

document.head.append(el('style', { textContent: figureCss() }));

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

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

// ---- Sheets and forms ----
const itemSheet = document.getElementById('exercise-sheet');
const formSheet = document.getElementById('form-sheet');

// Every sheet closes from its ✕ button or a tap on the backdrop; Android's back button closes it too.
document.querySelectorAll('dialog.sheet').forEach((sheet) => {
  sheet.querySelector('.sheet-close').addEventListener('click', () => sheet.close());
  sheet.addEventListener('click', (e) => e.target === sheet && sheet.close());
});

/**
 * Shows a small form in a bottom sheet. `fields` are text inputs or selects;
 * `onSubmit(values)` runs on the primary button. `extra` adds buttons such as Archive.
 */
function openForm({ title, message, fields = [], primary, onSubmit, extra = [] }) {
  const form = el('form', { className: 'form', method: 'dialog' });
  form.append(el('h2', { className: 'sheet-title game-text', id: 'form-title' }, title));
  if (message) form.append(el('p', { className: 'form-msg' }, message));
  for (const f of fields) {
    const id = `field-${f.name}`;
    const input =
      f.options
        ? el('select', { id, name: f.name }, ...f.options.map(([value, label]) => el('option', { value, selected: value === (f.value ?? '') }, label)))
        : el('input', { id, name: f.name, type: 'text', value: f.value ?? '', maxLength: f.maxLength ?? 40, required: f.required ?? false, autocomplete: 'off', placeholder: f.placeholder ?? '' });
    form.append(el('label', { className: 'field', htmlFor: id }, el('span', {}, f.label), input));
  }
  const buttons = el('div', { className: 'form-buttons' });
  for (const b of extra) {
    const btn = el('button', { type: 'button', className: `chunky-btn ${b.className ?? ''}` }, b.label);
    btn.addEventListener('click', () => {
      formSheet.close();
      b.onClick();
    });
    buttons.append(btn);
  }
  buttons.append(el('button', { type: 'submit', className: 'chunky-btn primary' }, primary));
  form.append(buttons);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const values = Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v).trim()]));
    if (fields.some((f) => f.required && !values[f.name])) return;
    formSheet.close();
    onSubmit(values);
  });
  formSheet.querySelector('.sheet-body').replaceChildren(form);
  formSheet.showModal();
}

const animationOptions = () => [['', 'None'], ...Object.entries(EXERCISES).map(([id, ex]) => [id, ex.name])];

function moveButtons(onMove, index, count, label) {
  const up = el('button', { className: 'mini-btn', ariaLabel: `Move ${label} up`, disabled: index === 0 }, '▲');
  const down = el('button', { className: 'mini-btn', ariaLabel: `Move ${label} down`, disabled: index === count - 1 }, '▼');
  up.addEventListener('click', () => onMove(-1));
  down.addEventListener('click', () => onMove(1));
  return [up, down];
}

const stat = (value, label) => el('div', { className: 'stat' }, el('span', { className: 'stat-value game-text' }, value), el('span', { className: 'stat-label' }, label));

// ---- Boards: one weekly grid per tab ----
// Check-ins are keyed by item id across all tabs, so new ids must be unique app-wide.
const boards = [];
const idsOnOtherTabs = (board) => boards.filter((b) => b !== board).flatMap((b) => everyItem(b.tab).map((it) => it.id));

/**
 * Wires up one tab's screen. `words` names what the rows are (exercises, habits),
 * and `animated` offers the exercise figures, muscle map and form tips.
 */
function createBoard({ id, seed, animated, words }) {
  const screen = document.getElementById(`screen-${id}`);
  const board = screen.querySelector('.board');
  const state = { todayKey: toDayKey(new Date()), weekOffset: 0, collapsed: new Set(), editing: false };
  const self = { id, tab: loadTab(id, seed) };

  /** Applies a layout edit, saves it and redraws. */
  function edit(next) {
    self.tab = next;
    saveTab(self.tab);
    render();
  }

  const weekStart = () => addDays(startOfWeek(fromDayKey(state.todayKey)), state.weekOffset * 7);
  const itemDone = (item) => (day) => isChecked(item.id, day);
  const sectionDone = (section) => (day) => {
    const items = activeItems(section);
    return items.length > 0 && items.every((it) => isChecked(it.id, day));
  };
  // Archived items still count, so archiving never breaks a past chain.
  const tabDone = (day) => everyItem(self.tab).some((it) => isChecked(it.id, day));
  const chain = () => currentStreak(tabDone, state.todayKey);
  // Fitness keeps its original keys so milestones it already celebrated don't replay.
  const celebrationKey = (start, milestone) => (id === 'fitness' ? '' : `${id}/`) + `${start}/${milestone}`;

  function render() {
    screen.classList.toggle('editing', state.editing);
    screen.querySelector('.edit-toggle').textContent = state.editing ? '✅ DONE' : `✏️ EDIT ${words.plural.toUpperCase()}`;
    if (state.editing) {
      renderEditor();
      updateWeekTotal(weekDays(weekStart()).map(toDayKey), false);
      updateChain(false);
      return;
    }
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

    for (const section of activeSections(self.tab)) {
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
        const items = activeItems(section);
        const done = items.filter((it) => isChecked(it.id, state.todayKey)).length;
        badge.textContent = `${done}/${items.length}`;
        badge.classList.toggle('cleared', items.length > 0 && done === items.length);
        sectionStreak.update(currentStreak(sectionDone(section), state.todayKey), animate);
      };
      updateSection(false);

      const onToggle = (day, nowChecked) => {
        updateSection(true);
        if (nowChecked && sectionDone(section)(day)) sectionClear(ribbon);
      };

      if (collapsed) continue;
      for (const item of activeItems(section)) {
        const itemStreak = makeStreakChip('item-streak');
        itemStreak.update(currentStreak(itemDone(item), state.todayKey), false);
        const name = el(
          'button',
          { className: 'item-name', title: animated ? `How to do ${item.name}` : `${item.name} history` },
          miniFigure(item, section),
          el('span', { className: 'item-text' }, el('span', {}, item.name), itemStreak),
        );
        name.addEventListener('click', () => openItem(item, section));
        grid.append(name);
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
      if (milestone && claimCelebration(celebrationKey(after.start, milestone))) {
        setTimeout(() => showTrophy(milestone), 450);
      }
    });
    return cell;
  }

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
    const shown = activeSections(self.tab).flatMap(activeItems);
    const total = shown.reduce((n, it) => n + days.filter((d) => isChecked(it.id, d)).length, 0);
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
  board.addEventListener('touchstart', (e) => (touchStart = state.editing ? null : e.touches[0]), { passive: true });
  board.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.clientX;
    const dy = e.changedTouches[0].clientY - touchStart.clientY;
    touchStart = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) changeWeek(dx > 0 ? -1 : 1);
  });

  // ---- Figures and the item card ----
  /** The exercise figure, or the section's emoji when there is none. */
  function miniFigure(item, section) {
    const svg = animated && figureSvg(item.exercise);
    if (svg) return html('span', 'mini-fig', svg);
    return el('span', { className: 'mini-fig empty', ariaHidden: 'true' }, animated ? '⭐' : section.emoji);
  }

  /** The last 12 weeks as columns of Mon–Sun cells, current week last. */
  function heatmap(item) {
    const start = addDays(startOfWeek(fromDayKey(state.todayKey)), -11 * 7);
    const grid = el('div', { className: 'heatmap', role: 'img' });
    let count = 0;
    for (let w = 0; w < 12; w++) {
      for (let d = 0; d < 7; d++) {
        const day = toDayKey(addDays(start, w * 7 + d));
        const on = isChecked(item.id, day);
        count += on;
        const cls = on ? ' on' : day > state.todayKey ? ' future' : '';
        grid.append(el('span', { className: 'heat' + cls + (day === state.todayKey ? ' today' : '') }));
      }
    }
    grid.setAttribute('aria-label', `${count} check-ins in the last 12 weeks`);
    return grid;
  }

  function openItem(item, section) {
    const ex = animated ? EXERCISES[item.exercise] : null;
    const days = checkedDays(item.id);
    const current = currentStreak(itemDone(item), state.todayKey);
    const card = itemSheet.querySelector('.sheet-body');

    let figure;
    if (ex) figure = html('div', 'hero-fig', figureSvg(item.exercise));
    else if (animated) figure = el('div', { className: 'hero-fig empty' }, el('span', { className: 'emoji' }, '⭐'), el('p', {}, 'No animation yet. Pick one in Edit exercises.'));
    else figure = el('div', { className: 'hero-fig empty' }, el('span', { className: 'emoji' }, section.emoji));

    const parts = [
      el('h2', { className: 'sheet-title game-text', id: 'exercise-title' }, item.name.toUpperCase()),
      figure,
      el(
        'div',
        { className: 'stats' },
        stat(`🔥 ${current.length}`, current.todayDone || current.length === 0 ? 'current streak' : 'check in today!'),
        stat(String(longestStreak(days)), 'best streak'),
        stat(String(days.length), 'total days'),
      ),
    ];

    if (ex) {
      const map = html('div', 'muscles', muscleMapSvg(ex.muscles));
      const named = (ids) => ids.map((m) => MUSCLE_NAMES[m]).join(', ');
      map.querySelector('svg').setAttribute('aria-label', `Works ${named(ex.muscles.primary)}; also ${named(ex.muscles.secondary)}`);
      const chip = (role, m) => el('span', { className: `chip ${role}` }, MUSCLE_NAMES[m]);
      parts.push(
        el('h3', { className: 'sheet-heading' }, 'MUSCLES WORKED'),
        map,
        el('div', { className: 'map-labels', ariaHidden: 'true' }, el('span', {}, 'FRONT'), el('span', {}, 'BACK')),
        el('div', { className: 'chips' }, ...ex.muscles.primary.map((m) => chip('primary', m)), ...ex.muscles.secondary.map((m) => chip('secondary', m))),
        el('h3', { className: 'sheet-heading' }, 'FORM TIPS'),
        el('ol', { className: 'tips' }, ...ex.tips.map((t) => el('li', {}, t))),
      );
    }
    parts.push(
      el('h3', { className: 'sheet-heading' }, 'LAST 12 WEEKS'),
      heatmap(item),
      el('div', { className: 'heat-labels', ariaHidden: 'true' }, el('span', {}, '12 weeks ago'), el('span', {}, 'this week')),
    );
    card.replaceChildren(...parts);
    // The sheet lives outside the screen, so it takes this tab's accent from here.
    itemSheet.dataset.tab = id;
    itemSheet.showModal();
    itemSheet.querySelector('.sheet-card').scrollTop = 0;
  }

  // ---- Edit mode ----
  function itemForm(section, item) {
    const tab = self.tab;
    const fields = [{ name: 'name', label: 'Name', value: item?.name, required: true, placeholder: words.itemExample }];
    if (animated) fields.push({ name: 'exercise', label: 'Animation', value: item?.exercise ?? '', options: animationOptions() });
    if (item && activeSections(tab).length > 1) {
      fields.push({ name: 'sectionId', label: 'Section', value: section.id, options: activeSections(tab).map((s) => [s.id, `${s.emoji} ${s.name} · ${s.subtitle}`]) });
    }
    openForm({
      title: `${item ? 'EDIT' : 'NEW'} ${words.singular.toUpperCase()}`,
      fields,
      primary: item ? 'SAVE' : 'ADD',
      extra: item ? [{ label: 'ARCHIVE', className: 'danger', onClick: () => edit(layout.setArchived(tab, 'item', item.id, true)) }] : [],
      onSubmit: (v) => {
        if (item) return edit(layout.updateItem(tab, item.id, v));
        // A new exercise named like one in the library gets its animation automatically.
        const match = animated && Object.keys(EXERCISES).find((ex) => EXERCISES[ex].name.toLowerCase() === v.name.toLowerCase());
        edit(layout.addItem(tab, section.id, { ...v, exercise: v.exercise || match || undefined }, idsOnOtherTabs(self)));
      },
    });
  }

  function sectionForm(section) {
    const tab = self.tab;
    openForm({
      title: section ? 'EDIT SECTION' : 'NEW SECTION',
      fields: [
        { name: 'name', label: 'Name', value: section?.name, required: true, placeholder: words.sectionExample },
        { name: 'subtitle', label: 'Subtitle', value: section?.subtitle, placeholder: words.subtitleExample },
        { name: 'emoji', label: 'Emoji', value: section?.emoji ?? '⭐', maxLength: 8 },
      ],
      primary: section ? 'SAVE' : 'ADD',
      extra: section ? [{ label: 'ARCHIVE', className: 'danger', onClick: () => edit(layout.setArchived(tab, 'section', section.id, true)) }] : [],
      onSubmit: (v) => {
        const values = { ...v, emoji: v.emoji || '⭐' };
        edit(section ? layout.updateSection(tab, section.id, values) : layout.addSection(tab, values));
      },
    });
  }

  function renderEditor() {
    const tab = self.tab;
    const editor = el('div', { className: 'editor' });
    const sections = activeSections(tab);

    sections.forEach((section, si) => {
      const open = el(
        'button',
        { className: 'edit-open ribbon-look', ariaLabel: `Edit section ${section.name}` },
        el('span', { className: 'emoji' }, section.emoji),
        el('span', { className: 'ribbon-text' }, el('span', { className: 'ribbon-name' }, section.name.toUpperCase()), el('span', { className: 'ribbon-sub' }, section.subtitle)),
        el('span', { className: 'pencil', ariaHidden: 'true' }, '✏️'),
      );
      open.addEventListener('click', () => sectionForm(section));
      const block = el('div', { className: 'edit-section' }, el('div', { className: 'edit-head' }, open, ...moveButtons((d) => edit(layout.moveSection(tab, section.id, d)), si, sections.length, section.name)));

      const items = activeItems(section);
      items.forEach((item, ii) => {
        const row = el('button', { className: 'edit-open item-look', ariaLabel: `Edit ${item.name}` }, miniFigure(item, section), el('span', { className: 'edit-name' }, item.name), el('span', { className: 'pencil', ariaHidden: 'true' }, '✏️'));
        row.addEventListener('click', () => itemForm(section, item));
        block.append(el('div', { className: 'edit-row' }, row, ...moveButtons((d) => edit(layout.moveItem(tab, item.id, d)), ii, items.length, item.name)));
      });
      const add = el('button', { className: 'add-btn' }, `+ ADD ${words.singular.toUpperCase()}`);
      add.addEventListener('click', () => itemForm(section, null));
      block.append(add);
      editor.append(block);
    });

    const addSection = el('button', { className: 'chunky-btn add-section' }, '+ ADD SECTION');
    addSection.addEventListener('click', () => sectionForm(null));
    editor.append(addSection);

    // Archived things keep their check-ins and can come back.
    const archived = [
      ...tab.sections.filter((s) => s.archived).map((s) => ({ kind: 'section', id: s.id, label: `${s.emoji} ${s.name} · ${s.subtitle}`, note: 'section' })),
      ...tab.sections.filter((s) => !s.archived).flatMap((s) => s.items.filter((it) => it.archived).map((it) => ({ kind: 'item', id: it.id, label: it.name, note: s.name }))),
    ];
    if (archived.length) {
      const list = el('div', { className: 'panel' }, el('h3', { className: 'sheet-heading' }, 'ARCHIVED'));
      for (const a of archived) {
        const restoreBtn = el('button', { className: 'chunky-btn small' }, 'RESTORE');
        restoreBtn.addEventListener('click', () => edit(layout.setArchived(tab, a.kind, a.id, false)));
        list.append(el('div', { className: 'archived-row' }, el('span', { className: 'edit-name' }, a.label, el('small', {}, a.note)), restoreBtn));
      }
      editor.append(list);
    }

    const exportBtn = el('button', { className: 'chunky-btn small' }, '⬇ EXPORT');
    const importBtn = el('button', { className: 'chunky-btn small' }, '⬆ IMPORT');
    exportBtn.addEventListener('click', exportBackup);
    importBtn.addEventListener('click', () => importInput.click());
    editor.append(
      el(
        'div',
        { className: 'panel' },
        el('h3', { className: 'sheet-heading' }, 'BACKUP'),
        el('p', { className: 'form-msg' }, 'Your check-ins live on this phone only. Export a backup file now and then, and import it to restore.'),
        el('div', { className: 'form-buttons' }, exportBtn, importBtn),
      ),
    );
    board.replaceChildren(editor);
  }

  screen.querySelector('.edit-toggle').addEventListener('click', () => {
    state.editing = !state.editing;
    render();
    window.scrollTo(0, 0);
  });

  Object.assign(self, {
    render,
    /** Re-reads the saved layout, e.g. after an import. */
    reload() {
      self.tab = loadTab(id, seed);
      render();
    },
    /** Redraws if the day rolled over while the app sat in the background. */
    refreshDay(today) {
      if (today === state.todayKey) return;
      state.todayKey = today;
      render();
    },
  });
  return self;
}

boards.push(
  createBoard({
    id: 'fitness',
    seed: fitnessTab,
    animated: true,
    words: { singular: 'exercise', plural: 'exercises', itemExample: 'e.g. Push-ups', sectionExample: 'e.g. Core', subtitleExample: 'e.g. Abs · Stability' },
  }),
  createBoard({
    id: 'diet',
    seed: dietTab,
    animated: false,
    words: { singular: 'habit', plural: 'habits', itemExample: 'e.g. Vitamin D', sectionExample: 'e.g. Veggies', subtitleExample: 'e.g. 5 a day' },
  }),
);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const today = toDayKey(new Date());
  boards.forEach((b) => b.refreshDay(today));
});

// ---- Backup ----
const importInput = el('input', { type: 'file', accept: 'application/json,.json', hidden: true });
document.body.append(importInput);

function exportBackup() {
  const blob = new Blob([JSON.stringify(makeBackup(snapshot()), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: backupFileName() });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Backup saved to Downloads');
}

importInput.addEventListener('change', async () => {
  const file = importInput.files[0];
  importInput.value = '';
  if (!file) return;
  let data;
  try {
    data = parseBackup(await file.text());
  } catch (err) {
    openForm({ title: 'CAN’T IMPORT', message: err.message, primary: 'OK', onSubmit: () => {} });
    return;
  }
  openForm({
    title: 'REPLACE EVERYTHING?',
    message: `This backup has ${describeBackup(data)}. Importing replaces all sections and check-ins on this phone.`,
    primary: 'REPLACE',
    extra: [{ label: 'CANCEL', onClick: () => {} }],
    onSubmit: () => {
      restore(data);
      boards.forEach((b) => b.reload());
      toast('Backup imported');
    },
  });
});

const toastEl = el('div', { className: 'toast', role: 'status' });
document.body.append(toastEl);
let toastTimer;
function toast(text) {
  toastEl.textContent = text;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

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
boards.forEach((b) => b.render());

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service worker not registered', err));
}
