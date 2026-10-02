import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, FileText, Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { LanguageProvider } from '@/lib/i18n';
import WeeklyReportView from '@/components/reports/WeeklyReportView';
import MonthlyReportView from '@/components/reports/MonthlyReportView';

// Public, read-only shared report page at /report/:shareId. No login required.
// Renders the report with a sticky bottom banner linking to /register.
export default function SharedReport() {
  const shareId = window.location.pathname.split('/report/')[1] || '';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    base44.functions
      .invoke('getShareableReport', { share_id: shareId })
      .then((res) => {
        if (cancelled) return;
        if (res.data?.error) setError(res.data.error);
        else setData(res.data);
      })
      .catch(() => { if (!cancelled) setError('Report non disponibile'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [shareId]);

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-foreground pb-24">
        <header className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b border-border">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-terracotta" />
            <span className="font-heading font-semibold">IBD Care · Report condiviso</span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="w-7 h-7 animate-spin mb-3" />
              <p className="text-sm">Caricamento report…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="font-heading text-lg font-semibold mb-1">{error}</p>
              <p className="text-sm text-muted-foreground">Il link potrebbe essere scaduto o non valido.</p>
            </div>
          ) : data?.report_type === 'weekly' ? (
            <WeeklyReportView data={data.report_data} />
          ) : data?.report_type === 'monthly' ? (
            <MonthlyReportView data={data.report_data} />
          ) : (
            <div className="py-24 text-center text-muted-foreground text-sm">Formato report non supportato.</div>
          )}
        </main>

        {/* Sticky bottom banner */}
        <div className="fixed bottom-0 inset-x-0 z-20 border-t border-border bg-card/95 backdrop-blur safe-pb">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-terracotta/15 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-terracotta" />
              </span>
              <p className="text-xs sm:text-sm text-foreground leading-tight">
                Generated with <span className="font-semibold">IBD Care</span> — free for Crohn's and Colitis patients.
              </p>
            </div>
            <Link
              to="/register"
              className="shrink-0 inline-flex items-center h-9 px-3 sm:px-4 rounded-xl bg-terracotta text-terracotta-foreground text-sm font-medium hover:bg-terracotta/90 transition-colors"
            >
              Try it free
            </Link>
          </div>
        </div>
      </div>
    </LanguageProvider>
  );
}