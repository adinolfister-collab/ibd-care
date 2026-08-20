// Tema "Rivista mediterranea" — foto tematiche per categoria.
// URL persistenti generati via GenerateImage (media.base44.com).
// `serena` è l'immagine condivisa usata anche nel masthead (PageHeader).

export const THEME_IMAGES = {
  serena: 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/9b63fdc12_generated_image.png',
  sintomi: 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/60b89938f_generated_image.png',
  alimentazione: 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/0dabb264e_generated_image.png',
  terapie: 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/19904ce49_generated_image.png',
  esami: 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/49a36b357_generated_image.png',
  mappa: 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/ee4348bc6_generated_image.png',
  community: 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/9515eddfe_generated_image.png',
};

export function themeImage(key) {
  return THEME_IMAGES[key] || THEME_IMAGES.serena;
}