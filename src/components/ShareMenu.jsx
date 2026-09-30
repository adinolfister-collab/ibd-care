import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Share2, Check, Link2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { SITE_BASE } from '@/lib/seo';

// Inline brand glyphs (lucide brand icons are deprecated/removed).
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
const LinkedInGlyph = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z"/></svg>
);
const EmailGlyph = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>
);

const PLATFORMS = [
  { key: 'whatsapp', labelKey: 'news.share_whatsapp', Glyph: WhatsAppGlyph, cls: 'w-4 h-4', getUrl: (u, txt) => `https://wa.me/?text=${encodeURIComponent(txt + ' ' + u)}` },
  { key: 'facebook', labelKey: 'news.share_facebook', Glyph: FacebookGlyph, cls: 'w-4 h-4', getUrl: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { key: 'x', labelKey: 'news.share_x', Glyph: XGlyph, cls: 'w-3.5 h-3.5', getUrl: (u, txt) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}&url=${encodeURIComponent(u)}` },
  { key: 'telegram', labelKey: 'news.share_telegram', Glyph: TelegramGlyph, cls: 'w-4 h-4', getUrl: (u, txt) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(txt)}` },
  { key: 'linkedin', labelKey: 'share.linkedin', Glyph: LinkedInGlyph, cls: 'w-4 h-4', getUrl: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { key: 'email', labelKey: 'share.email', Glyph: EmailGlyph, cls: 'w-4 h-4', getUrl: (u, txt) => `mailto:?subject=${encodeURIComponent(txt)}&body=${encodeURIComponent(txt + ' ' + u)}` },
];

// Unified share component. Replaces ShareApp, SocialShare, PageShareButtons,
// NewsShareButtons. Variants: "icon" (round trigger + dropdown, for headers),
// "labeled" (text trigger + dropdown, for demo/landing sections), "inline"
// (row of brand glyph buttons, for news/community pages). Shares the canonical
// ibd-care.it URL of the current path, or `shareUrl`/`path` when provided.
export default function ShareMenu({ variant = 'icon', title, summary, path, shareUrl, label }) {
  const { t } = useI18n();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  const url = shareUrl || (SITE_BASE + (path != null ? path : location.pathname));
  const shareTitle = title || 'IBD Care';
  const shareText = summary ? (title ? `${title} — ${summary}` : summary) : (t('share.text') || shareTitle);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleNative = async () => {
    try { if (navigator.share) await navigator.share({ title: shareTitle, text: shareText, url }); } catch (e) {}
    setOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {}
  };

  const openIntent = (u) => window.open(u, '_blank', 'noopener,noreferrer');

  // Inline row: brand glyph buttons (News pages, Community header).
  if (variant === 'inline') {
    const btn = 'inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors';
    return (
      <div className="flex items-center gap-1.5">
        {label && <span className="text-xs text-muted-foreground mr-1">{label}</span>}
        <button type="button" onClick={handleNative} aria-label={t('share.btn')} className={btn} title={t('share.btn')}>
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
        </button>
        {PLATFORMS.map((p) => (
          <button key={p.key} type="button" onClick={() => openIntent(p.getUrl(url, shareText))} aria-label={t(p.labelKey)} className={btn} title={t(p.labelKey)}>
            <p.Glyph className={p.cls} />
          </button>
        ))}
        <button type="button" onClick={copyLink} aria-label={t('share.copy_link')} className={btn} title={t('share.copy_link')}>
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  // Dropdown panel (icon + labeled variants).
  const trigger =
    variant === 'labeled' ? (
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-input bg-background hover:bg-accent text-sm font-medium transition-colors">
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
        {copied ? t('share.copied') : (label || t('share.btn'))}
      </button>
    ) : (
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={t('share.btn')} className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-input bg-background hover:bg-accent transition-colors shrink-0">
        {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
      </button>
    );

  return (
    <div className="relative" ref={ref}>
      {trigger}
      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-border bg-card shadow-lg z-50 p-1.5">
          {PLATFORMS.map((p) => (
            <a key={p.key} href={p.getUrl(url, shareText)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm hover:bg-accent transition-colors">
              <p.Glyph className={p.cls} />
              <span>{t(p.labelKey)}</span>
            </a>
          ))}
          <button type="button" onClick={handleNative} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm hover:bg-accent transition-colors">
            <Share2 className="w-4 h-4 text-muted-foreground" />
            <span>{t('share.native')}</span>
          </button>
          <button type="button" onClick={copyLink} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm hover:bg-accent transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4 text-muted-foreground" />}
            <span>{copied ? t('share.copied') : t('share.copy_link')}</span>
          </button>
        </div>
      )}
    </div>
  );
}