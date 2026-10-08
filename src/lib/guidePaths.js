// Percorso pubblico di una guida: lo slug è scelto dall'amministratore.
export function guidePath(language, slug) {
  return language === 'en' ? `/en/guide/${slug}` : `/guide/${slug}`;
}

export function slugify(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}