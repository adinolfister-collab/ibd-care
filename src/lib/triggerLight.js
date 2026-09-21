// Motore del semaforo trigger: incrocia FoodEntry con SymptomEntry per
// assegnare a ogni alimento un bollino personalizzato (verde/giallo/rosso).
//
// Logica:
// - Per ogni pasto, estrae i nomi degli alimenti (da items o dal testo foods).
// - Cerca sintomi severi nelle 24-48h successive al pasto.
// - Sintomo severo = pain_level >= 5 OR fatigue_level >= 5 OR bowel_movements_count >= 5 OR blood = true.
// - Per ogni alimento con >= minOccurrences (default 3) occorrenze:
//   - ratio = trigger / occurrences
//   - ratio >= redThreshold (0.5) → rosso (potenziale trigger)
//   - ratio <= greenThreshold (0.2) → verde (tollerato)
//   - altrimenti → giallo (da testare)

function splitNames(foods) {
  return String(foods || '')
    .split(/[\n,;·•]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function isSevereSymptom(s) {
  if (!s) return false;
  return (
    (s.pain_level ?? 0) >= 5 ||
    (s.fatigue_level ?? 0) >= 5 ||
    (s.bowel_movements_count ?? 0) >= 5 ||
    !!s.blood
  );
}

export function computeTriggerLights(foods, symptoms, opts = {}) {
  const minOccurrences = opts.minOccurrences ?? 3;
  const redThreshold = opts.redThreshold ?? 0.5;
  const greenThreshold = opts.greenThreshold ?? 0.2;
  const windowDays = opts.windowDays ?? 2;

  // Map date -> worst symptom (prefer severe)
  const symByDate = new Map();
  (symptoms || []).forEach((s) => {
    if (!s.entry_date) return;
    const prev = symByDate.get(s.entry_date);
    if (!prev || isSevereSymptom(s)) symByDate.set(s.entry_date, s);
  });

  // Accumulate per-food stats
  const stats = new Map();
  (foods || []).forEach((f) => {
    if (!f.entry_date) return;
    const names =
      Array.isArray(f.items) && f.items.length
        ? f.items.map((i) => (i.name || '').trim()).filter(Boolean)
        : splitNames(f.foods);
    if (names.length === 0) return;

    // Check symptom window: entry_date through entry_date + windowDays
    const base = new Date(f.entry_date + 'T00:00:00');
    const keys = [];
    for (let i = 0; i <= windowDays; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      keys.push(d.toISOString().slice(0, 10));
    }
    const triggered = keys.some((k) => isSevereSymptom(symByDate.get(k)));

    names.forEach((n) => {
      const cur = stats.get(n) || { occurrences: 0, triggers: 0 };
      cur.occurrences += 1;
      if (triggered) cur.triggers += 1;
      stats.set(n, cur);
    });
  });

  // Assign status per food
  const result = new Map();
  stats.forEach((v, name) => {
    let status;
    if (v.occurrences < minOccurrences) {
      status = 'yellow';
    } else {
      const ratio = v.triggers / v.occurrences;
      if (ratio >= redThreshold) status = 'red';
      else if (ratio <= greenThreshold) status = 'green';
      else status = 'yellow';
    }
    result.set(name, { status, occurrences: v.occurrences, triggers: v.triggers });
  });
  return result;
}