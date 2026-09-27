import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Card morbida di invito alla registrazione, mostrata agli ospiti al posto
// delle funzioni Premium (export PDF/CSV, scanner esami, import, AI).
// Tono positivo e rassicurante, niente lucchetto.
//
// Props:
//   feature   chiave feature (es. "summary_pdf") — per localizzare/futuro tracking
//   className classi extra
export default function GuestSignupCard({ feature, className = '' }) {
  const { t } = useI18n();
  return (
    <Card className={`border-0 shadow-sm bg-accent/40 ${className}`}>
      <CardContent className="p-6 sm:p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-terracotta/15 text-terracotta flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-primary tracking-tight">
          {t('guest.signup_card_title')}
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
          {t('guest.signup_card_desc')}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-5 justify-center">
          <Button asChild className="rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90">
            <Link to="/register">{t('guest.signup_card_cta')}</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/login">{t('guest.signup_card_login')}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}