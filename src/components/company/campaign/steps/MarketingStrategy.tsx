import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StrategyGenerationLoader } from '@/components/ui/strategy-generation-loader';
import { 
  BarChart3, 
  Edit3, 
  Sparkles, 
  Target, 
  Zap,
  CheckCircle,
  Loader2,
  TrendingUp,
  Lightbulb,
  Users,
  Download,
  Edit2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  EditableStrategySection, 
  EditableText, 
  EditableList, 
  EditableKeyValuePair 
} from './EditableStrategySection';


class StrategyErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void; onError?: () => void },
  { hasError: boolean; error?: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    console.error('❌ Strategy render error:', error);
    console.error('❌ Error info:', errorInfo);
    
    // NUEVO: Llamar onError para resetear generating
    if (this.props.onError) {
      this.props.onError();
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Ocurrió un error al mostrar la estrategia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Hemos detectado un problema al renderizar esta sección. Puedes reintentar la generación.
            </p>
            <Button onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset?.();
            }}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children as any;
  }
}


interface MarketingStrategyProps {
  campaignData: any;
  onComplete: (data: any) => void;
  loading: boolean;
}

export const MarketingStrategy = ({ campaignData, onComplete, loading }: MarketingStrategyProps) => {
  const [strategy, setStrategy] = useState<any>(null);
  const [editedStrategy, setEditedStrategy] = useState('');
  const [generating, setGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  
  // Estados de edición para cada sección
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<any>({});

  console.log('🔍 MarketingStrategy render - strategy:', strategy, 'generating:', generating, 'campaignData:', campaignData);

  // Helper function to normalize strategy data (supports EN/ES)
  const normalizeStrategy = (raw: any) => {
    const s: any = { ...(raw || {}) };

    // Canonicalizar nombres de plataformas
    const canon = (p: string) => {
      const k = (p || '').toLowerCase();
      if (k === 'linkedin' || k === 'linked in') return 'LinkedIn';
      if (k === 'instagram') return 'Instagram';
      if (k === 'tiktok' || k === 'tik tok') return 'TikTok';
      if (k === 'email' || k === 'correo' || k === 'mail') return 'Email';
      if (k === 'web' || k === 'website' || k === 'sitio' || k === 'site') return 'Web';
      return p || '';
    };

    // 1. Procesar core_message (mensaje_central en español)
    s.core_message = s.core_message || s.mensaje_central || '';
    
    // 2. Procesar competidores / competitors
    if (typeof s.competidores === 'string') {
      s.competitors = s.competidores ? [{ name: 'Análisis General', description: s.competidores }] : [];
    } else if (Array.isArray(s.competidores)) {
      s.competitors = s.competidores;
    } else {
      s.competitors = s.competitors || [];
    }

    // 3. Procesar mensaje_diferenciador / differentiated_message
    if (s.variantes_mensajes) {
      s.message_variants = {
        LinkedIn: s.variantes_mensajes.linkedin || '',
        Instagram: s.variantes_mensajes.instagram_facebook || s.variantes_mensajes.instagram || '',
        TikTok: s.variantes_mensajes.tiktok || ''
      };
    }

    // 4. Procesar embudo / funnel_strategies
    if (Array.isArray(s.embudo)) {
      s.strategies = {};
      s.embudo.forEach((item: any) => {
        const key = (item.etapa || '').toLowerCase().replace(/\s+/g, '_');
        if (key) s.strategies[key] = item;
      });
    }

    // 5. Procesar kpis
    if (Array.isArray(s.kpis)) {
      s.kpis_goals = s.kpis.map((item: any) => ({
        kpi: item.kpi || '',
        goal: item.meta || item.goal || ''
      }));
    }

    // 6. Procesar plan_contenidos / content_plan
    if (Array.isArray(s.plan_contenidos)) {
      s.content_plan = {};
      s.plan_contenidos.forEach((item: any) => {
        const platform = canon(item.canal || item.channel);
        if (platform) {
          s.content_plan[platform] = {
            formats: item.formatos || item.formats || '',
            tone: item.tono || item.tone || '',
            cta: item.CTA || item.cta || '',
            frequency: item.frecuencia_recomendada || item.frequency || ''
          };
        }
      });
    }

    // 7. Procesar plan_ejecucion / execution_plan
    if (Array.isArray(s.plan_ejecucion)) {
      s.execution_plan = {
        steps: s.plan_ejecucion.map((p: any) => p.paso || '').filter(Boolean),
        roles: s.plan_ejecucion.map((p: any) => p.responsable || '').filter(Boolean),
        assets: s.plan_ejecucion.map((p: any) => p.activos || '').filter(Boolean),
        budget: s.plan_ejecucion.map((p: any) => p.presupuesto || '').filter(Boolean)
      };
    }

    // 8. Procesar sources / fuentes
    s.sources = Array.isArray(s.sources) ? s.sources : (Array.isArray(s.fuentes) ? s.fuentes : []);

    // 9. Procesar risks_assumptions / riesgos_supuestos
    s.risks_assumptions = Array.isArray(s.risks_assumptions) 
      ? s.risks_assumptions 
      : (Array.isArray(s.riesgos_supuestos) ? s.riesgos_supuestos : []);

    return s;
  };

  // Helper function to generate strategy summary text
  const generateStrategyText = (strategy: any) => {
    return `MENSAJE PRINCIPAL: ${strategy.core_message || ''}

VARIACIONES POR PLATAFORMA:
${Object.entries(strategy.message_variants || {}).map(([platform, message]: [string, any]) => 
  `• ${platform.toUpperCase()}: ${message}`).join('\n')}

ESTRATEGIAS POR FUNNEL:
${Object.entries(strategy.strategies || {}).map(([key, value]: [string, any]) => 
  `• ${key.toUpperCase()}: ${value.objective || value}`).join('\n')}

KPIS Y OBJETIVOS:
${(strategy.kpis_goals || []).map((kpi: any) => 
  `• ${kpi.kpi}: ${kpi.goal}`).join('\n')}

RIESGOS Y ASUNCIONES:
${(strategy.risks_assumptions || []).map((risk: string, idx: number) => 
  `${idx + 1}. ${risk}`).join('\n')}

PLAN DE CONTENIDO:
${Object.entries(strategy.content_plan || {}).map(([platform, config]: [string, any]) => 
  `• ${platform}: ${config.frequency} - ${config.tone}`).join('\n')}`;
  };

  // Load existing strategy from campaignData or database
  useEffect(() => {
    // Don't reload if already have strategy or currently generating
    if (strategy || generating) {
      console.log('⏭️ Skipping load - already have strategy or generating');
      return;
    }
    
    // 1. First try to load from campaignData (memory)
    if (campaignData.strategy) {
      console.log('📥 Loading existing strategy from campaignData:', campaignData.strategy);
      
      const existingStrategy = campaignData.strategy.strategy || campaignData.strategy;
      setStrategy(existingStrategy);
      
      if (campaignData.strategy.edited_strategy) {
        setEditedStrategy(campaignData.strategy.edited_strategy);
      } else if (existingStrategy.core_message) {
        // Generate summary text from existing strategy
        const strategyText = `MENSAJE PRINCIPAL: ${existingStrategy.core_message}

VARIACIONES POR PLATAFORMA:
${Object.entries(existingStrategy.message_variants || {}).map(([platform, message]: [string, any]) => 
  `• ${platform.toUpperCase()}: ${message}`).join('\n')}

ESTRATEGIAS POR FUNNEL:
${Object.entries(existingStrategy.strategies || {}).map(([key, value]: [string, any]) => 
  `• ${key.toUpperCase()}: ${value.objective || value}`).join('\n')}

KPIS Y OBJETIVOS:
${(existingStrategy.kpis_goals || []).map((kpi: any) => 
  `• ${kpi.kpi}: ${kpi.goal}`).join('\n')}

RIESGOS Y ASUNCIONES:
${(existingStrategy.risks_assumptions || []).map((risk: string, idx: number) => 
  `${idx + 1}. ${risk}`).join('\n')}

PLAN DE CONTENIDO:
${Object.entries(existingStrategy.content_plan || {}).map(([platform, config]: [string, any]) => 
  `• ${platform}: ${config.frequency} - ${config.tone}`).join('\n')}`;
        
        setEditedStrategy(strategyText);
      }
      
      console.log('✅ Existing strategy loaded from campaignData');
    } else {
      // 2. If no strategy in memory, try to load from database
      console.log('🔍 No strategy in memory, attempting to load from database...');
      loadExistingStrategy();
    }
  }, [campaignData.strategy]);

  // Load existing strategy from database
  const loadExistingStrategy = async () => {
    try {
      setGenerating(true);
      console.log('🔄 Calling edge function to retrieve existing strategy...');
      
      const { data, error } = await supabase.functions.invoke(
        'marketing-hub-marketing-strategy',
        {
          body: { 
            retrieve_existing: true,
            input: {
              nombre_empresa: campaignData.company?.nombre_empresa || '',
              objetivo_de_negocio: campaignData.company?.objetivo_de_negocio || ''
            }
          }
        }
      );

      if (!error && data && data[0]?.output) {
        console.log('✅ Existing strategy retrieved from database');
        const existingStrategy = data[0].output;
        const normalized = normalizeStrategy(existingStrategy);
        setStrategy(normalized);
        
        // Generate editable text
        const strategyText = generateStrategyText(normalized);
        setEditedStrategy(strategyText);
        
        toast({
          title: "Éxito",
          description: "Estrategia recuperada exitosamente",
        });
      } else {
        console.log('ℹ️ No existing strategy found in database');
      }
    } catch (error) {
      console.log('ℹ️ No existing strategy available:', error);
      // This is not an error - just means no previous strategy exists
    } finally {
      setGenerating(false);
    }
  };

  const generateStrategy = async () => {
    console.log('🚀 Starting strategy generation');
    console.log('📋 Campaign data:', campaignData);
    
    if (!campaignData.company || !campaignData.audience) {
      console.error('❌ Missing required data:', { 
        hasCompany: !!campaignData.company, 
        hasAudience: !!campaignData.audience 
      });
      toast({
        title: "Datos insuficientes",
        description: "Necesitamos la información de empresa y audiencia para generar la estrategia",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    
    try {
      const objetivosSeleccionados = (campaignData.objective?.company_objectives || []).map((obj: any) => ({
        nombre: obj.title || obj.name,
        descripcion: obj.description || '',
        tipo: obj.objective_type || obj.type || '',
        plazo: obj.target_date || obj.deadline || null
      }));

      const strategyInput = {
        ...campaignData.company,
        nombre_campana: campaignData.name || 'Nueva Campaña',
        descripcion_campana: campaignData.description || campaignData.objective?.description || '',
        objetivo_campana: campaignData.objective?.goal || '',
        tipo_objetivo_campana: campaignData.objective?.type || 'awareness', // consideration, conversion, etc.
        objetivos_crecimiento: objetivosSeleccionados,
        audiencia_objetivo: {
          buyer_personas: campaignData.audience?.buyer_personas || []
        }
      };

      console.log('📤 Sending strategy input:', strategyInput);

      // Crear promesa de invocación con timeout de 4 minutos
      const invokePromise = supabase.functions.invoke('marketing-hub-marketing-strategy', {
        body: { input: strategyInput }
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: La generación de estrategia está tomando más tiempo del esperado (>4 minutos)')), 240000)
      );

      // Ejecutar con race para timeout
      const result = await Promise.race([invokePromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(error.message || 'Error al contactar el generador');
      }
      
      // Procesar la respuesta de N8N correctamente
      let processedStrategy = data as any;
      if (Array.isArray(data) && data.length > 0 && (data as any)[0]?.output) {
        processedStrategy = (data as any)[0].output;
        console.log('🔄 Extracted strategy from N8N array format');
      }

      const normalizeStrategy = (raw: any) => {
        const s: any = { ...(raw || {}) };

        // Canonicalizar nombres de plataformas
        const canon = (p: string) => {
          const k = (p || '').toLowerCase();
          if (k === 'linkedin' || k === 'linked in') return 'LinkedIn';
          if (k === 'instagram') return 'Instagram';
          if (k === 'tiktok' || k === 'tik tok') return 'TikTok';
          if (k === 'email' || k === 'correo' || k === 'mail') return 'Email';
          if (k === 'web' || k === 'website' || k === 'sitio' || k === 'site') return 'Web';
          return p || '';
        };

        // ========== NUEVA ESTRUCTURA N8N (Soporte Bilingüe ES/EN) ==========
        
        // 1. Procesar core_message (mensaje_central en español)
        s.core_message = s.core_message || s.mensaje_central || '';
        
        // 2. Procesar competidores / competitors
        if (typeof s.competidores === 'string') {
          s.competitors = s.competidores ? [{ name: 'Análisis General', description: s.competidores }] : [];
        } else if (Array.isArray(s.competidores)) {
          s.competitors = s.competidores;
        } else {
          s.competitors = s.competitors || [];
        }

        // 3. Procesar mensaje_diferenciador / differentiated_message (priorizar formato N8N)
        if (s.differentiated_message) {
          s.core_message = s.differentiated_message.core_message || '';
          s.message_variants = s.differentiated_message.variants || {};
          // Preservar el objeto completo para acceder a variantes específicas
          s.differentiated_message = {
            core_message: s.differentiated_message.core_message || '',
            variants: s.differentiated_message.variants || {},
            linkedin_variant: s.differentiated_message.linkedin_variant || '',
            tiktok_variant: s.differentiated_message.tiktok_variant || '',
            instagram_facebook_variant: s.differentiated_message.instagram_facebook_variant || ''
          };
        } else if (s.variantes_mensajes) {
          // NUEVO: Procesar formato de N8N API con variantes_mensajes
          s.core_message = s.core_message || '';
          s.message_variants = {
            LinkedIn: s.variantes_mensajes.linkedin || '',
            Instagram: s.variantes_mensajes.instagram_facebook || s.variantes_mensajes.instagram || '',
            TikTok: s.variantes_mensajes.tiktok || ''
          };
          s.differentiated_message = {
            core_message: s.core_message,
            variants: s.message_variants,
            linkedin_variant: s.variantes_mensajes.linkedin || '',
            tiktok_variant: s.variantes_mensajes.tiktok || '',
            instagram_facebook_variant: s.variantes_mensajes.instagram_facebook || s.variantes_mensajes.instagram || ''
          };
        } else if (s.mensaje_diferenciador) {
          s.core_message = s.mensaje_diferenciador.core_message || '';
          s.message_variants = {
            LinkedIn: s.mensaje_diferenciador.linkedin || '',
            Instagram: s.mensaje_diferenciador.instagram || '',
            TikTok: s.mensaje_diferenciador.tiktok || ''
          };
          s.differentiated_message = {
            core_message: s.mensaje_diferenciador.core_message || '',
            variants: s.message_variants,
            linkedin_variant: s.mensaje_diferenciador.linkedin || '',
            tiktok_variant: s.mensaje_diferenciador.tiktok || '',
            instagram_facebook_variant: s.mensaje_diferenciador.instagram || ''
          };
        } else if (s.mensaje_unificado_diferenciador) {
          s.core_message = s.mensaje_unificado_diferenciador.core_message;
          s.message_variants = s.mensaje_unificado_diferenciador.variantes;
          s.differentiated_message = {
            core_message: s.mensaje_unificado_diferenciador.core_message || '',
            variants: s.mensaje_unificado_diferenciador.variantes || {},
            linkedin_variant: s.mensaje_unificado_diferenciador.variantes?.LinkedIn || '',
            tiktok_variant: s.mensaje_unificado_diferenciador.variantes?.TikTok || '',
            instagram_facebook_variant: s.mensaje_unificado_diferenciador.variantes?.Instagram || ''
          };
        }

        // Normalizar message_variants si viene en otro formato
        if (!s.message_variants || Object.keys(s.message_variants).length === 0) {
          if (Array.isArray(s.message_variants)) {
            s.message_variants = s.message_variants.reduce((acc: Record<string, string>, item: any) => {
              const platform = item?.platform || item?.plataforma || item?.canal;
              const msg = item?.message || item?.mensaje || '';
              if (platform && typeof msg === 'string') acc[canon(platform)] = msg;
              return acc;
            }, {} as Record<string, string>);
          } else if (s.message_variants && typeof s.message_variants === 'object') {
            s.message_variants = Object.entries(s.message_variants).reduce((acc: Record<string, string>, [k, v]) => {
              acc[canon(k)] = typeof v === 'string' ? v : String(v);
              return acc;
            }, {} as Record<string, string>);
          } else {
            s.message_variants = {};
          }
        }

        // 4. Procesar estrategias_embudo / funnel_strategies (priorizar formato N8N)
        if (s.funnel_strategies && typeof s.funnel_strategies === 'object') {
          // Formato directo de N8N
          s.strategies = s.funnel_strategies;
        } else if (Array.isArray(s.embudo)) {
          // NUEVO: Procesar formato de N8N API con embudo como array
          const mapStageKeys: Record<string, string> = {
            'conciencia': 'awareness',
            'consideracion': 'consideration',
            'consideración': 'consideration',
            'conversion': 'conversion',
            'conversión': 'conversion',
            'lealtad': 'loyalty',
            'awareness': 'awareness',
            'consideration': 'consideration',
            'loyalty': 'loyalty'
          };
          
          s.strategies = {};
          s.embudo.forEach((stage: any) => {
            const normalizedStage = mapStageKeys[stage.etapa?.toLowerCase() || ''] || stage.etapa?.toLowerCase() || '';
            
            s.strategies[normalizedStage] = {
              objective: stage.objetivo || '',
              tactics: stage.tacticas || [],
              moonshot_tactics: [],
              main_channel: stage.canal_principal || '',
              main_kpi: stage.kpi_principal || '',
              timeline: stage.timeline || ''
            };
          });
        } else if (s.estrategias_embudo) {
          const mapStageKeys: Record<string, string> = {
            'conciencia': 'awareness',
            'consideracion': 'consideration',
            'conversion': 'conversion',
            'lealtad': 'loyalty',
            'awareness': 'awareness',
            'consideration': 'consideration',
            'loyalty': 'loyalty'
          };

          s.strategies = {};
          Object.entries(s.estrategias_embudo).forEach(([stage, details]: [string, any]) => {
            const normalizedStage = mapStageKeys[stage.toLowerCase()] || stage.toLowerCase();
            
            // Separar tácticas ejecutables de moonshots
            const allTactics = details.tacticas || details.tactics || [];
            const executableTactics = allTactics
              .filter((t: any) => !t.tipo || t.tipo === 'ejecutable')
              .map((t: any) => t.tactica || t.tactic || String(t));
            const moonshotTactics = allTactics
              .filter((t: any) => t.tipo === 'moonshot')
              .map((t: any) => t.tactica || t.tactic || String(t));

            s.strategies[normalizedStage] = {
              objective: details.objetivo || details.objective || '',
              tactics: executableTactics,
              moonshot_tactics: moonshotTactics,
              main_channel: details.canal_principal || details.main_channel || '',
              main_kpi: details.kpi_principal || details.main_kpi || '',
              timeline: details.timeline || { min: '', med: '', long: '' }
            };
          });
        } else if (s.embudo_estrategias) {
          // Formato antiguo
          s.strategies = s.embudo_estrategias;
        }

        // Fallback para strategies si aún no está normalizado
        if (Array.isArray(s.strategies)) {
          const strategiesObj: Record<string, any> = {};
          s.strategies.forEach((strategy: any) => {
            const stage = (strategy.etapa || strategy.funnel_stage || '').toLowerCase();
            if (stage) strategiesObj[stage] = strategy;
          });
          s.strategies = strategiesObj;
        } else if (s.strategies_by_funnel_stage) {
          s.strategies = s.strategies_by_funnel_stage;
        } else if (!s.strategies || typeof s.strategies !== 'object') {
          s.strategies = {};
        }

        // 5. Procesar plan_contenidos / content_plan (priorizar formato N8N)
        if (Array.isArray(s.plan_contenidos)) {
          // NUEVO: Procesar formato de N8N API con plan_contenidos como array directo
          s.content_plan = {};
          s.plan_contenidos.forEach((plan: any) => {
            const channel = canon(plan.canal || plan.channel || '');
            if (channel) {
              s.content_plan[channel] = {
                formats: typeof plan.formatos === 'string' ? [plan.formatos] : (plan.formatos || plan.formats || []),
                tone: plan.tono || plan.tone || '',
                cta: plan.CTA || plan.cta || '',
                frequency: plan.frecuencia_recomendada || plan.frequency || '',
                justification: plan.justificacion || plan.justification || ''
              };
            }
          });
        } else if (s.content_plan && typeof s.content_plan === 'object' && !Array.isArray(s.content_plan)) {
          // Formato directo de N8N - ya viene con estructura correcta
          const hasValidStructure = Object.values(s.content_plan).some((v: any) => 
            v && typeof v === 'object' && (v.formats || v.tone || v.cta || v.recommended_frequency)
          );
          if (hasValidStructure) {
            // Ya está en formato correcto, solo canonicalizar las keys
            s.content_plan = Object.entries(s.content_plan).reduce((acc: Record<string, any>, [k, v]) => {
              acc[canon(k)] = v;
              return acc;
            }, {} as Record<string, any>);
          }
        } else if (Array.isArray(s.plan_contenidos_old)) {
          s.content_plan = {};
          s.plan_contenidos.forEach((plan: any) => {
            const channel = canon(plan.canal || plan.channel || '');
            if (channel) {
              s.content_plan[channel] = {
                formats: plan.formatos || plan.formats || [],
                tone: plan.tono || plan.tone || '',
                cta: Array.isArray(plan.cta) ? plan.cta.join(' / ') : (plan.cta || ''),
                frequency: plan.frecuencia_post_semana 
                  ? `${plan.frecuencia_post_semana} posts/semana`
                  : (plan.frequency || ''),
                justification: plan.justificacion || plan.justification || ''
              };
            }
          });
        } else if (s.plan_contenidos_matriz) {
          s.content_plan = s.plan_contenidos_matriz;
        }

        // Normalizar content_plan adicional si viene en otro formato
        if (!s.content_plan || Object.keys(s.content_plan).length === 0) {
          if (Array.isArray(s.content_plan)) {
            const planObj: Record<string, any> = {};
            s.content_plan.forEach((plan: any) => {
              const channel = canon(plan.canal || plan.channel || '');
              if (channel) planObj[channel] = plan;
            });
            s.content_plan = planObj;
          } else if (s.content_plan && typeof s.content_plan === 'object') {
            s.content_plan = Object.entries(s.content_plan).reduce((acc: Record<string, any>, [k, v]) => {
              acc[canon(k)] = v;
              return acc;
            }, {} as Record<string, any>);
          } else {
            s.content_plan = {};
          }
        }

        // 6. Procesar kpis / kpis_goals (priorizar formato N8N)
        if (Array.isArray(s.kpis)) {
          // NUEVO: Procesar formato de N8N API con kpis como array directo
          s.kpis_goals = s.kpis.map((item: any) => ({
            kpi: item.kpi || '',
            goal: item.meta || item.goal || ''
          }));
        } else if (s.kpis_goals_8_weeks && typeof s.kpis_goals_8_weeks === 'object') {
          const labels: Record<string, string> = {
            reach: 'Alcance',
            impressions: 'Impresiones',
            ctr: 'CTR',
            leads: 'Leads',
            conversion_rate: 'Tasa de conversión',
            estimated_cac: 'CAC estimado'
          };
          s.kpis_goals = Object.entries(s.kpis_goals_8_weeks).map(([k, v]) => ({
            kpi: labels[k] || k,
            goal: String(v)
          }));
        } else if (s.kpi_metas && s.kpi_metas.KPIs && s.kpi_metas.Metas_8_semanas) {
          const kpis = s.kpi_metas.KPIs || [];
          const metas = s.kpi_metas.Metas_8_semanas || {};
          
          s.kpis_goals = kpis.map((kpi: string) => ({
            kpi: kpi,
            goal: metas[kpi] || 'Meta no definida'
          }));
        } else if (s.kpis_metas && typeof s.kpis_metas === 'object') {
          // Formato alternativo de kpis_metas
          if (!s.kpis_metas.KPIs) {
            s.kpis_goals = Object.entries(s.kpis_metas).map(([k, v]) => ({
              kpi: String(k),
              goal: String(v)
            }));
          }
        }

        // Fallback para KPIs de otros formatos
        if (!s.kpis_goals || s.kpis_goals.length === 0) {
          if (Array.isArray(s.kpis_goals)) {
            s.kpis_goals = s.kpis_goals.map((item: any) => ({
              kpi: item.kpi || item.name || String(item),
              goal: item.meta || item.goal || 'Meta no definida'
            }));
          } else if (Array.isArray(s.kpis)) {
            s.kpis_goals = s.kpis.map((kpi: any) => ({
              kpi: kpi.name || String(kpi),
              goal: kpi.goal || 'Meta no definida'
            }));
          } else if (s.kpis_and_goals && typeof s.kpis_and_goals === 'object') {
            if (s.kpis_and_goals.kpis && s.kpis_and_goals.goals) {
              const kpis = Array.isArray(s.kpis_and_goals.kpis) ? s.kpis_and_goals.kpis : [];
              const goals = Array.isArray(s.kpis_and_goals.goals) ? s.kpis_and_goals.goals : [];
              s.kpis_goals = kpis.map((kpi: string, index: number) => ({
                kpi: kpi,
                goal: goals[index] || 'Meta no definida'
              }));
            } else {
              s.kpis_goals = Object.entries(s.kpis_and_goals).map(([k, v]) => ({
                kpi: String(k),
                goal: String(v)
              }));
            }
          } else if (s.kpis_goals && typeof s.kpis_goals === 'object') {
            const labels: Record<string, string> = {
              reach: 'Alcance',
              impressions: 'Impresiones',
              ctr: 'CTR',
              leads: 'Leads',
              conversion_rate: 'Tasa de conversión',
              'conversion rate': 'Tasa de conversión',
              cac: 'CAC estimado'
            };
            s.kpis_goals = Object.entries(s.kpis_goals).map(([k, v]) => {
              const key = typeof k === 'string' ? k.toLowerCase() : String(k);
              return {
                kpi: labels[key] || (k as string),
                goal: String(v)
              };
            });
          } else {
            s.kpis_goals = [];
          }
        }

        // 7. Procesar plan_ejecucion / execution_plan (NUEVO: formato N8N API con plan_ejecucion como array)
        if (Array.isArray(s.plan_ejecucion)) {
          s.execution_plan = {
            steps: s.plan_ejecucion.map((p: any) => p.paso || '').filter(Boolean),
            roles: [...new Set(s.plan_ejecucion.map((p: any) => p.responsable || '').filter(Boolean))],
            assets: s.plan_ejecucion.map((p: any) => p.activos || '').filter(Boolean),
            budget: s.plan_ejecucion.reduce((acc: any, p: any, idx: number) => {
              if (p.presupuesto) acc[`Paso ${idx + 1}`] = p.presupuesto;
              return acc;
            }, {})
          };
        } else if (s.execution_plan_resources) {
          s.execution_plan = {
            steps: s.execution_plan_resources.steps || [],
            roles: s.execution_plan_resources.roles_needed || [],
            assets: s.execution_plan_resources.assets_to_create || [],
            budget: s.execution_plan_resources.budget_estimation_per_channel || {}
          };
        } else if (s.plan_ejecucion_recursos) {
          s.execution_plan = {
            steps: s.plan_ejecucion_recursos.pasos_operativos || [],
            roles: s.plan_ejecucion_recursos.roles_necesarios || [],
            assets: s.plan_ejecucion_recursos.activos_crear || s.plan_ejecucion_recursos.activos_a_crear || [],
            budget: s.plan_ejecucion_recursos.estimacion_presupuesto_por_canal || {}
          };
        } else if (s.execution_plan && typeof s.execution_plan === 'object') {
          s.execution_plan = {
            steps: s.execution_plan.pasos_operativos || s.execution_plan.steps || [],
            roles: s.execution_plan.roles_necesarios || s.execution_plan.roles || [],
            assets: s.execution_plan.activos_a_crear || s.execution_plan.activos_crear || s.execution_plan.assets || [],
            budget: s.execution_plan.presupuesto_estimado_canal || s.execution_plan.estimacion_presupuesto_por_canal || s.execution_plan.budget || {}
          };
        } else {
          s.execution_plan = { steps: [], roles: [], assets: [], budget: {} };
        }

        // 8. Procesar sources / fuentes
        s.sources = Array.isArray(s.sources) ? s.sources : (Array.isArray(s.fuentes) ? s.fuentes : []);

        // 9. Procesar risks_assumptions / riesgos_supuestos
        s.risks_assumptions = Array.isArray(s.risks_assumptions) 
          ? s.risks_assumptions 
          : (Array.isArray(s.riesgos_supuestos) ? s.riesgos_supuestos : []);

        // 9. Normalizar competidores adicionales si es array de objetos
        if (Array.isArray(s.competitors)) {
          s.competitors = s.competitors.map((c: any) => {
            if (typeof c === 'string') {
              return { name: 'Competidor', description: c };
            }
            
            // Normalizar strengths y weaknesses a arrays
            let strengths = c.fortalezas || c.strengths || [];
            if (typeof strengths === 'string') {
              strengths = strengths.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
            }
            
            let weaknesses = c.debilidades || c.weaknesses || [];
            if (typeof weaknesses === 'string') {
              weaknesses = weaknesses.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
            }
            
            let digital_tactics = c.digital_tactics || c.tacticas_digitales || c.resumen_tácticas_digitales || c.digital_tactics_summary || [];
            if (typeof digital_tactics === 'string') {
              digital_tactics = digital_tactics.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
            }
            
            return {
              ...c,
              name: c.nombre || c.name || 'Competidor',
              url: c.url || '',
              strengths: Array.isArray(strengths) ? strengths : [],
              weaknesses: Array.isArray(weaknesses) ? weaknesses : [],
              digital_tactics: Array.isArray(digital_tactics) ? digital_tactics : [],
              benchmarks: c.benchmarks_plataforma || (typeof c.benchmarks === 'string' 
                ? { descripcion: c.benchmarks }
                : (c.benchmarks || {}))
            };
          });
        }

        // 10. Calendario editorial (si existe)
        s.editorial_calendar = Array.isArray(s.editorial_calendar) ? s.editorial_calendar : [];
        s.editorial_calendar = Array.isArray(s.calendario_editorial) ? s.calendario_editorial : s.editorial_calendar;
        
        if (Array.isArray(s.editorial_calendar)) {
          s.editorial_calendar = s.editorial_calendar.map((item: any) => ({
            ...item,
            channel: canon(item?.canal || item?.channel || item?.red_social || ''),
            format: canon(item?.formato || item?.format || item?.tipo_contenido || item?.tipo || ''),
            title: item?.titulo_copy || item?.title || item?.titulo_gancho || item?.tema_concepto || '',
            cta: item?.cta || item?.call_to_action || item?.llamado_accion || '',
            date: item?.fecha || item?.date || '',
            responsible: item?.responsable || item?.responsible || ''
          }));
          const seen = new Set<string>();
          s.editorial_calendar = s.editorial_calendar.filter((it: any) => {
            const key = [it.date, it.channel, it.title].join('|').toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }

        return s;
      };

      const normalized = normalizeStrategy(processedStrategy);

      console.log('✅ Processed strategy (normalized):', normalized);
      console.log('🔍 Strategy sections check:', {
        hasCompetitors: !!normalized.competitors,
        hasCoreMessage: !!normalized.core_message,
        hasMessageVariants: !!normalized.message_variants,
        hasStrategies: !!normalized.strategies,
        hasContentPlan: !!normalized.content_plan,
        hasKPIs: !!normalized.kpis_goals,
        hasExecutionPlan: !!normalized.execution_plan,
        hasRisks: !!normalized.risks_assumptions
      });
      
      if (!normalized || Object.keys(normalized).length === 0) {
        throw new Error('La estrategia recibida está vacía');
      }
      
      setStrategy(normalized);
      
      // Crear un resumen editable de la estrategia basado en la nueva estructura
      const strategyText = normalized.core_message ? 
        `MENSAJE PRINCIPAL: ${normalized.core_message}

VARIACIONES POR PLATAFORMA:
${Object.entries(normalized.message_variants || {}).map(([platform, message]: [string, any]) => 
  `• ${platform.toUpperCase()}: ${message}`).join('\n')}

ESTRATEGIAS POR FUNNEL:
${Object.entries(normalized.strategies || {}).map(([key, value]: [string, any]) => 
  `• ${key.toUpperCase()}: ${value.objective || value}`).join('\n')}

KPIS Y OBJETIVOS:
${(normalized.kpis_goals || []).map((kpi: any) => 
  `• ${kpi.kpi}: ${kpi.goal}`).join('\n')}

RIESGOS Y ASUNCIONES:
${(normalized.risks_assumptions || []).map((risk: string, idx: number) => 
  `${idx + 1}. ${risk}`).join('\n')}

PLAN DE CONTENIDO:
${Object.entries(normalized.content_plan || {}).map(([platform, config]: [string, any]) => 
  `• ${platform}: ${config.frequency} - ${config.tone}`).join('\n')}` 
        : JSON.stringify(normalized, null, 2);

      setEditedStrategy(strategyText);
      
      console.log('✅ Strategy state updated successfully, strategy keys:', Object.keys(normalized));
      
      // Esperar a que React actualice el estado y el DOM antes de ocultar el loader
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setGenerating(false);
          toast({
            title: "¡Estrategia generada!",
            description: "Tu estrategia de marketing personalizada está lista",
          });
        });
      });
    } catch (error: any) {
      console.error('💥 Error generating strategy:', error);
      setStrategy(null); // Reset strategy on error

      // Mejorar el manejo de errores con información más específica
      let title = 'Error al generar estrategia';
      let description = 'No se pudo generar la estrategia. Por favor, intenta de nuevo.';
      let showRetry = true;

      if (error?.error === 'timeout' || error?.name === 'AbortError') {
        title = 'Generación en progreso';
        description = error?.message || 'La generación está tomando más tiempo del esperado. Por favor, intenta nuevamente.';
      } else if (error?.error === 'fetch_failed' || (typeof error?.message === 'string' && error.message.includes('Failed to fetch'))) {
        description = error?.message || 'No se pudo conectar con el servicio de generación. Verifica tu conexión e intenta nuevamente.';
      } else if (error?.message) {
        description = error.message;
      }

      toast({
        title,
        description,
        variant: 'destructive',
        action: showRetry ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateStrategy}
            className="gap-2"
          >
            <Sparkles className="h-3 w-3" />
            Reintentar
          </Button>
        ) : undefined
      });
    } finally {
      // CRÍTICO: Siempre resetear generating, sin importar el resultado
      // Usar setTimeout para asegurar que React procese el estado
      setTimeout(() => setGenerating(false), 100);
    }
  };

  const downloadStrategyPDF = async () => {
    if (!strategy) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Función helper para agregar marca de agua en cada página (más sutil)
      const addWatermark = () => {
        doc.setTextColor(245, 245, 245);
        doc.setFontSize(50);
        doc.text('BUILDERA', pageWidth / 2, pageHeight / 2, {
          align: 'center',
          angle: 45
        });
        doc.setTextColor(0, 0, 0);
      };

      // Función helper para agregar pie de página
      const addFooter = (pageNum: number) => {
        const footerY = pageHeight - 15;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Generado por Buildera - www.buildera.io', pageWidth / 2, footerY, { align: 'center' });
        doc.text(`Página ${pageNum}`, pageWidth - 20, footerY, { align: 'right' });
      };

      // Función helper para verificar espacio y agregar nueva página si es necesario
      const checkAddPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 25) {
          addFooter(doc.getCurrentPageInfo().pageNumber);
          doc.addPage();
          addWatermark();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // Primera página - Header mejorado
      addWatermark();
      
      // Header con gradiente (simulado con capas)
      doc.setFillColor(60, 70, 178); // Azul Buildera
      doc.rect(0, 0, pageWidth, 50, 'F');
      doc.setFillColor(50, 60, 168); // Azul más oscuro
      doc.rect(0, 40, pageWidth, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('BUILDERA', 20, 25);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Estrategia de Marketing Inteligente', 20, 38);
      
      // Fecha en esquina superior derecha
      doc.setFontSize(9);
      doc.text(new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }), pageWidth - 20, 25, { align: 'right' });

      // Info de campaña
      doc.setTextColor(0, 0, 0);
      yPosition = 65;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Estrategia de Marketing', 20, yPosition);
      
      yPosition += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Campaña: ${campaignData.name || 'Sin nombre'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Empresa: ${campaignData.company?.nombre_empresa || 'No definido'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, yPosition);
      
      // Mensaje Diferenciador
      if (strategy.core_message) {
        yPosition += 15;
        checkAddPage(40);
        
        doc.setFillColor(60, 70, 178);
        doc.rect(20, yPosition - 5, pageWidth - 40, 0.5, 'F');
        yPosition += 3;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 70, 178);
        doc.text('MENSAJE DIFERENCIADOR', 20, yPosition);
        
        yPosition += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const messageLines = doc.splitTextToSize(strategy.core_message, pageWidth - 40);
        doc.text(messageLines, 20, yPosition);
        yPosition += messageLines.length * 6 + 5;

        // Variaciones específicas por plataforma (mejoradas)
        if (strategy.differentiated_message) {
          yPosition += 5;
          checkAddPage(70);
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(60, 70, 178);
          doc.text('Variaciones por Plataforma:', 20, yPosition);
          yPosition += 8;

          // LinkedIn
          if (strategy.differentiated_message.linkedin_variant) {
            checkAddPage(25);
            doc.setFillColor(219, 234, 254);
            doc.roundedRect(25, yPosition - 3, pageWidth - 50, 8, 2, 2, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(37, 99, 235);
            doc.text('LinkedIn:', 28, yPosition + 3);
            yPosition += 10;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            const linkedinLines = doc.splitTextToSize(strategy.differentiated_message.linkedin_variant, pageWidth - 55);
            doc.text(linkedinLines, 28, yPosition);
            yPosition += linkedinLines.length * 5 + 5;
          }

          // TikTok
          if (strategy.differentiated_message.tiktok_variant) {
            checkAddPage(25);
            doc.setFillColor(243, 232, 255);
            doc.roundedRect(25, yPosition - 3, pageWidth - 50, 8, 2, 2, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(147, 51, 234);
            doc.text('TikTok:', 28, yPosition + 3);
            yPosition += 10;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            const tiktokLines = doc.splitTextToSize(strategy.differentiated_message.tiktok_variant, pageWidth - 55);
            doc.text(tiktokLines, 28, yPosition);
            yPosition += tiktokLines.length * 5 + 5;
          }

          // Instagram/Facebook
          if (strategy.differentiated_message.instagram_facebook_variant) {
            checkAddPage(25);
            doc.setFillColor(252, 231, 243);
            doc.roundedRect(25, yPosition - 3, pageWidth - 50, 8, 2, 2, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(219, 39, 119);
            doc.text('Instagram / Facebook:', 28, yPosition + 3);
            yPosition += 10;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            const igLines = doc.splitTextToSize(strategy.differentiated_message.instagram_facebook_variant, pageWidth - 55);
            doc.text(igLines, 28, yPosition);
            yPosition += igLines.length * 5 + 5;
          }
        }
        // Fallback a message_variants si no existe differentiated_message
        else if (strategy.message_variants && Object.keys(strategy.message_variants).length > 0) {
          Object.entries(strategy.message_variants).forEach(([platform, message]) => {
            checkAddPage(25);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`${platform}:`, 25, yPosition);
            yPosition += 6;
            doc.setFont('helvetica', 'normal');
            const variantLines = doc.splitTextToSize(message as string, pageWidth - 50);
            doc.text(variantLines, 25, yPosition);
            yPosition += variantLines.length * 5 + 3;
          });
        }
      }

      // Análisis Completo de Competidores
      if (strategy.competitors && strategy.competitors.length > 0) {
        yPosition += 10;
        checkAddPage(40);
        
        doc.setFillColor(241, 84, 56);
        doc.rect(20, yPosition - 5, pageWidth - 40, 0.5, 'F');
        yPosition += 3;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(241, 84, 56);
        doc.text('ANÁLISIS DE COMPETIDORES', 20, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        strategy.competitors.forEach((competitor: any, idx: number) => {
          checkAddPage(80);
          
          // Nombre del competidor con fondo
          doc.setFillColor(255, 237, 213);
          doc.roundedRect(20, yPosition - 3, pageWidth - 40, 10, 2, 2, 'F');
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`${idx + 1}. ${competitor.name || `Competidor ${idx + 1}`}`, 25, yPosition + 4);
          yPosition += 15;

          // Fortalezas
          if (competitor.strengths && competitor.strengths.length > 0) {
            doc.setFillColor(220, 252, 231);
            doc.roundedRect(25, yPosition - 2, pageWidth - 50, (competitor.strengths.length * 5) + 8, 2, 2, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(22, 163, 74);
            doc.text('✅ Fortalezas:', 28, yPosition + 3);
            yPosition += 7;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            
            competitor.strengths.forEach((strength: string) => {
              checkAddPage(10);
              const strengthLines = doc.splitTextToSize(`• ${strength}`, pageWidth - 65);
              doc.text(strengthLines, 32, yPosition);
              yPosition += strengthLines.length * 4 + 1;
            });
            yPosition += 5;
          }

          // Debilidades
          if (competitor.weaknesses && competitor.weaknesses.length > 0) {
            doc.setFillColor(254, 226, 226);
            doc.roundedRect(25, yPosition - 2, pageWidth - 50, (competitor.weaknesses.length * 5) + 8, 2, 2, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(220, 38, 38);
            doc.text('⚠️ Debilidades:', 28, yPosition + 3);
            yPosition += 7;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            
            competitor.weaknesses.forEach((weakness: string) => {
              checkAddPage(10);
              const weaknessLines = doc.splitTextToSize(`• ${weakness}`, pageWidth - 65);
              doc.text(weaknessLines, 32, yPosition);
              yPosition += weaknessLines.length * 4 + 1;
            });
            yPosition += 5;
          }

          // Tácticas Digitales
          if (competitor.digital_tactics && competitor.digital_tactics.length > 0) {
            doc.setFillColor(219, 234, 254);
            doc.roundedRect(25, yPosition - 2, pageWidth - 50, (competitor.digital_tactics.length * 5) + 8, 2, 2, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(37, 99, 235);
            doc.text('🌐 Tácticas Digitales:', 28, yPosition + 3);
            yPosition += 7;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            
            competitor.digital_tactics.forEach((tactic: string) => {
              checkAddPage(10);
              const tacticLines = doc.splitTextToSize(`• ${tactic}`, pageWidth - 65);
              doc.text(tacticLines, 32, yPosition);
              yPosition += tacticLines.length * 4 + 1;
            });
            yPosition += 5;
          }

          // Benchmarks
          if (competitor.benchmarks && Object.keys(competitor.benchmarks).length > 0) {
            doc.setFillColor(243, 232, 255);
            doc.roundedRect(25, yPosition - 2, pageWidth - 50, (Object.keys(competitor.benchmarks).length * 6) + 10, 2, 2, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(147, 51, 234);
            doc.text('📊 Benchmarks:', 28, yPosition + 3);
            yPosition += 7;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            
            Object.entries(competitor.benchmarks).forEach(([metric, value]: [string, any]) => {
              checkAddPage(8);
              doc.text(`• ${metric}: ${value}`, 32, yPosition);
              yPosition += 5;
            });
            yPosition += 5;
          }

          yPosition += 5;
        });
      }

      // Estrategias por Etapa del Funnel
      if (strategy.strategies && Object.keys(strategy.strategies).length > 0) {
        yPosition += 10;
        checkAddPage(40);
        
        doc.setFillColor(60, 70, 178);
        doc.rect(20, yPosition - 5, pageWidth - 40, 0.5, 'F');
        yPosition += 3;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 70, 178);
        doc.text('ESTRATEGIAS POR ETAPA DEL FUNNEL', 20, yPosition);
        yPosition += 10;

        const phaseNames: Record<string, string> = {
          awareness: 'Reconocimiento',
          consideration: 'Consideración',
          conversion: 'Conversión',
          loyalty: 'Fidelización'
        };

        Object.entries(strategy.strategies).forEach(([phase, details]: [string, any]) => {
          checkAddPage(60);
          
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(phaseNames[phase] || phase, 20, yPosition);
          yPosition += 7;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          const objectiveLines = doc.splitTextToSize(`Objetivo: ${details.objective}`, pageWidth - 40);
          doc.text(objectiveLines, 25, yPosition);
          yPosition += objectiveLines.length * 5 + 5;

          doc.setFont('helvetica', 'normal');
          doc.text(`Canal Principal: ${details.main_channel || details.canal_principal || 'N/A'}`, 25, yPosition);
          yPosition += 5;
          doc.text(`KPI Principal: ${details.main_kpi || details.kpi_principal || 'N/A'}`, 25, yPosition);
          yPosition += 8;

          if (details.tactics && details.tactics.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.text('Tácticas:', 25, yPosition);
            yPosition += 5;
            doc.setFont('helvetica', 'normal');
            
            details.tactics.forEach((tactic: string, idx: number) => {
              checkAddPage(15);
              const tacticLines = doc.splitTextToSize(`${idx + 1}. ${tactic}`, pageWidth - 50);
              doc.text(tacticLines, 30, yPosition);
              yPosition += tacticLines.length * 5 + 2;
            });
          }

          if (details.moonshot_tactics && details.moonshot_tactics.length > 0) {
            yPosition += 5;
            checkAddPage(30);
            doc.setFillColor(243, 232, 255);
            doc.roundedRect(25, yPosition - 2, pageWidth - 50, (details.moonshot_tactics.length * 6) + 10, 2, 2, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(147, 51, 234);
            doc.text('🚀 Tácticas Moonshot (Alto Impacto):', 28, yPosition + 3);
            yPosition += 7;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            
            details.moonshot_tactics.forEach((tactic: string) => {
              checkAddPage(12);
              const tacticLines = doc.splitTextToSize(`⭐ ${tactic}`, pageWidth - 55);
              doc.text(tacticLines, 32, yPosition);
              yPosition += tacticLines.length * 5 + 2;
            });
            yPosition += 5;
            doc.setTextColor(0, 0, 0);
          }

          yPosition += 8;
        });
      }

      // Plan de Contenido
      if (strategy.content_plan && Object.keys(strategy.content_plan).length > 0) {
        checkAddPage(40);
        
        doc.setFillColor(60, 70, 178);
        doc.rect(20, yPosition - 5, pageWidth - 40, 0.5, 'F');
        yPosition += 3;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 70, 178);
        doc.text('PLAN DE CONTENIDO', 20, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        Object.entries(strategy.content_plan).forEach(([platform, config]: [string, any]) => {
          checkAddPage(35);
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(platform, 20, yPosition);
          yPosition += 6;

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`Frecuencia: ${config.frequency || 'N/A'}`, 25, yPosition);
          yPosition += 5;
          doc.text(`Tono: ${config.tone || 'N/A'}`, 25, yPosition);
          yPosition += 5;
          
          if (config.formats && Array.isArray(config.formats)) {
            doc.text(`Formatos: ${config.formats.join(', ')}`, 25, yPosition);
            yPosition += 5;
          }
          
          if (config.cta) {
            const ctaLines = doc.splitTextToSize(`CTA: ${config.cta}`, pageWidth - 50);
            doc.text(ctaLines, 25, yPosition);
            yPosition += ctaLines.length * 5;
          }
          
          yPosition += 8;
        });
      }

      // KPIs y Objetivos
      if (strategy.kpis_goals && strategy.kpis_goals.length > 0) {
        checkAddPage(40);
        
        doc.setFillColor(60, 70, 178);
        doc.rect(20, yPosition - 5, pageWidth - 40, 0.5, 'F');
        yPosition += 3;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 70, 178);
        doc.text('KPIS Y OBJETIVOS', 20, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        const kpiTableData = strategy.kpis_goals.map((kpi: any) => [
          kpi.kpi,
          kpi.goal
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['KPI', 'Meta']],
          body: kpiTableData,
          theme: 'grid',
          headStyles: { fillColor: [60, 70, 178], textColor: 255 },
          margin: { left: 20, right: 20 },
          didDrawPage: (data) => {
            addWatermark();
            addFooter(doc.getCurrentPageInfo().pageNumber);
          }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Plan de Ejecución
      if (strategy.execution_plan && (strategy.execution_plan.steps?.length > 0 || strategy.execution_plan.roles?.length > 0)) {
        checkAddPage(40);
        
        doc.setFillColor(60, 70, 178);
        doc.rect(20, yPosition - 5, pageWidth - 40, 0.5, 'F');
        yPosition += 3;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 70, 178);
        doc.text('PLAN DE EJECUCIÓN', 20, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);

        if (strategy.execution_plan.steps && strategy.execution_plan.steps.length > 0) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('Pasos Operativos:', 20, yPosition);
          yPosition += 6;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');

          strategy.execution_plan.steps.forEach((step: string, idx: number) => {
            checkAddPage(12);
            const stepLines = doc.splitTextToSize(`${idx + 1}. ${step}`, pageWidth - 45);
            doc.text(stepLines, 25, yPosition);
            yPosition += stepLines.length * 5 + 2;
          });
          yPosition += 5;
        }

        if (strategy.execution_plan.roles && strategy.execution_plan.roles.length > 0) {
          checkAddPage(20);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('Roles Necesarios:', 20, yPosition);
          yPosition += 6;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(strategy.execution_plan.roles.join(', '), 25, yPosition, { maxWidth: pageWidth - 45 });
          yPosition += 10;
        }

        if (strategy.execution_plan.budget && Object.keys(strategy.execution_plan.budget).length > 0) {
          checkAddPage(30);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('Presupuesto Estimado:', 20, yPosition);
          yPosition += 6;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');

          Object.entries(strategy.execution_plan.budget).forEach(([channel, budget]) => {
            checkAddPage(8);
            doc.text(`${channel}: ${budget}`, 25, yPosition);
            yPosition += 5;
          });
          yPosition += 5;
        }

        // Activos a Crear
        if (strategy.execution_plan.assets && strategy.execution_plan.assets.length > 0) {
          checkAddPage(30);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('Activos a Crear:', 20, yPosition);
          yPosition += 6;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');

          strategy.execution_plan.assets.forEach((asset: string, idx: number) => {
            checkAddPage(10);
            const assetLines = doc.splitTextToSize(`${idx + 1}. ${asset}`, pageWidth - 45);
            doc.text(assetLines, 25, yPosition);
            yPosition += assetLines.length * 5 + 2;
          });
          yPosition += 5;
        }
      }

      // Riesgos y Asunciones
      if (strategy.risks_assumptions && strategy.risks_assumptions.length > 0) {
        yPosition += 5;
        checkAddPage(40);
        
        doc.setFillColor(60, 70, 178);
        doc.rect(20, yPosition - 5, pageWidth - 40, 0.5, 'F');
        yPosition += 3;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 70, 178);
        doc.text('RIESGOS Y ASUNCIONES', 20, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        strategy.risks_assumptions.forEach((risk: string, idx: number) => {
          checkAddPage(12);
          const riskLines = doc.splitTextToSize(`${idx + 1}. ${risk}`, pageWidth - 45);
          doc.text(riskLines, 25, yPosition);
          yPosition += riskLines.length * 5 + 3;
        });
      }

      // Footer en la última página
      addFooter(doc.getCurrentPageInfo().pageNumber);

      // Guardar PDF
      const fileName = `Estrategia_Marketing_${campaignData.name || 'Buildera'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "✅ PDF Descargado",
        description: "Tu estrategia ha sido descargada exitosamente"
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast({
        title: "Error al generar PDF",
        description: "No se pudo generar el archivo PDF. Intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  const handleComplete = () => {
    if (!strategy) {
      toast({
        title: "Estrategia requerida",
        description: "Primero debes generar la estrategia de marketing",
        variant: "destructive"
      });
      return;
    }

    const strategyData = {
      strategy: strategy, // Guardar toda la estrategia normalizada completa
      competitors: strategy.competitors || [],
      content_plan: strategy.content_plan || {},
      editorial_calendar: strategy.editorial_calendar || [],
      kpis: strategy.kpis_goals || [],
      execution_plan: strategy.execution_plan || {},
      risks_assumptions: strategy.risks_assumptions || [],
      sources: strategy.sources || [],
      message_differentiator: {
        core: strategy.core_message || '',
        linkedin_variation: strategy.message_variants?.LinkedIn || '',
        instagram_variation: strategy.message_variants?.Instagram || '',
        tiktok_variation: strategy.message_variants?.TikTok || ''
      },
      funnel_strategies: strategy.strategies || {},
      edited_strategy: isEditing ? editedStrategy : undefined,
      final_strategy: isEditing ? editedStrategy : strategy
    };

    console.log('💾 Guardando estrategia completa:', strategyData);
    onComplete(strategyData);
  };

  const canProceed = strategy && !generating;

  return (
    <StrategyErrorBoundary
      onReset={() => {
        setStrategy(null);
        setGenerating(false);
      }}
      onError={() => {
        setGenerating(false); // CRÍTICO: Resetear generating si hay crash
      }}
    >
      <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-purple-800">
            <BarChart3 className="h-6 w-6" />
            Estrategia de Marketing Personalizada
          </CardTitle>
          <p className="text-purple-600">
            Genera una estrategia basada en tu audiencia y objetivos, personalízala según tus necesidades
          </p>
        </CardHeader>
      </Card>

      {/* Campaign Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Resumen de tu Campaña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Información Básica */}
            <div className="pb-6 border-b">
              <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                INFORMACIÓN BÁSICA
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nombre de la campaña</p>
                  <p className="text-sm font-medium">{campaignData.name || 'Sin nombre'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Empresa</p>
                  <p className="text-sm font-medium">{campaignData.company?.nombre_empresa || 'No definido'}</p>
                </div>
                {campaignData.description && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                    <p className="text-sm text-muted-foreground">{campaignData.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tipo de Objetivo */}
            <div className="pb-6 border-b">
              <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                TIPO DE OBJETIVO
              </h4>
              <div className="flex items-center gap-2">
                {campaignData.objective?.type && (
                  <Badge variant="default" className="text-sm">
                    {campaignData.objective.type === 'awareness' && '📢 Reconocimiento de Marca'}
                    {campaignData.objective.type === 'consideration' && '🤔 Consideración'}
                    {campaignData.objective.type === 'conversion' && '💰 Conversión'}
                    {campaignData.objective.type === 'loyalty' && '❤️ Fidelización'}
                    {!['awareness', 'consideration', 'conversion', 'loyalty'].includes(campaignData.objective.type) && campaignData.objective.type}
                  </Badge>
                )}
                {campaignData.objective?.goal && (
                  <span className="text-sm text-muted-foreground">- {campaignData.objective.goal}</span>
                )}
              </div>
            </div>

            {/* Objetivos de Crecimiento */}
            {(campaignData.objective?.company_objectives?.length > 0 || campaignData.objective?.target_metrics?.companyObjectives?.length > 0) && (
              <div className="pb-6 border-b">
                <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  OBJETIVOS DE CRECIMIENTO
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(campaignData.objective?.company_objectives || campaignData.objective?.target_metrics?.companyObjectives || []).map((objective: any, index: number) => (
                    <div key={index} className="flex items-start gap-2 bg-muted/50 p-3 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{objective.title}</p>
                        {objective.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{objective.description}</p>
                        )}
                        {objective.metrics && objective.metrics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {objective.metrics.slice(0, 2).map((metric: any, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {metric.name}: {metric.target_value} {metric.unit}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audiencias Seleccionadas */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                AUDIENCIAS SELECCIONADAS ({campaignData.audience?.audience_count || campaignData.audience?.buyer_personas?.length || campaignData.audience?.selected_audiences?.length || 0})
              </h4>
              <div className="space-y-3">
                {campaignData.audience?.selected_audiences?.length > 0 ? (
                  campaignData.audience.selected_audiences.map((audience: any, index: number) => (
                    <div key={index} className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-semibold">
                          {audience.name}
                        </Badge>
                      </div>
                      {audience.description && (
                        <p className="text-xs text-muted-foreground">{audience.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {audience.age_ranges && Object.keys(audience.age_ranges).length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Edad: {Object.keys(audience.age_ranges).join(', ')}
                          </Badge>
                        )}
                        {audience.geographic_locations && Object.keys(audience.geographic_locations).length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            📍 {(() => {
                              const locations = audience.geographic_locations;
                              const allLocations = [];
                              if (locations.cities && Array.isArray(locations.cities)) {
                                allLocations.push(...locations.cities);
                              }
                              if (locations.countries && Array.isArray(locations.countries)) {
                                allLocations.push(...locations.countries);
                              }
                              if (locations.regions && Array.isArray(locations.regions)) {
                                allLocations.push(...locations.regions);
                              }
                              return allLocations.slice(0, 3).join(', ') || 'Ubicaciones definidas';
                            })()}
                          </Badge>
                        )}
                        {audience.platform_preferences && Object.keys(audience.platform_preferences).length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            🌐 {Object.keys(audience.platform_preferences).slice(0, 2).join(', ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : campaignData.audience?.buyer_personas?.length > 0 ? (
                  campaignData.audience.buyer_personas.map((persona: any, index: number) => (
                    <div key={index} className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-semibold">
                          {persona.nombre_ficticio}
                        </Badge>
                      </div>
                      {persona.descripcion && (
                        <p className="text-xs text-muted-foreground">{persona.descripcion}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {persona.demograficos?.edad && (
                          <Badge variant="secondary" className="text-xs">
                            Edad: {persona.demograficos.edad}
                          </Badge>
                        )}
                        {persona.demograficos?.ubicacion && (
                          <Badge variant="secondary" className="text-xs">
                            📍 {persona.demograficos.ubicacion}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Ninguna audiencia seleccionada
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Strategy or Loading */}
      {!strategy && !generating && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Genera tu Estrategia con IA</h3>
              <p className="text-muted-foreground">
                Basándose en tu audiencia objetivo y objetivos, crearemos una estrategia de marketing personalizada y efectiva.
              </p>
              <Button 
                onClick={generateStrategy}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                size="lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                Generar Estrategia con IA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategy Display with Action Buttons */}
      {strategy && !generating && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Estrategia Generada
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={downloadStrategyPDF}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </Button>
                <Button
                  onClick={() => {
                    if (confirm('¿Estás seguro? Se generará una nueva estrategia desde cero y se reemplazará la actual.')) {
                      setStrategy(null);
                      setEditedStrategy('');
                      generateStrategy();
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Regenerar Estrategia
                </Button>
              </div>
            </div>
            
            {/* Info banner about reusability */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Esta estrategia se ha guardado automáticamente. Puedes volver a este paso en cualquier momento para revisarla, editarla o regenerarla.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Loading State with Strategy Generation Loader */}
      <StrategyGenerationLoader
        isVisible={generating}
      />

      {/* Generated Strategy */}
      {strategy && !generating && (
        <div className="space-y-6">
          {/* Strategy Success Header */}
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">
                ¡Tu Estrategia está Lista! 🚀
              </CardTitle>
              <p className="text-green-600 text-lg">
                Hemos creado una estrategia de marketing personalizada basada en tu audiencia y objetivos
              </p>
            </CardHeader>
          </Card>

          {/* Competitors Analysis */}
          {strategy.competitors && strategy.competitors.length > 0 && (
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  Análisis de Competidores
                </CardTitle>
                <p className="text-muted-foreground">Fortalezas, debilidades y estrategias digitales de la competencia</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {strategy.competitors.map((competitor: any, idx: number) => (
                    <div key={idx} className="bg-white p-6 rounded-xl border-2 border-orange-100 space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-orange-200">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-bold">{idx + 1}</span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-800">{competitor.name || `Competidor ${idx + 1}`}</h4>
                      </div>
                      
                      {/* Fortalezas */}
                      {competitor.strengths && competitor.strengths.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h5 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                            ✅ Fortalezas
                          </h5>
                          <ul className="space-y-2">
                            {competitor.strengths.map((strength: string, sidx: number) => (
                              <li key={sidx} className="text-sm text-green-700 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">•</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Debilidades */}
                      {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <h5 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                            ⚠️ Debilidades
                          </h5>
                          <ul className="space-y-2">
                            {competitor.weaknesses.map((weakness: string, widx: number) => (
                              <li key={widx} className="text-sm text-red-700 flex items-start gap-2">
                                <span className="text-red-600 mt-0.5">•</span>
                                <span>{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Tácticas Digitales */}
                      {competitor.digital_tactics && competitor.digital_tactics.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                            🌐 Tácticas Digitales
                          </h5>
                          <ul className="space-y-2">
                            {competitor.digital_tactics.map((tactic: string, tidx: number) => (
                              <li key={tidx} className="text-sm text-blue-700 flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>{tactic}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Benchmarks */}
                      {competitor.benchmarks && Object.keys(competitor.benchmarks).length > 0 && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <h5 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                            📊 Benchmarks
                          </h5>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(competitor.benchmarks).map(([metric, value]: [string, any]) => (
                              <div key={metric} className="bg-white p-3 rounded-lg border border-purple-100">
                                <p className="text-xs text-purple-600 font-medium mb-1">{metric}</p>
                                <p className="text-sm font-bold text-purple-800">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message Differentiator - EDITABLE */}
          {strategy.core_message && (
            <EditableStrategySection
              title="Mensaje Diferenciador Principal"
              icon={
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              }
              editMode={editingSection === 'message'}
              setEditMode={(value) => {
                if (value) {
                  setEditingSection('message');
                  setEditedData({
                    core_message: strategy.core_message,
                    differentiated_message: strategy.differentiated_message || {},
                    message_variants: strategy.message_variants || {}
                  });
                } else {
                  setEditingSection(null);
                }
              }}
              onSave={() => {
                setStrategy({
                  ...strategy,
                  core_message: editedData.core_message,
                  differentiated_message: editedData.differentiated_message,
                  message_variants: editedData.message_variants
                });
                toast({
                  title: "Mensaje actualizado",
                  description: "Los cambios se han guardado correctamente"
                });
              }}
            >
              <div className="text-center mb-6">
                <div className="bg-white/50 backdrop-blur p-6 rounded-xl border">
                  <h3 className="text-2xl font-bold text-primary mb-2">
                    {editingSection === 'message' ? (
                      <Textarea
                        value={editedData.core_message || ''}
                        onChange={(e) => setEditedData({...editedData, core_message: e.target.value})}
                        className="text-2xl font-bold text-primary text-center"
                      />
                    ) : (
                      `"${strategy.core_message}"`
                    )}
                  </h3>
                  <p className="text-muted-foreground">Mensaje central de tu estrategia</p>
                </div>
              </div>
              
              {/* Variantes por Plataforma desde differentiated_message */}
              {(strategy.differentiated_message || editingSection === 'message') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* LinkedIn */}
                  <div className="bg-white/70 p-6 rounded-xl border-2 border-blue-100 bg-blue-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                        <span className="font-bold text-sm">Li</span>
                      </div>
                      <h4 className="font-semibold text-blue-900">LinkedIn</h4>
                    </div>
                    {editingSection === 'message' ? (
                      <Textarea
                        value={editedData.differentiated_message?.linkedin_variant || ''}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          differentiated_message: {
                            ...editedData.differentiated_message,
                            linkedin_variant: e.target.value
                          }
                        })}
                        className="text-sm min-h-[100px]"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed text-blue-700">
                        {strategy.differentiated_message?.linkedin_variant || 'No definido'}
                      </p>
                    )}
                  </div>
                  
                  {/* TikTok */}
                  <div className="bg-white/70 p-6 rounded-xl border-2 border-purple-100 bg-purple-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                        <span className="font-bold text-sm">Tk</span>
                      </div>
                      <h4 className="font-semibold text-purple-900">TikTok</h4>
                    </div>
                    {editingSection === 'message' ? (
                      <Textarea
                        value={editedData.differentiated_message?.tiktok_variant || ''}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          differentiated_message: {
                            ...editedData.differentiated_message,
                            tiktok_variant: e.target.value
                          }
                        })}
                        className="text-sm min-h-[100px]"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed text-purple-700">
                        {strategy.differentiated_message?.tiktok_variant || 'No definido'}
                      </p>
                    )}
                  </div>
                  
                  {/* Instagram/Facebook */}
                  <div className="bg-white/70 p-6 rounded-xl border-2 border-pink-100 bg-pink-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-pink-100 text-pink-600">
                        <span className="font-bold text-sm">Ig</span>
                      </div>
                      <h4 className="font-semibold text-pink-900">Instagram / Facebook</h4>
                    </div>
                    {editingSection === 'message' ? (
                      <Textarea
                        value={editedData.differentiated_message?.instagram_facebook_variant || ''}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          differentiated_message: {
                            ...editedData.differentiated_message,
                            instagram_facebook_variant: e.target.value
                          }
                        })}
                        className="text-sm min-h-[100px]"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed text-pink-700">
                        {strategy.differentiated_message?.instagram_facebook_variant || 'No definido'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </EditableStrategySection>
          )}

          {/* Funnel Strategies */}
          {(strategy.strategies || strategy.funnel_strategies) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  Estrategias por Etapa del Funnel
                </CardTitle>
                <p className="text-muted-foreground">Plan de acción para cada fase del customer journey</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {/* Renderizar desde funnel_strategies si existe */}
                  {strategy.funnel_strategies && Array.isArray(strategy.funnel_strategies) ? (
                    strategy.funnel_strategies.map((funnelStage: any, index: number) => {
                      const phaseColors = {
                        awareness: 'from-yellow-400 to-orange-500',
                        consideration: 'from-blue-400 to-cyan-500', 
                        conversion: 'from-green-400 to-emerald-500',
                        loyalty: 'from-purple-400 to-pink-500'
                      };
                      const phaseEmojis = {
                        awareness: '📢',
                        consideration: '🤔',
                        conversion: '💰',
                        loyalty: '❤️'
                      };
                      const phaseNames = {
                        awareness: 'Reconocimiento',
                        consideration: 'Consideración',
                        conversion: 'Conversión',
                        loyalty: 'Fidelización'
                      };
                      
                      const stage = funnelStage.stage?.toLowerCase() || '';
                      
                      return (
                        <div key={index} className="relative">
                          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 bg-gradient-to-r ${phaseColors[stage as keyof typeof phaseColors] || 'from-gray-400 to-gray-500'} rounded-xl flex items-center justify-center shadow-lg`}>
                                  <span className="text-2xl">{phaseEmojis[stage as keyof typeof phaseEmojis] || '🎯'}</span>
                                </div>
                                <div>
                                  <h4 className="text-xl font-bold capitalize">
                                    {phaseNames[stage as keyof typeof phaseNames] || funnelStage.stage || `Etapa ${index + 1}`}
                                  </h4>
                                  {funnelStage.timeline && (
                                    <Badge variant="secondary" className="mt-1">
                                      ⏱️ {funnelStage.timeline}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Objetivo */}
                            {funnelStage.objective && (
                              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg mb-4 border-l-4 border-primary">
                                <h5 className="font-semibold text-sm text-muted-foreground mb-1">🎯 Objetivo</h5>
                                <p className="text-gray-800 font-medium leading-relaxed">{funnelStage.objective}</p>
                              </div>
                            )}
                            
                            {/* Canal y KPI */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {funnelStage.main_channel && (
                                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                                  <h5 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
                                    📱 Canal Principal
                                  </h5>
                                  <p className="text-sm font-bold text-gray-800">{funnelStage.main_channel}</p>
                                </div>
                              )}
                              {funnelStage.main_kpi && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                  <h5 className="font-semibold text-sm text-green-700 mb-2 flex items-center gap-2">
                                    📊 KPI Principal
                                  </h5>
                                  <p className="text-sm font-bold text-gray-800">{funnelStage.main_kpi}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Tácticas */}
                            {funnelStage.tactics && funnelStage.tactics.length > 0 && (
                              <div className="mb-4">
                                <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  Tácticas Ejecutables
                                </h5>
                                <div className="grid gap-2">
                                  {funnelStage.tactics.map((tactic: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-200">
                                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-green-600 font-bold text-xs">{idx + 1}</span>
                                      </div>
                                      <p className="text-sm text-gray-700 leading-relaxed">{tactic}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* Renderizar desde strategies (formato antiguo) */
                    Object.entries(strategy.strategies || {}).map(([phase, details]: [string, any], index) => {
                      const phaseColors = {
                        awareness: 'from-yellow-400 to-orange-500',
                        consideration: 'from-blue-400 to-cyan-500', 
                        conversion: 'from-green-400 to-emerald-500',
                        loyalty: 'from-purple-400 to-pink-500'
                      };
                      const phaseEmojis = {
                        awareness: '📢',
                        consideration: '🤔',
                        conversion: '💰',
                        loyalty: '❤️'
                      };
                      const phaseNames = {
                        awareness: 'Reconocimiento',
                        consideration: 'Consideración',
                        conversion: 'Conversión',
                        loyalty: 'Fidelización'
                      };
                      
                      const timeline = details.timeline || {};
                      
                      return (
                        <div key={phase} className="relative">
                          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 bg-gradient-to-r ${phaseColors[phase as keyof typeof phaseColors] || 'from-gray-400 to-gray-500'} rounded-xl flex items-center justify-center shadow-lg`}>
                                  <span className="text-2xl">{phaseEmojis[phase as keyof typeof phaseEmojis] || '🎯'}</span>
                                </div>
                                <div>
                                  <h4 className="text-xl font-bold capitalize">
                                    {phaseNames[phase as keyof typeof phaseNames] || phase}
                                  </h4>
                                  {typeof details.timeline === 'string' && (
                                    <Badge variant="secondary" className="mt-1">
                                      ⏱️ {details.timeline}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Objetivo */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg mb-4 border-l-4 border-primary">
                              <h5 className="font-semibold text-sm text-muted-foreground mb-1">🎯 Objetivo</h5>
                              <p className="text-gray-800 font-medium leading-relaxed">{details.objective}</p>
                            </div>
                            
                            {/* Timeline visual (si es objeto) */}
                            {timeline.min && timeline.med && timeline.long && (
                              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                                <h5 className="font-semibold text-sm text-blue-800 mb-3">⏱️ Timeline de Ejecución</h5>
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="bg-white p-3 rounded-lg text-center border border-blue-100">
                                    <p className="text-xs text-blue-600 font-medium mb-1">Corto Plazo</p>
                                    <p className="text-sm font-bold text-blue-800">{timeline.min}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg text-center border border-blue-100">
                                    <p className="text-xs text-blue-600 font-medium mb-1">Mediano Plazo</p>
                                    <p className="text-sm font-bold text-blue-800">{timeline.med}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg text-center border border-blue-100">
                                    <p className="text-xs text-blue-600 font-medium mb-1">Largo Plazo</p>
                                    <p className="text-sm font-bold text-blue-800">{timeline.long}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Canal y KPI */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                                <h5 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
                                  📱 Canal Principal
                                </h5>
                                <p className="text-sm font-bold text-gray-800">{details.main_channel || details.canal_principal}</p>
                              </div>
                              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <h5 className="font-semibold text-sm text-green-700 mb-2 flex items-center gap-2">
                                  📊 KPI Principal
                                </h5>
                                <p className="text-sm font-bold text-gray-800">{details.main_kpi || details.kpi_principal}</p>
                              </div>
                            </div>
                          
                          {/* Tácticas Ejecutables */}
                          {details.tactics && details.tactics.length > 0 && (
                            <div className="mb-4">
                              <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Tácticas Ejecutables
                              </h5>
                              <div className="grid gap-2">
                                {details.tactics.map((tactic: string, idx: number) => (
                                  <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <span className="text-green-600 font-bold text-xs">{idx + 1}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed">{tactic}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Tácticas Moonshot */}
                          {details.moonshot_tactics && details.moonshot_tactics.length > 0 && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200">
                              <h5 className="font-semibold text-sm mb-3 flex items-center gap-2 text-purple-800">
                                <Sparkles className="h-4 w-4" />
                                🚀 Tácticas Moonshot (Alto Impacto)
                              </h5>
                              <div className="grid gap-2">
                                {details.moonshot_tactics.map((tactic: string, idx: number) => (
                                  <div key={idx} className="flex items-start gap-3 bg-white/70 p-3 rounded-lg border border-purple-300">
                                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <Sparkles className="h-3 w-3 text-purple-600" />
                                    </div>
                                    <p className="text-sm text-purple-900 font-medium leading-relaxed">{tactic}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Plan */}
          {strategy.content_plan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  Plan de Contenido por Plataforma
                </CardTitle>
                <p className="text-muted-foreground">Estrategia específica para cada red social</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(strategy.content_plan).map(([platform, config]: [string, any]) => {
                    const platformColors = {
                      LinkedIn: 'border-blue-200 bg-blue-50',
                      Instagram: 'border-pink-200 bg-pink-50', 
                      TikTok: 'border-purple-200 bg-purple-50',
                      Email: 'border-green-200 bg-green-50',
                      Web: 'border-orange-200 bg-orange-50'
                    };
                    
                    const platformIcons = {
                      LinkedIn: '💼',
                      Instagram: '📸',
                      TikTok: '🎵',
                      Email: '📧',
                      Web: '🌐'
                    };
                    
                    return (
                      <div key={platform} className={`rounded-xl border-2 p-6 ${platformColors[platform as keyof typeof platformColors] || 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-2xl">{platformIcons[platform as keyof typeof platformIcons] || '📱'}</span>
                          <h4 className="text-xl font-bold capitalize">{platform}</h4>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-white/70 p-3 rounded-lg">
                            <h5 className="font-medium text-sm text-gray-600 mb-1">Frecuencia</h5>
                            <p className="font-semibold">{config.frequency}</p>
                          </div>
                          
                          <div className="bg-white/70 p-3 rounded-lg">
                            <h5 className="font-medium text-sm text-gray-600 mb-1">Tono de Comunicación</h5>
                            <p className="font-semibold">{config.tone}</p>
                          </div>
                          
                          <div className="bg-white/70 p-3 rounded-lg">
                            <h5 className="font-medium text-sm text-gray-600 mb-1">Call to Action</h5>
                            <p className="font-semibold text-primary">"{config.cta}"</p>
                          </div>
                          
                          <div className="bg-white/70 p-3 rounded-lg">
                            <h5 className="font-medium text-sm text-gray-600 mb-2">Formatos de Contenido</h5>
                            <div className="flex flex-wrap gap-2">
                              {config.formats?.map((format: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {format}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-white/70 p-3 rounded-lg">
                            <h5 className="font-medium text-sm text-gray-600 mb-1">Justificación</h5>
                            <p className="text-xs text-gray-600 leading-relaxed">{config.justification}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* KPIs */}
          {strategy.kpis_goals && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  KPIs y Objetivos Medibles
                </CardTitle>
                <p className="text-muted-foreground">Métricas clave para medir el éxito de tu campaña</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {strategy.kpis_goals.map((goal: any, idx: number) => {
                    const kpiIcons = {
                      'Alcance': '🎯',
                      'Impresiones': '👀', 
                      'CTR': '🖱️',
                      'Leads': '🚀',
                      'Conversion Rate': '💰',
                      'CAC estimado': '💵'
                    };
                    
                    return (
                      <div key={idx} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 p-6 rounded-xl hover:shadow-lg transition-all">
                        <div className="text-center">
                          <div className="text-3xl mb-3">
                            {kpiIcons[goal.kpi as keyof typeof kpiIcons] || '📊'}
                          </div>
                          <h4 className="font-bold text-lg mb-2 text-gray-800">{goal.kpi}</h4>
                          <div className="bg-primary/10 px-4 py-3 rounded-lg">
                            <p className="text-lg font-bold text-primary">{goal.goal}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Assumptions - EDITABLE */}
          {strategy.risks_assumptions && strategy.risks_assumptions.length > 0 && (
            <EditableStrategySection
              title="Riesgos y Asunciones"
              icon={
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">⚠️</span>
                </div>
              }
              editMode={editingSection === 'risks'}
              setEditMode={(value) => {
                if (value) {
                  setEditingSection('risks');
                  setEditedData({ risks_assumptions: [...strategy.risks_assumptions] });
                } else {
                  setEditingSection(null);
                }
              }}
              onSave={() => {
                setStrategy({
                  ...strategy,
                  risks_assumptions: editedData.risks_assumptions
                });
                toast({
                  title: "Riesgos actualizados",
                  description: "Los cambios se han guardado correctamente"
                });
              }}
            >
              <EditableList
                items={editingSection === 'risks' ? editedData.risks_assumptions || [] : strategy.risks_assumptions}
                onChange={(items) => setEditedData({ risks_assumptions: items })}
                editMode={editingSection === 'risks'}
                emptyMessage="No hay riesgos definidos"
                addButtonText="Agregar Riesgo"
              />
            </EditableStrategySection>
          )}

          {/* Execution Plan & Resources */}
          {strategy.execution_plan && (strategy.execution_plan.steps?.length > 0 || strategy.execution_plan.roles?.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  Plan de Ejecución y Recursos
                </CardTitle>
                <p className="text-muted-foreground">Pasos operativos, roles necesarios y presupuesto estimado</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {/* Pasos Operativos */}
                  {strategy.execution_plan.steps && strategy.execution_plan.steps.length > 0 && (
                    <div>
                      <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        Pasos Operativos
                      </h4>
                      <div className="grid gap-2">
                        {strategy.execution_plan.steps.map((step: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                              {idx + 1}
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed pt-1">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Roles y Activos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {strategy.execution_plan.roles && strategy.execution_plan.roles.length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg">
                        <h5 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Roles Necesarios
                        </h5>
                        <div className="space-y-2">
                          {strategy.execution_plan.roles.map((role: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-purple-100">
                              <span className="text-purple-600">👤</span>
                              <p className="text-sm text-gray-800">{role}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {strategy.execution_plan.assets && strategy.execution_plan.assets.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 p-5 rounded-lg">
                        <h5 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                          <Lightbulb className="h-5 w-5" />
                          Activos a Crear
                        </h5>
                        <div className="space-y-2">
                          {strategy.execution_plan.assets.map((asset: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-orange-100">
                              <span className="text-orange-600">📄</span>
                              <p className="text-sm text-gray-800">{asset}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Presupuesto por Canal */}
                  {strategy.execution_plan.budget && Object.keys(strategy.execution_plan.budget).length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-5 rounded-lg">
                      <h4 className="font-bold text-lg text-green-800 mb-4 flex items-center gap-2">
                        💰 Presupuesto Estimado por Canal
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(strategy.execution_plan.budget).map(([channel, budget]: [string, any]) => (
                          <div key={channel} className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                            <h5 className="font-semibold text-gray-700 mb-2">{channel}</h5>
                            <p className="text-xl font-bold text-green-700">{budget}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sources & Competitors Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sources */}
            {strategy.sources && strategy.sources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">📚</span>
                    </div>
                    Fuentes de Información
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {strategy.sources.map((source: string, idx: number) => (
                      <div key={idx} className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg">
                        <p className="text-xs text-indigo-800 leading-relaxed">{source}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Competitors Quick View */}
            {strategy.competitors && strategy.competitors.length > 0 && typeof strategy.competitors[0] !== 'string' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    Análisis de Competencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {strategy.competitors.map((competitor: any, idx: number) => (
                    <div key={idx} className="mb-4 last:mb-0 bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-800">{competitor.name}</h5>
                          {competitor.url && (
                            <a href={competitor.url} target="_blank" rel="noopener noreferrer" 
                               className="text-xs text-primary hover:underline">
                              {competitor.url}
                            </a>
                          )}
                        </div>
                      </div>
                      {competitor.description && (
                        <p className="text-xs text-gray-600 mt-2">{competitor.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Complete Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleComplete}
          disabled={!canProceed || loading}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8"
          size="lg"
        >
          {loading ? 'Guardando...' : 'Continuar con Calendario de Contenido'}
        </Button>
      </div>
      </div>
    </StrategyErrorBoundary>
  );
};