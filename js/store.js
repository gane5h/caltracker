// Everything is kept in localStorage:
//   'chain/check-ins'  { version, checkIns: { itemId: { 'YYYY-MM-DD': true } } }
//   'chain/tabs'       { version, tabs: { tabId: tab } }   (the edited layout)
//   'chain/celebrated' [ 'chainStart/milestone', … ]
const KEY = 'chain/check-ins';
const TABS_KEY = 'chain/tabs';
const CELEBRATED_KEY = 'chain/celebrated';
const VERSION = 1;

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null; // Corrupt or unavailable storage: start empty rather than crash.
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Could not save ${key}`, err);
  }
}

// ---- Check-ins ----
const checkIns = (() => {
  const saved = read(KEY);
  return saved?.version === VERSION && saved.checkIns ? saved.checkIns : {};
})();

const saveCheckIns = () => write(KEY, { version: VERSION, checkIns });

export function isChecked(itemId, day) {
  return checkIns[itemId]?.[day] === true;
}

/** Flips the cell and returns whether it is now checked. */
export function toggle(itemId, day) {
  const days = (checkIns[itemId] ??= {});
  const nowChecked = !days[day];
  if (nowChecked) days[day] = true;
  else delete days[day];
  saveCheckIns();
  return nowChecked;
}

/** Every day the item was checked, oldest first. */
export function checkedDays(itemId) {
  return Object.keys(checkIns[itemId] ?? {}).sort();
}

// ---- Layout ----
const tabs = (() => {
  const saved = read(TABS_KEY);
  return saved?.version === VERSION && saved.tabs ? saved.tabs : {};
})();

/** The saved layout for a tab, or `fallback` (the starting layout) if it was never edited. */
export function loadTab(id, fallback) {
  return tabs[id] ?? structuredClone(fallback);
}

export function saveTab(tab) {
  tabs[tab.id] = tab;
  write(TABS_KEY, { version: VERSION, tabs });
}

// ---- Celebrations ----
// Milestones already celebrated, keyed by chain start + milestone, so undoing
// and redoing a check-in doesn't replay the trophy card.
const celebrated = new Set(Array.isArray(read(CELEBRATED_KEY)) ? read(CELEBRATED_KEY) : []);

/** Returns false if `key` was already celebrated; otherwise records it and returns true. */
export function claimCelebration(key) {
  if (celebrated.has(key)) return false;
  celebrated.add(key);
  write(CELEBRATED_KEY, [...celebrated]);
  return true;
}

// ---- Backup ----
export function snapshot() {
  return { tabs: structuredClone(tabs), checkIns: structuredClone(checkIns), celebrated: [...celebrated] };
}

/** Replaces everything with a parsed backup (see backup.js). */
export function restore(data) {
  for (const k of Object.keys(checkIns)) delete checkIns[k];
  Object.assign(checkIns, data.checkIns);
  for (const k of Object.keys(tabs)) delete tabs[k];
  Object.assign(tabs, data.tabs);
  celebrated.clear();
  data.celebrated.forEach((k) => celebrated.add(k));
  saveCheckIns();
  write(TABS_KEY, { version: VERSION, tabs });
  write(CELEBRATED_KEY, [...celebrated]);
}

// Ask the browser not to evict our data under storage pressure.
navigator.storage?.persist?.();
