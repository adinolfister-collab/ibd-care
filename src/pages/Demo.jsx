import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, UserPlus, Play, Eye } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import MagazineEssay from '@/components/MagazineEssay';
import PublicFooter from '@/components/PublicFooter';
import CopyLinkBox from '@/components/CopyLinkBox';
import ShareApp from '@/components/ShareApp';
import DemoPromoBanner from '@/components/DemoPromoBanner';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

function Step({ n, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-9 h-9 rounded-full bg-terracotta/15 border border-terracotta/40 flex items-center justify-center font-heading font-semibold text-terracotta">
        {n}
      </div>
      <div className="flex-1 pt-0.5">
        <p className="font-heading text-base md:text-lg font-semibold text-foreground leading-snug">{title}</p>
        <p className="mt-1 text-sm md:text-[0.95rem] text-muted-foreground leading-relaxed select-text">{desc}</p>
      </div>
    </div>
  );
}

// Community (s7) è esclusa dalla demo: le funzioni social richiedono un account.
const SECTIONS = [
  { n: '01', theme: 'sintomi', to: '/symptoms', tk: 'guide.s1_title', dk: 'guide.s1_desc' },
  { n: '02', theme: 'alimentazione', to: '/food', tk: 'guide.s2_title', dk: 'guide.s2_desc' },
  { n: '03', theme: 'terapie', to: '/meds', tk: 'guide.s3_title', dk: 'guide.s3_desc' },
  { n: '04', theme: 'esami', to: '/records', tk: 'guide.s4_title', dk: 'guide.s4_desc' },
  { n: '05', theme: 'sintomi', to: '/trends', tk: 'guide.s5_title', dk: 'guide.s5_desc' },
  { n: '06', theme: 'serena', to: '/assistant', tk: 'guide.s6_title', dk: 'guide.s6_desc' },
  { n: '08', theme: 'mappa', to: '/map', tk: 'guide.s8_title', dk: 'guide.s8_desc' },
  { n: '09', theme: 'esami', to: '/abbonamento', tk: 'guide.s9_title', dk: 'guide.s9_desc', premium: true },
];

export default function Demo() {
  const { t } = useI18n();
  const demoUrl = typeof window !== 'undefined' ? `${window.location.origin}/demo` : 'https://ibd-care.it/demo';

  return (
    <AppLayout>
      <div className="w-full max-w-2xl mx-auto">
        <PageHeader title={t('guide.title')} subtitle={t('guide.subtitle')} />

        <DemoPromoBanner />

        {/* Hero: cos'è IBD Care + prova la demo + trial + condividi */}
        <MagazineEssay theme="serena" number="00" eyebrow={t('guide.intro_eyebrow')} title={t('guide.intro_title')}>
          <div className="space-y-5">
            <p className="text-sm md:text-base text-foreground/90 leading-relaxed select-text">{t('guide.intro_desc')}</p>
            <div className="rounded-xl border border-terracotta/30 bg-terracotta/[0.06] px-4 py-3 flex items-start gap-2.5">
              <Eye className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm text-foreground/80 leading-relaxed select-text">{t('guide.demo_notice_desc')}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Link to="/symptoms">
                <Button className="rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 w-full sm:w-auto">
                  <Play className="w-4 h-4 mr-1.5" /> {t('guide.demo_cta')}
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="rounded-xl border-terracotta/50 text-terracotta hover:bg-terracotta/10 w-full sm:w-auto">
                  <UserPlus className="w-4 h-4 mr-1.5" /> {t('guide.trial_cta')}
                </Button>
              </Link>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{t('guide.share_title')}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <ShareApp />
                <CopyLinkBox url={demoUrl} />
              </div>
            </div>
          </div>
        </MagazineEssay>

        {/* Sezioni feature: tutorial + "Prova la demo" */}
        {SECTIONS.map((s) => (
          <MagazineEssay key={s.n} theme={s.theme} number={s.n} eyebrow={s.premium ? t('guide.eyebrow_premium') : t('guide.eyebrow_feature')} title={t(s.tk)} to={s.to}>
            <div className="space-y-5">
              <p className="text-sm md:text-base text-foreground/90 leading-relaxed select-text">{t(s.dk)}</p>
              <Step n="1" title={t(s.tk.replace('_title', '_s1_t'))} desc={t(s.tk.replace('_title', '_s1_d'))} />
              <Step n="2" title={t(s.tk.replace('_title', '_s2_t'))} desc={t(s.tk.replace('_title', '_s2_d'))} />
              <Link to={s.to}>
                <Button variant="outline" className="rounded-xl border-terracotta/50 text-terracotta hover:bg-terracotta/10">
                  {s.premium ? t('guide.s9_cta') : t('guide.demo_cta')} <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </MagazineEssay>
        ))}

        {/* Band finale: registrazione */}
        <div className="my-8 rounded-2xl bg-terracotta/[0.08] border border-terracotta/30 p-6 text-center">
          <p className="font-heading text-xl md:text-2xl font-semibold text-foreground leading-snug">{t('guide.final_title')}</p>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">{t('guide.final_desc')}</p>
          <Link to="/register" className="inline-block mt-4">
            <Button className="rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90">
              <UserPlus className="w-4 h-4 mr-1.5" /> {t('guide.trial_cta')}
            </Button>
          </Link>
        </div>

        <PublicFooter />
      </div>
    </AppLayout>
  );
}