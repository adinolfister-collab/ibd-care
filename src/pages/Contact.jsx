import React, { useState } from 'react';
import { Mail, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import PublicFooter from '@/components/PublicFooter';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';
import AppLayout from '@/components/AppLayout';
import TopRightActions from '@/components/TopRightActions';
import LanguageMenu from '@/components/LanguageMenu';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';

const CONTACT_EMAIL = 'supporto@ibdcare.app';

export default function Contact() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendContactMessage', {
        name: form.name,
        email: form.email,
        message: form.message,
      });
      if (res?.data?.error) throw new Error(res.data.error);
      toast({
        title: t('contact.success_title') || 'Messaggio inviato',
        description: t('contact.success_desc') || 'Grazie! Ti risponderemo al più presto.',
      });
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      toast({
        title: t('contact.error_title') || 'Invio non riuscito',
        description: err?.message || (t('contact.error_desc') || 'Riprova tra poco o scrivici direttamente via email.'),
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout>
      <div className="w-full max-w-2xl mx-auto">
        <PageHeader title={t('nav.contact')} subtitle={t('contact.subtitle')} />
        <PageEditorial pageKey="contact" />

        <p className="text-muted-foreground mb-6 leading-relaxed select-text">
          {t('contact.intro')}
        </p>

        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-2 space-y-3">
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                <Mail className="w-4 h-4 text-primary" /> {t('contact.email_label')}
              </p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-primary hover:underline break-all select-text">
                {CONTACT_EMAIL}
              </a>
            </div>
            <div className="rounded-xl bg-card border border-border p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">{t('contact.community_label')}</p>
              {t('contact.community_desc')}
            </div>
          </div>

          <form onSubmit={onSubmit} className="md:col-span-3 space-y-4 rounded-xl bg-card border border-border p-5">
            <div>
              <Label htmlFor="name" className="mb-1.5">{t('contact.name')}</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('contact.name_placeholder')} />
            </div>
            <div>
              <Label htmlFor="email" className="mb-1.5">{t('contact.email_label')}</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t('contact.email_placeholder')} />
            </div>
            <div>
              <Label htmlFor="message" className="mb-1.5">{t('contact.message')}</Label>
              <Textarea id="message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={t('contact.message_placeholder')} />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={sending}>
              {sending
                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> {t('contact.sending') || 'Invio…'}</>
                : <><Send className="w-4 h-4 mr-1.5" /> {t('contact.send')}</>}
            </Button>
            <p className="text-xs text-muted-foreground text-center">{t('contact.mailto_hint')}</p>
          </form>
        </div>

        <EditorialBlock sectionKey="contact_care" align="left" />

        <PublicFooter />
      </div>
    </AppLayout>
  );
}