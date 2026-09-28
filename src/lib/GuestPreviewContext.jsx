import React, { createContext, useState, useContext, useCallback } from 'react';
import { queryClientInstance } from '@/lib/query-client';
import GuestPreviewBanner from '@/components/GuestPreviewBanner';

// Anteprima ospite admin: permette a un utente con ruolo admin di navigare
// l'app esattamente come un visitatore non loggato (dati demo, route admin
// nascoste, scritture bloccate) senza disconnettere la sessione reale.
// Lo stato persiste in localStorage così sopravvive ai cambi di rotta.
const GuestPreviewContext = createContext(null);
const STORAGE_KEY = 'ibd_guest_preview';

export const GuestPreviewProvider = ({ children }) => {
  const [isGuestPreview, setIsGuestPreview] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });

  const enterGuestPreview = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setIsGuestPreview(true);
  }, []);

  const exitGuestPreview = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setIsGuestPreview(false);
    // Invalida le cache react-query così i dati reali vengono ricaricati.
    try { queryClientInstance.invalidateQueries(); } catch { /* ignore */ }
  }, []);

  return (
    <GuestPreviewContext.Provider value={{ isGuestPreview, enterGuestPreview, exitGuestPreview }}>
      {children}
      {isGuestPreview && <GuestPreviewBanner onExit={exitGuestPreview} />}
    </GuestPreviewContext.Provider>
  );
};

export const useGuestPreview = () => {
  const ctx = useContext(GuestPreviewContext);
  if (!ctx) return { isGuestPreview: false, enterGuestPreview: () => {}, exitGuestPreview: () => {} };
  return ctx;
};