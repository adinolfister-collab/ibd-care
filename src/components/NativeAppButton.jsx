import React from 'react';
import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

// Pulsante "Scarica/app nativa" in alto a destra. Su mobile apre lo store
// corretto (App Store / Google Play) se configurato, altrimenti il link
// web dell'app (che funge da universal link se l'app nativa è installata).
// Su desktop apre la pagina web di download.

const APP_WEB_URL = 'https://ibd-care.it';
// Imposta questi URL quando saranno disponibili gli store listing.
const IOS_STORE_URL = '';
const ANDROID_STORE_URL = '';

function detect() {
  if (typeof navigator === 'undefined') return { isIOS: false, isAndroid: false };
  const ua = navigator.userAgent || '';
  return {
    isIOS: /iphone|ipad|ipod/i.test(ua),
    isAndroid: /android/i.test(ua),
  };
}

export default function NativeAppButton({ size = 'icon', className = '' }) {
  const { t } = useI18n();

  const open = () => {
    const { isIOS, isAndroid } = detect();
    const storeUrl = isIOS ? IOS_STORE_URL : isAndroid ? ANDROID_STORE_URL : '';
    if (storeUrl) {
      window.open(storeUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    // Nessuno store configurato: apri l'app web (universal link / download).
    window.open(APP_WEB_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={open}
      aria-label={t('download.native') || t('download.app')}
      className={`rounded-full text-terracotta hover:bg-terracotta/10 ${className}`}
    >
      <Smartphone className="w-5 h-5" />
    </Button>
  );
}