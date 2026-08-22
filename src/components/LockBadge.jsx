import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Reusable lock marker for premium-gated nav entries.
//   variant="inline" -> beside the label (sidebar / secondary bar)
//   variant="corner"  -> top-right corner of a bottom-nav icon
export default function LockBadge({ className, variant = 'inline' }) {
  if (variant === 'corner') {
    return (
      <Lock
        className={cn(
          'w-3 h-3 absolute -top-1 -right-1.5 text-muted-foreground bg-card rounded-full p-0.5 box-border',
          className
        )}
      />
    );
  }
  return <Lock className={cn('w-3.5 h-3.5 ml-auto text-muted-foreground/70', className)} />;
}