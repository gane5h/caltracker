// Pure edits to a tab's layout. Each function returns a new tab and leaves the
// input untouched. Archiving hides a section or item but keeps its check-ins,
// so past chains stay intact and it can be restored later.

const clone = (tab) => structuredClone(tab);

export const activeSections = (tab) => tab.sections.filter((s) => !s.archived);
export const activeItems = (section) => section.items.filter((it) => !it.archived);
/** Every item on the tab, archived ones included (they still count toward past chains). */
export const everyItem = (tab) => tab.sections.flatMap((s) => s.items);

export function findItem(tab, itemId) {
  for (const section of tab.sections) {
    const item = section.items.find((it) => it.id === itemId);
    if (item) return { section, item };
  }
  return null;
}

/** A readable, unused id such as 'push-ups' or 'push-ups-2'. */
export function newId(name, taken) {
  const base =
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'item';
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

const takenIds = (tab) => new Set([...tab.sections.map((s) => s.id), ...everyItem(tab).map((it) => it.id)]);

/** Swaps `list[index]` with the nearest visible neighbour in direction `delta` (−1 or 1). */
function shift(list, index, delta) {
  let j = index + delta;
  while (j >= 0 && j < list.length && list[j].archived) j += delta;
  if (j < 0 || j >= list.length) return false;
  [list[index], list[j]] = [list[j], list[index]];
  return true;
}

export function moveSection(tab, sectionId, delta) {
  const next = clone(tab);
  shift(next.sections, next.sections.findIndex((s) => s.id === sectionId), delta);
  return next;
}

export function moveItem(tab, itemId, delta) {
  const next = clone(tab);
  const { section } = findItem(next, itemId);
  shift(section.items, section.items.findIndex((it) => it.id === itemId), delta);
  return next;
}

export function addSection(tab, { name, subtitle = '', emoji = '⭐' }) {
  const next = clone(tab);
  next.sections.push({ id: newId(name, takenIds(tab)), name, subtitle, emoji, items: [] });
  return next;
}

/** `reserved` lists item ids used on other tabs; check-ins are keyed by item id app-wide. */
export function addItem(tab, sectionId, { name, exercise }, reserved = []) {
  const next = clone(tab);
  const item = { id: newId(name, new Set([...takenIds(tab), ...reserved])), name };
  if (exercise) item.exercise = exercise;
  next.sections.find((s) => s.id === sectionId).items.push(item);
  return next;
}

export function updateSection(tab, sectionId, changes) {
  const next = clone(tab);
  Object.assign(
    next.sections.find((s) => s.id === sectionId),
    changes,
  );
  return next;
}

/** Renames or re-animates an item; `sectionId` moves it to the end of another section. */
export function updateItem(tab, itemId, { sectionId, exercise, ...changes }) {
  const next = clone(tab);
  const { section, item } = findItem(next, itemId);
  Object.assign(item, changes);
  if (exercise !== undefined) {
    if (exercise) item.exercise = exercise;
    else delete item.exercise;
  }
  if (sectionId && sectionId !== section.id) {
    section.items.splice(section.items.indexOf(item), 1);
    next.sections.find((s) => s.id === sectionId).items.push(item);
  }
  return next;
}

export function setArchived(tab, kind, id, archived) {
  const next = clone(tab);
  const target = kind === 'section' ? next.sections.find((s) => s.id === id) : findItem(next, id).item;
  if (archived) target.archived = true;
  else delete target.archived;
  return next;
}
