// Tema "Sereno mediterraneo" — foto tematiche per categoria.
// URL persistenti generati via GenerateImage (media.base44.com).
// `serena` è l'immagine condivisa usata anche nell'hero (PageHeader).

export const THEME_IMAGES = {
  serena: 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/caa358a8a_generated_image.png',
  sintomi: 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/ea7c7df32_generated_image.png',
  alimentazione: 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/9d11e78fd_generated_image.png',
  terapie: 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/a43ecb37a_generated_image.png',
  esami: 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/12ad98354_generated_image.png',
  mappa: 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/766ab788a_generated_image.png',
  community: 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/176eda38a_generated_image.png',
};

export function themeImage(key) {
  return THEME_IMAGES[key] || THEME_IMAGES.serena;
}