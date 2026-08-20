import React, { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Social platforms with brand-colored initials (lucide has no brand icons).
const PLATFORMS = [
  { key: 'whatsapp', label: 'WhatsApp', color: '#25D366', getUrl: (u, t) => `https://wa.me/?text=${encodeURIComponent(t + ' ' + u)}` },
  { key: 'facebook', label: 'Facebook', color: '#1877F2', getUrl: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { key: 'x', label: 'X', color: '#000000', getUrl: (u, t) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { key: 'telegram', label: 'Telegram', color: '#26A5E4', getUrl: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2', getUrl: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { key: 'email', label: 'Email', color: '#6b7280', getUrl: (u, t) => `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(t + ' ' + u)}` },
];

export default function SocialShare() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const url = typeof window !== 'undefined' ? window.location.href : 'https://ibd-care.base44.app';
  const shareText = t('share.text');
  const shareTitle = 'IBD Care';

  const handleNative = async () => {
    try {
      if (navigator.share) await navigator.share({ title: shareTitle, text: shareText, url });
    } catch (e) { /* cancelled */ }
    setOpen(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('share.btn')}
        className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-input bg-background hover:bg-accent transition-colors shrink-0"
      >
        <Share2 className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-border bg-card shadow-lg z-50 p-1.5">
          {PLATFORMS.map((p) => (
            <a
              key={p.key}
              href={p.getUrl(url, shareText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm hover:bg-accent transition-colors"
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: p.color }}>
                {p.label[0]}
              </span>
              <span>{p.label}</span>
            </a>
          ))}
          <button type="button" onClick={handleNative} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm hover:bg-accent transition-colors">
            <Share2 className="w-4 h-4 text-muted-foreground" />
            <span>Condividi…</span>
          </button>
          <button type="button" onClick={copy} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm hover:bg-accent transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            <span>{copied ? t('share.copied') : 'Copia link'}</span>
          </button>
        </div>
      )}
    </div>
  );
}