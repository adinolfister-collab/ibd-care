import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, UserPlus } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import MagazineEssay from '@/components/MagazineEssay';
import PublicFooter from '@/components/PublicFooter';
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

const SECTIONS = [
  { n: '01', theme: 'sintomi', to: '/symptoms', tk: 'guide.s1_title', dk: 'guide.s1_desc', ck: 'guide.s1_cta' },
  { n: '02', theme: 'alimentazione', to: '/food', tk: 'guide.s2_title', dk: 'guide.s2_desc', ck: 'guide.s2_cta' },
  { n: '03', theme: 'terapie', to: '/meds', tk: 'guide.s3_title', dk: 'guide.s3_desc', ck: 'guide.s3_cta' },
  { n: '04', theme: 'esami', to: '/records', tk: 'guide.s4_title', dk: 'guide.s4_desc', ck: 'guide.s4_cta' },
  { n: '05', theme: 'sintomi', to: '/trends', tk: 'guide.s5_title', dk: 'guide.s5_desc', ck: 'guide.s5_cta' },
  { n: '06', theme: 'serena', to: '/assistant', tk: 'guide.s6_title', dk: 'guide.s6_desc', ck: 'guide.s6_cta' },
  { n: '07', theme: 'community', to: '/community', tk: 'guide.s7_title', dk: 'guide.s7_desc', ck: 'guide.s7_cta' },
  { n: '08', theme: 'mappa', to: '/map', tk: 'guide.s8_title', dk: 'guide.s8_desc', ck: 'guide.s8_cta' },
  { n: '09', theme: 'esami', to: '/abbonamento', tk: 'guide.s9_title', dk: 'guide.s9_desc', ck: 'guide.s9_cta', premium: true },
];

export default function Guida() {
  const { t } = useI18n();
  return (
    <AppLayout>
      <div className="w-full max-w-2xl mx-auto">
        <PageHeader title={t('guide.title')} subtitle={t('guide.subtitle')} />

        <MagazineEssay theme="serena" number="00" eyebrow="Inizia da qui" title={t('guide.intro_title')}>
          <div className="space-y-5">
            <p className="text-sm md:text-base text-foreground/90 leading-relaxed select-text">{t('guide.intro_desc')}</p>
            <Step n="1" title={t('guide.intro_s1_t')} desc={t('guide.intro_s1_d')} />
            <Step n="2" title={t('guide.intro_s2_t')} desc={t('guide.intro_s2_d')} />
            <Link to="/register">
              <Button className="rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90">
                <UserPlus className="w-4 h-4 mr-1.5" /> {t('guide.intro_cta')}
              </Button>
            </Link>
          </div>
        </MagazineEssay>

        {SECTIONS.map((s) => (
          <MagazineEssay key={s.n} theme={s.theme} number={s.n} eyebrow={s.premium ? 'Premium' : 'Funzione'} title={t(s.tk)} to={s.to}>
            <div className="space-y-5">
              <p className="text-sm md:text-base text-foreground/90 leading-relaxed select-text">{t(s.dk)}</p>
              <Step n="1" title={t(s.tk.replace('_title', '_s1_t'))} desc={t(s.tk.replace('_title', '_s1_d'))} />
              <Step n="2" title={t(s.tk.replace('_title', '_s2_t'))} desc={t(s.tk.replace('_title', '_s2_d'))} />
              <Link to={s.to}>
                <Button variant="outline" className="rounded-xl border-terracotta/50 text-terracotta hover:bg-terracotta/10">
                  {t(s.ck)} <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </MagazineEssay>
        ))}

        <PublicFooter />
      </div>
    </AppLayout>
  );
}