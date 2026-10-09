// Requisiti immagini Google Play Console. Misure in pixel.
const MB = 1024 * 1024;

const screenshotDims = (w, h) => {
  const min = Math.min(w, h);
  const max = Math.max(w, h);
  return min >= 320 && max <= 3840 && max <= min * 2;
};

export const APP_STORE_CATEGORIES = [
  {
    id: 'phone',
    label: 'Schermate smartphone',
    requirement:
      'PNG o JPEG, massimo 8 MB. Da 2 a 8 immagini. Ogni lato tra 320 e 3840 px; il lato lungo non può superare il doppio del lato corto.',
    mimes: ['image/png', 'image/jpeg'],
    maxBytes: 8 * MB,
    dimOk: screenshotDims,
    max: 8,
  },
  {
    id: 'tablet',
    label: 'Schermate tablet da 10 pollici',
    requirement:
      'PNG o JPEG, massimo 8 MB ciascuna. Fino a 8 immagini. Proporzioni 16:9 o 9:16; ogni lato tra 1080 e 7680 px.',
    mimes: ['image/png', 'image/jpeg'],
    maxBytes: 8 * MB,
    dimOk: (w, h) => {
      const min = Math.min(w, h);
      const max = Math.max(w, h);
      return min >= 1080 && max <= 7680 && Math.abs(max * 9 - min * 16) <= 16;
    },
    max: 8,
  },
  {
    id: 'feature',
    label: 'Immagine promozionale (feature graphic)',
    requirement: 'PNG o JPEG, esattamente 1024×500 px, massimo 15 MB.',
    mimes: ['image/png', 'image/jpeg'],
    maxBytes: 15 * MB,
    dimOk: (w, h) => w === 1024 && h === 500,
    max: 1,
  },
  {
    id: 'icon',
    label: 'Icona applicazione',
    requirement: 'PNG a 32 bit, esattamente 512×512 px, massimo 1024 KB.',
    mimes: ['image/png'],
    maxBytes: 1024 * 1024,
    dimOk: (w, h) => w === 512 && h === 512,
    max: 1,
  },
];

export function checkImage(cat, file, w, h) {
  const mimeOk = cat.mimes.includes(file.type);
  const sizeOk = cat.dimOk(w, h) && file.size <= cat.maxBytes;
  return { mimeOk, sizeOk, ok: mimeOk && sizeOk };
}