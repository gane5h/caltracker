// Check-ins live in localStorage as { version, checkIns: { itemId: { 'YYYY-MM-DD': true } } }.
const KEY = 'chain/check-ins';
const VERSION = 1;

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.version === VERSION && saved.checkIns) return saved.checkIns;
  } catch {
    // Corrupt or unavailable storage: start empty rather than crash.
  }
  return {};
}

const checkIns = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, checkIns }));
  } catch (err) {
    console.error('Could not save check-ins', err);
  }
}

export function isChecked(itemId, day) {
  return checkIns[itemId]?.[day] === true;
}

/** Flips the cell and returns whether it is now checked. */
export function toggle(itemId, day) {
  const days = (checkIns[itemId] ??= {});
  const nowChecked = !days[day];
  if (nowChecked) days[day] = true;
  else delete days[day];
  save();
  return nowChecked;
}

// Milestones already celebrated, keyed by chain start + milestone, so undoing
// and redoing a check-in doesn't replay the trophy card.
const CELEBRATED_KEY = 'chain/celebrated';
const celebrated = new Set(
  (() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CELEBRATED_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  })(),
);

/** Returns false if `key` was already celebrated; otherwise records it and returns true. */
export function claimCelebration(key) {
  if (celebrated.has(key)) return false;
  celebrated.add(key);
  try {
    localStorage.setItem(CELEBRATED_KEY, JSON.stringify([...celebrated]));
  } catch (err) {
    console.error('Could not save celebrations', err);
  }
  return true;
}

// Ask the browser not to evict our data under storage pressure.
navigator.storage?.persist?.();
