// Counts guest (unauthenticated) diary saves so we can show a soft paywall
// after a few free saves. Persisted in localStorage; cleared on login.
const KEY = 'ibdcare:guest:save_count';
export const FREE_SAVES = 3;

export function readGuestSaveCount() {
  try {
    const n = parseInt(localStorage.getItem(KEY) || '0', 10);
    return isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function writeGuestSaveCount(n) {
  try { localStorage.setItem(KEY, String(n)); } catch { /* ignore */ }
}

export function resetGuestSaveCount() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}