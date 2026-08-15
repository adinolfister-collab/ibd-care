import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + (b || 0), 0) / nums.length;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    const fromStr = dateStr(from);
    const toStr = dateStr(today);

    const [symptoms, foods] = await Promise.all([
      base44.entities.SymptomEntry.list('-entry_date', 500),
      base44.entities.FoodEntry.list('-entry_date', 500)
    ]);

    const inRange = (e: any) => e.entry_date && e.entry_date >= fromStr && e.entry_date <= toStr;
    const sDays = symptoms.filter(inRange);
    const fDays = foods.filter(inRange);

    const days: any[] = [];
    const suspicious: Record<string, number> = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      const ds = dateStr(d);
      const ss = sDays.filter((s) => s.entry_date === ds);
      const fs = fDays.filter((f) => f.entry_date === ds);

      const avgPain = avg(ss.map((s) => s.pain_level));
      const avgFatigue = avg(ss.map((s) => s.fatigue_level));
      const bowel = ss.reduce((a, s) => a + (s.bowel_movements_count || 0), 0);
      const blood = ss.some((s) => s.blood);
      const meals = fs.length;
      const reactions: Record<string, number> = { nessuna: 0, lieve: 0, moderata: 0, severa: 0 };
      fs.forEach((f) => { if (f.reaction && reactions[f.reaction] !== undefined) reactions[f.reaction]++; });

      const highSymptom = (avgPain !== null && avgPain >= 6) || ss.some((s) => (s.pain_level || 0) >= 6);
      const severeReaction = fs.some((f) => f.reaction === 'severa');
      if (highSymptom || severeReaction) {
        fs.forEach((f) => {
          (f.foods || '').split(/[,;]/).map((x: string) => x.trim()).filter(Boolean).forEach((it: string) => {
            suspicious[it] = (suspicious[it] || 0) + 1;
          });
        });
      }

      days.push({ date: ds, avg_pain: avgPain, avg_fatigue: avgFatigue, bowel_movements: bowel, blood, meals, reactions });
    }

    const weekAvg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const stats = {
      week_avg_pain: Number(weekAvg(days.map((d) => d.avg_pain ?? 0)).toFixed(1)),
      week_avg_fatigue: Number(weekAvg(days.map((d) => d.avg_fatigue ?? 0)).toFixed(1)),
      total_bowel: days.reduce((a, d) => a + d.bowel_movements, 0),
      blood_days: days.filter((d) => d.blood).length,
      total_meals: days.reduce((a, d) => a + d.meals, 0),
      reaction_meals: days.reduce((a, d) => a + d.reactions.lieve + d.reactions.moderata + d.reactions.severa, 0)
    };

    const suspiciousFoods = Object.entries(suspicious)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    return Response.json({
      period: { from: fromStr, to: toStr },
      days,
      stats,
      suspicious_foods: suspiciousFoods,
      symptom_entries: sDays,
      food_entries: fDays
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}