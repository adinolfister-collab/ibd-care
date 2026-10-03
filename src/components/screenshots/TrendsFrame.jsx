import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Utensils, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { trendBuckets, mealBuckets } from '@/lib/screenshotSampleData';

const PAIN_COLOR = 'hsl(8 70% 58%)';
const FATIGUE_COLOR = 'hsl(43 74% 50%)';
const REACTION_COLORS = {
  nessuna: 'hsl(142 71% 45%)',
  lieve: 'hsl(43 74% 50%)',
  moderata: 'hsl(25 95% 53%)',
  severa: 'hsl(0 84% 60%)',
};
const REACTION_ORDER = ['nessuna', 'lieve', 'moderata', 'severa'];

function TrendBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
      <TrendingDown className="w-3.5 h-3.5" /> In miglioramento
    </span>
  );
}

export default function TrendsFrame() {
  return (
    <div className="h-full overflow-y-auto px-3 pb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">Andamento</span>
        <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent text-accent-foreground inline-flex items-center gap-1"><Utensils className="w-3.5 h-3.5" />Correlazione</span>
      </div>
      <div className="flex gap-1.5 mb-2">
        {['7g', '15g', '30g', '90g'].map((r) => (
          <span key={r} className={cn('px-2.5 py-1 rounded-full text-[0.65rem] font-medium', r === '7g' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>{r}</span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2.5">
        <Card>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Dolore</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between px-3 pb-3">
            <p className="text-2xl font-semibold">4.1</p>
            <TrendBadge />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Stanchezza</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between px-3 pb-3">
            <p className="text-2xl font-semibold">5.1</p>
            <TrendBadge />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-2.5">
        <CardHeader className="pb-1 p-3">
          <CardTitle className="text-sm">Andamento sintomi</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="h-36 w-full">
            <LineChart data={trendBuckets} margin={{ top: 4, right: 6, left: -18, bottom: 0 }} width={300} height={144}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
              <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="pain" name="Dolore" stroke={PAIN_COLOR} strokeWidth={2.5} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="fatigue" name="Stanchezza" stroke={FATIGUE_COLOR} strokeWidth={2.5} dot={{ r: 2 }} />
            </LineChart>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1 p-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-1.5"><Utensils className="w-4 h-4 text-primary" />Pasti e reazioni</CardTitle>
              <CardDescription className="text-[0.65rem]">19 pasti · 63% tollerati</CardDescription>
            </div>
            <p className="text-lg font-semibold leading-none">19</p>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <div className="h-32 w-full">
            <BarChart data={mealBuckets} margin={{ top: 4, right: 6, left: -18, bottom: 0 }} width={300} height={128}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {REACTION_ORDER.map((r) => (
                <Bar key={r} dataKey={r} stackId="a" name={r} fill={REACTION_COLORS[r]} />
              ))}
            </BarChart>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}