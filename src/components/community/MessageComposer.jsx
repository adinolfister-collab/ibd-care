import React, { useEffect, useRef, useState } from 'react';
import { Send, AtSign, Paperclip } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import MentionPicker from './MentionPicker';
import DiarySharePicker from './DiarySharePicker';
import SharedEntryCard from './SharedEntryCard';

// Compositore messaggi condiviso (board pubblica e chat privata).
// Supporta menzioni (@) e allegati dal diario (scheda riassuntiva).
// Props: onSubmit(content, mentions, sharedEntry), placeholder, disabled,
// users (lista per menzioni), autoFocus.
export default function MessageComposer({
  onSubmit,
  placeholder,
  disabled,
  users = [],
  autoFocus,
  me,
  inject,
  injectKey,
}) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [mentions, setMentions] = useState([]);
  const [shared, setShared] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [posting, setPosting] = useState(false);
  const wrapRef = useRef(null);

  // Permette a un parent di iniettare testo nel compositore (es. starter).
  useEffect(() => {
    if (inject) {
      setText((c) => `${c}${c && !c.endsWith(' ') ? ' ' : ''}${inject} `);
    }
  }, [injectKey]);

  const submit = async () => {
    const content = text.trim();
    if ((!content && !shared) || posting || disabled) return;
    setPosting(true);
    try {
      await onSubmit(content, mentions, shared);
      setText('');
      setMentions([]);
      setShared(null);
    } finally {
      setPosting(false);
    }
  };

  const pickMention = (u) => {
    setText((c) => `${c}${c && !c.endsWith(' ') ? ' ' : ''}@${u.name} `);
    setMentions((m) => (m.find((x) => x.user_id === u.id) ? m : [...m, { user_id: u.id, name: u.name }]));
    setShowMentions(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      {shared && (
        <div className="mb-2 relative">
          <SharedEntryCard entry={shared} />
          <button
            type="button"
            onClick={() => setShared(null)}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background/80 border border-border text-xs hover:bg-background"
          >×</button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            autoFocus={autoFocus}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          {showMentions && (
            <MentionPicker
              users={users}
              onPick={pickMention}
              onClose={() => setShowMentions(false)}
            />
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowMentions((s) => !s)}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors',
            showMentions ? 'bg-primary/15 text-primary' : 'bg-accent text-accent-foreground hover:bg-accent/70'
          )}
          title={t('community.mention_title')}
        >
          <AtSign className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('community.mention_title')}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowShare(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/70 transition-colors"
          title={t('community.share_pick')}
        >
          <Paperclip className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('community.share_pick')}</span>
        </button>
        <div className="flex-1" />
        <Button onClick={submit} disabled={(!text.trim() && !shared) || posting || disabled} className="h-10 px-4">
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">{t('community.post')}</span>
        </Button>
      </div>

      <DiarySharePicker open={showShare} onClose={() => setShowShare(false)} onPick={(entry) => { setShared(entry); setShowShare(false); }} />
    </div>
  );
}