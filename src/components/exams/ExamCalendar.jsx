import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, CalendarDays, ChevronLeft, ChevronRight, MapPin, Stethoscope } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { demoRecords } from '@/lib/demoData';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, addMonths, format, isToday, isAfter, parseISO,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/EmptyState';
import { cn } from '@/lib/utils';

const catColor = {
  esame_sangue: 'bg-rose-50 text-rose-500',
  calprotectina: 'bg-amber-50 text-amber-600',
  colonscopia: 'bg-violet-50 text-violet-600',
  ecografia: 'bg-sky-50 text-sky-600',
};

export default function ExamCalendar({ reloadKey }) {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [cursor, setCursor] = useState(new Date());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    if (!isAuthenticated) {
      setItems(demoRecords);
      setLoading(false);
      return;
    }
    try {
      const data = await base44.entities.MedicalRecord.list('-record_date', 400);
      setItems(data);
    } catch { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, [reloadKey]);

  // Eventi passati (record_date) + prossimi appuntamenti (next_appointment)
  const events = useMemo(() => {
    const evs = [];
    items.forEach((r) => {
      if (r.record_date) evs.push({ date: parseISO(r.record_date), record: r, kind: 'past' });
      if (r.next_appointment) evs.push({ date: parseISO(r.next_appointment), record: r, kind: 'next' });
    });
    return evs;
  }, [items]);

  const upcoming = useMemo(
    () => events
      .filter((e) => e.kind === 'next' && (isAfter(e.date, new Date()) || isSameDay(e.date, new Date())))
      .sort((a, b) => a.date - b.date),
    [events]
  );

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const today = new Date();

  const eventsFor = (day) => events.filter((e) => isSameDay(e.date, day));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">{t('common.loading')}</span>
      </div>
    );
  }

  const monthLabel = format(cursor, 'MMMM yyyy', { locale: it });

  return (
    <div className="space-y-6">
      {/* Griglia mensile */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCursor((c) => addMonths(c, -1))}
              className="p-2 rounded-full hover:bg-accent"
              aria-label={t('exams.calendar_prev')}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-heading text-xl md:text-2xl font-semibold text-primary capitalize tracking-tight">
              {monthLabel}
            </h3>
            <button
              onClick={() => setCursor((c) => addMonths(c, 1))}
              className="p-2 rounded-full hover:bg-accent"
              aria-label={t('exams.calendar_next')}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => (
              <div key={i} className="text-center text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = isSameMonth(day, cursor);
              const dayEvents = eventsFor(day);
              const hasNext = dayEvents.some((e) => e.kind === 'next');
              const hasPast = dayEvents.some((e) => e.kind === 'past');
              const isTodayCell = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'flex flex-col items-center justify-start rounded-lg aspect-square min-h-[44px] pt-1.5 relative',
                    inMonth ? 'bg-card' : 'bg-transparent opacity-40',
                    dayEvents.length > 0 && 'ring-1 ring-border/60'
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-medium leading-none w-6 h-6 flex items-center justify-center rounded-full',
                      isTodayCell && 'bg-primary text-primary-foreground',
                      !isTodayCell && inMonth && 'text-foreground',
                      !inMonth && 'text-muted-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center">
                      {hasNext && <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />}
                      {hasPast && <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] font-semibold text-muted-foreground leading-none">+{dayEvents.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/60">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-terracotta" /> {t('exams.calendar_legend_next')}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50" /> {t('exams.calendar_legend_past')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Agenda prossimi controlli */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-4 h-4 text-terracotta" />
          <h3 className="font-heading text-lg font-semibold text-primary tracking-tight">
            {t('exams.calendar_upcoming')}
          </h3>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={t('exams.calendar_empty')}
            description={t('exams.scan_hint')}
          />
        ) : (
          <div className="space-y-3">
            {upcoming.map((e, i) => {
              const r = e.record;
              return (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center justify-center bg-terracotta/10 rounded-xl px-3 py-2 min-w-[56px]">
                        <span className="text-[10px] uppercase tracking-wide text-terracotta/80 font-medium">
                          {format(e.date, 'MMM', { locale: it })}
                        </span>
                        <span className="font-heading text-xl font-semibold text-terracotta leading-none mt-0.5">
                          {format(e.date, 'd')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{r.title}</p>
                        <p className="text-sm text-muted-foreground capitalize">{format(e.date, 'EEEE d MMMM yyyy', { locale: it })}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                          {r.exam_category && (
                            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', catColor[r.exam_category])}>
                              <Stethoscope className="w-3 h-3" /> {t('exams.cat_' + r.exam_category)}
                            </span>
                          )}
                          {r.provider && <span className="text-xs text-muted-foreground">{r.provider}</span>}
                          {r.location && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" /> {r.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}