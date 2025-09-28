import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CampaignDraft {
  id: string;
  company_name: string;
  business_objective: string;
  status: string;
  current_step: string;
  is_draft: boolean;
  draft_data: any;
  last_saved_at: string;
  created_at: string;
  updated_at: string;
}

export const useCampaignDrafts = () => {
  const [drafts, setDrafts] = useState<CampaignDraft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<CampaignDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load user's campaign drafts
  const loadDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setDrafts(data || []);
    } catch (error: any) {
      console.error('Error loading drafts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las campañas en progreso",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create or update a campaign draft
  const saveDraft = useCallback(async (
    campaignData: any,
    currentStep: string,
    draftId?: string
  ): Promise<string | null> => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const draftPayload = {
        user_id: user.id,
        company_name: campaignData.company?.nombre_empresa || 'Campaña sin nombre',
        business_objective: campaignData.company?.objetivo_de_negocio || campaignData.objective?.goal || 'Objetivo no definido',
        status: 'Borrador',
        current_step: currentStep,
        is_draft: true,
        draft_data: campaignData,
        last_saved_at: new Date().toISOString(),
      };

      let result;
      if (draftId) {
        // Update existing draft
        const { data, error } = await supabase
          .from('marketing_campaigns')
          .update(draftPayload)
          .eq('id', draftId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('marketing_campaigns')
          .insert(draftPayload)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      setCurrentDraft(result);
      await loadDrafts(); // Refresh drafts list

      return result.id;
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar el progreso",
        variant: "destructive"
      });
      return null;
    } finally {
      setSaving(false);
    }
  }, [toast, loadDrafts]);

  // Load a specific draft
  const loadDraft = useCallback(async (draftId: string): Promise<any | null> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', draftId)
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .single();

      if (error) throw error;

      setCurrentDraft(data);
      return data;
    } catch (error: any) {
      console.error('Error loading draft:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la campaña",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Delete a draft
  const deleteDraft = useCallback(async (draftId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', draftId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadDrafts(); // Refresh drafts list
      
      if (currentDraft?.id === draftId) {
        setCurrentDraft(null);
      }

      toast({
        title: "Borrador eliminado",
        description: "La campaña en progreso fue eliminada exitosamente",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la campaña",
        variant: "destructive"
      });
      return false;
    }
  }, [toast, loadDrafts, currentDraft]);

  // Complete a draft (mark as finished)
  const completeDraft = useCallback(async (draftId: string): Promise<boolean> => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('marketing_campaigns')
        .update({
          is_draft: false,
          status: 'Completada',
          current_step: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', draftId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadDrafts(); // Refresh drafts list
      setCurrentDraft(null);

      toast({
        title: "¡Campaña completada!",
        description: "Tu campaña ha sido finalizada exitosamente",
      });

      return true;
    } catch (error: any) {
      console.error('Error completing draft:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la campaña",
        variant: "destructive"
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [toast, loadDrafts]);

  // Auto-save functionality
  const autoSave = useCallback(async (campaignData: any, currentStep: string, draftId?: string) => {
    // Debounced auto-save logic
    return saveDraft(campaignData, currentStep, draftId);
  }, [saveDraft]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  return {
    drafts,
    currentDraft,
    loading,
    saving,
    loadDrafts,
    saveDraft,
    loadDraft,
    deleteDraft,
    completeDraft,
    autoSave,
    setCurrentDraft
  };
};