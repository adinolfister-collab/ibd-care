import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <HeartPulse className="w-4 h-4 text-primary" />
        </div>
        <span className="font-semibold text-foreground">IBD Care</span>
      </div>
      <nav className="flex flex-wrap gap-x-5 gap-y-2">
        <Link to="/" className="hover:text-primary hover:underline">Home</Link>
        <Link to="/abbonamento" className="hover:text-primary hover:underline">Abbonamento</Link>
        <Link to="/about" className="hover:text-primary hover:underline">Chi siamo</Link>
        <Link to="/privacy" className="hover:text-primary hover:underline">Privacy</Link>
        <Link to="/contact" className="hover:text-primary hover:underline">Contatti</Link>
      </nav>
      <p className="mt-3 text-xs">© {new Date().getFullYear()} IBD Care. Tutti i diritti riservati.</p>
    </footer>
  );
}