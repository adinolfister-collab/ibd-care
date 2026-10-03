import React, { forwardRef } from 'react';

// Frame 1024×500 (feature graphic Google Play): logo + wordmark "IBD Care"
// su sfondo primary del brand. Renderizzato a dimensione reale per export
// pixel-perfect via html2canvas (la pagina lo scala visivamente).
const LOGO_URL = 'https://media.base44.com/files/public/6a80de4be246a7b03417c238/db435078d_pnglogoibdcare';

const FeatureGraphicFrame = forwardRef(function FeatureGraphicFrame(_, ref) {
  return (
    <div
      ref={ref}
      className="bg-primary flex items-center justify-center"
      style={{ width: 1024, height: 500 }}
    >
      <div className="flex items-center gap-10">
        <img
          src={LOGO_URL}
          alt="IBD Care"
          crossOrigin="anonymous"
          className="h-[220px] w-[220px] object-contain shrink-0"
        />
        <div className="flex flex-col">
          <h1 className="font-heading font-semibold text-primary-foreground leading-none" style={{ fontSize: 96, letterSpacing: '-0.02em' }}>
            IBD Care
          </h1>
          <span className="block mt-4 h-1.5 w-40 rounded-full bg-terracotta" />
        </div>
      </div>
    </div>
  );
});

export default FeatureGraphicFrame;