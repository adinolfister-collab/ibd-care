import React, { useState } from 'react';
import { BookOpen, ChevronDown, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { FOOD_LESSONS } from '@/lib/foodLessons';
import { cn } from '@/lib/utils';

// Micro-lezioni alimentari IBD: card editoriali numerate, cliccabili,
// con takeaway pratico. Visibili a tutti (guest e loggati).
export default function FoodLessons() {
  const { t, lang } = useI18n();
  const [openId, setOpenId] = useState(null);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-primary" />
        <p className="font-heading text-lg font-semibold text-foreground">{t('food.lessons_title')}</p>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{t('food.lessons_desc')}</p>
      <div className="space-y-3">
        {FOOD_LESSONS.map((lesson, i) => {
          const text = lesson[lang] || lesson.it;
          const open = openId === lesson.id;
          return (
            <Card key={lesson.id} className={cn('border shadow-sm transition-colors', open ? 'border-primary/40' : 'border-border')}>
              <CardContent className="p-0">
                <button
                  onClick={() => setOpenId(open ? null : lesson.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <span className="text-[0.65rem] font-heading font-semibold uppercase tracking-[0.2em] text-muted-foreground shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={cn('flex-1 font-heading text-base font-semibold', open ? 'text-primary' : 'text-foreground')}>{text.title}</span>
                  <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform shrink-0', open && 'rotate-180')} />
                </button>
                {open && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{text.body}</p>
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-terracotta/10 p-3">
                      <Lightbulb className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-accent-foreground">{text.takeaway}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}