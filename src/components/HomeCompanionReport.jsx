import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, FileDown, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import CaryAvatar from '@/components/CaryAvatar';
import { Button } from '@/components/ui/button';

// Blocco homepage: Cary (compagno, free) + Report pronti per il gastro (Premium).
// Visibile a guest e loggati per massimizzare acquisizione e conversione.
export default function HomeCompanionReport() {
  const { t } = useI18n();
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Cary companion (free) */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-accent/40 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <CaryAvatar className="w-12 h-12" />
          <div>
            <p className="text-[0.65rem] font-heading font-semibold uppercase tracking-[0.2em] text-terracotta mb-0.5">
              {t('home.companion_badge')}
            </p>
            <h3 className="font-heading text-xl font-semibold text-foreground leading-tight">{t('home.companion_title')}</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{t('home.companion_desc')}</p>
        <Link to="/assistant" className="mt-4">
          <Button className="rounded-xl w-full">
            <HeartPulse className="w-4 h-4 mr-1.5" />
            {t('home.companion_cta')}
          </Button>
        </Link>
      </div>

      {/* Report gastro (Premium) */}
      <div className="rounded-2xl border-2 border-terracotta/40 bg-gradient-to-br from-terracotta/10 to-card p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-terracotta/15 flex items-center justify-center">
            <FileDown className="w-6 h-6 text-terracotta" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="w-3 h-3 text-terracotta" />
              <span className="text-[0.65rem] font-heading font-semibold uppercase tracking-[0.2em] text-terracotta">{t('home.report_badge')}</span>
            </div>
            <h3 className="font-heading text-xl font-semibold text-foreground leading-tight">{t('home.report_title')}</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{t('home.report_desc')}</p>
        <Link to="/abbonamento" className="mt-4">
          <Button className="rounded-xl w-full bg-terracotta hover:bg-terracotta/90 text-terracotta-foreground">
            <Lock className="w-4 h-4 mr-1.5" />
            {t('home.report_cta')}
          </Button>
        </Link>
      </div>
    </div>
  );
}