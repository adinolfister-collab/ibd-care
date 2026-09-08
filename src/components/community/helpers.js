// Utility condivise dai componenti community.

export function timeAgoShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'ora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString();
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch (e) { return dateStr; }
}

// Costruisce un summary breve e anonimizzato per una registrazione del diario.
export function buildEntrySummary(type, entry) {
  if (!entry) return '';
  const d = formatDate(entry.entry_date || entry.record_date || entry.start_date || entry.created_date);
  if (type === 'symptom') {
    const parts = [];
    if (d) parts.push(d);
    if (entry.pain_level != null) parts.push(`dolore ${entry.pain_level}/10`);
    if (entry.fatigue_level != null) parts.push(`stanchezza ${entry.fatigue_level}/10`);
    if (entry.bowel_movements_count != null) parts.push(`${entry.bowel_movements_count} scariche`);
    return parts.join(' · ');
  }
  if (type === 'meal') {
    const parts = [];
    if (d) parts.push(d);
    if (entry.meal_type) parts.push(entry.meal_type);
    if (entry.foods) parts.push(entry.foods);
    else if (Array.isArray(entry.items) && entry.items.length) {
      parts.push(entry.items.map((i) => i.name).filter(Boolean).join(', '));
    }
    if (entry.reaction && entry.reaction !== 'nessuna') parts.push(`reazione ${entry.reaction}`);
    return parts.join(' · ');
  }
  if (type === 'med') {
    const parts = [];
    if (entry.name) parts.push(entry.name);
    if (entry.dosage) parts.push(entry.dosage);
    if (entry.frequency) parts.push(entry.frequency);
    return parts.join(' · ');
  }
  if (type === 'exam') {
    const parts = [];
    if (d) parts.push(d);
    if (entry.title) parts.push(entry.title);
    if (entry.provider) parts.push(entry.provider);
    return parts.join(' · ');
  }
  return '';
}