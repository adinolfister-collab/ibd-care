import React, { useEffect, useState } from 'react';
import { Save, Trash2, Plus, Footprints, Flame, MapPin, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function todayStr() { return new Date().toISOString().slice(0, 10); }

// Form di revisione per i dati di attivita' estratti (screenshot singolo o
// CSV multi-giorno). L'utente puo' correggere ogni riga prima del salvataggio.
// Al salvataggio, per ogni riga: se esiste gia' un record manuale per quella
// data lo aggiorna, altrimenti lo crea. Il record manuale prevale sul sync
// Google Fit (gia' garantito dalla logica di syncGoogleFitData).
export default function ActivityReviewForm({ rows, kind, defaultDate, onSaved, onCancel }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [list, setList] = useState(() => rows.map((r) => ({
    entry_date: r.entry_date || defaultDate || todayStr(),
    steps: r.steps || 0,
    kcal_expended: r.kcal_expended || 0,
    distance_m: r.distance_m || 0,
    distance_km: ((r.distance_m || 0) / 1000),
  })));
  const [existing, setExisting] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.ActivityEntry.filter({ source: 'manual' }, '-entry_date', 300);
        const map = {};
        for (const e of data) map[e.entry_date] = e.id;
        setExisting(map);
      } catch { setExisting({}); }
    })();
  }, []);

  const setRow = (i, k, v) => setList((prev) => prev.map((r, idx) => idx === i ? { ...r, [k]: v } : r));

  const addRow = () => setList((prev) => [...prev, {
    entry_date: defaultDate || todayStr(),
    steps: 0, kcal_expended: 0, distance_m: 0, distance_km: 0,
  }]);

  const removeRow = (i) => setList((prev) => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    // valida: almeno una riga con un valore
    const valid = list.filter((r) => r.entry_date && (r.steps || r.kcal_expended || r.distance_m || r.distance_km));
    if (!valid.length) {
      toast({ title: t('common.error'), description: t('activity_manual.enter_one'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    let ok = 0, fail = 0;
    for (const r of valid) {
      const distance_m = Math.round((Number(r.distance_km) || 0) * 1000);
      const payload = {
        entry_date: r.entry_date,
        steps: parseInt(r.steps, 10) || 0,
        kcal_expended: Math.round(Number(r.kcal_expended) || 0),
        distance_m,
        source: 'manual',
      };
      try {
        const id = existing[r.entry_date];
        if (id) await base44.entities.ActivityEntry.update(id, payload);
        else {
          const created = await base44.entities.ActivityEntry.create(payload);
          setExisting((m) => ({ ...m, [r.entry_date]: created.id }));
        }
        ok++;
      } catch { fail++; }
    }
    setSaving(false);
    if (fail && !ok) {
      toast({ title: t('common.error'), description: t('import.activity_save_fail'), variant: 'destructive' });
      return;
    }
    if (fail) toast({ title: t('import.activity_partial'), description: `${ok} ok, ${fail} err` });
    onSaved && onSaved();
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{kind === 'csv' ? t('import.review_csv') : t('import.review_screenshot')}</p>
        </div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {list.map((r, i) => (
            <div key={i} className="rounded-xl border border-input bg-background p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={r.entry_date}
                  onChange={(e) => setRow(i, 'entry_date', e.target.value)}
                  max={todayStr()}
                  className="rounded-lg flex-1"
                />
                <button onClick={() => removeRow(i)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-400 shrink-0" aria-label={t('common.delete')}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-0.5 block flex items-center gap-1"><Footprints className="w-3 h-3" />{t('activity_manual.steps')}</label>
                  <Input type="number" inputMode="numeric" value={r.steps || ''} onChange={(e) => setRow(i, 'steps', e.target.value)} placeholder="0" className="rounded-lg" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-0.5 block flex items-center gap-1"><Flame className="w-3 h-3" />{t('activity_manual.kcal')}</label>
                  <Input type="number" inputMode="decimal" value={r.kcal_expended || ''} onChange={(e) => setRow(i, 'kcal_expended', e.target.value)} placeholder="0" className="rounded-lg" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-0.5 block flex items-center gap-1"><MapPin className="w-3 h-3" />{t('activity_manual.distance')}</label>
                  <Input type="number" inputMode="decimal" step="0.1" value={r.distance_km || ''} onChange={(e) => setRow(i, 'distance_km', e.target.value)} placeholder="0" className="rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addRow} className="inline-flex items-center gap-1 text-xs text-primary font-medium"><Plus className="w-3.5 h-3.5" /> {t('import.add_row')}</button>
        <div className="flex gap-2 pt-1">
          <Button onClick={save} disabled={saving} className="rounded-xl flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            {t('import.save_all')}
          </Button>
          <Button variant="outline" onClick={onCancel} className="rounded-xl">{t('common.cancel')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}