// Template motivi per i ticket di supporto. Ogni motivo ha una chiave i18n
// per label e descrizione (it/en). I colori sono usati per i badge admin.
export const SUPPORT_REASONS = [
  { value: 'tecnico', labelKey: 'support_reason.tecnico.label', descKey: 'support_reason.tecnico.desc', color: 'blue' },
  { value: 'account', labelKey: 'support_reason.account.label', descKey: 'support_reason.account.desc', color: 'violet' },
  { value: 'domanda', labelKey: 'support_reason.domanda.label', descKey: 'support_reason.domanda.desc', color: 'teal' },
  { value: 'feedback', labelKey: 'support_reason.feedback.label', descKey: 'support_reason.feedback.desc', color: 'amber' },
  { value: 'abbonamento', labelKey: 'support_reason.abbonamento.label', descKey: 'support_reason.abbonamento.desc', color: 'emerald' },
  { value: 'altro', labelKey: 'support_reason.altro.label', descKey: 'support_reason.altro.desc', color: 'slate' },
];

export const DEFAULT_REASON = 'altro';

export function getReasonTemplate(value) {
  return SUPPORT_REASONS.find((r) => r.value === value) || SUPPORT_REASONS.find((r) => r.value === DEFAULT_REASON);
}

// Mappa colore -> classi Tailwind per badge admin (light mode).
export const REASON_BADGE_CLASSES = {
  blue: 'text-blue-700 bg-blue-50 border-blue-200',
  violet: 'text-violet-700 bg-violet-50 border-violet-200',
  teal: 'text-teal-700 bg-teal-50 border-teal-200',
  amber: 'text-amber-700 bg-amber-50 border-amber-200',
  emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  slate: 'text-slate-600 bg-slate-50 border-slate-200',
};