import { useLocation } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { resolveRouteMeta } from '@/lib/seo';
import { useI18n } from '@/lib/i18n';

// Componente centrale: deriva i meta dalla rotta corrente e li applica.
// Vive una sola volta nell'albero (in AuthenticatedApp) così ogni cambio
// percorso aggiorna title/description/canonical/robots senza toccare le pagine.
export default function SeoMetaManager() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const meta = resolveRouteMeta(pathname, t);
  usePageMeta(meta);
  return null;
}