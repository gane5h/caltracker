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

// Ask the browser not to evict our data under storage pressure.
navigator.storage?.persist?.();
