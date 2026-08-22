import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Droplet, Smile, FileDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/EmptyState';
import { exportCoursePdf } from '@/lib/coursePdf';

const MOOD_MAP = { buono: 5, discreto: 4, ansia: 3, giu: 2, irritabile: 1 };
const MOOD_KEYS = ['buono', 'discreto', 'ansia', 'giu', 'irritabile'];

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function keyOf(d) { return d.toISOString().slice(0, 10); }
function fmtDay(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function DiseaseCourse({ entries, range }) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState(false);

  const series = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    const symMap = new Map();
    entries.forEach((e) => {
      if (!e.entry_date) return;
      const prev = symMap.get(e.entry_date);
      if (!prev || (e.created_date || '') > (prev.created_date || '')) symMap.set(e.entry_date, e);
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = keyOf(d);
      const s = symMap.get(key);
      days.push({
        date: fmtDay(d),
        fullDate: key,
        pain: s ? (s.pain_level ?? null) : null,
        fatigue: s ? (s.fatigue_level ?? null) : null,
        bowel: s ? (s.bowel_movements_count ?? null) : null,
        stool: s ? (s.stool_consistency ?? null) : null,
        mood: s && s.mood ? (MOOD_MAP[s.mood] ?? null) : null,
        moodKey: s && s.mood ? s.mood : null,
        blood: s ? !!s.blood : false,
      });
    }
    return days;
  }, [entries, range]);

  const hasData = series.some((s) => s.mood !== null || s.stool !== null || s.blood);
  if (!hasData) return <EmptyState icon={Activity} title={t('decorso.no_data')} />;

  const rangeLabel =
    range === 7 ? t('trends.range1') : range === 14 ? t('trends.range2') : t('trends.range4');

  const moodTickFmt = (v) => {
    const key = MOOD_KEYS.find((k) => MOOD_MAP[k] === v);
    return key ? t('decorso.mood_' + key) : '';
  };

  const handleExport = async () => {
    setBusy(true);
    try { exportCoursePdf({ series, t, lang, rangeLabel }); }
    finally { setBusy(false); }
  };

  const cards = [
    {
      icon: Smile,
      field: 'mood',
      label: t('decorso.mood'),
      color: 'hsl(43 74% 50%)',
      domain: [0.5, 5.5],
      ticks: [1, 2, 3, 4, 5],
      tickFmt: moodTickFmt,
    },
    {
      icon: Activity,
      field: 'stool',
      label: t('decorso.stool'),
      color: 'hsl(174 40% 34%)',
      domain: [0, 8],
      ticks: [1, 3, 5, 7],
      tickFmt: (v) => String(v),
    },
    {
      icon: Droplet,
      field: 'blood',
      label: t('decorso.blood'),
      color: 'hsl(8 70% 58%)',
      domain: [0, 1],
      ticks: [0, 1],
      tickFmt: (v) => (v === 1 ? t('decorso.blood_yes') : t('decorso.blood_no')),
      bool: true,
    },
  ];

  return (
    <Card className="border-terracotta/30">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-xl flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="h-5 w-1.5 rounded-full bg-terracotta" />
            {t('decorso.title')}
          </span>
          <Button onClick={handleExport} disabled={busy} size="sm" className="rounded-xl">
            <FileDown className="w-4 h-4" />
            {busy ? t('decorso.generating') : t('decorso.export')}
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground -mt-1">{t('decorso.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {cards.map((c) => (
          <div key={c.field}>
            <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
              <c.icon className="w-4 h-4" /> {c.label}
            </p>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" minTickGap={20} />
                  <YAxis domain={c.domain} ticks={c.ticks} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={c.tickFmt} allowDecimals={false} width={c.field === 'mood' ? 56 : 36} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const p = payload[0].payload;
                      const val = p[c.field];
                      let txt = val;
                      if (c.field === 'mood') txt = p.moodKey ? t('decorso.mood_' + p.moodKey) : '—';
                      else if (c.field === 'blood') txt = p.blood ? t('decorso.blood_yes') : t('decorso.blood_no');
                      return (
                        <div className="rounded-xl border border-border bg-card shadow-md p-2.5" style={{ minWidth: 120 }}>
                          <p className="font-semibold text-xs">{p.date}</p>
                          <p className="text-sm mt-0.5" style={{ color: c.color }}>{c.label}: <span className="font-medium">{txt}</span></p>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={c.field}
                    stroke={c.color}
                    strokeWidth={3}
                    connectNulls
                    dot={{ r: 3, strokeWidth: 0, fill: c.color }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}