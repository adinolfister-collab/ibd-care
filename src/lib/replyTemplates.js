// Template di risposta predefiniti per la casella di supporto admin.
// Ogni template ha una chiave i18n per etichetta e corpo (it/en).
// `reasons` indica i motivi ticket a cui il template è più rilevante
// (usato per ordinare i chip pertinenti per primi).
export const REPLY_TEMPLATES = [
  {
    id: 'welcome_new_user',
    labelKey: 'reply_tpl.welcome.label',
    bodyKey: 'reply_tpl.welcome.body',
    reasons: [],
  },
  {
    id: 'tech_ack',
    labelKey: 'reply_tpl.tech_ack.label',
    bodyKey: 'reply_tpl.tech_ack.body',
    reasons: ['tecnico'],
  },
  {
    id: 'account_help',
    labelKey: 'reply_tpl.account_help.label',
    bodyKey: 'reply_tpl.account_help.body',
    reasons: ['account'],
  },
  {
    id: 'feedback_thanks',
    labelKey: 'reply_tpl.feedback_thanks.label',
    bodyKey: 'reply_tpl.feedback_thanks.body',
    reasons: ['feedback'],
  },
  {
    id: 'subscription_help',
    labelKey: 'reply_tpl.subscription_help.label',
    bodyKey: 'reply_tpl.subscription_help.body',
    reasons: ['abbonamento'],
  },
  {
    id: 'generic_ack',
    labelKey: 'reply_tpl.generic_ack.label',
    bodyKey: 'reply_tpl.generic_ack.body',
    reasons: ['domanda', 'altro'],
  },
  {
    id: 'close_resolved',
    labelKey: 'reply_tpl.close_resolved.label',
    bodyKey: 'reply_tpl.close_resolved.body',
    reasons: [],
  },
];

// Ordina i template mettendo prima quelli pertinenti al motivo del ticket.
export function sortedTemplatesForReason(reason) {
  if (!reason) return REPLY_TEMPLATES;
  return [...REPLY_TEMPLATES].sort((a, b) => {
    const aMatch = a.reasons.includes(reason) ? 0 : 1;
    const bMatch = b.reasons.includes(reason) ? 0 : 1;
    return aMatch - bMatch;
  });
}