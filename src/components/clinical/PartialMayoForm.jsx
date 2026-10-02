import React, { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { calcPartialMayo, MAYO_STOOL, MAYO_BLEEDING, MAYO_GLOBAL } from '@/lib/clinicalIndices';
import { ScoreBadge } from '@/components/clinical/HBIForm';
import { cn } from '@/lib/utils';

// Questionario Partial Mayo Score (Colite Ulcerosa). 3 parametri, scala 0-9.
export default function PartialMayoForm({ onSave, saving }) {
  const { t } = useI18n();
  const [answers, setAnswers] = useState({});
  const result = useMemo(() => calcPartialMayo(answers), [answers]);
  const set = (k, v) => setAnswers((a) => ({ ...a, [k]: v }));

  const submit = () => onSave({ index_type: 'partial_mayo', answers });

  return (
    <div className="space-y-5">
      <ParamGroup label={t('clinical.mayo_stool_q')}>
        <OptionRow options={MAYO_STOOL} value={answers.stool_frequency} onChange={(v) => set('stool_frequency', v)} t={t} />
      </ParamGroup>
      <ParamGroup label={t('clinical.mayo_bleeding_q')}>
        <OptionRow options={MAYO_BLEEDING} value={answers.rectal_bleeding} onChange={(v) => set('rectal_bleeding', v)} t={t} />
      </ParamGroup>
      <ParamGroup label={t('clinical.mayo_global_q')}>
        <OptionRow options={MAYO_GLOBAL} value={answers.global_assessment} onChange={(v) => set('global_assessment', v)} t={t} />
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
              'flex-1 min-w-[6rem] px-3 py-2.5 rounded-xl border text-sm text-left transition-colors',
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