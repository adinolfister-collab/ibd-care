import React, { useEffect, useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

// Pulsante "Installa l'app": usa l'evento beforeinstallprompt (Chrome/Android
// e browser compatibili) per lanciare la finestra nativa di installazione PWA.
// Su iOS Safari (che non emette beforeinstallprompt) apre un piccolo popover
// con le istruzioni "Aggiungi a schermata Home". Si nasconde se l'app e' gia'
// installata (display-mode standalone).

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    window.navigator.standalone === true
  );
}

function detectIOS() {
  const ua = navigator.userAgent || '';
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios/i.test(ua);
  return isIOS && isSafari;
}

export default function InstallAppButton({ className = '' }) {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState(null);
  const [showIos, setShowIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return; }
    const onBip = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onAppInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (installed) return null;

  const label = t('landing.install_app');

  // Browser che supporta l'installazione nativa (Chrome/Android, Edge desktop)
  if (deferred) {
    const install = async () => {
      deferred.prompt();
      try { await deferred.userChoice; } catch {}
      setDeferred(null);
    };
    return (
      <Button
        onClick={install}
        variant="outline"
        className={`rounded-xl h-12 px-5 border-terracotta/50 text-terracotta hover:bg-terracotta/10 ${className}`}
      >
        <Download className="w-4 h-4 mr-2" />
        {label}
      </Button>
    );
  }

  // iOS Safari: nessun prompt nativo, mostro le istruzioni
  if (detectIOS()) {
    return (
      <>
        <Button
          onClick={() => setShowIos(true)}
          variant="outline"
          className={`rounded-xl h-12 px-5 border-terracotta/50 text-terracotta hover:bg-terracotta/10 ${className}`}
        >
          <Smartphone className="w-4 h-4 mr-2" />
          {label}
        </Button>
        {showIos && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
            onClick={() => setShowIos(false)}
          >
            <div
              className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-terracotta" />
                  <h3 className="font-heading font-semibold text-base">{label}</h3>
                </div>
                <button
                  onClick={() => setShowIos(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent"
                  aria-label="Chiudi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">1.</span>
                  <span>Tocca l\u2019icona <Share className="inline w-4 h-4 text-terracotta align-text-bottom" /> Condividi in basso.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">2.</span>
                  <span>Scegli <span className="font-medium text-foreground">\u201cAggiungi a schermata Home\u201d</span>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground">3.</span>
                  <span>Conferma: l\u2019app apparira tra le tue applicazioni.</span>
                </li>
              </ol>
            </div>
          </div>
        )}
      </>
    );
  }

  // Nessun supporto installazione (es. desktop senza PWA): niente bottone.
  return null;
}