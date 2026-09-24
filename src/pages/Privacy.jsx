import React from 'react';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import PublicFooter from '@/components/PublicFooter';
import { useI18n } from '@/lib/i18n';

// Pagina pubblica di informativa sulla privacy (necessaria per la scheda
// Google Play). Stile "Rivista mediterranea": PageHeader + testo sereno.
// Contenuto in IT/EN; le altre lingue ricadono sull'italiano (fallback i18n).
const SECTIONS = [
  { title: 'privacy.s_controller_t', body: 'privacy.s_controller_b' },
  { title: 'privacy.s_data_t', body: 'privacy.s_data_b' },
  { title: 'privacy.s_lawful_t', body: 'privacy.s_lawful_b' },
  { title: 'privacy.s_purposes_t', body: 'privacy.s_purposes_b' },
  { title: 'privacy.s_retention_t', body: 'privacy.s_retention_b' },
  { title: 'privacy.s_sharing_t', body: 'privacy.s_sharing_b' },
  { title: 'privacy.s_security_t', body: 'privacy.s_security_b' },
  { title: 'privacy.s_rights_t', body: 'privacy.s_rights_b' },
  { title: 'privacy.s_minors_t', body: 'privacy.s_minors_b' },
  { title: 'privacy.s_changes_t', body: 'privacy.s_changes_b' },
  { title: 'privacy.s_contact_t', body: 'privacy.s_contact_b' },
];

export default function Privacy() {
  const { t } = useI18n();
  return (
    <AppLayout>
      <div className="w-full max-w-2xl mx-auto">
        <PageHeader title={t('privacy.title')} subtitle={t('privacy.subtitle')} />
        <PageEditorial pageKey="privacy" />

        <div className="prose prose-sm max-w-none select-text text-foreground/90 leading-relaxed space-y-6">
          <p className="text-base md:text-lg text-muted-foreground">
            {t('privacy.intro')}
          </p>
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="font-heading text-lg md:text-xl font-semibold text-primary tracking-tight mb-2">
                {t(s.title)}
              </h2>
              <p>{t(s.body)}</p>
            </section>
          ))}
          <p className="text-xs text-muted-foreground italic pt-2 border-t border-border">
            {t('privacy.last_update')}
          </p>
        </div>

        <PublicFooter />
      </div>
    </AppLayout>
  );
}