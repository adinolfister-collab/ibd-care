import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Loader2, FileDown, LogIn } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/lib/AuthContext';
import { trackPremiumAttempt } from '@/lib/premiumTracking';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Pulsante di esportazione PDF riservato agli abbonati Premium.
// - Se abbonato: esegue onExport (genera il PDF).
// - Se ospite: rimanda al login (servizio Premium).
// - Se autenticato ma non abbonato: mostra la corona terracotta, registra il
//   tentativo di conversione e rimanda alla pagina abbonamento.
export default function PremiumExportButton({ onExport, label, lockedLabel, feature, icon: Icon = FileDown, className = '' }) {
  const { isSubscribed } = useSubscription();
  const { isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleLocked = () => {
    trackPremiumAttempt(feature, 'export_button');
  };

  if (isSubscribed) {
    return (
      <Button
        onClick={async () => {
          setBusy(true);
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

  // Guests must log in first to access the Premium export.
  if (!isAuthenticated) {
    return (
      <Button asChild variant="outline" className={cn("rounded-xl h-10 border-terracotta/40 text-terracotta hover:bg-terracotta/10 hover:text-terracotta", className)}>
        <Link to="/login">
          <LogIn className="w-4 h-4 mr-1.5" />
          {lockedLabel}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      asChild
      onClick={handleLocked}
      variant="outline"
      className={cn("rounded-xl h-10 border-terracotta/40 text-terracotta hover:bg-terracotta/10 hover:text-terracotta", className)}
    >
      <Link to="/abbonamento">
        <Crown className="w-4 h-4 mr-1.5" />
        {lockedLabel}
      </Link>
    </Button>
  );
}