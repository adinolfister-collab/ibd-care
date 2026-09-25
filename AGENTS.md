# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.

## i18n / Stringhe visibili (obbligatorio)

Questa app è multilingua via `src/lib/i18n` (dizionari `it`/`en` + altri, `it` è la fonte canonica, `en` deve rispecchiarla). Regola fissa per ogni modifica:

- **Nessuna stringa visibile hardcodata** (italiano o inglese) nel JSX: label, bottoni, placeholder, empty state, titoli di toast, etichette di enum vanno sempre attraverso `t('chiave')` da `useI18n()`.
- I valori enum salvati nelle entità (es. `meal_type='colazione'`, `reaction='lieve'`, `cooking_method`, `unit`, `med type/frequency`, `pain_location`, `mood`, `record type`, `exam_category`, `service type`, `community category`, `product category`) **non si traducono**: si mostrano tramite l'helper centralizzato `src/lib/enumLabels.js` (es. `t(MEAL_TYPE_KEYS[v])` o `mealTypeLabel(t, v)`). Non dichiarare array di label locali nelle pagine.
- Quando aggiungi una nuova stringa visibile, **nella stessa modifica** aggiungi la chiave a `src/lib/i18n/locales/it.js` e a `src/lib/i18n/locales/en.js`. Le altre lingue (es/fr/de/pt/ru/pl/ro/sq/zh) ricadono automaticamente sull'italiano via `t()`, ma si possono tradurre quando utile.
- Date/numeri formattati: usa `localeForLang(lang)` da `src/lib/enumLabels.js` (con `lang` da `useI18n()`), mai un locale hardcodato come `'it-IT'`.
- Lascia stare i contenuti genuinely data-driven (note libere inserite dall'utente, nomi alimenti del catalogo, contenuti editoriali già strutturati per lingua come `foodLessons.js` e `editorialContent.js`).