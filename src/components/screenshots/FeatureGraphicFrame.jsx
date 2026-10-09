import React, { forwardRef } from 'react';

// Frame 1024×500 (feature graphic Google Play): immagine "Saggio Terracotta"
// a dimensione reale per export pixel-perfect via html2canvas.
const IMAGE_URL = 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/653e16a71_generated_10f681dc.png';

const FeatureGraphicFrame = forwardRef(function FeatureGraphicFrame(_, ref) {
  return (
    <div ref={ref} className="overflow-hidden" style={{ width: 1024, height: 500 }}>
      <img
        src={IMAGE_URL}
        alt="IBD Care"
        crossOrigin="anonymous"
        className="block w-full h-full object-cover"
      />
    </div>
  );
});

export default FeatureGraphicFrame;