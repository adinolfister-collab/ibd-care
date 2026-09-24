import React from 'react';
import { Smartphone, Share, Download, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import InstallAppButton from '@/components/InstallAppButton';
import { Card, CardContent } from '@/components/ui/card';

export default function ScaricaApp() {
  const { t } = useI18n();
  return (
    <AppLayout>
      <PageHeader title={t('download.page_title')} subtitle={t('download.page_subtitle')} />

      <div className="mb-6 flex justify-center">
        <InstallAppButton />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* iPhone */}
        <Card className="border border-border shadow-sm bg-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-terracotta" />
              <h3 className="font-heading font-semibold">{t('download.ios_title')}</h3>
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="font-medium text-foreground">1.</span> {t('download.ios_step1')}</li>
              <li className="flex gap-2"><span className="font-medium text-foreground">2.</span> {t('download.ios_step2')} <Share className="inline w-4 h-4 text-terracotta align-text-bottom" /></li>
              <li className="flex gap-2"><span className="font-medium text-foreground">3.</span> {t('download.ios_step3')}</li>
            </ol>
          </CardContent>
        </Card>

        {/* Android */}
        <Card className="border border-border shadow-sm bg-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-terracotta" />
              <h3 className="font-heading font-semibold">{t('download.android_title')}</h3>
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="font-medium text-foreground">1.</span> {t('download.android_step1')}</li>
              <li className="flex gap-2"><span className="font-medium text-foreground">2.</span> {t('download.android_step2')}</li>
              <li className="flex gap-2"><span className="font-medium text-foreground">3.</span> {t('download.android_step3')}</li>
            </ol>
          </CardContent>
        </Card>

        {/* Desktop */}
        <Card className="border border-border shadow-sm bg-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-5 h-5 text-terracotta" />
              <h3 className="font-heading font-semibold">{t('download.desktop_title')}</h3>
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="font-medium text-foreground">1.</span> {t('download.desktop_step1')}</li>
              <li className="flex gap-2"><span className="font-medium text-foreground">2.</span> {t('download.desktop_step2')}</li>
              <li className="flex gap-2"><span className="font-medium text-foreground">3.</span> {t('download.desktop_step3')}</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        {t('download.installed')}
      </p>
    </AppLayout>
  );
}