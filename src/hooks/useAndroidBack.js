import { useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Path considerati "root" dei tab: sul back lasciamo il comportamento nativo.
const ROOT_PATHS = ['/', '/symptoms', '/community', '/abbonamento', '/account', '/login'];

function tabRootFor(path) {
  if (path.startsWith('/symptoms')) return '/symptoms';
  if (path.startsWith('/community')) return '/community';
  if (path.startsWith('/abbonamento')) return '/abbonamento';
  if (path.startsWith('/account')) return '/account';
  if (path.startsWith('/login')) return '/login';
  return '/';
}

// Tasto back Android/web (nessuna dipendenza Capacitor). Quando l'app viene
// aperta direttamente su una schermata figlio (deep link) senza cronologia
// precedente, inserisce la root del tab sotto la schermata corrente tramite
// due navigazioni router (replace root + push figlio). Le due navigazioni
// sono batchate in un unico render -> nessun flash visibile e la cronologia
// resta gestita dal router. Cosi' il back torna alla root del tab invece di
// chiudere l'app. La navigazione in-app normale ha gia' cronologia reale e
// non viene toccata (non interferisce con il back del browser).
export function useAndroidBack() {
  const location = useLocation();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const p = location.pathname;
    if (ROOT_PATHS.includes(p)) return;       // root: back nativo
    if (window.history.length > 1) return;   // cronologia reale: non interferire
    const root = tabRootFor(p);
    if (root === p) return;
    navigate(root, { replace: true });
    navigate(p);
  }, [location.pathname, navigate]);
}