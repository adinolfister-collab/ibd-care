import React, { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { timeAgoShort } from './helpers';

// Campanella notifiche con badge conteggio non lette. Apre un dropdown con
// la lista; "segna tutte come lette" marca read=true.
export default function NotificationsBell() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const data = await base44.entities.Notification.list('-created_date', 30);
      setItems(data);
    } catch (e) { setItems([]); }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    load();
    const unsub = base44.entities.Notification.subscribe(load);
    return unsub;
  }, [isAuthenticated]);

  const unread = items.filter((n) => !n.read).length;

  const markAll = async () => {
    const unreadItems = items.filter((n) => !n.read);
    if (unreadItems.length === 0) return;
    await base44.entities.Notification.bulkUpdate(
      unreadItems.map((n) => ({ id: n.id, read: true }))
    );
    load();
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-accent transition-colors"
        aria-label={t('community.notif_title')}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-terracotta text-terracotta-foreground text-[10px] font-semibold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-border bg-popover shadow-lg z-30 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <p className="font-heading font-semibold text-sm">{t('community.notif_title')}</p>
              {unread > 0 && (
                <button type="button" onClick={markAll} className="text-[11px] text-primary hover:underline">
                  {t('community.mark_all_read')}
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <BellOff className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{t('community.no_notifications')}</p>
                </div>
              ) : (
                items.map((n) => (
                  <div
                    key={n.id}
                    className={`px-3 py-2.5 border-b border-border/60 last:border-0 ${n.read ? 'bg-transparent' : 'bg-primary/5'}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0">
                        {(n.title || 'U').charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{n.title || 'Utente'}</span>{' '}
                          <span className="text-muted-foreground">{t('community.notif_' + n.type)}</span>
                        </p>
                        {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                        <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgoShort(n.created_date)}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-terracotta mt-1.5 shrink-0" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}