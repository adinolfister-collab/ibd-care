import React, { useEffect, useState } from 'react';
import { Footprints, Flame, MapPin, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

function todayStr() { return new Date().toISOString().slice(0, 10); }

// Form per l'inserimento manuale delle calorie di attivita' (passi, kcal
// consumate, distanza). Pensato per chi non usa Google Fit (Samsung Health,
// Apple Health, ecc.): legge i valori dalla propria app e li digita qui.
// Il record viene salvato come ActivityEntry source='manual' e concorre al
// calcolo del bilancio giornaliero. La sincronizzazione Google Fit salta le
// date con un record manuale (il manuale prevale).
// Props:
//  - defaultDate: data precompilata (es. giorno selezionato nel diario Food)
//  - onSaved: callback dopo salvataggio/cancellazione (per refresh genitore)
export default function ManualActivityForm({ defaultDate, onSaved }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(defaultDate || todayStr());
  const [steps, setSteps] = useState('');
  const [kcal, setKcal] = useState('');
  const [distance, setDistance] = useState('');

  const load = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const data = await base44.entities.ActivityEntry.filter({ source: 'manual' }, '-entry_date', 50);
      setEntries(data);
    } catch { setEntries([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [isAuthenticated]);
  useEffect(() => { if (defaultDate) setDate(defaultDate); }, [defaultDate]);

  const handleSave = async () => {
    const s = parseInt(steps, 10) || 0;
    const k = parseFloat(kcal.replace(',', '.')) || 0;
    const d = parseFloat(distance.replace(',', '.')) || 0;
    if (!s && !k && !d) {
      toast({ title: t('common.error'), description: t('activity_manual.enter_one'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const existing = entries.find((e) => e.entry_date === date);
      const payload = {
        entry_date: date,
        steps: s,
        kcal_expended: Math.round(k),
        distance_m: Math.round(d * 1000),
        source: 'manual',
      };
      if (existing) {
        await base44.entities.ActivityEntry.update(existing.id, payload);
      } else {
        await base44.entities.ActivityEntry.create(payload);
      }
      setSteps(''); setKcal(''); setDistance('');
      toast({ title: t('activity_manual.saved') });
      load();
      onSaved?.();
    } catch (e) {
      toast({ title: t('common.error'), description: String(e?.message || e), variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.ActivityEntry.delete(id);
      load();
      onSaved?.();
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-chart-2/10 flex items-center justify-center">
            <Footprints className="w-5 h-5 text-chart-2" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{t('activity_manual.title')}</p>
            <p className="text-sm text-muted-foreground">{t('activity_manual.desc')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('activity_manual.date')}</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayStr()}
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1"><Footprints className="w-3 h-3" />{t('activity_manual.steps')}</label>
              <Input
                type="number"
                inputMode="numeric"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="0"
                className="rounded-xl"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1"><Flame className="w-3 h-3" />{t('activity_manual.kcal')}</label>
              <Input
                type="number"
                inputMode="decimal"
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
                placeholder="0"
                className="rounded-xl"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3" />{t('activity_manual.distance')}</label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="0"
                className="rounded-xl"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl w-full">
            {saving ? t('common.saving') : t('activity_manual.save')}
          </Button>
        </div>

        {!loading && entries.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t('activity_manual.recent')}</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {entries.slice(0, 10).map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-accent/40 px-3 py-2 text-sm">
                  <span className="text-xs text-muted-foreground shrink-0">{e.entry_date}</span>
                  <span className="flex-1 text-xs text-foreground truncate">
                    {e.steps ? `${e.steps.toLocaleString()} ${t('calorie.steps').toLowerCase()}` : ''}
                    {e.steps && e.kcal_expended ? ' · ' : ''}
                    {e.kcal_expended ? `${e.kcal_expended} kcal` : ''}
                    {e.distance_m ? ` · ${(e.distance_m / 1000).toFixed(1)} km` : ''}
                  </span>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 shrink-0"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}