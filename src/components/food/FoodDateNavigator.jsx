import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, RotateCcw } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { localeForLang } from '@/lib/enumLabels';
import { cn } from '@/lib/utils';

function todayStr() { return new Date().toISOString().slice(0, 10); }

function shiftDay(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function prettyDate(dateStr, lang) {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(localeForLang(lang), {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Navigatore data compatto per il diario alimentare: frecce giorno precedente
// / successivo, etichetta della data, pulsante calendario (popover con
// DayPicker) e pulsante "Oggi" per tornare alla data corrente.
export default function FoodDateNavigator({ value, onChange, mealCount = 0 }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const isToday = value === todayStr();

  return (
    <div className="sticky top-0 z-20 -mx-1 px-1 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border mb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={() => onChange(shiftDay(value, -1))}
          aria-label={t('food.day_prev')}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className="flex-1 min-w-0 flex flex-col items-center px-3 py-1.5 rounded-xl hover:bg-accent transition-colors"
              aria-label={t('food.pick_date')}
            >
              <span className="font-heading text-sm md:text-base font-semibold capitalize leading-tight truncate">
                {prettyDate(value, lang)}
              </span>
              <span className="text-xs text-muted-foreground">
                {mealCount > 0
                  ? `${mealCount} ${mealCount === 1 ? t('food.meal_one') : t('food.meal_many')}`
                  : t('food.no_meals_day_short')}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={new Date(value + 'T00:00:00')}
              onSelect={(d) => {
                if (!d) return;
                onChange(d.toISOString().slice(0, 10));
                setOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={() => onChange(shiftDay(value, 1))}
          aria-label={t('food.day_next')}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {!isToday && (
        <div className="mt-1 flex justify-center">
          <Button
            variant="link"
            size="sm"
            className="h-8 text-terracotta"
            onClick={() => onChange(todayStr())}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            {t('food.today')}
          </Button>
        </div>
      )}
    </div>
  );
}