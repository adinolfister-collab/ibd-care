import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/components/AppLayout';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { useGuestPreview } from '@/lib/GuestPreviewContext';

// Pagina admin dedicata all'attivazione della modalità "Anteprima ospite".
// L'admin vede qui cosa comporta l'anteprima e attiva la modalità con un
// pulsante esplicito, invece di cercare un toggle nascosto nel pannello.
export default function AdminGuestPreview() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { isGuestPreview, enterGuestPreview } = useGuestPreview();
  const navigate = useNavigate();

  const handleEnter = () => {
    enterGuestPreview();
    navigate('/');
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('nav.back') || 'Indietro'}
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <span className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Eye className="w-6 h-6 text-primary" />
          </span>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              {t('guest.preview_page_title') || 'Anteprima ospite'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
              {t('guest.preview_page_desc') ||
                "Attivando l'anteprima ospite navigherai l'app esattamente come un visitatore non loggato: vedrai i dati demo su tutte le pagine, le sezioni account e admin resteranno nascoste e ogni scrittura sarà bloccata. La tua sessione admin resta attiva in background."}
            </p>
            <div className="flex items-start gap-2.5 rounded-xl bg-terracotta/10 border border-terracotta/30 p-3.5">
              <Info className="w-4 h-4 text-terracotta mt-0.5 shrink-0" />
              <p className="text-xs md:text-sm text-foreground/80 leading-relaxed">
                {t('guest.preview_page_hint') ||
                  "Per uscire dall'anteprima usa il pulsante «Esci dall'anteprima» nel banner in basso: tornerai subito alla tua vista admin senza rifare il login."}
              </p>
            </div>
            <Button
              onClick={handleEnter}
              disabled={isGuestPreview}
              className="w-full h-12 text-base font-medium"
            >
              <Eye className="w-5 h-5" />
              {isGuestPreview
                ? (t('guest.preview_page_active') || 'Anteprima già attiva')
                : (t('guest.preview_page_enter') || 'Entra in anteprima ospite')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}