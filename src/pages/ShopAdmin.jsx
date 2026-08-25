import React, { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Upload, Loader2, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import EntityFormDialog from '@/components/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { CATEGORY_LABEL_KEY } from '@/lib/shop';
import { cn } from '@/lib/utils';

const categories = [
  { value: 'integratori_nutraceutici', key: 'shop.cat_integratori_nutraceutici' },
  { value: 'alimenti_speciali', key: 'shop.cat_alimenti_speciali' },
  { value: 'presidi_medici_stomia', key: 'shop.cat_presidi_medici_stomia' },
];

const fields = (t) => [
  { name: 'name', label: t('shop.field_name'), type: 'text' },
  { name: 'category', label: t('shop.field_category'), type: 'select', options: categories.map((c) => ({ value: c.value, label: t(c.key) })) },
  { name: 'supplier', label: t('shop.field_supplier'), type: 'text' },
  { name: 'supplier_url', label: t('shop.field_supplier_url'), type: 'text' },
  { name: 'price_indicativo', label: t('shop.field_price'), type: 'text' },
  { name: 'description', label: t('shop.field_description'), type: 'textarea' },
  { name: 'image_url', label: t('shop.field_image'), type: 'file' },
  { name: 'active', label: t('shop.field_active'), type: 'checkbox' },
  { name: 'order', label: 'Ordine', type: 'number' },
];

export default function ShopAdmin() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Product.list('-order,-created_date', 400);
      setItems(data || []);
    } catch { setItems([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/shop" replace />;

  const openNew = () => { setEditing({ active: true }); setOpen(true); };
  const openEdit = (p) => { setEditing(p); setOpen(true); };

  const handleSubmit = async (data) => {
    try {
      if (editing?.id) await base44.entities.Product.update(editing.id, data);
      else await base44.entities.Product.create(data);
      setOpen(false); load();
    } catch (e) {
      toast({ title: 'Errore', description: e.message || 'Salvataggio non riuscito', variant: 'destructive' });
    }
  };
  const handleDelete = async (id) => {
    if (!confirm('Eliminare questo prodotto?')) return;
    await base44.entities.Product.delete(id); load();
  };

  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  category: { type: 'string', enum: ['integratori_nutraceutici', 'alimenti_speciali', 'presidi_medici_stomia'] },
                  supplier: { type: 'string' },
                  supplier_url: { type: 'string' },
                  description: { type: 'string' },
                  price_indicativo: { type: 'string' },
                },
                required: ['name', 'category', 'supplier', 'supplier_url'],
              },
            },
          },
        },
      });
      const list = (res?.output?.products || (Array.isArray(res?.output) ? res.output : []));
      if (!list.length) { toast({ title: t('shop.import_title'), description: t('shop.import_empty'), variant: 'destructive' }); }
      else {
        const ok = await base44.entities.Product.bulkCreate(list);
        toast({ title: t('shop.import_title'), description: `${(ok || []).length} ${t('shop.import_result')}` });
        load();
      }
    } catch (e) {
      toast({ title: t('shop.import_title'), description: e.message || t('shop.import_error'), variant: 'destructive' });
    }
    setImporting(false);
  };

  return (
    <AppLayout>
      <PageHeader
        title={t('shop.admin_title')}
        subtitle={t('shop.admin_subtitle')}
        action={
          <div className="flex gap-2 flex-wrap">
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.json" onChange={onImportFile} className="hidden" />
            <Button variant="outline" className="rounded-xl" onClick={() => fileRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}{t('shop.import')}
            </Button>
            <Button onClick={openNew} className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" />{t('shop.add')}</Button>
          </div>
        }
      />

      {loading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">{t('shop.empty')}</p>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <Card key={p.id} className={cn('border-0 shadow-sm', p.active === false && 'opacity-60')}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0 overflow-hidden">
                  {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{t(CATEGORY_LABEL_KEY[p.category])} · {p.supplier} {p.price_indicativo ? '· ' + p.price_indicativo : ''}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EntityFormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing?.id ? t('common.edit') : t('shop.add')}
        submitLabel={t('common.save')}
        fields={fields(t)}
        initialData={editing}
        onSubmit={handleSubmit}
      />
    </AppLayout>
  );
}