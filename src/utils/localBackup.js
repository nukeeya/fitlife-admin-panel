/**
 * Browser-local data backup.
 *
 * GymDataContext never talks to Supabase — members, invoices, attendance etc.
 * live only in localStorage. Sign-out wipes those keys, so we export them first
 * or the data is gone for good.
 */

const PREFIX = 'fitlife-';

/** Theme/branding are preferences, not business records — skip them when
 *  deciding whether a backup is worth prompting for. */
const PREFERENCE_KEYS = new Set(['fitlife-theme-settings', 'fitlife-branding']);

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** Snapshot every fitlife-* key, JSON-decoded where possible. */
export function collectLocalData() {
  const data = {};
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      data[key] = safeParse(localStorage.getItem(key));
    }
  } catch {
    // storage unavailable (private mode / blocked cookies)
  }
  return data;
}

/** True when anything other than preferences holds real content. */
export function hasBusinessData() {
  const data = collectLocalData();
  return Object.entries(data).some(([key, value]) => {
    if (PREFERENCE_KEYS.has(key)) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') return Object.keys(value).length > 0;
    if (typeof value === 'number') return value > 0;
    return value !== null && value !== undefined && value !== '';
  });
}

/** Trigger a JSON download of the current browser-local data. */
export function downloadBackup(data = collectLocalData()) {
  const payload = {
    exportedAt: new Date().toISOString(),
    origin: typeof window !== 'undefined' ? window.location.origin : null,
    note: 'FitLife browser-local data. Exported before sign-out cleared this device.',
    data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const link = document.createElement('a');

  link.href = url;
  link.download = `fitlife-backup-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
