import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, TrendingDown, TrendingUp, Minus, Footprints, Watch } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function CalorieBalanceCard({ foods, selectedDate }) {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);

  const consumed = React.useMemo(() => {
    return (foods || []).reduce((sum, meal) => {
      const items = Array.isArray(meal.items) ? meal.items : [];
      return sum + items.reduce((s, it) => s + (Number(it.kcal) || 0), 0);
    }, 0);
  }, [foods]);

  useEffect(() => {
    if (!isAuthenticated || !selectedDate) { setActivity(null); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await base44.entities.ActivityEntry.list('-entry_date', 200);
        if (cancelled) return;
        setActivity(list.find((a) => a.entry_date === selectedDate) || null);
      } catch { if (!cancelled) setActivity(null); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, selectedDate]);

  const burned = activity?.kcal_expended || 0;
  const balance = consumed - burned;
  const isDeficit = balance < -50;
  const isSurplus = balance > 50;
  const steps = activity?.steps || 0;
  const distanceKm = activity?.distance_m ? (activity.distance_m / 1000).toFixed(1) : null;

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-accent/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-primary" />
            </span>
            <p className="font-heading font-semibold text-sm">{t('calorie.balance_title')}</p>
          </div>
          <Link to="/calorie-analysis">
            <Button variant="ghost" size="sm" className="h-8 text-xs px-2">{t('nav.calorie_analysis')}</Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card p-3 text-center">
            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1">{t('calorie.consumed')}</p>
            <p className="text-xl font-bold text-terracotta">{Math.round(consumed)}</p>
            <p className="text-[0.6rem] text-muted-foreground">kcal</p>
          </div>
          <div className="rounded-xl bg-card p-3 text-center">
            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-1">{t('calorie.burned')}</p>
            <p className="text-xl font-bold text-chart-2">{Math.round(burned)}</p>
            <p className="text-[0.6rem] text-muted-foreground">kcal {activity ? '' : `· ${t('calorie.no_activity')}`}</p>
          </div>
        </div>
        <div className={cn(
          'mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-sm font-medium',
          isDeficit ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : isSurplus ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
              : 'bg-accent text-accent-foreground'
        )}>
          {isDeficit ? <TrendingDown className="w-4 h-4" /> : isSurplus ? <TrendingUp className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          <span>{t('calorie.balance')}: {balance > 0 ? '+' : ''}{Math.round(balance)} kcal</span>
          <span className="text-xs opacity-70">· {isDeficit ? t('calorie.deficit') : isSurplus ? t('calorie.surplus') : t('calorie.balanced')}</span>
        </div>
        {isAuthenticated && (steps > 0 || distanceKm) && (
          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            {steps > 0 && <span className="inline-flex items-center gap-1"><Footprints className="w-3.5 h-3.5" /> {steps.toLocaleString()} {t('calorie.steps').toLowerCase()}</span>}
            {distanceKm && <span>{distanceKm} km</span>}
          </div>
        )}
        {isAuthenticated && !activity && !loading && (
          <p className="mt-2 text-center text-xs text-muted-foreground inline-flex items-center justify-center gap-1.5">
            <Watch className="w-3.5 h-3.5" /> {t('calorie.connect_hint')}
          </p>
        )}
        {!isAuthenticated && (
          <p className="mt-2 text-center text-xs text-muted-foreground">{t('gfit.login_required')}</p>
        )}
      </CardContent>
    </Card>
  );
}