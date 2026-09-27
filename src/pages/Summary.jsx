import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { FileBarChart, Download, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { mealTypeLabel, reactionLabel, medTypeLabel, medFrequencyLabel, recordTypeLabel, moodLabel } from '@/lib/enumLabels';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';
import MagazineEssay from '@/components/MagazineEssay';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import WeeklyReport from '@/components/WeeklyReport';
import MonthlyReport from '@/components/MonthlyReport';
import PremiumExportButton from '@/components/PremiumExportButton';
import PremiumLockBadge from '@/components/PremiumLockBadge';
import { useSubscription } from '@/hooks/useSubscription';

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}
function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function Summary() {
  const { t } = useI18n();
  const { isSubscribed } = useSubscription();
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(todayStr());
  const [inc, setInc] = useState({ symptoms: true, food: true, meds: true, records: true });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const toggle = (k) => setInc((s) => ({ ...s, [k]: !s[k] }));

  const generate = async () => {
    setBusy(true);
    let symptoms = [], food = [], meds = [], records = [];
    try {
      if (inc.symptoms) symptoms = (await base44.entities.SymptomEntry.list('-entry_date', 500)).filter(inRange);
      if (inc.food) food = (await base44.entities.FoodEntry.list('-entry_date', 500)).filter(inRange);
      if (inc.meds) meds = await base44.entities.Medication.list('-created_date', 500);
      if (inc.records) records = (await base44.entities.MedicalRecord.list('-record_date', 500)).filter(r => inRange(r, 'record_date'));
    } catch (e) {
      setBusy(false);
      return;
    }

    function inRange(it) { return it.entry_date && it.entry_date >= from && it.entry_date <= to; }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const M = 48;
    let y = 56;

    const accent = [13, 148, 136];
    doc.setFillColor(...accent);
    doc.roundedRect(M, y, 6, 22, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text(t('summary.pdf_title'), M + 16, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(t('summary.pdf_period').replace('{from}', from).replace('{to}', to), M + 16, y + 34);
    y += 60;

    const section = (title) => {
      y += 14;
      doc.setFillColor(...accent);
      doc.roundedRect(M, y, W - M * 2, 24, 4, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(title, M + 12, y + 16);
      y += 36;
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    };

    const line = (txt) => {
      const wrapped = doc.splitTextToSize(txt, W - M * 2);
      if (y + wrapped.length * 13 > doc.internal.pageSize.getHeight() - M) { doc.addPage(); y = M; }
      doc.text(wrapped, M, y);
      y += wrapped.length * 13 + 2;
    };

    if (inc.symptoms) {
      section(t('summary.pdf_section_symptoms'));
      if (symptoms.length === 0) line(t('summary.pdf_no_symptoms'));
      symptoms.forEach((s) => {
        line(`${s.entry_date} — ${t('symptom_pdf.pain')} ${s.pain_level ?? 0}/10, ${t('symptom_pdf.fatigue')} ${s.fatigue_level ?? 0}/10, ${t('symptom_pdf.bowel')} ${s.bowel_movements_count ?? 0}, ${t('summary.pdf_bristol').replace('{n}', s.stool_consistency ?? '-')}${s.blood ? ', ' + t('summary.pdf_blood_yes') : ''}${s.mood ? ', ' + t('summary.pdf_mood').replace('{v}', moodLabel(t, s.mood)) : ''}${s.notes ? ' — ' + s.notes : ''}`);
      });
    }

    if (inc.food) {
      section(t('summary.pdf_section_food'));
      if (food.length === 0) line(t('summary.pdf_no_food'));
      food.forEach((f) => {
        line(`${f.entry_date} · ${f.meal_type ? mealTypeLabel(t, f.meal_type) : '—'} — ${f.foods}${f.reaction ? ' (' + t('summary.pdf_reaction').replace('{v}', reactionLabel(t, f.reaction)) + ')' : ''}${f.tolerated === false ? ' — ' + t('summary.pdf_not_tolerated') : ''}${f.notes ? ' — ' + f.notes : ''}`);
      });
    }

    if (inc.meds) {
      section(t('summary.pdf_section_meds'));
      if (meds.length === 0) line(t('summary.pdf_no_meds'));
      meds.forEach((m) => {
        line(`${m.name} (${medTypeLabel(t, m.type)})${m.dosage ? ', ' + m.dosage : ''} — ${m.frequency ? medFrequencyLabel(t, m.frequency) : ''}, ${t('summary.pdf_times').replace('{v}', m.times || '—')}${m.active ? '' : ' ' + t('summary.pdf_not_active')}${m.notes ? ' — ' + m.notes : ''}`);
      });
    }

    if (inc.records) {
      section(t('summary.pdf_section_records'));
      if (records.length === 0) line(t('summary.pdf_no_records'));
      records.forEach((r) => {
        line(`${r.record_date} · ${r.title} (${recordTypeLabel(t, r.type)})${r.provider ? ' — ' + r.provider : ''}${r.result_summary ? ' — ' + r.result_summary : ''}${r.next_appointment ? ' — ' + t('summary.pdf_next').replace('{v}', r.next_appointment) : ''}`);
      });
    }

    if (note.trim()) {
      section(t('summary.pdf_note_section'));
      line(note.trim());
    }

    // Footer on every page
    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(t('summary.pdf_footer'), M, doc.internal.pageSize.getHeight() - 24);
    }

    doc.save(`IBD-Care-report_${from}_${to}.pdf`);
    setBusy(false);
  };

  const toggles = [
    { k: 'symptoms', label: t('summary.include_symptoms') },
    { k: 'food', label: t('summary.include_food') },
    { k: 'meds', label: t('summary.include_meds') },
    { k: 'records', label: t('summary.include_records') },
  ];

  return (
    <AppLayout>
      <PageHeader title={t('summary.title')} subtitle={t('summary.subtitle')} />
      <PageEditorial pageKey="summary" />
      <MagazineEssay theme="esami" number="01" eyebrow={t('summary.eyebrow')} title={t('summary.report_title')}>
      <div className="grid gap-4">
        <WeeklyReport />
        <MonthlyReport />
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-muted-foreground">{t('summary.from')}</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">{t('summary.to')}</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1.5 rounded-xl" />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{t('summary.include')}</p>
              <div className="grid grid-cols-2 gap-2">
                {toggles.map((tg) => (
                  <button
                    key={tg.k}
                    onClick={() => toggle(tg.k)}
                    className={cn(
                      'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                      inc[tg.k] ? 'bg-primary/10 text-primary' : 'bg-accent text-muted-foreground'
                    )}
                  >
                    <span className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center', inc[tg.k] ? 'border-primary bg-primary' : 'border-muted-foreground')}>
                      {inc[tg.k] && <span className="w-2 h-2 rounded-sm bg-primary-foreground" />}
                    </span>
                    {tg.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">{t('summary.note')}</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1.5 rounded-xl" placeholder={t('summary.note_placeholder')} />
            </div>

            {!isSubscribed && (
              <p className="text-sm font-medium flex items-center gap-1.5 text-terracotta">
                <PremiumLockBadge /> {t('summary.pdf_locked')}
              </p>
            )}
            <PremiumExportButton
              onExport={generate}
              label={t('summary.generate')}
              lockedLabel={t('summary.pdf_locked')}
              feature="summary_pdf"
              icon={Download}
              className="w-full h-12 text-base"
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-accent/40">
          <CardContent className="p-5 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('summary.privacy_note')}
            </p>
          </CardContent>
        </Card>
      </div>
      </MagazineEssay>
      <EditorialBlock sectionKey="summary_pdf" align="right" />
    </AppLayout>
  );
}