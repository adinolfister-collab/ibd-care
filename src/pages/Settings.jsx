import React, { useEffect, useState } from 'react';
import { ShieldCheck, Globe, LogOut, User as UserIcon, Fingerprint, Database, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import HistoryExport from '@/components/HistoryExport';
import { useBiometric } from '@/lib/biometric';

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { supported, enabled, enable, disable } = useBiometric();
  const [bioBusy, setBioBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteAck, setDeleteAck] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toggleBio = async (checked) => {
    setBioBusy(true);
    try { if (checked) await enable(); else disable(); } catch (e) {}
    setBioBusy(false);
  };

  useEffect(() => {
    (async () => {
      try { setUser(await base44.auth.me()); } catch (e) {}
    })();
  }, []);

  const handleLogout = async () => { await base44.auth.logout(); };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleting(true);
    try {
      await Promise.all([
        base44.entities.SymptomEntry.deleteMany({}),
        base44.entities.FoodEntry.deleteMany({}),
        base44.entities.Medication.deleteMany({}),
        base44.entities.MedicalRecord.deleteMany({}),
        base44.entities.MealTemplate.deleteMany({}),
      ]);
    } catch (err) {
      console.error('Errore durante la cancellazione dei dati', err);
    }
    setDeleting(false);
    setDeleteOpen(false);
    await base44.auth.logout();
    navigate('/login');
  };

  return (
    <AppLayout>
      <PageHeader title={t('settings.title')} subtitle="Privacy, lingua ed esportazione dei tuoi dati sanitari." />

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

        {/* Full data export */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Database className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="font-semibold">Esporta tutti i tuoi dati</p>
                <p className="text-sm text-muted-foreground leading-snug mt-0.5">Scarica l'intero storico di sintomi, pasti e referti in un unico file CSV o PDF.</p>
              </div>
            </div>
            <HistoryExport />
          </CardContent>
        </Card>

        {/* Biometric lock */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Fingerprint className="w-5 h-5 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Blocco biometrico</p>
                <p className="text-sm text-muted-foreground leading-snug">Sblocca l'app con impronta o riconoscimento facciale per proteggere i tuoi dati sanitari privati.</p>
              </div>
              <Switch checked={enabled} disabled={!supported || bioBusy} onCheckedChange={toggleBio} />
            </div>
            {!supported && <p className="text-xs text-muted-foreground mt-3">Il dispositivo non supporta lo sblocco biometrico nel browser.</p>}
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
            <button
              onClick={() => { setDeleteAck(false); setDeleteOpen(true); }}
              className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl text-sm font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Elimina account
            </button>
          </CardContent>
        </Card>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Elimina account e dati sanitari</AlertDialogTitle>
              <AlertDialogDescription>
                Stai per cancellare definitivamente il tuo account IBD Care insieme a tutti i sintomi, pasti, terapie, referti e modelli salvati. Questa azione è irreversibile e i dati non potranno essere recuperati.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={deleteAck}
                onChange={(e) => setDeleteAck(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border accent-destructive"
              />
              <span>Ho compreso che l'eliminazione è permanente e cancellerà tutti i miei dati sanitari.</span>
            </label>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting} className="min-h-[44px]">Annulla</AlertDialogCancel>
              <AlertDialogAction
                disabled={!deleteAck || deleting}
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px]"
              >
                {deleting ? 'Eliminazione…' : 'Elimina definitivamente'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}