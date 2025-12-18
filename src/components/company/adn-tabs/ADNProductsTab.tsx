import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useCompanyProducts, CompanyProduct } from '@/hooks/useCompanyProducts';
import { Package, Plus, Trash2, Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface ADNProductsTabProps {
  companyId: string;
}

export const ADNProductsTab = ({ companyId }: ADNProductsTabProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { products, loading, saving, addProduct, updateProduct, deleteProduct } = useCompanyProducts(companyId);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = async () => {
    try {
      await addProduct({ name: 'Nuevo Producto' });
      toast({ title: t('company.products.added', 'Producto agregado') });
    } catch {
      toast({ title: t('company.email.save_error'), variant: 'destructive' });
    }
  };

  const handleUpdate = async (id: string, updates: Partial<CompanyProduct>) => {
    try {
      await updateProduct(id, updates);
    } catch {
      toast({ title: t('company.email.save_error'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast({ title: t('company.products.deleted', 'Producto eliminado') });
    } catch {
      toast({ title: t('company.email.save_error'), variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('company.products.title', 'Productos y Servicios')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('company.products.desc', 'Los agentes usarán esta información para crear contenido específico')}
          </p>
        </div>
        <Button onClick={handleAdd} disabled={saving}>
          <Plus className="h-4 w-4 mr-2" />
          {t('company.products.add', 'Agregar')}
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('company.products.empty', 'No hay productos configurados')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map(product => (
            <Card key={product.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={product.name}
                      onChange={(e) => handleUpdate(product.id, { name: e.target.value })}
                      className="font-semibold text-lg border-none px-0 focus-visible:ring-0"
                      placeholder={t('company.products.name', 'Nombre del producto')}
                    />
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Star className={`h-4 w-4 ${product.is_featured ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                        <Label className="text-sm">{t('company.products.featured', 'Destacado')}</Label>
                        <Switch
                          checked={product.is_featured}
                          onCheckedChange={(v) => handleUpdate(product.id, { is_featured: v })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">{t('company.products.active', 'Activo')}</Label>
                        <Switch
                          checked={product.is_active}
                          onCheckedChange={(v) => handleUpdate(product.id, { is_active: v })}
                        />
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('company.products.category', 'Categoría')}</Label>
                    <Input
                      value={product.category || ''}
                      onChange={(e) => handleUpdate(product.id, { category: e.target.value })}
                      placeholder="Ej: Software, Consultoría"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('company.products.price', 'Precio')}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={product.price || ''}
                        onChange={(e) => handleUpdate(product.id, { price: parseFloat(e.target.value) || null })}
                        placeholder="0.00"
                      />
                      <Input
                        value={product.currency}
                        onChange={(e) => handleUpdate(product.id, { currency: e.target.value })}
                        className="w-20"
                        placeholder="MXN"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('company.products.description', 'Descripción')}</Label>
                  <Textarea
                    value={product.description || ''}
                    onChange={(e) => handleUpdate(product.id, { description: e.target.value })}
                    placeholder={t('company.products.description_placeholder', 'Describe tu producto o servicio...')}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('company.products.value_prop', 'Propuesta de valor')}</Label>
                  <Textarea
                    value={product.value_proposition || ''}
                    onChange={(e) => handleUpdate(product.id, { value_proposition: e.target.value })}
                    placeholder={t('company.products.value_prop_placeholder', '¿Por qué elegir este producto?')}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('company.products.landing_url', 'URL de landing')}</Label>
                  <Input
                    value={product.landing_url || ''}
                    onChange={(e) => handleUpdate(product.id, { landing_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
