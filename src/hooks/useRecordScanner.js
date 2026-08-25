import { useState } from 'react';
import { base44 } from '@/api/base44Client';

const TYPES = ['visita', 'esame', 'esame_sangue', 'referto', 'controllo'];
const BLOOD_CATS = ['esame_sangue', 'calprotectina', 'colonscopia', 'ecografia'];
const MED_TYPES = ['farmaco_orale', 'iniezione', 'biologico', 'integratore'];
const MED_FREQ = ['giornaliero', 'settimanale', 'bisettimanale', 'mensile', 'al_bisogno'];

function today() { return new Date().toISOString().slice(0, 10); }

// Hook riusabile: carica un file, lo fa analizzare da scanMedicalDocument (auto)
// e restituisce i dati pronti per un MedicalRecord o un Medication.
// restituisce { scanning, error, scan, clearError }
// scan(file) => { kind: 'record'|'medication'|'duplicate', record, medication, duplicate }
export default function useRecordScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  const scan = async (file) => {
    if (!file) return null;
    setScanning(true);
    setError(null);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      const url = up.file_url;
      const res = await base44.functions.invoke('scanMedicalDocument', { file_url: url });
      const ex = res.data?.extracted || {};
      const dup = res.data?.duplicate;

      if (dup && dup.exists) {
        return { kind: 'duplicate', duplicate: dup, extracted: ex };
      }

      const rtype = TYPES.includes(ex.record_type) ? ex.record_type : 'referto';
      const isTherapy = ex.record_type === 'terapia' && ex.medication && ex.medication.name;

      if (isTherapy) {
        const med = ex.medication || {};
        const created = await base44.entities.Medication.create({
          name: med.name || '',
          type: MED_TYPES.includes(med.type) ? med.type : 'farmaco_orale',
          dosage: med.dosage || '',
          frequency: MED_FREQ.includes(med.frequency) ? med.frequency : 'al_bisogno',
          times: '',
          start_date: med.start_date || ex.record_date || today(),
          active: true,
          notes: med.notes || ''
        });
        return { kind: 'medication', medication: created };
      }

      const record = {
        record_date: ex.record_date || today(),
        type: rtype,
        exam_category: rtype === 'esame_sangue' && BLOOD_CATS.includes(ex.exam_category) ? ex.exam_category : (BLOOD_CATS.includes(ex.exam_category) ? ex.exam_category : ''),
        title: ex.title || file.name.replace(/\.[^.]+$/, ''),
        provider: ex.provider || '',
        location: ex.location || '',
        result_summary: ex.result_summary || '',
        findings: ex.findings || '',
        markers: Array.isArray(ex.markers) ? ex.markers.filter((m) => m && m.name) : [],
        report_file_url: url,
        next_appointment: ex.next_appointment || ''
      };
      return { kind: 'record', record };
    } catch (err) {
      setError(err.message || 'Errore scansione');
      return { kind: 'error', error: err.message || 'Errore scansione' };
    } finally {
      setScanning(false);
    }
  };

  return { scanning, error, scan, clearError: () => setError(null) };
}