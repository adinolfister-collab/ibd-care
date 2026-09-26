import React from 'react';
import PublicFooter from '@/components/PublicFooter';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';
import AppLayout from '@/components/AppLayout';
import TopRightActions from '@/components/TopRightActions';
import LanguageMenu from '@/components/LanguageMenu';
import { useI18n } from '@/lib/i18n';

export default function About() {
  const { t } = useI18n();
  return (
    <AppLayout>
      <div className="w-full max-w-2xl mx-auto">
        <PageHeader title={t('about.title')} subtitle={t('about.subtitle')} />
        <PageEditorial pageKey="about" />

        <div className="prose max-w-none select-text text-foreground/90 leading-relaxed space-y-4">
          <p>{t('about.para1')}</p>
          <p>{t('about.para2')}</p>
          <p>{t('about.para3')}</p>
          <p>{t('about.para4')}</p>
        </div>

        <EditorialBlock sectionKey="about_privacy" align="right" />

        <PublicFooter />
      </div>
    </AppLayout>
  );
}