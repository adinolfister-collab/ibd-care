// Dati di esempio statici per il generatore di screenshot (pagina admin).
// Nessun dato viene dal database: questi oggetti alimentano i frame che
// riproducono le schermate reali dell'app per la cattura di screenshot
// destinati alla scheda Google Play. Testi in italiano (lingua principale).

export const CAPTIONS = [
  'Il tuo stato di oggi a colpo d\'occhio',
  'Registra dolore, scariche e scala Bristol in pochi secondi',
  'Il semaforo ti dice subito cosa tolleri e cosa no',
  'Grafici di dolore e alimentazione nel tempo',
  'Promemoria farmaci con orari e aderenza alla terapia',
  'Riepilogo clinico pronto da portare dal gastroenterologo',
  'Centri IBD, farmacie e bagni pubblici vicino a te',
  'Cary, l\'assistente vocale che conosce la tua cartella',
];

export const todaySymptom = {
  pain_level: 3,
  fatigue_level: 4,
  bowel_movements_count: 2,
  stool_consistency: 5,
};

export const quickActions = [
  { key: 'Registra sintomo', icon: 'Activity', color: 'text-rose-500', bg: 'bg-rose-50' },
  { key: 'Registra pasto', icon: 'Utensils', color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'Riepilogo', icon: 'FileBarChart', color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'Trova servizio', icon: 'MapPin', color: 'text-sky-600', bg: 'bg-sky-50' },
];

export const homeMeds = [
  { name: 'Mesalazina', dosage: '500 mg · 2 compresse', times: '08:00, 20:00', active: true },
  { name: 'Adalimumab', dosage: '40 mg s.c.', times: '14:00', active: true },
];

export const homeRecent = [
  { kind: 'symptom', label: 'Diario sintomi', date: '2026-10-03' },
  { kind: 'food', label: 'Riso, pollo, zucchine', date: '2026-10-03' },
  { kind: 'symptom', label: 'Diario sintomi', date: '2026-10-02' },
];

export const symptomItems = [
  {
    id: 's1', entry_date: '2026-10-03', pain_level: 3, fatigue_level: 4,
    bowel_movements_count: 2, stool_consistency: 5, blood: false,
    notes: 'Dopo pranzo leggermente meglio.',
  },
  {
    id: 's2', entry_date: '2026-10-02', pain_level: 6, fatigue_level: 7,
    bowel_movements_count: 5, stool_consistency: 6, blood: true,
    notes: 'Risveglio difficile, crampi addominali.',
  },
  {
    id: 's3', entry_date: '2026-10-01', pain_level: 2, fatigue_level: 3,
    bowel_movements_count: 1, stool_consistency: 4, blood: false,
  },
];

export const foodItems = [
  {
    id: 'f1', entry_date: '2026-10-03', meal_type: 'pranzo', reaction: 'nessuna', tolerated: true,
    items: [
      { name: 'Riso bianco', qty: '80', unit: 'g' },
      { name: 'Petto di pollo', qty: '120', unit: 'g' },
      { name: 'Zucchine', qty: '100', unit: 'g' },
    ],
  },
  {
    id: 'f2', entry_date: '2026-10-03', meal_type: 'colazione', reaction: 'lieve', tolerated: false,
    items: [
      { name: 'Latte', qty: '200', unit: 'ml' },
      { name: 'Caffè', qty: '1', unit: 'tazza' },
    ],
    notes: 'Leggero gonfiore dopo mezz\'ora.',
  },
  {
    id: 'f3', entry_date: '2026-10-02', meal_type: 'cena', reaction: 'severa', tolerated: false,
    items: [
      { name: 'Pomodoro', qty: '60', unit: 'g' },
      { name: 'Insalata', qty: '1', unit: 'porzione' },
    ],
    notes: 'Crampi e scariche serali.',
  },
];

// Semaforo tolleranza: mappa nome alimento -> stato (green/yellow/red)
export const toleranceLight = [
  { name: 'Riso bianco', status: 'green', note: 'Tollerato' },
  { name: 'Petto di pollo', status: 'green', note: 'Tollerato' },
  { name: 'Latte', status: 'red', note: 'Trigger frequente' },
  { name: 'Caffè', status: 'yellow', note: 'Modera la dose' },
  { name: 'Pomodoro', status: 'red', note: 'Reazione severa' },
  { name: 'Zucchine', status: 'green', note: 'Tollerato' },
];

export const trendBuckets = [
  { label: '27/09', pain: 5, fatigue: 6, count: 1 },
  { label: '28/09', pain: 4, fatigue: 5, count: 1 },
  { label: '29/09', pain: 6, fatigue: 7, count: 1 },
  { label: '30/09', pain: 3, fatigue: 4, count: 1 },
  { label: '01/10', pain: 2, fatigue: 3, count: 1 },
  { label: '02/10', pain: 6, fatigue: 7, count: 1 },
  { label: '03/10', pain: 3, fatigue: 4, count: 1 },
];

export const mealBuckets = [
  { label: '27/09', count: 3, nessuna: 2, lieve: 1, moderata: 0, severa: 0 },
  { label: '28/09', count: 3, nessuna: 3, lieve: 0, moderata: 0, severa: 0 },
  { label: '29/09', count: 2, nessuna: 1, lieve: 0, moderata: 0, severa: 1 },
  { label: '30/09', count: 3, nessuna: 3, lieve: 0, moderata: 0, severa: 0 },
  { label: '01/10', count: 3, nessuna: 2, lieve: 1, moderata: 0, severa: 0 },
  { label: '02/10', count: 2, nessuna: 0, lieve: 0, moderata: 0, severa: 2 },
  { label: '03/10', count: 3, nessuna: 2, lieve: 1, moderata: 0, severa: 0 },
];

export const medItems = [
  { id: 'm1', name: 'Mesalazina', type: 'farmaco_orale', dosage: '500 mg', times: '08:00, 20:00', frequency: 'giornaliero', active: true, notes: 'Con i pasti.' },
  { id: 'm2', name: 'Adalimumab', type: 'biologico', dosage: '40 mg s.c.', times: '14:00', frequency: 'settimanale', active: true, notes: 'Iniezione sottocutanea.' },
  { id: 'm3', name: 'Ferro', type: 'integratore', dosage: '30 mg', times: '09:00', frequency: 'giornaliero', active: true },
];

export const monthlyReportData = {
  month: '2026-09',
  symptoms: [
    { entry_date: '2026-09-01', pain_level: 2, fatigue_level: 3, bowel_movements_count: 1, stool_consistency: 4, blood: false, mood: 'bene' },
    { entry_date: '2026-09-15', pain_level: 6, fatigue_level: 7, bowel_movements_count: 5, stool_consistency: 6, blood: true, mood: 'giu' },
    { entry_date: '2026-09-28', pain_level: 3, fatigue_level: 4, bowel_movements_count: 2, stool_consistency: 5, blood: false, mood: 'bene' },
  ],
  foods: [
    { entry_date: '2026-09-01', meal_type: 'pranzo', foods: 'Riso, pollo, zucchine', reaction: 'nessuna', tolerated: true },
    { entry_date: '2026-09-15', meal_type: 'cena', foods: 'Pomodoro, insalata', reaction: 'severa', tolerated: false, notes: 'Crampi serali.' },
    { entry_date: '2026-09-28', meal_type: 'colazione', foods: 'Latte, caffè', reaction: 'lieve', tolerated: false },
  ],
};

export const mapLocations = [
  { id: 'l1', name: 'Centro IBD — Ospedale San Raffaele', type: 'centro_ibd', city: 'Milano', region: 'Lombardia', country: 'Italia', address: 'Via Olgettina 60' },
  { id: 'l2', name: 'Farmacia Comunale n. 12', type: 'farmacia', city: 'Milano', region: 'Lombardia', country: 'Italia', address: 'Corso Buenos Aires 75' },
  { id: 'l3', name: 'Bagno pubblico — Stazione Centrale', type: 'bagno_pubblico', city: 'Milano', region: 'Lombardia', country: 'Italia' },
  { id: 'l4', name: 'Pronto soccorso — Ospedale Niguarda', type: 'pronto_soccorso', city: 'Milano', region: 'Lombardia', country: 'Italia' },
];

export const assistantMessages = [
  { role: 'assistant', content: 'Ciao! Sono Cary. Ho visto che nelle ultime due settimane il tuo dolore medio è sceso da 6 a 3. Vuoi che controlliamo insieme i pasti che hanno coinciso con i picchi?' },
  { role: 'user', content: 'Sì, cosa ho mangiato i giorni con dolore più alto?' },
  { role: 'assistant', content: 'Il 29 settembre e il 2 ottobre hai registrato dolore 6/10. In entrambi i giorni avevi registrato pasti con **pomodoro** e reazione severa. È un pattern che si ripete: il pomodoro compare nel 70% dei tuoi giorni con crampi. Ti consiglio di marcarlo come trigger nel diario alimentare.' },
];

export const assistantSuggestions = [
  'Quali cibi associeresti ai miei picchi di dolore?',
  'Riepiloga la mia settimana per il gastroenterologo',
  'Come sta andando la mia aderenza alla terapia?',
];

export const clinicalScore = { score: 6, severity: 'lieve' };