import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Per ospiti non autenticati: blocca le funzioni di lettura (storico,
// download, grafici, comparazioni). Una card-CTA apre una finestra di
// avviso "Per questa funzione ti devi registrare" con link alla registrazione.
export default function RegistrationLock({ description }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-left shadow-sm hover:border-terracotta/50 transition-colors"
      >
        <span className="w-10 h-10 rounded-xl bg-terracotta/15 flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5 text-terracotta" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-heading font-medium text-foreground">Registrati per rivedere i tuoi dati</span>
          <span className="block text-sm text-muted-foreground">
            {description || 'Lo storico, i download e i grafici sono riservati agli utenti registrati.'}
          </span>
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Per questa funzione ti devi registrare</DialogTitle>
            <DialogDescription>
              La registrazione è gratuita e ti permette di salvare e rivedere il tuo storico, scaricare i report e accedere a grafici e comparazioni.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annulla</Button>
            <Button asChild>
              <Link to="/register" onClick={() => setOpen(false)}>Registrati ora</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}