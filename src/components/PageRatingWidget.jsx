import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const VISITOR_KEY = 'ibd_visitor_id';
const RATING_PREFIX = 'ibd_rating_';

function getOrCreateVisitor() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        (crypto && crypto.randomUUID && crypto.randomUUID()) ||
        Date.now().toString(36) + Math.random().toString(36).slice(2);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

function storedKey(path) {
  return RATING_PREFIX + path;
}

function getStoredStars(path) {
  try {
    const v = localStorage.getItem(storedKey(path));
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
}

export default function PageRatingWidget() {
  const { t } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const [hover, setHover] = useState(0);
  const [saved, setSaved] = useState(0);
  const [busy, setBusy] = useState(false);
  const [thanked, setThanked] = useState(false);

  useEffect(() => {
    setSaved(getStoredStars(path));
    setThanked(false);
    setHover(0);
  }, [path]);

  const submit = async (stars) => {
    if (busy) return;
    setBusy(true);
    setSaved(stars);
    setThanked(true);
    try {
      await base44.entities.Feedback.create({
        path,
        stars,
        user_id: user?.id || '',
        session_id: user?.id ? '' : getOrCreateVisitor(),
      });
      try { localStorage.setItem(storedKey(path), String(stars)); } catch {}
    } catch {
      //Feedback non salvato: lasciamo lo stato locale ma non blocciamo l'utente
    } finally {
      setBusy(false);
    }
  };

  const shown = hover || saved || 0;

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      <p className="font-heading text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {thanked ? t('feedback.thanks') : t('feedback.rate_label')}
      </p>
      <div className="flex items-center gap-1" role="group" aria-label={t('feedback.rate_label')}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={busy}
            onClick={() => submit(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            aria-label={`${n} ${t('feedback.rate_label')}`}
            className={cn(
              'p-1 rounded-full transition-transform active:scale-90 disabled:opacity-50',
              'min-h-[44px] min-w-[44px] flex items-center justify-center'
            )}
          >
            <Star
              className={cn(
                'w-6 h-6 transition-colors',
                n <= shown
                  ? 'fill-terracotta text-terracotta'
                  : 'fill-transparent text-muted-foreground/40'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}