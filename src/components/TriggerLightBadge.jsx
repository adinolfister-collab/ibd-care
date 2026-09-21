import React from 'react';
import { cn } from '@/lib/utils';

const COLORS = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-rose-500',
};

const RINGS = {
  green: 'ring-emerald-500/20',
  yellow: 'ring-amber-400/20',
  red: 'ring-rose-500/20',
};

export default function TriggerLightBadge({ status, size = 'sm' }) {
  if (!status || !COLORS[status]) return null;
  const sz = size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';
  return (
    <span
      className={cn(
        'inline-block rounded-full shrink-0 ring-2',
        sz,
        COLORS[status],
        RINGS[status]
      )}
    />
  );
}