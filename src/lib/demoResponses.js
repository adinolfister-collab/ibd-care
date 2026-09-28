// Localized, pre-formed "demo" responses for the costly Premium features
// (AI assistant and exam scanner/import) when the visitor is unauthenticated.
// No backend call is made: these strings let the guest experience the flow
// without consuming integration credits. Content is illustrative only.

export const demoAssistantReply = {
  it: `Ecco un esempio di ciò che Cary può fare con i tuoi dati reali.\n\nDalle tue registrazioni delle ultime due settimane noto un lieve aumento del dolore nei giorni in cui compaiono latticini e cibi fritti. La stanchezza resta moderata e le scariche si mantengono sotto controllo nei giorni di remissione.\n\nConsiglio: prova a ridurre i latticini per 7–10 giorni e continua a registrare i sintomi per confermare la correlazione. Condividi questo riepilogo con il tuo gastroenterologo al prossimo controllo.\n\n_(Esempio di risposta — nella versione reale Cary analizza i tuoi dati veri.)_`,
  en: `Here's an example of what Cary can do with your real data.\n\nFrom your logs over the last two weeks I notice a slight increase in pain on days with dairy and fried foods. Fatigue stays moderate and bowel movements remain controlled on remission days.\n\nTip: try reducing dairy for 7–10 days and keep logging symptoms to confirm the correlation. Share this summary with your gastroenterologist at your next check-up.\n\n_(Example response — in the real version Cary analyzes your actual data.)_`,
};

export const demoAssistantGreeting = {
  it: 'Ciao! Sono Cary. Questa è una **demo** dell\'assistente AI: scrivimi e ti risponderò con un esempio.Registrandoti, Cary analizzerà i tuoi dati veri.',
  en: 'Hi! I\'m Cary. This is an **AI assistant demo**: write to me and I\'ll reply with an example. Once you sign up, Cary analyzes your real data.',
};

// Simulated extracted exam record for the scanner demo.
export function demoExtractedRecord(fileName) {
  const base = new Date().toISOString().slice(0, 10);
  return {
    type: 'esame_sangue',
    exam_category: 'esame_sangue',
    record_date: base,
    title: (fileName || 'Emocromo').replace(/\.[^.]+$/, ''),
    provider: 'Laboratorio Demolab',
    findings: 'Quadro nel complesso nei limiti. PCR leggermente elevata.',
    result_summary: 'Estrazione automatica di marker e valori dal referto (esempio).',
    next_appointment: '',
    markers: [
      { name: 'PCR', value: '6,2', unit: 'mg/L', ref_low: '0', ref_high: '5', flag: 'high' },
      { name: 'Emoglobina', value: '13,8', unit: 'g/dL', ref_low: '12', ref_high: '16', flag: 'normal' },
      { name: 'Ferritina', value: '42', unit: 'µg/L', ref_low: '30', ref_high: '300', flag: 'normal' },
      { name: 'Calprotectina', value: '120', unit: 'µg/g', ref_low: '0', ref_high: '50', flag: 'high' },
    ],
  };
}

export function demoExtractedMedication(fileName) {
  const base = new Date().toISOString().slice(0, 10);
  return {
    name: 'Mesalazina',
    type: 'farmaco_orale',
    dosage: '1,5 g',
    frequency: 'giornaliero',
    start_date: base,
    active: true,
    notes: 'Terapia di mantenimento (esempio).',
  };
}