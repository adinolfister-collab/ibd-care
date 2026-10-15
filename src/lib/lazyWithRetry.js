import { lazy } from 'react';

// lazy() che si riprende da un aggiornamento dell'app: se il file della pagina
// non esiste piu' (deploy nuovo, cache vecchia) ricarica UNA volta la pagina
// per ottenere i file aggiornati, invece di andare in crash.
const KEY = 'lazy_retry_reload_at';

export function lazyWithRetry(factory) {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(KEY);
      return mod;
    } catch (err) {
      const last = Number(sessionStorage.getItem(KEY) || 0);
      if (Date.now() - last > 30000) {
        sessionStorage.setItem(KEY, String(Date.now()));
        window.location.reload();
        return new Promise(() => {});
      }
      throw err;
    }
  });
}