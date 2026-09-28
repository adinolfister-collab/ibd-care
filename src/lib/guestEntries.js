import { base44 } from '@/api/base44Client';

// Guest (unauthenticated) logging lives entirely on the device via
// localStorage. On first authenticated mount, AppLayout syncs these local
// entries into the user's cloud entities and clears the cache, so nothing a
// guest recorded is lost when they sign up.
//
// In "demo mode" (unauthenticated visitor) the app treats the guest as a
// Premium user: every diary page reads/writes these stores instead of the
// cloud, and a "Azzera demo" button clears them all.

const KEYS = {
  symptoms: 'ibdcare:guest:symptoms',
  foods: 'ibdcare:guest:foods',
  records: 'ibdcare:guest:records',
  meds: 'ibdcare:guest:meds',
  doses: 'ibdcare:guest:doses',
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
    list: () => read(key).slice().sort((a, b) => (b[dateField] || '').localeCompare(a[dateField] || '')),
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
export const guestMeds = makeStore(KEYS.meds, 'start_date');
export const guestDoses = makeStore(KEYS.doses, 'dose_date');

// True if the guest has recorded any local demo data across all stores.
export function guestHasAnyEntries() {
  return (
    guestSymptoms.has() ||
    guestFoods.has() ||
    guestRecords.has() ||
    guestMeds.has() ||
    guestDoses.has()
  );
}

// Clear every guest local store — used by the "Azzera demo" button.
export function clearAllGuestEntries() {
  guestSymptoms.clear();
  guestFoods.clear();
  guestRecords.clear();
  guestMeds.clear();
  guestDoses.clear();
  try { localStorage.removeItem('ibdcare:guest:save_count'); } catch { /* ignore */ }
}

// Strip client-only fields before pushing to the cloud entity.
function stripLocal({ id, created_date, ...rest }) {
  return rest;
}

// Push any guest entries into the authenticated user's entities, per-entity,
// clearing the local cache only after a successful create. Returns the count.
// Medications are created first so their new ids can be mapped to doses.
export async function syncGuestEntriesToCloud() {
  let count = 0;

  const meds = guestMeds.all();
  const medIdMap = {};
  if (meds.length) {
    const created = await base44.entities.Medication.bulkCreate(meds.map(stripLocal));
    (created || []).forEach((c, i) => {
      if (meds[i]) medIdMap[meds[i].id] = c.id;
    });
    guestMeds.clear();
    count += meds.length;
  }

  const doses = guestDoses.all();
  if (doses.length) {
    const payload = doses.map((d) => {
      const { id, created_date, medication_id, ...rest } = d;
      return { ...rest, medication_id: medIdMap[medication_id] || medication_id };
    });
    await base44.entities.MedicationDose.bulkCreate(payload);
    guestDoses.clear();
    count += doses.length;
  }

  const syms = guestSymptoms.all();
  if (syms.length) {
    await base44.entities.SymptomEntry.bulkCreate(syms.map(stripLocal));
    guestSymptoms.clear();
    count += syms.length;
  }
  const foods = guestFoods.all();
  if (foods.length) {
    await base44.entities.FoodEntry.bulkCreate(foods.map(stripLocal));
    guestFoods.clear();
    count += foods.length;
  }
  const records = guestRecords.all();
  if (records.length) {
    await base44.entities.MedicalRecord.bulkCreate(records.map(stripLocal));
    guestRecords.clear();
    count += records.length;
  }
  return count;
}