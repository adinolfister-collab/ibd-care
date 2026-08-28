import React from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

// Soft paywall overlay shown over the current page (the page stays mounted
// and dimmed). Does not change the route; close with X returns to read-only.
export default function SavePaywall({ open, onClose }) {
  const { t } = useI18n();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 md:p-8 text-center">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-accent text-muted-foreground"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-terracotta/15 text-terracotta flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="font-heading text-2xl font-semibold text-primary tracking-tight">
          {t('paywall.title')}
        </h2>
        <div className="h-px bg-terracotta/70 mx-auto my-3 w-12" />
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {t('paywall.desc')}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-5 justify-center">
          <Link to="/login" className="flex-1">
            <Button className="w-full rounded-xl h-11">{t('paywall.cta_login')}</Button>
          </Link>
          <Link to="/register" className="flex-1">
            <Button variant="outline" className="w-full rounded-xl h-11">{t('paywall.cta_register')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}