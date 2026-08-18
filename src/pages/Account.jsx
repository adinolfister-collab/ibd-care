import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings as SettingsIcon, LogOut, Mail, ShieldCheck, KeyRound, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import SubscriptionCard from '@/components/SubscriptionCard';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';

const ACCESS_LABELS = {
  none: { label: 'Nessun abbonamento', cls: 'bg-muted text-muted-foreground' },
  trialing: { label: 'Prova gratuita', cls: 'bg-amber-100 text-amber-700' },
  active: { label: 'Premium attivo', cls: 'bg-emerald-100 text-emerald-700' },
  past_due: { label: 'Pagamento in sospeso', cls: 'bg-rose-100 text-rose-700' },
  canceled: { label: 'Abbonamento disdetto', cls: 'bg-muted text-muted-foreground' },
};
function accessBadge(status) {
  return ACCESS_LABELS[status] || ACCESS_LABELS.none;
}

export default function Account() {
  const { t } = useI18n();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const logout = async () => {
    await base44.auth.logout();
  };

  return (
    <AppLayout>
      <PageHeader title={t('settings.account')} subtitle="Gestisci abbonamento, profilo e impostazioni" />

      <Tabs defaultValue="abbonamento" className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-5">
          <TabsTrigger value="abbonamento">Abbonamento</TabsTrigger>
          <TabsTrigger value="profilo">Profilo</TabsTrigger>
          <TabsTrigger value="impostazioni">Impostazioni</TabsTrigger>
        </TabsList>

        <TabsContent value="abbonamento" className="mt-0">
          <SubscriptionCard />
        </TabsContent>

        <TabsContent value="profilo" className="mt-0 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{user?.full_name || 'Utente'}</p>
                  <p className="text-sm text-muted-foreground">{user?.role || 'user'}</p>
                </div>
              <span className={cn('ml-auto text-xs font-medium px-2.5 py-1 rounded-full', accessBadge(user?.subscription_status).cls)}>
                {accessBadge(user?.subscription_status).label}
              </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{user?.email || '—'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-medium mb-3">{t('settings.language')}</p>
              <LanguageSwitcher className="w-full" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impostazioni" className="mt-0 space-y-3">
          <Link to="/settings" className="block">
            <Card className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <SettingsIcon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t('settings.title')}</p>
                  <p className="text-xs text-muted-foreground">Privacy, dati ed esportazione</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">{t('settings.privacy_desc')}</p>
            </CardContent>
          </Card>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border border-input bg-transparent text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('settings.logout')}
          </button>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}