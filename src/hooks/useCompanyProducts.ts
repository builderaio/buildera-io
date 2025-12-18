import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyProduct {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
  currency: string;
  is_featured: boolean;
  is_active: boolean;
  value_proposition: string | null;
  target_audience: string | null;
  benefits: string[] | null;
  keywords: string[] | null;
  image_url: string | null;
  landing_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useCompanyProducts = (companyId: string | null) => {
  const [products, setProducts] = useState<CompanyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!companyId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_products')
        .select('*')
        .eq('company_id', companyId)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const addProduct = async (product: Partial<CompanyProduct>) => {
    if (!companyId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('company_products')
        .insert({ company_id: companyId, name: product.name || 'Nuevo Producto', ...product });

      if (error) throw error;
      await loadProducts();
    } catch (err) {
      console.error('Error adding product:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async (productId: string, updates: Partial<CompanyProduct>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('company_products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;
      await loadProducts();
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('company_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { products, loading, saving, addProduct, updateProduct, deleteProduct, refetch: loadProducts };
};
