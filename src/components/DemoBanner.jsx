import React from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Banner mostrato in cima alle pagine dati ai visitatori non autenticati:
// avvisa che i contenuti sono dimostrativi e invita a registrarsi per
// visualizzare i propri dati reali. Discreto ma visibile, in tinta terracotta.
export default function DemoBanner({ className = '' }) {
  const { t } = useI18n();
  return (
    <div className={`mb-4 rounded-xl border border-terracotta/30 bg-terracotta/[0.06] px-4 py-3 flex items-center gap-3 ${className}`}>
      <Eye className="w-4 h-4 text-terracotta shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{t('demo.banner_title')}</p>
        <p className="text-xs text-muted-foreground leading-snug">{t('demo.banner_desc')}</p>
      </div>
      <Link
        to="/register"
        className="shrink-0 rounded-lg bg-terracotta text-terracotta-foreground text-xs font-semibold px-3 py-2 hover:bg-terracotta/90 transition-colors"
      >
        {t('demo.cta_register')}
      </Link>
    </div>
  );
}