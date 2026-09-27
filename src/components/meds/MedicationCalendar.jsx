import React, { useState, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isToday, isBefore, startOfDay, addMonths, subMonths, isSameDay,
  parseISO,
} from 'date-fns';
import { it as itLocale, enUS as enLocale } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, X, Clock, Pill } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { medTypeLabel } from '@/lib/enumLabels';

// Restituisce l'elenco dei farmaci che ci si aspetta di assumere in un dato
// giorno, in base alla frequenza e alla data di inizio. Solo le terapie
// giornaliere generano attese deterministiche; le altre frequenze non hanno un
// giorno fisso memorizzato, quindi non vengono conteggiate come "dimenticate".
const expectedForDay = (meds, day) => {
  const d = format(day, 'yyyy-MM-dd');
  return meds.filter((m) => {
    if (!m.active) return false;
    if (m.frequency !== 'giornaliero') return false;
    if (m.start_date && m.start_date > d) return false;
    return true;
  });
};

const DayCell = ({ day, monthDate, meds, dosesByDate, today, onOpen }) => {
  const isCurrentMonth = day.getMonth() === monthDate.getMonth();
  const key = format(day, 'yyyy-MM-dd');
  const expected = expectedForDay(meds, day);
  const dayDoses = dosesByDate[key] || [];
  const past = isBefore(day, today) && !isSameDay(day, today);

  let taken = 0;
  let missed = 0;
  let skipped = 0;
  // Conta le attese giornaliere
  expected.forEach((m) => {
    const log = dayDoses.find((dd) => dd.medication_id === m.id);
    if (log?.status === 'taken') taken += 1;
    else if (log?.status === 'skipped') skipped += 1;
    else if (past) missed += 1;
  });
  // Dosi extra registrate per farmaci non giornalieri
  const extraTaken = dayDoses.filter(
    (dd) => dd.status === 'taken' && !expected.some((m) => m.id === dd.medication_id)
  ).length;

  const totalTaken = taken + extraTaken;
  const hasMissed = missed > 0;
  const allTaken = expected.length > 0 && missed === 0 && (totalTaken) >= expected.length;
  const pendingToday = isSameDay(day, today) && expected.length > 0 && taken < expected.length;

  const tone = !isCurrentMonth
    ? 'bg-transparent text-muted-foreground/40'
    : hasMissed
      ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
      : allTaken
        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
        : pendingToday
          ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
          : 'bg-card hover:bg-accent/40';

  return (
    <button
      onClick={() => onOpen(day)}
      className={cn(
        'min-h-[64px] md:min-h-[88px] p-1.5 md:p-2 rounded-lg border text-left flex flex-col gap-1 transition-colors',
        tone,
        !isCurrentMonth && 'pointer-events-none opacity-50'
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn('text-xs md:text-sm font-medium', isToday(day) && 'text-terracotta font-bold')}>
          {format(day, 'd')}
        </span>
        {isCurrentMonth && expected.length > 0 && (
          <span className="text-[0.65rem] md:text-xs text-muted-foreground">
            {totalTaken}/{expected.length}
          </span>
        )}
      </div>
      {isCurrentMonth && (
        <div className="flex flex-wrap gap-1">
          {hasMissed && (
            <span className="inline-flex items-center text-[0.6rem] md:text-xs text-rose-600 dark:text-rose-400 font-medium">
              <X className="w-3 h-3 mr-0.5" />{missed}
            </span>
          )}
          {totalTaken > 0 && (
            <span className="inline-flex items-center text-[0.6rem] md:text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="w-3 h-3 mr-0.5" />{totalTaken}
            </span>
          )}
          {skipped > 0 && (
            <span className="inline-flex items-center text-[0.6rem] md:text-xs text-muted-foreground font-medium">
              {skipped} salt.
            </span>
          )}
        </div>
      )}
    </button>
  );
};

const StatusBadge = ({ status, t }) => {
  const map = {
    taken: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    skipped: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    missed: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    pending: 'bg-accent text-muted-foreground',
  };
  const label = {
    taken: t('meds.cal.taken'),
    skipped: t('meds.cal.skipped'),
    missed: t('meds.cal.missed'),
    pending: t('meds.cal.pending'),
  }[status];
  return <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', map[status])}>{label}</span>;
};

const DayDetail = ({ day, meds, doses, onClose, onMark, onSkip, onRemove, t }) => {
  const key = format(day, 'yyyy-MM-dd');
  const dayDoses = doses.filter((d) => d.dose_date === key);
  const expected = expectedForDay(meds, day);
  const past = isBefore(day, startOfDay(new Date()));
  const today = isSameDay(day, startOfDay(new Date()));

  // Unione: attese giornaliere + eventuali dosi extra (non giornaliere) loggate
  const rows = expected.map((m) => {
    const log = dayDoses.find((d) => d.medication_id === m.id);
    let status = 'pending';
    if (log?.status === 'taken') status = 'taken';
    else if (log?.status === 'skipped') status = 'skipped';
    else if (past) status = 'missed';
    return { med: m, status, dose: log || null };
  });
  const extra = dayDoses
    .filter((d) => !expected.some((m) => m.id === d.medication_id))
    .map((d) => ({ med: { id: d.medication_id, name: d.medication_name, dosage: '', type: '', times: '' }, status: d.status, dose: d }));

  const all = [...rows, ...extra];

  return (
    <Dialog open={!!day} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-terracotta" />
            {format(day, 'EEEE d MMMM', { locale: itLocale })}
          </DialogTitle>
          <DialogDescription>{t('meds.cal.detail_desc')}</DialogDescription>
        </DialogHeader>

        {all.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t('meds.cal.nothing_scheduled')}</p>
        ) : (
          <div className="space-y-2.5">
            {all.map(({ med, status, dose }, idx) => (
              <div key={(med.id || '') + idx} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight">{med.name}</p>
                    {med.dosage && <p className="text-xs text-muted-foreground">{med.dosage}</p>}
                    {med.times && (
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {med.times}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={status} t={t} />
                </div>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {status !== 'taken' && (
                    <Button size="sm" onClick={() => onMark(med, day)} className="h-8 rounded-lg">
                      <Check className="w-3.5 h-3.5 mr-1" /> {t('meds.cal.mark_taken')}
                    </Button>
                  )}
                  {status !== 'skipped' && status !== 'taken' && (
                    <Button size="sm" variant="outline" onClick={() => onSkip(med, day)} className="h-8 rounded-lg">
                      {t('meds.cal.mark_skipped')}
                    </Button>
                  )}
                  {dose && (
                    <Button size="sm" variant="ghost" onClick={() => onRemove(dose)} className="h-8 rounded-lg text-muted-foreground">
                      {t('meds.cal.remove_log')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default function MedicationCalendar({ meds, doses, onMark, onSkip, onRemove }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(null);
  const locale = lang === 'en' ? enLocale : itLocale;
  const today = startOfDay(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(monthDate, { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthDate]);

  const dosesByDate = useMemo(() => {
    const map = {};
    (doses || []).forEach((d) => {
      if (!map[d.dose_date]) map[d.dose_date] = [];
      map[d.dose_date].push(d);
    });
    return map;
  }, [doses]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'EEEEEE', { locale }));
  }, [locale]);

  const hasMeds = meds.length > 0;

  return (
    <div>
      {/* Header mese */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="outline" size="icon" onClick={() => setMonthDate((d) => subMonths(d, 1))} className="rounded-lg">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <p className="font-heading font-semibold text-lg capitalize">
          {format(monthDate, 'MMMM yyyy', { locale })}
        </p>
        <Button variant="outline" size="icon" onClick={() => setMonthDate((d) => addMonths(d, 1))} className="rounded-lg">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Griglia */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((w, i) => (
          <div key={i} className="text-center text-[0.65rem] md:text-xs uppercase font-medium text-muted-foreground py-1">
            {w}
          </div>
        ))}
        {days.map((day) => (
          <DayCell
            key={day.toISOString()}
            day={day}
            monthDate={monthDate}
            meds={meds}
            dosesByDate={dosesByDate}
            today={today}
            onOpen={(d) => {
              if (d.getMonth() !== monthDate.getMonth()) return;
              setSelected(d);
            }}
          />
        ))}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center"><span className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-500/30 mr-1.5" />{t('meds.cal.legend_taken')}</span>
        <span className="inline-flex items-center"><span className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-500/30 mr-1.5" />{t('meds.cal.legend_pending')}</span>
        <span className="inline-flex items-center"><span className="w-3 h-3 rounded bg-rose-200 dark:bg-rose-500/30 mr-1.5" />{t('meds.cal.legend_missed')}</span>
      </div>

      {selected && (
        <DayDetail
          day={selected}
          meds={meds}
          doses={doses}
          onClose={() => setSelected(null)}
          onMark={onMark}
          onSkip={onSkip}
          onRemove={onRemove}
          t={t}
        />
      )}
    </div>
  );
}

// helper locale per evitare import extra
function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}