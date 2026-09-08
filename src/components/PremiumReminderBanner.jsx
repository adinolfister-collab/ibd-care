import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Banner "Rivista mediterranea" che ricorda i vantaggi Premium sopra una
// lista di registrazioni. Solo presentazionale; visibile a chi non è abbonato.
//
// Props:
//   message  testo breve (opzionale); default descrive storico + export PDF
//   to       destinazione del link (default "/abbonamento")
export default function PremiumReminderBanner({ message, to = '/abbonamento' }) {
  const { t } = useI18n();
  const text = message || t('premium.desc');
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-xl border border-terracotta/40 bg-gradient-to-r from-primary/5 to-accent/40 px-4 py-3"
    >
      {/* riflesso terracotta che pulsa dolcemente */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 w-20 h-20 rounded-full bg-terracotta/15 blur-2xl"
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative flex items-center gap-3">
        <motion.span
          className="shrink-0 inline-flex w-9 h-9 items-center justify-center rounded-full bg-terracotta/15"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Crown className="w-4.5 h-4.5 text-terracotta" />
        </motion.span>
        <p className="text-xs md:text-sm text-foreground/85 leading-snug flex-1">
          {text}{' '}
          <Link
            to={to}
            className="inline-flex items-center gap-1 font-medium text-terracotta underline-offset-2 hover:underline"
          >
            {t('premium.cta')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </div>
    </motion.div>
  );
}