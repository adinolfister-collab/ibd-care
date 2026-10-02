import { base44 } from '@/api/base44Client';

// Esportazione dati grezzi (GDPR art. 20 - portabilita' / accesso).
// Raccoglie tutte le entita' sanitarie dell'utente in un unico oggetto JSON
// e lo scarica come file. RLS limita automaticamente ai record dell'utente.
export async function exportUserDataAsJson() {
  const [symptoms, foods, meds, records, indices, triggers, medDoses] = await Promise.all([
    base44.entities.SymptomEntry.list('-entry_date', 5000),
    base44.entities.FoodEntry.list('-entry_date', 5000),
    base44.entities.Medication.list('-created_date', 5000),
    base44.entities.MedicalRecord.list('-record_date', 5000),
    base44.entities.ClinicalIndexEntry.list('-entry_date', 5000),
    base44.entities.FoodTriggerTag.list('-created_date', 5000),
    base44.entities.MedicationDose.list('-dose_date', 5000).catch(() => []),
  ]);
  const payload = {
    exported_at: new Date().toISOString(),
    schema_version: '1.0',
    symptom_entries: symptoms,
    food_entries: foods,
    medications: meds,
    medication_doses: medDoses,
    medical_records: records,
    clinical_index_entries: indices,
    food_trigger_tags: triggers,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `IBD-Care-dati-personali_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}