import { useAuth } from '@/lib/AuthContext';

// Restituisce true solo quando lo stato di autenticazione si è risolto e il
// visitatore non è autenticato. Usato dalle pagine dati per decidere se
// mostrare i dataset dimostrativi (vedi src/lib/demoData.js) invece di
// chiamare base44.entities.*, che fallirebbe per un guest sulle entità con
// RLS created_by_id.
export function useIsGuest() {
  const { isAuthenticated, authChecked } = useAuth();
  return authChecked && !isAuthenticated;
}