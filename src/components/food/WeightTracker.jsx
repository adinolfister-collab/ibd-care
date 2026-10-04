import React, { useEffect, useState } from 'react';
import { Scale } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function WeightTracker() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const data = await base44.entities.WeightEntry.list('-entry_date', 200);
      setEntries(data);
    } catch { setEntries([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [isAuthenticated]);

  const handleSave = async () => {
    const num = parseFloat(value.replace(',', '.'));
    if (!num || num < 20 || num > 400) {
      toast({ title: t('common.error'), description: t('weight.enter'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.WeightEntry.create({ entry_date: todayStr(), weight_kg: num, source: 'manual' });
      setValue('');
      toast({ title: t('weight.saved') });
      load();
    } catch (e) {
      toast({ title: t('common.error'), description: String(e?.message || e), variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const latest = entries[0];

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Scale className="w-5 h-5 text-primary" /></div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{t('weight.title')}</p>
            {latest ? (
              <p className="text-sm text-muted-foreground">
                {t('weight.current')}: <span className="font-semibold text-foreground">{latest.weight_kg} {t('weight.kg')}</span>
                {' · '}
                <span className="text-xs">{latest.entry_date}</span>
                {latest.source === 'googlefit' && <span className="ml-1 text-[0.65rem] px-1.5 py-0.5 rounded-full bg-chart-2/10 text-chart-2">Google Fit</span>}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{t('weight.no_data')}</p>
            )}
          </div>
        </div>
        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t('weight.enter')}
              className="flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter' && value) handleSave(); }}
            />
            <Button onClick={handleSave} disabled={saving || !value} className="rounded-xl shrink-0">
              {saving ? t('common.saving') : t('weight.save')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}