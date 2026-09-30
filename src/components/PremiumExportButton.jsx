import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Loader2, FileDown } from 'lucide-react';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { trackTrialFeature } from '@/lib/trialTracking';
import { trackGuestActivity } from '@/lib/guestTracking';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import GuestSignupCard from '@/components/GuestSignupCard';

// Pulsante di esportazione PDF/CSV con three-state gate:
//  - trialing/active: bottone normale, tracking 'used' dopo export
//  - guest: GuestSignupCard morbida (no padlock)
//  - expired: padlock terracotta + redirect abbonamento + tracking 'blocked'
export default function PremiumExportButton({ onExport, label, lockedLabel, feature, icon: Icon = FileDown, className = '' }) {
  const { isSubscribed, isGuest } = usePremiumGate();
  const [busy, setBusy] = useState(false);

  if (isSubscribed) {
    return (
      <Button
        onClick={async () => {
          setBusy(true);
          trackTrialFeature(feature, 'used');
          try { await onExport(); } finally { setBusy(false); }
        }}
        variant="outline"
        className={cn("rounded-xl h-10", className)}
      >
        {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Icon className="w-4 h-4 mr-1.5" />}
        {busy ? 'Generazione…' : label}
      </Button>
    );
  }

  if (isGuest) {
    trackGuestActivity(feature, 'blocked');
    return <GuestSignupCard feature={feature} />;
  }

  // expired
  return (
    <Button
      asChild
      onClick={() => trackTrialFeature(feature, 'blocked')}
      variant="outline"
      className={cn("rounded-xl h-10 border-terracotta/40 text-terracotta hover:bg-terracotta/10 hover:text-terracotta", className)}
    >
      <Link to="/abbonamento">
        <Lock className="w-4 h-4 mr-1.5" />
        {lockedLabel}
      </Link>
    </Button>
  );
}