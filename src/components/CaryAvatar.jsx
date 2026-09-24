import React from 'react';
import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

// Avatar di Cary: cerchio con gradiente primary→terracotta e iniziale "C"
// o icona HeartPulse. Dimensioni configurabili via className.
export default function CaryAvatar({ className, withIcon = false }) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-gradient-to-br from-primary to-terracotta flex items-center justify-center text-primary-foreground shadow-sm shrink-0',
        className
      )}
      aria-hidden="true"
    >
      {withIcon ? (
        <HeartPulse className="w-1/2 h-1/2" />
      ) : (
        <span className="font-heading font-semibold leading-none" style={{ fontSize: '0.55em' }}>C</span>
      )}
    </div>
  );
}