import { base44 } from '@/api/base44Client';

// Guest (unauthenticated) logging lives entirely on the device via
// localStorage. On first authenticated mount, AppLayout syncs these local
// entries into the user's cloud entities (SymptomEntry / FoodEntry) and clears
// the cache, so nothing a guest recorded is lost when they sign up.

const KEYS = {
  symptoms: 'ibdcare:guest:symptoms',
  foods: 'ibdcare:guest:foods',
  records: 'ibdcare:guest:records',
};

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    /* storage full / unavailable — best effort */
  }
}

function genId() {
  return 'guest_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

function makeStore(key, dateField = 'entry_date') {
  return {
    list: () => read(key).sort((a, b) => (b[dateField] || '').localeCompare(a[dateField] || '')),
    all: () => read(key),
    has: () => read(key).length > 0,
    add: (data) => {
      const arr = read(key);
      const entry = { ...data, id: genId(), created_date: new Date().toISOString() };
      arr.unshift(entry);
      write(key, arr);
      return entry;
    },
    update: (id, data) => {
      const arr = read(key);
      const idx = arr.findIndex((e) => e.id === id);
      if (idx >= 0) {
        arr[idx] = { ...arr[idx], ...data };
        write(key, arr);
      }
    },
    remove: (id) => {
      write(key, read(key).filter((e) => e.id !== id));
    },
    clear: () => {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

export const guestSymptoms = makeStore(KEYS.symptoms);
export const guestFoods = makeStore(KEYS.foods);
export const guestRecords = makeStore(KEYS.records, 'record_date');

// Strip client-only fields before pushing to the cloud entity.
function stripLocal({ id, created_date, ...rest }) {
  return rest;
}

// Push any guest entries into the authenticated user's entities, per-entity,
// clearing the local cache only after a successful create. Returns the count.
export async function syncGuestEntriesToCloud() {
  let count = 0;
  const syms = guestSymptoms.all();
  if (syms.length) {
    const payload = syms.map(stripLocal);
    await base44.entities.SymptomEntry.bulkCreate(payload);
    guestSymptoms.clear();
    count += syms.length;
  }
  const foods = guestFoods.all();
  if (foods.length) {
    const payload = foods.map(stripLocal);
    await base44.entities.FoodEntry.bulkCreate(payload);
    guestFoods.clear();
    count += foods.length;
  }
  const records = guestRecords.all();
  if (records.length) {
    const payload = records.map(stripLocal);
    await base44.entities.MedicalRecord.bulkCreate(payload);
    guestRecords.clear();
    count += records.length;
  }
  return count;
}