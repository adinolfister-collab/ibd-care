import React, { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BristolScalePicker from '@/components/BristolScalePicker';
import { calcHBI, HBI_WELLBEING, HBI_PAIN, HBI_MASS, HBI_COMPLICATIONS, severityLabelKey, severityColor } from '@/lib/clinicalIndices';
import { cn } from '@/lib/utils';

// Questionario dinamico Harvey-Bradshaw Index (Morbo di Crohn).
// Calcola il punteggio in tempo reale. onSaved: (result) => void.
export default function HBIForm({ onSave, saving }) {
  const { t } = useI18n();
  const [answers, setAnswers] = useState({});
  const [complications, setComplications] = useState([]);
  const [stool, setStool] = useState('');

  const result = useMemo(() => calcHBI(answers, complications), [answers, complications]);

  const set = (k, v) => setAnswers((a) => ({ ...a, [k]: v }));
  const toggleComp = (v) => setComplications((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]));
  const liquidStools = stool ? String(stool) : String(answers.liquid_stools || '0');

  const submit = () => {
    const payload = {
      index_type: 'hbi',
      answers: { ...answers, liquid_stools: Number(liquidStools) || 0 },
      complications,
      stool_support: stool ? Number(stool) : null,
    };
    onSave(payload);
  };

  return (
    <div className="space-y-5">
      <ParamGroup label={t('clinical.hbi_wellbeing_q')}>
        <OptionRow options={HBI_WELLBEING} value={answers.wellbeing} onChange={(v) => set('wellbeing', v)} t={t} />
      </ParamGroup>
      <ParamGroup label={t('clinical.hbi_pain_q')}>
        <OptionRow options={HBI_PAIN} value={answers.abdominal_pain} onChange={(v) => set('abdominal_pain', v)} t={t} />
      </ParamGroup>
      <div>
        <Label className="text-sm font-medium text-muted-foreground">{t('clinical.hbi_stools_q')}</Label>
        <Input
          type="number"
          min={0}
          value={liquidStools === '0' ? '' : liquidStools}
          onChange={(e) => setStool(e.target.value)}
          placeholder="0"
          className="mt-1.5"
        />
        <p className="text-xs text-muted-foreground mt-1">{t('clinical.hbi_stools_hint')}</p>
      </div>
      <div>
        <Label className="text-sm font-medium text-muted-foreground">{t('clinical.hbi_bristol_support')}</Label>
        <BristolScalePicker value={stool} onChange={setStool} className="mt-1.5" />
      </div>
      <div>
        <Label className="text-sm font-medium text-muted-foreground">{t('clinical.hbi_complications_q')}</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {HBI_COMPLICATIONS.map((c) => {
            const active = complications.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleComp(c.value)}
                className={cn(
                  'px-3 py-2 rounded-full text-sm border transition-colors',
                  active ? 'border-terracotta bg-terracotta/15 text-accent-foreground' : 'border-border bg-card hover:border-terracotta/40'
                )}
              >
                {t(c.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
      <ParamGroup label={t('clinical.hbi_mass_q')}>
        <OptionRow options={HBI_MASS} value={answers.abdominal_mass} onChange={(v) => set('abdominal_mass', v)} t={t} />
      </ParamGroup>

      <ScoreBadge score={result.score} severity={result.severity} t={t} />

      <Button onClick={submit} disabled={saving} className="w-full rounded-xl">
        {saving ? t('common.saving') : t('clinical.save')}
      </Button>
    </div>
  );
}

function ParamGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function OptionRow({ options, value, onChange, t }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = Number(value) === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(active ? '' : o.value)}
            className={cn(
              'flex-1 min-w-[5rem] px-3 py-2.5 rounded-xl border text-sm text-left transition-colors',
              active ? 'border-primary bg-primary/5 text-foreground font-medium' : 'border-border bg-card hover:border-terracotta/40 text-muted-foreground'
            )}
          >
            <span className="block text-xs font-semibold text-primary/70 mb-0.5">{o.value}</span>
            {t(o.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

export function ScoreBadge({ score, severity, t }) {
  const color = severityColor(severity);
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-accent/40 px-5 py-4">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('clinical.score')}</p>
        <p className="text-4xl font-bold font-heading" style={{ color }}>{score}</p>
      </div>
      <span className="px-4 py-1.5 rounded-full text-sm font-semibold text-white" style={{ background: color }}>
        {t(severityLabelKey(severity))}
      </span>
    </div>
  );
}