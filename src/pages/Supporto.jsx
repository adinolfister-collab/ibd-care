import React from 'react';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import SupportFinderChat from '@/components/community/SupportFinderChat';

export default function Supporto() {
  const { t } = useI18n();
  return (
    <AppLayout>
      <PageHeader
        title={t('support.title')}
        subtitle={t('support.subtitle')}
      />
      <PageEditorial pageKey="support" compact />
      <SupportFinderChat />
    </AppLayout>
  );
}