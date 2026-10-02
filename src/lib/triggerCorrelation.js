// Correlazione tra tag trigger personalizzati e sintomi successivi.
// Per ogni tag, conta quante volte compare in pasti seguiti (entro 48h) da un
// sintomo con pain_level elevato (>=4) o feci liquide (Bristol >=5).

const SYMPTOM_WINDOW_H = 48;
const PAIN_THRESHOLD = 4;
const LIQUID_BRISTOL = 5;

// foods: array FoodEntry (con trigger_tags e entry_date)
// symptoms: array SymptomEntry (con pain_level, stool_consistency, entry_date)
// Restituisce array { name, count, total } ordinato per count desc.
export function computeTriggerCorrelation(foods = [], symptoms = []) {
  const tagMap = new Map();
  const sympDates = symptoms
    .map((s) => s.entry_date ? new Date(s.entry_date + 'T12:00:00').getTime() : null)
    .filter(Boolean);

  foods.forEach((f) => {
    const tags = Array.isArray(f.trigger_tags) ? f.trigger_tags : [];
    if (!tags.length || !f.entry_date) return;
    const mealTime = new Date(f.entry_date + 'T12:00:00').getTime();
    // Cerca un sintomo nelle 48h successive al pasto.
    const followedBySymptom = sympDates.some((st) => {
      const diff = (st - mealTime) / (1000 * 60 * 60);
      return diff >= 0 && diff <= SYMPTOM_WINDOW_H;
    });
    // Verifica severita' del sintomo (pain elevato o feci liquide) per raffinare.
    const severeSymptom = symptoms.some((s) => {
      if (!s.entry_date) return false;
      const st = new Date(s.entry_date + 'T12:00:00').getTime();
      const diff = (st - mealTime) / (1000 * 60 * 60);
      if (diff < 0 || diff > SYMPTOM_WINDOW_H) return false;
      return (s.pain_level >= PAIN_THRESHOLD) || (s.stool_consistency >= LIQUID_BRISTOL);
    });
    tags.forEach((name) => {
      if (!tagMap.has(name)) tagMap.set(name, { name, count: 0, total: 0 });
      const e = tagMap.get(name);
      e.total += 1;
      if (severeSymptom) e.count += 1;
      else if (followedBySymptom) e.count += 0.5;
    });
  });

  return Array.from(tagMap.values())
    .map((e) => ({ ...e, count: Math.round(e.count * 10) / 10 }))
    .sort((a, b) => b.count - a.count);
}

// Correlazione longitudinale terapia-sintomi: per ogni terapia con start_date,
// calcola la media del pain_level e delle scariche nei 30 giorni prima e dopo.
// meds: array Medication (con start_date, name)
// symptoms: array SymptomEntry (con pain_level, bowel_movements_count, entry_date)
export function computeTherapyCorrelation(meds = [], symptoms = []) {
  const DAY = 24 * 60 * 60 * 1000;
  return meds
    .filter((m) => m.start_date && m.name)
    .map((m) => {
      const start = new Date(m.start_date + 'T12:00:00').getTime();
      const before = symptoms.filter((s) => {
        if (!s.entry_date) return false;
        const t = new Date(s.entry_date + 'T12:00:00').getTime();
        return t >= start - 30 * DAY && t < start;
      });
      const after = symptoms.filter((s) => {
        if (!s.entry_date) return false;
        const t = new Date(s.entry_date + 'T12:00:00').getTime();
        return t >= start && t <= start + 30 * DAY;
      });
      const avg = (arr, field) => {
        const v = arr.map((x) => x[field]).filter((x) => x != null);
        return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
      };
      return {
        id: m.id,
        name: m.name,
        start_date: m.start_date,
        before: { pain: avg(before, 'pain_level'), bowel: avg(before, 'bowel_movements_count'), count: before.length },
        after: { pain: avg(after, 'pain_level'), bowel: avg(after, 'bowel_movements_count'), count: after.length },
      };
    })
    .filter((r) => r.before.count > 0 || r.after.count > 0);
}