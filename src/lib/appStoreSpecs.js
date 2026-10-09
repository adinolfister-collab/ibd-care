// Requisiti immagini App Store Connect (Apple). Misure in pixel [larghezza, altezza].
// Le schermate accettano orientamento verticale o orizzontale.
const both = (list) => list.flatMap(([w, h]) => [[w, h], [h, w]]);

const IPHONE = both([
  [1320, 2868],
  [1290, 2796],
  [1260, 2736],
  [1284, 2778],
  [1242, 2688],
]);

const IPAD = both([
  [2064, 2752],
  [2048, 2732],
  [1668, 2420],
  [1488, 2266],
  [1640, 2360],
  [1668, 2388],
]);

export const APP_STORE_CATEGORIES = [
  {
    id: 'iphone',
    label: 'Schermate smartphone (iPhone)',
    requirement:
      'PNG o JPEG, senza trasparenza. Da 1 a 10 immagini. Misure ammesse (verticale o orizzontale): 1320×2868, 1290×2796, 1260×2736, 1284×2778, 1242×2688.',
    mimes: ['image/png', 'image/jpeg'],
    sizes: IPHONE,
    max: 10,
  },
  {
    id: 'ipad',
    label: 'Schermate tablet (iPad)',
    requirement:
      'PNG o JPEG, senza trasparenza. Da 1 a 10 immagini. Misure ammesse (verticale o orizzontale): 2064×2752, 2048×2732, 1668×2420, 1488×2266, 1640×2360, 1668×2388.',
    mimes: ['image/png', 'image/jpeg'],
    sizes: IPAD,
    max: 10,
  },
  {
    id: 'promo',
    label: 'Foto promozionali (primo piano)',
    requirement:
      'Apple non prevede una categoria a parte: le foto promozionali compaiono come schermate, quindi valgono le misure iPhone (PNG o JPEG).',
    mimes: ['image/png', 'image/jpeg'],
    sizes: IPHONE,
    max: 10,
  },
  {
    id: 'icon',
    label: 'Icona applicazione',
    requirement:
      'PNG quadrato 1024×1024, senza trasparenza e senza angoli arrotondati (li applica Apple).',
    mimes: ['image/png'],
    sizes: [[1024, 1024]],
    max: 1,
  },
];

export const sizeLabel = (sizes) => sizes.map(([w, h]) => `${w}×${h}`).join(', ');

export function checkImage(cat, file, w, h) {
  const mimeOk = cat.mimes.includes(file.type);
  const sizeOk = cat.sizes.some(([sw, sh]) => sw === w && sh === h);
  return { mimeOk, sizeOk, ok: mimeOk && sizeOk };
}