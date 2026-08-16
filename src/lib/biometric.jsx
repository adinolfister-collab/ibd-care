import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Fingerprint } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ENABLED_KEY = 'ibd_biometric_lock';
const CRED_KEY = 'ibd_biometric_cred_id';

function b64urlToBuf(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const s = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(s);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf;
}

async function isBiometricSupported() {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

const BiometricContext = createContext(null);

export function BiometricLockProvider({ children }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    (async () => {
      setSupported(await isBiometricSupported());
      const en = localStorage.getItem(ENABLED_KEY) === '1';
      setEnabled(en);
      if (en) {
        try {
          const authed = await base44.auth.isAuthenticated();
          if (authed) setLocked(true);
        } catch {}
      }
    })();
  }, []);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && localStorage.getItem(ENABLED_KEY) === '1') {
        base44.auth.isAuthenticated().then((authed) => { if (authed) setLocked(true); }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const enable = useCallback(async () => {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'IBD Care' },
        user: { id: new Uint8Array(16).fill(1), name: 'ibd-user', displayName: 'Utente IBD Care' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        timeout: 60000,
      },
    });
    localStorage.setItem(CRED_KEY, cred.id);
    localStorage.setItem(ENABLED_KEY, '1');
    setEnabled(true);
    setLocked(false);
  }, []);

  const disable = useCallback(() => {
    localStorage.removeItem(ENABLED_KEY);
    localStorage.removeItem(CRED_KEY);
    setEnabled(false);
    setLocked(false);
  }, []);

  const unlock = useCallback(async () => {
    const credId = localStorage.getItem(CRED_KEY);
    if (!credId) {
      disable();
      return false;
    }
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    try {
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          allowCredentials: [{ id: b64urlToBuf(credId), type: 'public-key' }],
        },
      });
      setLocked(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <BiometricContext.Provider value={{ supported, enabled, locked, enable, disable, unlock }}>
      {children}
      {locked && (
        <LockedOverlay onUnlock={unlock} onLogout={async () => { await base44.auth.logout(); }} />
      )}
    </BiometricContext.Provider>
  );
}

function LockedOverlay({ onUnlock, onLogout }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const handle = async () => {
    setBusy(true);
    setErr(false);
    const ok = await onUnlock();
    if (!ok) setErr(true);
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
        <Fingerprint className="w-10 h-10 text-primary" />
      </div>
      <p className="text-xl font-semibold">App bloccata</p>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs">Autenticati con impronta digitale o riconoscimento facciale per accedere ai tuoi dati sanitari.</p>
      <button
        onClick={handle}
        disabled={busy}
        className="mt-6 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-60"
      >
        <Fingerprint className="w-5 h-5" />
        {busy ? 'Verifica…' : 'Sblocca'}
      </button>
      {err && <p className="mt-3 text-sm text-rose-600">Verifica biometrica non riuscita. Riprova.</p>}
      <button onClick={onLogout} className="mt-6 text-sm text-muted-foreground underline">Esci dall'account</button>
    </div>
  );
}

export const useBiometric = () => useContext(BiometricContext);