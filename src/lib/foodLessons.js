// Micro-lezioni alimentari IBD: contenuti statici editoriali brevi.
// Ogni lezione: { id, icon, it/en: { title, body, takeaway } }.
// Visibili a tutti (guest e loggati).

export const FOOD_LESSONS = [
  {
    id: 'fibre_flare',
    it: {
      title: 'Fibre in flare: sì o no?',
      body: 'In fase di riacutizzazione le fibre insolubili (crusca, verdure crude, bucce) possono irritare l\'intestino già infiammato. Si preferiscono fibre solubili (avena, patata lessa, carota cotta) meglio tollerate e utili per le scariche. In remissione si reintroducono gradualmente.',
      takeaway: 'In flare: cottura lunga e fibre solubili. In remissione: reintroduci poco per volta.',
    },
    en: {
      title: 'Fiber during a flare: yes or no?',
      body: 'During a flare, insoluble fiber (bran, raw vegetables, skins) can irritate an already inflamed gut. Soluble fiber (oats, boiled potato, cooked carrot) is better tolerated and helps with diarrhea. In remission, reintroduce fiber gradually.',
      takeaway: 'During a flare: long cooking and soluble fiber. In remission: reintroduce little by little.',
    },
  },
  {
    id: 'lowfodmap',
    it: {
      title: 'Introduzione alla low-FODMAP per IBD',
      body: 'La dieta low-FODMAP riduce zuccheri fermentabili che possono causare gas e gonfiore. Non è una terapia per l\'IBD ma uno strumento a breve termine per capire quali carboidrati fermentano troppo nel tuo intestino. Si fa in 3 fasi: eliminazione (4-6 settimane), reintroduzione uno per uno, personalizzazione.',
      takeaway: 'Non a vita: serve a mappare quali FODMAP tolleri, non a eliminarli tutti per sempre.',
    },
    en: {
      title: 'Low-FODMAP for IBD: an intro',
      body: 'The low-FODMAP diet reduces fermentable sugars that can cause gas and bloating. It is not an IBD treatment but a short-term tool to learn which carbohydrates ferment too much in your gut. It runs in 3 phases: elimination (4-6 weeks), step-by-step reintroduction, personalization.',
      takeaway: 'Not for life: it maps which FODMAPs you tolerate, not a permanent ban.',
    },
  },
  {
    id: 'cottura',
    it: {
      title: 'Cottura e tollerabilità',
      body: 'Lo stesso cibo cambia tollerabilità con la cottura. La cottura al vapore o bollita rompe le fibre e le rende più digeribili; la frittura aggiunge grassi che accelerano il transito e possono scatenare scariche. Annotare il metodo di cottura nel diario ti rivela pattern che il solo nome del cibo nasconde.',
      takeaway: 'Segna sempre il metodo di cottura: è il dato che nessun competitor ti fa registrare.',
    },
    en: {
      title: 'Cooking and tolerance',
      body: 'The same food changes tolerance with cooking. Steaming or boiling breaks down fiber and makes it easier to digest; frying adds fats that speed transit and can trigger bowel movements. Logging the cooking method reveals patterns that the food name alone hides.',
      takeaway: 'Always log the cooking method: it is the data point no competitor records.',
    },
  },
  {
    id: 'idratazione',
    it: {
      title: 'Idratazione in riacutizzazione',
      body: 'Con scariche frequenti si perdono liquidi e sali. Bevi a piccoli sorsi durante la giornata, preferibilmente acqua naturale o soluzioni reidratanti orali. Evita succhi molto zuccherati, alcol e caffeina abbondante che possono peggiorare la diarrea. Un\'urina chiara è un buon segnale.',
      takeaway: 'Sorsi piccoli e frequenti valgono più di grandi quantità tutta insieme.',
    },
    en: {
      title: 'Hydration during a flare',
      body: 'With frequent bowel movements you lose fluids and salts. Sip small amounts through the day, preferably still water or oral rehydration solutions. Avoid very sugary juices, alcohol and heavy caffeine that can worsen diarrhea. Clear urine is a good sign.',
      takeaway: 'Small, frequent sips beat large amounts all at once.',
    },
  },
];

export function getLesson(lang, id) {
  const l = FOOD_LESSONS.find((x) => x.id === id);
  if (!l) return null;
  const text = l[lang] || l.it;
  return { ...text, id };
}