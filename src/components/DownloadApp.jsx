import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLogo from '@/components/AppLogo';
import { useI18n } from '@/lib/i18n';

const APP_URL = 'https://ibd-care.it';

export default function DownloadApp({ variant = 'icon' }) {
  const { t } = useI18n();

  const open = () => {
    window.open(APP_URL, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'icon') {
    return (
      <Button variant="ghost" size="icon" onClick={open} aria-label={t('download.app')} className="rounded-full">
        <AppLogo className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={open} className="rounded-full">
      <AppLogo className="w-4 h-4 mr-1.5" />
      {t('download.app')}
    </Button>
  );
}