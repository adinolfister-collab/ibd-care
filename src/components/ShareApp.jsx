import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

export default function ShareApp({ variant = 'icon' }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const shareData = {
    title: 'IBD Care',
    text: t('share.text'),
    url: typeof window !== 'undefined' ? window.location.origin : 'https://ibd-care.base44.app',
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch (e) {
      /* user cancelled or unsupported — fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      /* ignore */
    }
  };

  if (variant === 'icon') {
    return (
      <Button variant="outline" size="icon" onClick={handleShare} aria-label={t('share.btn')} className="rounded-full">
        {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={handleShare} className="rounded-xl">
      {copied ? <Check className="w-4 h-4 mr-1.5 text-emerald-600" /> : <Share2 className="w-4 h-4 mr-1.5" />}
      {copied ? t('share.copied') : t('share.btn')}
    </Button>
  );
}