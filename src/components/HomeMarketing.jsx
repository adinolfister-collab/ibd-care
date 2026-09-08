import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Utensils, Pill, ScanLine, Users, MapPin, HeartPulse, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Image } from '@/components/ui/image';
import { themeImage } from '@/lib/themeImages';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import MagazineEssay from '@/components/MagazineEssay';
import EditorialBlock from '@/components/EditorialBlock';
import EditorialSlider from '@/components/EditorialSlider';
import PublicFooter from '@/components/PublicFooter';
import FoundersBanner from '@/components/FoundersBanner';
import TopRightActions from '@/components/TopRightActions';
import LanguageMenu from '@/components/LanguageMenu';
import AppLayout from '@/components/AppLayout';
import SiteMenu from '@/components/SiteMenu';
import { Button } from '@/components/ui/button';

const MODULES = [
  { theme: 'sintomi', icon: Activity, key: 'nav.symptoms', desc: 'Registra dolore, stanchezza, scariche e umore, giorno per giorno.' },
  { theme: 'alimentazione', icon: Utensils, key: 'nav.food', desc: 'Annota i pasti e scopri quali cibi tolleri meglio.' },
  { theme: 'terapie', icon: Pill, key: 'nav.meds', desc: 'Promemoria per farmaci, biologici e integratori.' },
  { theme: 'esami', icon: ScanLine, key: 'nav.esami', desc: 'Scansiona referti e confronta i valori nel tempo.' },
  { theme: 'community', icon: Users, key: 'nav.community', desc: 'Condividi esperienze in una board serena e moderata.' },
  { theme: 'mappa', icon: MapPin, key: 'nav.map', desc: 'Centri IBD, farmacie e bagni pubblici vicini a te.' },
];

// Landing marketing "Rivista mediterranea" per ospiti non autenticati.
export default function HomeMarketing() {
  const { t } = useI18n();
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader title={t('app.name')} subtitle={t('app.tagline')} />

        {/* Messaggio di benvenuto */}
        <MagazineEssay theme="serena" number="00" eyebrow="Benvenuto" title="Il tuo diario di salute, con calma">
          <div className="space-y-4">
            <p className="font-heading text-lg md:text-xl text-foreground leading-relaxed">
              Benvenuto in IBD Care. Uno spazio sereno e privato per accompagnare, giorno dopo giorno, la vita con la malattia infiammatoria intestinale.
            </p>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Qui puoi tenere un <span className="font-medium text-foreground">diario di sintomi e umore</span>, annotare i <span className="font-medium text-foreground">pasti e scoprire quali cibi tolleri</span>, ricevere <span className="font-medium text-foreground">promemoria per le terapie</span> e conservare gli <span className="font-medium text-foreground">esami con scansione dei referti e confronto dei valori</span> nel tempo. Puoi confrontarti in una <span className="font-medium text-foreground">community moderata</span>, trovare <span className="font-medium text-foreground">centri IBD, farmacie e bagni pubblici</span> sulla mappa, e chiedere supporto all'<span className="font-medium text-foreground">assistente AI</span>. Quando serve, esporta un <span className="font-medium text-foreground">report PDF</span> pronto per la visita.
            </p>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              IBD Care è <span className="font-medium text-terracotta">{t('home.bullet_free')}</span>: {t('home.bullet_free_desc')}
            </p>
          </div>
        </MagazineEssay>

        <PageEditorial pageKey="home" />
        <div className="mb-6"><FoundersBanner /></div>
        <EditorialSlider />
        <SiteMenu />

        <MagazineEssay theme="serena" number="01" eyebrow="Cosa trovi" title="Sei moduli, un unico diario">
          <div className="grid sm:grid-cols-2 gap-4">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.theme} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    <Image src={themeImage(m.theme)} fittingType="fill" alt="" className="w-full h-full block" />
                    <div className="absolute inset-0 bg-primary/35" />
                    <Icon className="absolute inset-0 m-auto w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-foreground">{t(m.key)}</p>
                    <p className="text-sm text-muted-foreground leading-snug mt-0.5">{m.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </MagazineEssay>

        <MagazineEssay theme="terapie" number="02" eyebrow="Perché IBD Care" title="Calma, privacy, controllo">
          <ul className="space-y-3 text-sm md:text-base text-foreground/90 leading-relaxed">
            <li className="flex items-start gap-3"><span className="text-terracotta mt-1">◆</span><span>Interfaccia serena, tipografie ampie e palette mediterranea per ridurre lo stress nei giorni difficili.</span></li>
            <li className="flex items-start gap-3"><span className="text-terracotta mt-1">◆</span><span>Dati sanitari privati, protetti a livello di riga (RLS) e conformi al GDPR: visibili solo a te.</span></li>
            <li className="flex items-start gap-3"><span className="text-terracotta mt-1">◆</span><span>Esporta un report PDF pronto per la visita e usa l'assistente AI per comprendere i tuoi trend.</span></li>
            <li className="flex items-start gap-3"><span className="text-terracotta mt-1">◆</span><span>{t('premium.subtitle')}</span></li>
          </ul>
        </MagazineEssay>

        <section className="mb-10">
          <div className="rounded-2xl border-2 border-terracotta/70 bg-gradient-to-br from-primary/5 to-accent/40 p-6 md:p-8 text-center">
            <p className="text-[0.65rem] font-heading font-semibold uppercase tracking-[0.25em] text-terracotta">Inizia oggi</p>
            <h2 className="font-heading text-2xl md:text-3xl font-semibold mt-2 text-foreground">Crea il tuo diario di salute</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">{t('home.cta_subtitle')}</p>
            <div className="flex flex-wrap gap-3 justify-center mt-5">
              <Link to="/register">
                <Button className="rounded-xl h-11 px-6 text-base">
                  <HeartPulse className="w-4 h-4 mr-1.5" /> Crea account
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="rounded-xl h-11 px-6 text-base">
                  {t('auth.login_btn')} <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <EditorialBlock sectionKey="home_insight" align="right" number="03" />
      </div>

      <PublicFooter />
    </AppLayout>
  );
}