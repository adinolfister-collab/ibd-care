import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { computeTriggerCorrelation } from '@/lib/triggerCorrelation';
import EmptyState from '@/components/EmptyState';
import { cn } from '@/lib/utils';

// Gestione dei tag trigger personalizzati dell'utente + vista correlazione
// mensile (gated Premium dal chiamante). Affianca il catalogo cibi esistente.
export default function TriggerTagManager({ tags, foods, symptoms, onTagsChanged, premiumBlocked, onRequirePremium, guard }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const addTag = async (e) => {
    e.preventDefault();
    if (guard && !guard('trigger_tag_write')) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const created = await base44.entities.FoodTriggerTag.create({ name: trimmed });
      onTagsChanged([...tags, created]);
      setName('');
    } catch {
      toast({ title: t('common.error'), description: t('common.error_add'), variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };
  const removeTag = async (id) => {
    if (guard && !guard('trigger_tag_write')) return;
    try {
      await base44.entities.FoodTriggerTag.delete(id);
      onTagsChanged(tags.filter((tg) => tg.id !== id));
    } catch {
      toast({ title: t('common.error'), description: t('common.error_save'), variant: 'destructive' });
    }
  };

  const correlation = computeTriggerCorrelation(foods, symptoms);
  const hasData = correlation.length > 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div>
          <p className="font-heading text-lg font-semibold">{t('trigger.title')}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{t('trigger.subtitle')}</p>
        </div>

        <form onSubmit={addTag} className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('trigger.add_placeholder')}
            className="flex-1"
            maxLength={40}
          />
          <Button type="submit" disabled={creating || !name.trim()} className="rounded-xl">
            <Plus className="w-4 h-4 mr-1" />{t('trigger.add')}
          </Button>
        </form>

        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('trigger.empty')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tg) => (
              <span key={tg.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-terracotta/10 text-accent-foreground text-sm">
                {tg.name}
                <button onClick={() => removeTag(tg.id)} className="p-0.5 rounded-full hover:bg-terracotta/20 text-muted-foreground">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">{t('trigger.correlation_title')}</p>
            {premiumBlocked && (
              <button onClick={onRequirePremium} className="text-xs text-primary font-medium hover:underline">
                {t('trigger.premium_unlock')}
              </button>
            )}
          </div>
          {premiumBlocked ? (
            <p className="text-sm text-muted-foreground">{t('trigger.premium_desc')}</p>
          ) : hasData ? (
            <div className="space-y-2">
              {correlation.slice(0, 8).map((c) => {
                const pct = c.total ? Math.round((c.count / c.total) * 100) : 0;
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-28 truncate">{c.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
                      <div className="h-full rounded-full bg-terracotta" style={{ width: `${pct}%` }} />
                    </div>
                    <span className={cn('text-xs w-20 text-right', pct >= 50 ? 'text-rose-600 font-semibold' : 'text-muted-foreground')}>
                      {c.count}/{c.total}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('trigger.no_correlation')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}