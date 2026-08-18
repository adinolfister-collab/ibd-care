import React from 'react';

// IBD Care app mark: a calm, rounded badge with a heart+leaf motif
// evoking health and care, using the app primary teal palette.
export default function AppLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="12" fill="hsl(174 40% 34%)" />
      <path
        d="M24 36c-5.2-2.8-9-6.4-9-11.2 0-2.9 2.2-5.1 5-5.1 1.8 0 3.4.9 4 2.4.6-1.5 2.2-2.4 4-2.4 2.8 0 5 2.2 5 5.1 0 4.8-3.8 8.4-9 11.2z"
        fill="hsl(40 30% 99%)"
      />
      <path
        d="M24 31c-1.6-1-3-2.4-3-4 0-1 .8-1.8 1.8-1.8.6 0 1 .3 1.2.8.2-.5.6-.8 1.2-.8 1 0 1.8.8 1.8 1.8 0 1.6-1.4 3-3 4z"
        fill="hsl(174 40% 34%)"
      />
    </svg>
  );
}