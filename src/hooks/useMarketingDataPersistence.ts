import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MarketingCampaign {
  id?: string;
  company_name: string;
  business_objective: string;
  status: string;
  user_id: string;
}

interface BuyerPersona {
  campaign_id: string;
  fictional_name: string;
  professional_role?: string;
  details: any;
}

interface MarketingStrategy {
  campaign_id: string;
  unified_message?: string;
  competitive_analysis: any[];
  marketing_funnel: any;
  content_plan: any;
}

interface ContentCalendarItem {
  strategy_id: string;
  publish_date: string;
  publish_time?: string;
  social_network: string;
  content_details: any;
  final_copy?: string;
}

interface GeneratedAsset {
  calendar_item_id: string;
  asset_type: 'image' | 'reel';
  asset_url?: string;
  prompt_used?: string;
  creative_assets?: any;
}

export const useMarketingDataPersistence = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Helper function to get current user ID
  const getCurrentUserId = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  };

  // Store target audience data (buyer personas)
  const storeTargetAudienceData = async (
    functionOutput: any, 
    companyData: { nombre_empresa: string; objetivo_de_negocio: string }
  ) => {
    setIsProcessing(true);
    try {
      const userId = await getCurrentUserId();

      // Create campaign first
      const { data: campaign, error: campaignError } = await supabase
        .from('marketing_campaigns')
        .insert({
          company_name: companyData.nombre_empresa,
          business_objective: companyData.objetivo_de_negocio,
          status: 'Audience Defined',
          user_id: userId
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Extract buyer personas from function output
      const buyerPersonas = functionOutput.data?.buyer_personas || 
                           functionOutput.buyer_personas || 
                           [];

      if (buyerPersonas.length > 0) {
        const personasToInsert = buyerPersonas.map((persona: any) => ({
          campaign_id: campaign.id,
          fictional_name: persona.nombre_ficticio || persona.fictional_name || 'Persona',
          professional_role: persona.rol_profesional || persona.professional_role,
          details: {
            demografia: persona.demografia,
            puntos_de_dolor: persona.puntos_de_dolor,
            metas_y_objetivos: persona.metas_y_objetivos,
            motivaciones: persona.motivaciones,
            estrategia_de_activacion: persona.estrategia_de_activacion,
            plataformas_prioritarias: persona.plataformas_prioritarias
          }
        }));

        const { error: personasError } = await supabase
          .from('buyer_personas')
          .insert(personasToInsert);

        if (personasError) throw personasError;
      }

      toast({
        title: "Audiencia objetivo guardada",
        description: `Campaña creada con ${buyerPersonas.length} buyer personas`,
      });

      return campaign.id;

    } catch (error: any) {
      toast({
        title: "Error al guardar audiencia",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Store marketing strategy data
  const storeMarketingStrategyData = async (functionOutput: any, campaignId: string) => {
    setIsProcessing(true);
    try {
      // Extract strategy data from function output - handle N8N response structure
      let strategyData = functionOutput;
      if (Array.isArray(functionOutput) && functionOutput.length > 0 && functionOutput[0].output) {
        strategyData = functionOutput[0].output;
      }

      // Extract comprehensive strategy information
      const competitors = strategyData.competitors || [];
      const mainStrategy = competitors.length > 3 ? competitors[3] : {};

      const { data: strategy, error: strategyError } = await supabase
        .from('marketing_strategies')
        .insert({
          campaign_id: campaignId,
          unified_message: mainStrategy.message_differentiator?.core || 'Estrategia personalizada generada con IA',
          competitive_analysis: competitors.slice(0, 3) || [], // Store competitor analysis
          marketing_funnel: mainStrategy.strategies || {}, // Store funnel strategies
          content_plan: {
            platform_plans: mainStrategy.content_plan || {},
            editorial_calendar: mainStrategy.editorial_calendar || [],
            kpis: mainStrategy.kpis || {},
            execution_plan: mainStrategy.execution_plan || {},
            budget_estimation: mainStrategy.execution_plan?.budget_estimation || {},
            message_differentiator: mainStrategy.message_differentiator || {},
            full_strategy_data: strategyData // Store complete response for reference
          }
        })
        .select()
        .single();

      if (strategyError) throw strategyError;

      // Update campaign status
      await supabase
        .from('marketing_campaigns')
        .update({ status: 'Strategy Created' })
        .eq('id', campaignId);

      toast({
        title: "Estrategia de marketing guardada",
        description: "La estrategia completa ha sido almacenada correctamente",
      });

      return strategy.id;

    } catch (error: any) {
      toast({
        title: "Error al guardar estrategia",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Store content calendar data
  const storeContentCalendarData = async (functionOutput: any, strategyId: string) => {
    setIsProcessing(true);
    try {
      // Extract calendar data from strategy output - handle N8N response structure
      let calendarData = functionOutput;
      if (Array.isArray(functionOutput) && functionOutput.length > 0 && functionOutput[0].output) {
        calendarData = functionOutput[0].output;
      }

      // Get editorial calendar from the strategy
      const editorialCalendar = calendarData.competitors?.[3]?.editorial_calendar || 
                               calendarData.editorial_calendar || 
                               calendarData.calendario || 
                               calendarData.calendar || 
                               [];

      if (editorialCalendar.length > 0) {
        const postsToInsert = editorialCalendar.map((post: any) => ({
          strategy_id: strategyId,
          publish_date: post.date || post.fecha || post.publish_date,
          publish_time: post.time || post.hora || post.publish_time || '12:00',
          social_network: post.channel || post.red_social || post.social_network || post.platform,
          content_details: {
            format: post.format || post.formato || post.content_type,
            title: post.title || post.titulo || post.hook_title,
            cta: post.cta || post.call_to_action,
            responsible: post.responsible || post.responsable,
            tema_concepto: post.theme_concept || post.tema_concepto,
            copy_mensaje: post.copy_message || post.copy_mensaje,
            descripcion_creativo: post.creative_description || post.descripcion_creativo
          }
        }));

        const { error: postsError } = await supabase
          .from('content_calendar_items')
          .insert(postsToInsert);

        if (postsError) throw postsError;

        // Update campaign status
        const { data: strategy } = await supabase
          .from('marketing_strategies')
          .select('campaign_id')
          .eq('id', strategyId)
          .single();
        
        if (strategy) {
          await supabase
            .from('marketing_campaigns')
            .update({ status: 'Calendar Created' })
            .eq('id', strategy.campaign_id);
        }

        toast({
          title: "Calendario de contenido guardado",
          description: `${editorialCalendar.length} publicaciones programadas`,
        });
      }

    } catch (error: any) {
      toast({
        title: "Error al guardar calendario",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Store post creator data
  const storePostCreatorData = async (functionOutput: any, calendarItemId: string) => {
    setIsProcessing(true);
    try {
      const postData = functionOutput.data || functionOutput;
      const finalCopy = postData.copy_final || postData.final_copy || postData.generated_copy;

      if (finalCopy) {
        const { error } = await supabase
          .from('content_calendar_items')
          .update({ final_copy: finalCopy })
          .eq('id', calendarItemId);

        if (error) throw error;

        toast({
          title: "Copy del post guardado",
          description: "El contenido final ha sido almacenado",
        });
      }

    } catch (error: any) {
      toast({
        title: "Error al guardar copy",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Store generated assets (images/reels)
  const storeGeneratedAssetData = async (
    functionOutput: any, 
    calendarItemId: string, 
    assetType: 'image' | 'reel'
  ) => {
    setIsProcessing(true);
    try {
      const assetData = functionOutput.data || functionOutput;

      const { error } = await supabase
        .from('generated_assets')
        .insert({
          calendar_item_id: calendarItemId,
          asset_type: assetType,
          asset_url: assetData.asset_url || assetData.url,
          prompt_used: assetData.prompt_usado || assetData.prompt_used,
          creative_assets: assetData.assets_creativos || assetData.creative_assets
        });

      if (error) throw error;

      toast({
        title: `${assetType === 'image' ? 'Imagen' : 'Reel'} guardado`,
        description: "El asset ha sido almacenado correctamente",
      });

    } catch (error: any) {
      toast({
        title: "Error al guardar asset",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Get campaigns for current user
  const getUserCampaigns = async () => {
    try {
      const userId = await getCurrentUserId();
      
      const { data: campaigns, error } = await supabase
        .from('marketing_campaigns')
        .select(`
          *,
          buyer_personas(*),
          marketing_strategies(
            *,
            content_calendar_items(
              *,
              generated_assets(*)
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return campaigns;

    } catch (error: any) {
      toast({
        title: "Error al cargar campañas",
        description: error.message,
        variant: "destructive"
      });
      return [];
    }
  };

  return {
    isProcessing,
    storeTargetAudienceData,
    storeMarketingStrategyData,
    storeContentCalendarData,
    storePostCreatorData,
    storeGeneratedAssetData,
    getUserCampaigns
  };
};