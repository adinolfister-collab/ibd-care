import React from 'react';
import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Bottone "Invita un amico" distribuito nell'app. Per gli utenti autenticati
// porta alla pagina /invita dove possono generare e condividere il proprio
// link referral; per gli ospiti mostra la stessa CTA (la pagina spiega tutto).
// Variante "card" per posizioni in evidenza (Home), "compact" per toolbar.
export default function InviteFriendButton({ variant = 'card', className }) {
  const { t } = useI18n();

  if (variant === 'compact') {
    return (
      <Link
        to="/invita"
        className={cn(
          'inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-terracotta/15 text-terracotta hover:bg-terracotta/25 text-sm font-medium transition-colors',
          className
        )}
      >
        <Gift className="w-4 h-4" />
        {t('invite.cta')}
      </Link>
    );
  }

  return (
    <Link
      to="/invita"
      className={cn(
        'block rounded-2xl border border-terracotta/30 bg-gradient-to-br from-terracotta/10 to-accent/40 p-5 hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-terracotta/20 flex items-center justify-center shrink-0">
          <Gift className="w-6 h-6 text-terracotta" />
        </div>
        <div>
          <p className="font-heading text-base font-semibold leading-snug">
            {t('invite.card_title')}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
            {t('invite.card_desc')}
          </p>
        </div>
      </div>
    </Link>
  );
}