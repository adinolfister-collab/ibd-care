// Dataset dimostrativi per visitatori non autenticati. Generati una sola
// volta al caricamento del modulo con date relative a "oggi", così che
// liste, grafici recharts e correlazioni risultino popolati su tutti i
// range del ChartRangeSelector (7gg / 15gg / mese / 3 mesi / storico).
//
// Le pagine dati usano questi array quando l'utente non è autenticato,
// al posto delle chiamate a base44.entities.* (che fallirebbero per un
// guest sulle entità con RLS created_by_id). I record hanno id fittizi
// prefissati "demo-" per distinguerli da quelli reali.

function isoDaysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const SAFE = ['Riso', 'Patate', 'Pollo', 'Pesce bianco', 'Zucchine', 'Carote', 'Banane', 'Mele cotte'];
const TRIGGER = ['Cipolla', 'Latticini', 'Cavolo', 'Fritto', 'Legumi', 'Pane integrale'];
const MOODS = ['buono', 'discreto', 'giu', 'ansia', 'irritabile'];
const COOKING = ['al_vapore', 'bollito', 'al_forno', 'piastrato', 'fritto', 'crudo'];

function pick(arr, i) { return arr[((i % arr.length) + arr.length) % arr.length]; }

const DAYS = 120;

const demoSymptoms = Array.from({ length: DAYS }, (_, idx) => {
  const day = DAYS - 1 - idx;
  const d = isoDaysAgo(day);
  const flare = day % 10 < 2;
  const pain = flare ? 5 + (day % 4) : day % 3;
  const fatigue = flare ? 5 + (day % 3) : day % 4;
  const bowel = flare ? 4 + (day % 4) : 1 + (day % 3);
  return {
    id: `demo-sym-${idx}`,
    entry_date: d,
    pain_level: pain,
    pain_location: flare ? 'addome_inferiore' : 'nessuno',
    fatigue_level: fatigue,
    bowel_movements_count: bowel,
    stool_consistency: flare ? 6 : 4,
    blood: flare && day % 20 === 0,
    mood: pick(MOODS, day),
    notes: flare ? 'Giornata di flare, idratarsi.' : '',
    created_date: `${d}T08:00:00.000Z`,
  };
});

const demoFoods = [];
let fIdx = 0;
for (let day = DAYS - 1; day >= 0; day--) {
  const d = isoDaysAgo(day);
  const mealsToday = 1 + (day % 3);
  const flare = day % 10 < 2;
  const mealTypes = ['colazione', 'pranzo', 'cena', 'spuntino'];
  for (let m = 0; m < mealsToday; m++) {
    const isTrigger = flare && m === 1;
    const foods = isTrigger
      ? [pick(TRIGGER, day), pick(SAFE, day + 1)]
      : [pick(SAFE, day + m), pick(SAFE, day + m + 2)];
    const reaction = isTrigger
      ? pick(['moderata', 'severa'], day)
      : (m === 0 && day % 7 === 0 ? 'lieve' : 'nessuna');
    const items = foods.map((name) => ({
      name,
      qty: '1',
      unit: 'porzione',
      kcal: 200 + (name.length * 10),
      proteine: 5 + (name.length % 10),
      carboidrati: 20 + (name.length % 15),
      kcal_source: 'catalog',
    }));
    demoFoods.push({
      id: `demo-food-${fIdx++}`,
      entry_date: d,
      meal_type: mealTypes[m % 4],
      cooking_method: pick(COOKING, day + m),
      foods: foods.join(', '),
      items,
      reaction,
      tolerated: reaction === 'nessuna',
      notes: '',
      created_date: `${d}T${12 + m}:00:00.000Z`,
    });
  }
}

const demoMeds = [
  { id: 'demo-med-1', name: 'Mesalazina', type: 'farmaco_orale', dosage: '1,5 g', frequency: 'giornaliero', times: '08:00, 20:00', start_date: isoDaysAgo(180), active: true, notes: 'Terapia di mantenimento' },
  { id: 'demo-med-2', name: 'Adalimumab', type: 'biologico', dosage: '40 mg', frequency: 'bisettimanale', times: '09:00', start_date: isoDaysAgo(90), active: true, notes: 'Iniezione sottocutanea' },
  { id: 'demo-med-3', name: 'Vitamina D', type: 'integratore', dosage: '1000 UI', frequency: 'giornaliero', times: '08:00', start_date: isoDaysAgo(60), active: true, notes: '' },
];

const demoRecords = [
  { id: 'demo-rec-1', record_date: isoDaysAgo(95), type: 'visita', title: 'Visita gastroenterologica', provider: 'Prof. Bianchi', location: 'Centro IBD — Ospedale S. Orsola', result_summary: 'Malattia in remissione. Continuare la terapia di mantenimento.', next_appointment: isoDaysAgo(-30), notes: '' },
  { id: 'demo-rec-2', record_date: isoDaysAgo(80), type: 'esame_sangue', exam_category: 'esame_sangue', title: 'Esami ematochimici', provider: 'Laboratorio Analyses', location: 'Roma', result_summary: 'PCR nei range. Calprotectina richiesta di approfondimento.', markers: [{ name: 'PCR', value: '2,1', unit: 'mg/dL', ref_low: '0', ref_high: '5', flag: 'normal' }, { name: 'Emoglobina', value: '13,2', unit: 'g/dL', ref_low: '12', ref_high: '16', flag: 'normal' }], notes: '' },
  { id: 'demo-rec-3', record_date: isoDaysAgo(45), type: 'esame', exam_category: 'calprotectina', title: 'Calprotectina fecale', provider: 'Laboratorio Analyses', location: 'Roma', result_summary: 'Valore in range, coerente con remissione clinica.', markers: [{ name: 'Calprotectina', value: '48', unit: 'µg/g', ref_low: '0', ref_high: '50', flag: 'normal' }], notes: '' },
  { id: 'demo-rec-4', record_date: isoDaysAgo(20), type: 'controllo', title: 'Controllo trimestrale', provider: 'Prof. Bianchi', location: 'Centro IBD — Ospedale S. Orsola', result_summary: 'Quadro stabile. Prossimo controllo tra tre mesi.', next_appointment: isoDaysAgo(-70), notes: '' },
];

export { demoSymptoms, demoFoods, demoMeds, demoRecords };