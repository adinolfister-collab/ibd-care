import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';

// URL di destinazione del QR: stesso dominio usato da DownloadApp, per
// coerenza. Chi scansiona atterra direttamente nell'app da mobile.
const APP_URL = 'https://ibd-care.it';

// Sezione "Scarica l'app" con QR code. Layout unico mobile/desktop:
// il QR resta sempre visibile (utile anche per condivisione da mobile).
export default function AppQrCode({ className = '' }) {
  const { t } = useI18n();
  return (
    <div className={className}>
      <Card className="border-2 border-terracotta/50 shadow-sm bg-gradient-to-br from-card to-accent/30 overflow-hidden">
        <CardContent className="p-6 md:p-8 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-terracotta/15 flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-terracotta" />
          </div>
          <div className="max-w-md">
            <h3 className="font-heading text-xl md:text-2xl font-semibold tracking-tight text-primary leading-snug">
              {t('qr.title')}
            </h3>
            <p className="mt-2 text-sm md:text-[0.95rem] text-muted-foreground leading-relaxed">
              {t('qr.subtitle')}
            </p>
          </div>
          <div className="p-3 md:p-4 bg-white rounded-2xl shadow-sm ring-1 ring-border">
            <QRCodeSVG
              value={APP_URL}
              size={200}
              level="M"
              marginSize={2}
              aria-label={t('qr.scan_hint')}
            />
          </div>
          <p className="text-sm font-medium text-terracotta">
            {t('qr.scan_hint')}
          </p>
          <p className="text-xs text-muted-foreground/80 break-all">
            {APP_URL}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}