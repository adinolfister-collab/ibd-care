import { guestSymptoms, guestFoods, guestMeds, guestRecords } from '@/lib/guestEntries';
import { demoSymptoms, demoFoods, demoMeds, demoRecords } from '@/lib/demoData';

// Demo mode data sources for unauthenticated guests. Guest local entries
// come first, then the demo dataset as a rich base so reports/charts stay
// populated even before the guest records anything. Used by composite
// report/export components so they work in demo mode without a backend.

export function getGuestSymptoms() {
  return [...guestSymptoms.list(), ...demoSymptoms];
}
export function getGuestFoods() {
  return [...guestFoods.list(), ...demoFoods];
}
export function getGuestMeds() {
  return [...guestMeds.list(), ...demoMeds];
}
export function getGuestRecords() {
  return [...guestRecords.list(), ...demoRecords];
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Compute a weekly report (last 7 days) from demo data, mirroring the shape
// returned by the generateWeeklyReport backend function so WeeklyReport works
// in demo mode without any backend call.
export function computeWeeklyReportDemo() {
  const from = isoDaysAgo(6);
  const to = isoDaysAgo(0);
  const symptoms = getGuestSymptoms().filter((s) => s.entry_date >= from && s.entry_date <= to);
  const foods = getGuestFoods().filter((f) => f.entry_date >= from && f.entry_date <= to);

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = isoDaysAgo(i);
    const ss = symptoms.filter((s) => s.entry_date === date);
    const avg = (arr, k) => (arr.length ? arr.reduce((a, x) => a + (x[k] ?? 0), 0) / arr.length : null);
    days.push({
      date,
      avg_pain: avg(ss, 'pain_level'),
      avg_fatigue: avg(ss, 'fatigue_level'),
      bowel_movements: ss.reduce((a, x) => a + (x.bowel_movements_count ?? 0), 0),
    });
  }

  const painVals = symptoms.map((s) => s.pain_level ?? 0);
  const fatigueVals = symptoms.map((s) => s.fatigue_level ?? 0);
  const stats = {
    week_avg_pain: painVals.length ? painVals.reduce((a, b) => a + b, 0) / painVals.length : 0,
    week_avg_fatigue: fatigueVals.length ? fatigueVals.reduce((a, b) => a + b, 0) / fatigueVals.length : 0,
    total_bowel: symptoms.reduce((a, s) => a + (s.bowel_movements_count ?? 0), 0),
    blood_days: new Set(symptoms.filter((s) => s.blood).map((s) => s.entry_date)).size,
    total_meals: foods.length,
    reaction_meals: foods.filter((f) => f.reaction && f.reaction !== 'nessuna').length,
  };

  const counts = {};
  foods.filter((f) => f.reaction && f.reaction !== 'nessuna').forEach((f) => {
    (f.items || []).forEach((it) => { if (it && it.name) counts[it.name] = (counts[it.name] || 0) + 1; });
    if (!f.items || !f.items.length) {
      (f.foods || '').split(/,\s*/).filter(Boolean).forEach((n) => { counts[n] = (counts[n] || 0) + 1; });
    }
  });
  const suspicious_foods = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return { period: { from, to }, days, stats, suspicious_foods };
}