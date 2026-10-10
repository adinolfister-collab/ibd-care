import { Navigate, useLocation } from 'react-router-dom';

// Reindirizza i visitatori alla registrazione/accesso e li riporta alla pagina richiesta.
export default function RequireLogin() {
  const { pathname, search } = useLocation();
  const returnTo = encodeURIComponent(pathname + search);
  return <Navigate to={`/register?returnTo=${returnTo}`} replace />;
}