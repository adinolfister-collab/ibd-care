import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Stethoscope, Gift, CreditCard, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';

const COPY = {
  it: {
    badge: '45 giorni gratis, senza carta di credito',
    title: 'Cosa ottieni appena ti registri',
    items: [
      { icon: Bot, title: 'Cary, il tuo assistente', desc: 'Fai domande su sintomi, dieta e terapie e ricevi risposte pensate per chi convive con una IBD.' },
      { icon: Stethoscope, title: 'Prepara la visita', desc: 'Un riepilogo pronto per il gastroenterologo con sintomi, pasti e farmaci degli ultimi mesi.' },
      { icon: Gift, title: 'Tutto gratis per 45 giorni', desc: 'Diario, farmaci, referti e grafici inclusi. Nessuna carta richiesta, nessun rinnovo automatico.' },
    ],
    cta: 'Inizia gratis',
  },
  en: {
    badge: '45 days free, no credit card',
    title: 'What you get as soon as you sign up',
    items: [
      { icon: Bot, title: 'Cary, your assistant', desc: 'Ask about symptoms, diet and therapies and get answers made for people living with IBD.' },
      { icon: Stethoscope, title: 'Visit preparation', desc: 'A ready summary for your gastroenterologist with symptoms, meals and medications from recent months.' },
      { icon: Gift, title: 'Everything free for 45 days', desc: 'Diary, medications, records and charts included. No card required, no automatic renewal.' },
    ],
    cta: 'Start for free',
  },
};

// Sezione di valore per i visitatori non registrati: spiega cosa ottengono.
export default function HomeValueSection() {
  const { lang } = useI18n();
  const c = COPY[lang] || COPY.en;
  const track = () => {
    try { base44.analytics.track({ eventName: 'home_value_cta_click' }); } catch (_) { /* noop */ }
  };
  return (
    <section className="mb-10">
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
          <CreditCard className="w-3.5 h-3.5" />
          {c.badge}
        </span>
        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mt-3">{c.title}</h2>
        <div className="grid sm:grid-cols-3 gap-4 mt-5">
          {c.items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.title} className="rounded-xl bg-accent/40 p-4">
                <Icon className="w-6 h-6 text-terracotta mb-2" />
                <h3 className="font-heading font-semibold text-foreground">{it.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{it.desc}</p>
              </div>
            );
          })}
        </div>
        <Link to="/register" onClick={track}>
          <button className="mt-5 inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-terracotta text-terracotta-foreground font-medium text-sm hover:bg-terracotta/90 transition-colors shadow-md">
            {c.cta}
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </section>
  );
}