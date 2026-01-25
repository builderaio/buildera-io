import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyCompetitor {
  id: string;
  company_id: string;
  competitor_name: string;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  tiktok_url: string | null;
  twitter_url: string | null;
  is_direct_competitor: boolean;
  priority_level: number;
  monitor_pricing: boolean;
  monitor_content: boolean;
  monitor_campaigns: boolean;
  notes: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  ai_analysis: any | null;
  last_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useCompanyCompetitors = (companyId: string | null) => {
  const [competitors, setCompetitors] = useState<CompanyCompetitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCompetitors = useCallback(async () => {
    if (!companyId) {
      setCompetitors([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_competitors')
        .select('*')
        .eq('company_id', companyId)
        .order('priority_level', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompetitors(data || []);
    } catch (err) {
      console.error('Error loading competitors:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadCompetitors();
  }, [loadCompetitors]);

  const addCompetitor = async (competitor: Partial<CompanyCompetitor>) => {
    if (!companyId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('company_competitors')
        .insert({ 
          company_id: companyId, 
          competitor_name: competitor.competitor_name || 'Nuevo Competidor',
          ...competitor 
        });

      if (error) throw error;
      await loadCompetitors();
    } catch (err) {
      console.error('Error adding competitor:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const updateCompetitor = async (competitorId: string, updates: Partial<CompanyCompetitor>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('company_competitors')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', competitorId);

      if (error) throw error;
      await loadCompetitors();
    } catch (err) {
      console.error('Error updating competitor:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const deleteCompetitor = async (competitorId: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('company_competitors')
        .delete()
        .eq('id', competitorId);

      if (error) throw error;
      await loadCompetitors();
    } catch (err) {
      console.error('Error deleting competitor:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { competitors, loading, saving, addCompetitor, updateCompetitor, deleteCompetitor, refetch: loadCompetitors };
};
