import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

// Shown to non-admin users on /shop and /shop/:slug while the store is in
// standby. Admins see the real shop (gated in the page, not here).
export default function ShopStandby() {
  const { t } = useI18n();
  return (
    <AppLayout>
      <PageHeader title={t('shop.title')} subtitle={t('shop.subtitle')} />
      <div className="flex flex-col items-center justify-center text-center py-16 md:py-24">
        <div className="w-16 h-16 rounded-2xl bg-terracotta/15 text-terracotta flex items-center justify-center mb-5">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-primary tracking-tight">
          {t('shop.standby_title')}
        </h2>
        <div className="h-px bg-terracotta/70 my-4 w-16" />
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-md">
          {t('shop.standby_desc')}
        </p>
        <Link to="/" className="mt-7">
          <Button variant="outline" className="rounded-xl">{t('common.back')}</Button>
        </Link>
      </div>
    </AppLayout>
  );
}