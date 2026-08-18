import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const APP_URL = 'https://ibd-care.it';

// Inline brand glyphs (lucide brand icons are deprecated/removed)
const FacebookGlyph = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/></svg>
);
const XGlyph = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.96 6.82H1.69l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.16 17.93h1.83L7.01 4.13H5.05l12.03 16.05Z"/></svg>
);
const WhatsAppGlyph = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.13c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.24-8.23 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.39 1.01 2.55.12.17 1.74 2.66 4.21 3.73.59.25 1.05.4 1.41.51.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.1-.22-.16-.47-.28Z"/></svg>
);
const TelegramGlyph = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M21.94 4.6 18.6 20.16c-.25 1.1-.91 1.37-1.84.85l-5.1-3.76-2.46 2.37c-.27.27-.5.5-1.02.5l.36-5.16 9.43-8.52c.41-.36-.09-.56-.64-.2L5.83 13.26.82 11.69c-1.09-.34-1.11-1.09.23-1.61L20.5 2.51c.91-.33 1.7.2 1.44 2.09Z"/></svg>
);
const InstagramGlyph = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
);

const btnBase =
  'inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors';

export default function NewsShareButtons({ title, summary }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const shareText = summary ? `${title} — ${summary}` : title;
  const shareUrl = APP_URL;
  const enc = (s) => encodeURIComponent(s || '');
  const encUrl = encodeURIComponent(shareUrl);

  const intents = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
    x: `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${encUrl}`,
    whatsapp: `https://wa.me/?text=${enc(`${shareText} ${shareUrl}`)}`,
    telegram: `https://t.me/share/url?url=${encUrl}&text=${enc(shareText)}`,
  };

  const openIntent = (url) => window.open(url, '_blank', 'noopener,noreferrer');

  const handleNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      } catch (e) {
        /* cancelled — fall through to copy */
      }
    }
    copyLink();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      /* ignore */
    }
  };

  return (
    <div className="flex items-center gap-1 mt-2.5" onClick={(e) => e.preventDefault()}>
      <button type="button" onClick={handleNative} aria-label={t('news.share')} className={btnBase} title={t('news.share')}>
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
      </button>
      <button type="button" onClick={() => openIntent(intents.facebook)} aria-label={t('news.share_facebook')} className={btnBase} title={t('news.share_facebook')}>
        <FacebookGlyph className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => openIntent(intents.x)} aria-label={t('news.share_x')} className={btnBase} title={t('news.share_x')}>
        <XGlyph className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={() => openIntent(intents.whatsapp)} aria-label={t('news.share_whatsapp')} className={btnBase} title={t('news.share_whatsapp')}>
        <WhatsAppGlyph className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => openIntent(intents.telegram)} aria-label={t('news.share_telegram')} className={btnBase} title={t('news.share_telegram')}>
        <TelegramGlyph className="w-4 h-4" />
      </button>
      <button type="button" onClick={copyLink} aria-label={t('news.share_instagram')} className={btnBase} title={t('news.share_instagram')}>
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <InstagramGlyph className="w-4 h-4" />}
      </button>
    </div>
  );
}