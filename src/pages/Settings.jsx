import React, { useEffect, useState } from 'react';
import { ShieldCheck, Globe, LogOut, User as UserIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try { setUser(await base44.auth.me()); } catch (e) {}
    })();
  }, []);

  const handleLogout = async () => { await base44.auth.logout(); };

  return (
    <AppLayout>
      <PageHeader title={t('settings.title')} />

      <div className="space-y-4">
        {/* Language */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Globe className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="font-semibold">{t('settings.language')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { code: 'it', label: 'Italiano', flag: '🇮🇹' },
                { code: 'en', label: 'English', flag: '🇬🇧' },
                { code: 'es', label: 'Español', flag: '🇪🇸' },
                { code: 'fr', label: 'Français', flag: '🇫🇷' },
                { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
                { code: 'pt', label: 'Português', flag: '🇵🇹' },
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={cn(
                    'flex items-center justify-center gap-2 py-3 rounded-xl text-base font-medium transition-colors',
                    lang === l.code ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
                  )}
                >
                  <span className="text-lg">{l.flag}</span> {l.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-accent/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-emerald-600" /></div>
              <p className="font-semibold">{t('settings.privacy')}</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('settings.privacy_desc')}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">✓</span> Ogni registrazione è accessibile solo dal tuo account.</li>
              <li className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">✓</span> I referti caricati restano privati e associati a te.</li>
              <li className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">✓</span> Il riepilogo PDF è generato sul dispositivo, non sui server.</li>
              <li className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">✓</span> L'accesso è protetto da login; puoi attivare il blocco biometrico del dispositivo dalle impostazioni di sistema.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center"><UserIcon className="w-5 h-5 text-muted-foreground" /></div>
              <div>
                <p className="font-semibold">{t('settings.account')}</p>
                {user?.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-base font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
              <LogOut className="w-5 h-5" /> {t('settings.logout')}
            </button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}