// JSON backup files: everything the app keeps on the phone, in one file.
const APP = 'chain';
const VERSION = 1;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function makeBackup({ tabs, checkIns, celebrated }, now = new Date()) {
  return { app: APP, version: VERSION, exportedAt: now.toISOString(), tabs, checkIns, celebrated };
}

export function backupFileName(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `chain-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';

function checkTab(tab, name) {
  if (!isObject(tab) || !Array.isArray(tab.sections)) throw new Error(`The “${name}” tab is missing its sections.`);
  for (const s of tab.sections) {
    if (!isObject(s) || !isText(s.id) || !isText(s.name) || !Array.isArray(s.items)) {
      throw new Error(`A section on the “${name}” tab is incomplete.`);
    }
    for (const it of s.items) {
      if (!isObject(it) || !isText(it.id) || !isText(it.name)) throw new Error(`An item in “${s.name}” is incomplete.`);
    }
  }
}

/** Parses and checks a backup file's text. Throws an Error with a readable message. */
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file isn’t valid JSON. Choose a file saved with Export.');
  }
  if (!isObject(data) || data.app !== APP) throw new Error('This isn’t a Chain backup file.');
  if (data.version !== VERSION) throw new Error(`This backup is from a newer version of Chain (v${data.version}). Update the app first.`);
  if (!isObject(data.tabs) || !isObject(data.checkIns)) throw new Error('This backup is missing its tabs or check-ins.');
  for (const [name, tab] of Object.entries(data.tabs)) checkTab(tab, name);

  const checkIns = {};
  for (const [itemId, days] of Object.entries(data.checkIns)) {
    if (!isObject(days)) continue;
    const kept = Object.keys(days).filter((d) => DAY_KEY.test(d) && days[d] === true);
    if (kept.length) checkIns[itemId] = Object.fromEntries(kept.map((d) => [d, true]));
  }
  const celebrated = Array.isArray(data.celebrated) ? data.celebrated.filter((k) => typeof k === 'string') : [];
  return { tabs: data.tabs, checkIns, celebrated };
}

/** A one-line summary for the import confirmation. */
export function describeBackup({ tabs, checkIns }) {
  const items = Object.values(tabs).reduce((n, t) => n + t.sections.reduce((m, s) => m + s.items.length, 0), 0);
  const days = Object.values(checkIns).reduce((n, d) => n + Object.keys(d).length, 0);
  return `${items} item${items === 1 ? '' : 's'} and ${days} check-in${days === 1 ? '' : 's'}`;
}
