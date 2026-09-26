import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, Loader2, RefreshCw, ExternalLink, ShoppingBag, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  AMAZON_PARTNER_TAG, AMAZON_STORE, isAmazonUrl, extractAmazonAsin,
  buildAmazonAffiliateUrl, formatPrice, CATEGORY_LABEL_KEY,
} from '@/lib/shop';
import { cn } from '@/lib/utils';

// Pannello admin per le offerte Amazon manuale.
// L'admin incolla l'URL prodotto amazon.it: il sistema estrae l'ASIN e
// ricostruisce l'URL canonico con il tag affiliato iniettato. Mostra anche lo
// stato della Product Advertising API (PA API) e un pulsante "Verifica" che
// invoca lookupAmazonOffers. Testi admin-only in italiano.

export default function AmazonOffersPanel() {
  const { t, lang } = useI18n();
  const { toast } = useToast();

  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [url, setUrl] = useState('');
  const [price, setPrice] = useState('');
  const [productId, setProductId] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // PA API verify state
  const [verifying, setVerifying] = useState(false);
  const [paResult, setPaResult] = useState(null);

  const asin = useMemo(() => extractAmazonAsin(url), [url]);
  const previewUrl = useMemo(() => {
    if (asin) return buildAmazonAffiliateUrl(url, AMAZON_PARTNER_TAG);
    if (isAmazonUrl(url)) return buildAmazonAffiliateUrl(url, AMAZON_PARTNER_TAG);
    return '';
  }, [url, asin]);
  const urlValid = isAmazonUrl(url) || asin !== '';

  const load = async () => {
    setLoading(true);
    try {
      const [prods, offs] = await Promise.all([
        base44.entities.Product.list('order', 400).catch(() => []),
        base44.entities.AffiliateOffer.filter({ store_name: AMAZON_STORE }, '-updated_date', 400).catch(() => []),
      ]);
      setProducts((prods || []).filter((p) => p.active !== false));
      setOffers(offs || []);
    } catch { /* keep empty */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const productById = useMemo(() => {
    const m = {};
    for (const p of products) m[p.id] = p;
    return m;
  }, [products]);

  const resetForm = () => {
    setUrl(''); setPrice(''); setProductId(''); setTitle(''); setImageUrl('');
    setEditingId(null);
  };

  const handleEdit = (o) => {
    setEditingId(o.id);
    setUrl(o.affiliate_url || '');
    setPrice(o.store_price != null ? String(o.store_price) : '');
    setProductId(o.product_id || '');
    setTitle(o.title || '');
    setImageUrl(o.image_url || '');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!urlValid) {
      toast({ title: 'URL non valido', description: 'Incolla un link prodotto di amazon.it (contiene /dp/ASIN).', variant: 'destructive' });
      return;
    }
    const affiliate_url = buildAmazonAffiliateUrl(url, AMAZON_PARTNER_TAG);
    if (!affiliate_url) {
      toast({ title: 'URL non valido', description: 'Impossibile ricostruire il link affiliato.', variant: 'destructive' });
      return;
    }
    const pnum = parseFloat(String(price).replace(',', '.'));
    if (!isFinite(pnum) || pnum < 0) {
      toast({ title: 'Prezzo non valido', description: 'Inserisci un prezzo numerico (es. 19.90).', variant: 'destructive' });
      return;
    }
    if (!productId) {
      toast({ title: 'Prodotto mancante', description: 'Seleziona il prodotto del catalogo a cui collegare l\'offerta Amazon.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        product_id: productId,
        store_name: AMAZON_STORE,
        store_price: pnum,
        affiliate_url,
        image_url: imageUrl || undefined,
        title: title || undefined,
        source: 'manual',
      };
      if (editingId) await base44.entities.AffiliateOffer.update(editingId, payload);
      else await base44.entities.AffiliateOffer.create(payload);
      toast({ title: 'Offerta Amazon salvata', description: editingId ? 'Offerta aggiornata.' : 'Aggiunta al comparatore prezzi.' });
      resetForm();
      load();
    } catch (err) {
      toast({ title: 'Errore', description: err?.message || 'Salvataggio non riuscito', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questa offerta Amazon?')) return;
    try {
      await base44.entities.AffiliateOffer.delete(id);
      toast({ title: 'Offerta rimossa' });
      load();
    } catch (err) {
      toast({ title: 'Errore', description: err?.message || 'Eliminazione non riuscita', variant: 'destructive' });
    }
  };

  const verifyPaApi = async () => {
    setVerifying(true); setPaResult(null);
    try {
      const res = await base44.functions.invoke('lookupAmazonOffers', { limit: 5, dry_run: true });
      const data = res?.data || {};
      setPaResult(data);
      if (data.ok) {
        toast({ title: 'PA API attiva', description: 'Configurazione corretta: la sync notturna e\' pronta.' });
      } else {
        toast({ title: 'PA API non configurata', description: data.message || 'Inserisci le chiavi in Settings → Secrets.', variant: 'default' });
      }
    } catch (e) {
      setPaResult({ ok: false, error: e?.message || 'Errore verifica' });
      toast({ title: 'Errore', description: e?.message || 'Verifica non riuscita', variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

  const paMissing = paResult?.missing || [];

  return (
    <div className="space-y-5">
      {/* PA API status card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-heading text-lg font-semibold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-terracotta" /> Amazon Associates (tag {AMAZON_PARTNER_TAG})
              </p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Aggiungi le offerte Amazon a mano incollando il link prodotto: il tag affiliato viene inserito in automatico.
                La <strong>sync automatica dei prezzi</strong> (Product Advertising API) si attiva dopo le 3 vendite idonee di Amazon: allora inserisci le chiavi in Settings → Secrets.
              </p>
            </div>
            <Button onClick={verifyPaApi} disabled={verifying} variant="outline" className="rounded-xl">
              {verifying ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
              {t('shop.amazon_paapi_check')}
            </Button>
          </div>

          {paResult && !verifying && (
            paResult.ok ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> PA API configurata e funzionante. Sync notturna attiva.
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-medium flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> {t('shop.amazon_paapi_inactive')}</p>
                <p className="mt-1 leading-relaxed">
                  {paResult.message || 'Configurazione PA API incompleta.'}
                  {paMissing.length > 0 && <> Imposta in Settings → Secrets: <span className="font-mono">{paMissing.join(', ')}</span> (dopo l\'approvazione Amazon).</>}
                </p>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Add/edit form */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <p className="font-heading text-lg font-semibold">{editingId ? 'Modifica offerta Amazon' : t('shop.amazon_add')}</p>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <Label htmlFor="amz-url">{t('shop.amazon_url')}</Label>
              <Input
                id="amz-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.amazon.it/dp/B0xxxxxxxx"
                className={cn('mt-1', url && !urlValid && 'border-destructive/60')}
              />
              {url && asin && (
                <p className="text-xs text-muted-foreground mt-1">ASIN rilevato: <span className="font-mono">{asin}</span></p>
              )}
              {url && !urlValid && (
                <p className="text-xs text-destructive mt-1">Inserisci un URL amazon.it valido.</p>
              )}
              {previewUrl && (
                <div className="mt-2 rounded-lg border border-border bg-accent/50 p-2.5">
                  <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground mb-0.5">{t('shop.amazon_preview')}</p>
                  <p className="text-xs text-foreground break-all font-mono select-text">{previewUrl}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="amz-price">{t('shop.amazon_price')} (€)</Label>
                <Input id="amz-price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="19.90" inputMode="decimal" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="amz-product">{t('shop.amazon_product')}</Label>
                <Select value={productId} onValueChange={(v) => setProductId(v)}>
                  <SelectTrigger id="amz-product" className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <SelectValue placeholder="— Seleziona prodotto —" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}{p.category ? ' · ' + t(CATEGORY_LABEL_KEY[p.category]) : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="amz-title">{t('shop.amazon_title_field')}</Label>
                <Input id="amz-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Integratore (confezione 30 cps)" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="amz-img">{t('shop.amazon_image')} (URL)</Label>
                <Input id="amz-img" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://m.media-amazon.com/…" className="mt-1" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={saving} className="rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
                {editingId ? t('common.save') : t('common.add')}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" className="rounded-xl" onClick={resetForm}>{t('common.cancel')}</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Amazon offers */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-3">
          <p className="text-xs font-heading font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Offerte Amazon esistenti ({offers.length})
          </p>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin" /> Caricamento…</div>
          ) : offers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">{t('shop.amazon_empty')}</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {offers.map((o) => {
                const p = productById[o.product_id];
                return (
                  <div key={o.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center shrink-0 overflow-hidden">
                      {o.image_url ? <img src={o.image_url} alt="" className="w-full h-full object-cover" /> : <ShoppingBag className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{p?.name || 'Prodotto non trovato'}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.title || extractAmazonAsin(o.affiliate_url) || 'Amazon'}</p>
                      <p className="font-heading font-semibold text-terracotta">{formatPrice(o.store_price, lang)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(o)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground" aria-label={t('common.edit')}><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(o.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-400" aria-label={t('common.delete')}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}