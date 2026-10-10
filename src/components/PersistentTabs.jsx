import React, { createContext, lazy, Suspense, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

// Context che comunica ad AppLayout se e' il tab "attivo" (visibile) o un tab
// persistente inattivo (intero layout nascosto via display:none). Predefinito
// true per tutte le rotte NON gestite da PersistentTabs (rotte normali).
export const PersistentTabContext = createContext({ isActive: true });

const Symptoms = lazy(() => import('@/pages/Symptoms'));
const Community = lazy(() => import('@/pages/Community'));
const Records = lazy(() => import('@/pages/Records'));

// Tab "data-heavy" mantenuti sempre montati per preservare stato delle liste e
// posizione di scroll. Le altre rotte continuano a montarsi on-demand con le
// transizioni AnimatePresence/PageTransition.
const PERSISTENT = [
  { path: '/symptoms', Comp: Symptoms },
  { path: '/community', Comp: Community },
  { path: '/records', Comp: Records },
];
const PERSISTENT_PATHS = PERSISTENT.map((p) => p.path);

// Renderizza sempre i tre tab data-heavy: quello corrispondente al path attivo
// e visibile (isActive=true -> AppLayout con chrome), gli altri sono nascosti
// (isActive=false -> AppLayout con display:none). I figli restano nella stessa
// posizione nel DOM, quindi React ne preserva lo stato. Salva/ripristina lo
// scroll del tab al rientro.
export default function PersistentTabs() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const activePath = location.pathname;
  const scrollRef = useRef({});
  const lastPathRef = useRef(null);

  useEffect(() => {
    const prev = lastPathRef.current;
    // Salva lo scroll del tab persistente che si sta lasciando.
    if (prev && PERSISTENT_PATHS.includes(prev) && prev !== activePath) {
      scrollRef.current[prev] = window.scrollY;
    }
    lastPathRef.current = activePath;
    // Ripristina lo scroll del tab persistente in entrata, dopo il reset
    // sincrono di ScrollToTop. La pagina e' gia' montata -> l'altezza e'
    // disponibile subito, quindi il ripristino e' affidabile.
    if (PERSISTENT_PATHS.includes(activePath)) {
      const saved = scrollRef.current[activePath] ?? 0;
      const id = window.setTimeout(() => {
        window.scrollTo({ top: saved, left: 0, behavior: 'instant' });
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [activePath]);

  if (!isAuthenticated) return null;

  return (
    <Suspense fallback={null}>
      {PERSISTENT.map(({ path, Comp }) => (
        <PersistentTabContext.Provider key={path} value={{ isActive: activePath === path }}>
          <Comp />
        </PersistentTabContext.Provider>
      ))}
    </Suspense>
  );
}