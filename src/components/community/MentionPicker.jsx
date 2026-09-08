import React, { useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Search } from 'lucide-react';

// Popover per selezionare un utente da menzionare. Lista filtrabile per nome.
export default function MentionPicker({ users, onPick, onClose }) {
  const { t } = useI18n();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => (u.name || '').toLowerCase().includes(term));
  }, [q, users]);

  return (
    <div className="absolute z-30 mt-1 w-64 max-w-[80vw] rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('community.mention_search')}
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
        <button type="button" onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">×</button>
      </div>
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-3 py-3 text-xs text-muted-foreground">{users.length === 0 ? t('community.mention_none_yet') : t('community.mention_no_users')}</p>
        ) : (
          filtered.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => onPick(u)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0">
                {(u.name || 'U').charAt(0).toUpperCase()}
              </span>
              <span className="text-sm truncate">{u.name || 'Utente'}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}