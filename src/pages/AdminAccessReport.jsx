import React from 'react';
import { Download, FileText, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ACCESS_REPORT } from '@/lib/accessReportData';
import { exportAccessReportPdf } from '@/lib/accessReportPdf';

// Pagina admin: rende consultabile in app il "Report accessi IBD Care"
// (Guest / Demo-Trial / Utente loggato) e ne permette il download in PDF.
export default function AdminAccessReport() {
  const { t } = useI18n();
  const { user } = useAuth();
  const R = ACCESS_REPORT;
  const today = new Date().toLocaleDateString('it-IT');

  return (
    <AppLayout>
      <PageHeader
        title={R.title}
        subtitle={R.subtitle}
        action={
          <Button onClick={exportAccessReportPdf} className="rounded-xl">
            <Download className="w-4 h-4 mr-1.5" /> {t('common.download_pdf') || 'Scarica PDF'}
          </Button>
        }
      />

      <p className="text-sm text-muted-foreground mb-1">
        {R.generatedLabel}: {today}
      </p>
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="w-4 h-4 text-terracotta" />
        <p className="text-sm text-terracotta font-medium">Strumento interno amministratore</p>
      </div>

      {/* Intro */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-5">
          <p className="text-sm text-foreground leading-relaxed">{R.intro}</p>
        </CardContent>
      </Card>

      {/* Tabella modalità */}
      <h2 className="font-heading text-lg font-semibold mb-3">Modalità di accesso</h2>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-accent text-left">
              <th className="p-3 font-semibold rounded-l-xl">Modalità</th>
              <th className="p-3 font-semibold">Quando si attiva</th>
              <th className="p-3 font-semibold">Dove salva</th>
              <th className="p-3 font-semibold rounded-r-xl">Premium</th>
            </tr>
          </thead>
          <tbody>
            {R.modes.map((m) => (
              <tr key={m.mode} className="border-b border-border">
                <td className="p-3 font-medium align-top">{m.mode}</td>
                <td className="p-3 text-muted-foreground align-top">{m.when}</td>
                <td className="p-3 text-muted-foreground align-top">{m.storage}</td>
                <td className="p-3 align-top">
                  <span className={m.premium.startsWith('Sì') ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
                    {m.premium}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stati abbonamento */}
      <h2 className="font-heading text-lg font-semibold mb-3">Stati abbonamento (utente loggato)</h2>
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-5 space-y-2">
          {R.subscriptionStates.map((s) => (
            <div key={s.state} className="flex gap-2 text-sm">
              <span className="font-mono text-xs bg-accent px-2 py-0.5 rounded shrink-0">{s.state}</span>
              <span className="text-muted-foreground">{s.desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sezioni dettaglio */}
      {R.sections.map((sec) => (
        <div key={sec.title} className="mb-6">
          <h2 className="font-heading text-lg font-semibold mb-3">{sec.title}</h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 divide-y divide-border">
              {sec.rows.map((r) => (
                <div key={r.area} className="py-2.5 flex flex-col sm:flex-row gap-1 sm:gap-3">
                  <span className="font-medium sm:w-44 shrink-0">{r.area}</span>
                  <span className="text-muted-foreground">{r.can}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Flusso conversione */}
      <h2 className="font-heading text-lg font-semibold mb-3">Percorsi di conversione</h2>
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-5 space-y-2">
          {R.conversionFlow.map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-terracotta font-mono mt-0.5">→</span>
              <span className="text-muted-foreground">{c}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Note */}
      <h2 className="font-heading text-lg font-semibold mb-3">Note tecniche</h2>
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-5 space-y-2">
          {R.notes.map((n, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">• {n}</p>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={exportAccessReportPdf} variant="outline" className="rounded-xl">
          <FileText className="w-4 h-4 mr-1.5" /> {t('common.download_pdf') || 'Scarica PDF'}
        </Button>
      </div>
    </AppLayout>
  );
}