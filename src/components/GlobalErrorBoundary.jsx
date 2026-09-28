import React from 'react';
import { reportCrash, installGlobalErrorListeners } from '@/lib/crashReporter';

// Error Boundary globale: avvolge l'intera app in main.jsx. Cattura errori di
// render, mostra un fallback calmo per il visitatore e segnala il crash alla
// backend function reportAppCrash. I listener windowOnError/unhandledrejection
// coprono gli errori non di render.

export default class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    installGlobalErrorListeners();
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    reportCrash(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fbf7f0',
            padding: '1.5rem',
          }}
        >
          <div style={{ maxWidth: '26rem', textAlign: 'center' }}>
            <div
              style={{
                width: '3.25rem',
                height: '3.25rem',
                margin: '0 auto 1.25rem',
                borderRadius: '9999px',
                background: '#e9c2ad',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9a4a2a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </div>
            <h1
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: '1.6rem',
                color: '#1f3a3a',
                marginBottom: '0.5rem',
              }}
            >
              Qualcosa non ha funzionato
            </h1>
            <p
              style={{
                color: '#5b6b6b',
                marginBottom: '1.75rem',
                fontSize: '1rem',
                lineHeight: 1.5,
              }}
            >
              Si è verificato un problema. Ricarica la pagina per continuare.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#1f3a3a',
                color: '#fff',
                padding: '0.75rem 1.75rem',
                borderRadius: '0.75rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Ricarica
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}