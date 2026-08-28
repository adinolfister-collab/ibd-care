import React from 'react';
import { Building2, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/lib/i18n';
import { trackShopClick } from '@/lib/shop';

// menù a tendina "I nostri partner" per il Negozio: elenca i nomi store unici
// derivati dalle offerte affiliate salvate e apre il sito dello store selezionato
// in una nuova scheda, registrando l'evento di conversione.
export default function ShopPartnerMenu({ partners = [] }) {
  const { t } = useI18n();
  if (!partners.length) return null;

  const handleClick = (partner) => {
    trackShopClick({ store_name: partner.name, affiliate_url: partner.url }, null, 'partner_menu');
    window.open(partner.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/70 transition-colors"
        >
          <Building2 className="w-4 h-4" />
          {t('shop.our_partners')}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 border-terracotta/40">
        <DropdownMenuLabel className="font-heading text-sm text-terracotta">
          {t('shop.our_partners')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {partners.map((p) => (
          <DropdownMenuItem
            key={p.name}
            onClick={() => handleClick(p)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="font-heading text-sm text-foreground flex-1 truncate">{p.name}</span>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}