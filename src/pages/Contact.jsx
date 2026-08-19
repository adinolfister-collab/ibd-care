import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import PublicFooter from '@/components/PublicFooter';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';

const CONTACT_EMAIL = 'supporto@ibdcare.app';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const onSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Contatto IBD Care — ${form.name || 'Utente'}`);
    const body = encodeURIComponent(
      `${form.message}\n\n---\nNome: ${form.name}\nEmail: ${form.email}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="w-full max-w-2xl mx-auto">
        <PageHeader title="Contatti" subtitle="Siamo qui per ascoltarti: supporto, suggerimenti e segnala la tua esperienza con IBD Care." />
        <PageEditorial pageKey="contact" />

        <p className="text-muted-foreground mb-6 leading-relaxed select-text">
          Siamo qui per ascoltarti. Scrivici per supporto tecnico, suggerimenti o per segnalarci
          la tua esperienza con IBD Care: leggiamo ogni messaggio e rispondiamo il prima possibile.
        </p>

        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-2 space-y-3">
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                <Mail className="w-4 h-4 text-primary" /> Email
              </p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-primary hover:underline break-all select-text">
                {CONTACT_EMAIL}
              </a>
            </div>
            <div className="rounded-xl bg-card border border-border p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Comunità</p>
              Unisciti alla board community interna all'app per confrontarti con altre persone che vivono con l'IBD.
            </div>
          </div>

          <form onSubmit={onSubmit} className="md:col-span-3 space-y-4 rounded-xl bg-card border border-border p-5">
            <div>
              <Label htmlFor="name" className="mb-1.5">Nome</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Il tuo nome" />
            </div>
            <div>
              <Label htmlFor="email" className="mb-1.5">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nome@email.com" />
            </div>
            <div>
              <Label htmlFor="message" className="mb-1.5">Messaggio</Label>
              <Textarea id="message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Come possiamo aiutarti?" />
            </div>
            <Button type="submit" className="w-full rounded-xl">
              <Send className="w-4 h-4 mr-1.5" /> Invia messaggio
            </Button>
            <p className="text-xs text-muted-foreground text-center">Il messaggio verrà aperto nel tuo client di posta.</p>
          </form>
        </div>

        <EditorialBlock sectionKey="contact_care" align="left" />

        <PublicFooter />
      </div>
    </div>
  );
}