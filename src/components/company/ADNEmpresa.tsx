import { useState, useEffect, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { 
  Building2, 
  Target, 
  Palette,
  Share2,
  RefreshCw,
} from "lucide-react";
import { 
  ADNInfoTab, 
  ADNStrategyTab, 
  ADNBrandTab, 
  ADNSocialTab, 
  ADNFilesTab, 
  ADNEmailTab,
  ADNTeamTab,
  ADNProductsTab,
  ADNCompetitorsTab,
  ADNChannelsConsolidatedView,
  ADNVoiceCommunicationTab,
  ADNScheduleSimplified,
  ADNAgentPrefsSimplified,
} from "./adn-tabs";

interface ADNEmpresaProps {
  profile: any;
  onProfileUpdate: (profile: any) => void;
}

const ADNEmpresa = ({ profile, onProfileUpdate }: ADNEmpresaProps) => {
  const { toast } = useToast();
  const { t } = useTranslation(['marketing', 'company', 'common']);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("empresa");
  const [companyData, setCompanyData] = useState<any>(null);
  const [strategyData, setStrategyData] = useState<any>(null);
  const [brandingData, setBrandingData] = useState<any>(null);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [isEnrichingData, setIsEnrichingData] = useState(false);
  const [isGeneratingBrand, setIsGeneratingBrand] = useState(false);
  const [isGeneratingObjectives, setIsGeneratingObjectives] = useState(false);
  const loadedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profile?.user_id) {
      setLoading(false);
      return;
    }
    
    if (loadedUserIdRef.current === profile.user_id && companyData) {
      return;
    }
    
    loadedUserIdRef.current = profile.user_id;
    loadData();
  }, [profile?.user_id, companyData]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      let companyId: string | null = null;
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('primary_company_id')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      
      companyId = profileData?.primary_company_id || null;
      
      if (!companyId) {
        const { data: member } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', profile.user_id)
          .eq('is_primary', true)
          .maybeSingle();
        companyId = member?.company_id || null;
      }
      
      if (!companyId) {
        const { data: firstMember } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', profile.user_id)
          .limit(1)
          .maybeSingle();
        companyId = firstMember?.company_id || null;
      }
      
      if (!companyId) {
        setLoading(false);
        return;
      }

      const [companyRes, strategyRes, brandingRes, objectivesRes] = await Promise.all([
        supabase.from('companies').select('*').eq('id', companyId).maybeSingle(),
        supabase.from('company_strategy').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('company_branding').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('company_objectives').select('*').eq('company_id', companyId).order('priority')
      ]);

      setCompanyData(companyRes.data || null);
      setObjectives(objectivesRes.data || []);

      if (!strategyRes.data && companyId) {
        const { data: newStrategy } = await supabase
          .from('company_strategy')
          .insert({ company_id: companyId })
          .select()
          .single();
        setStrategyData(newStrategy);
      } else {
        setStrategyData(strategyRes.data);
      }

      if (!brandingRes.data && companyId) {
        const { data: newBranding } = await supabase
          .from('company_branding')
          .insert({ company_id: companyId })
          .select()
          .single();
        setBrandingData(newBranding);
      } else {
        setBrandingData(brandingRes.data);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: t('common:error'), description: t('common:adn.errorLoadingData'), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveField = useCallback(async (field: string, value: any, table: string = 'companies') => {
    try {
      const updateData: any = { [field]: value };
      
      if (table === 'companies' && companyData?.id) {
        const { error } = await supabase.from('companies').update(updateData).eq('id', companyData.id);
        if (error) throw error;
        setCompanyData((prev: any) => ({ ...prev, [field]: value }));
      } else if (table === 'company_strategy' && strategyData?.id) {
        const { error } = await supabase.from('company_strategy').update(updateData).eq('id', strategyData.id);
        if (error) throw error;
        setStrategyData((prev: any) => ({ ...prev, [field]: value }));
      } else if (table === 'company_branding' && brandingData?.id) {
        const { error } = await supabase.from('company_branding').update(updateData).eq('id', brandingData.id);
        if (error) throw error;
        setBrandingData((prev: any) => ({ ...prev, [field]: value }));
      }
      
      toast({ title: "✓", description: t('common:adn.saved'), duration: 1500 });
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: t('common:error'), description: t('common:adn.couldNotSave'), variant: "destructive" });
    }
  }, [companyData?.id, strategyData?.id, brandingData?.id, toast, t]);

  const saveObjective = useCallback(async (data: any, objectiveId?: string) => {
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://ubhzzppmkhxbuiajfswa.supabase.co'}/functions/v1/manage-company-objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({
          action: objectiveId ? 'update' : 'create',
          objectiveData: data,
          objectiveId,
          companyId: companyData?.id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        if (objectiveId) {
          setObjectives(prev => prev.map(obj => obj.id === objectiveId ? { ...obj, ...data } : obj));
        } else {
          setObjectives(prev => [...prev, { id: result.data?.id || result.objectiveId, ...data }]);
        }
        toast({ title: "✓", description: t('common:adn.objectiveSaved'), duration: 1500 });
      }
    } catch (error) {
      console.error('Error saving objective:', error);
      toast({ title: t('common:error'), description: t('common:adn.couldNotSaveObjective'), variant: "destructive" });
    }
  }, [companyData?.id, toast, t]);

  const deleteObjective = useCallback(async (objectiveId: string) => {
    if (!confirm(t('common:adn.deleteObjectiveConfirm'))) return;
    
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://ubhzzppmkhxbuiajfswa.supabase.co'}/functions/v1/manage-company-objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({ action: 'delete', objectiveId, companyId: companyData?.id })
      });

      const result = await response.json();
      if (result.success) {
        setObjectives(prev => prev.filter(obj => obj.id !== objectiveId));
        toast({ title: "✓", description: t('common:adn.objectiveDeleted'), duration: 1500 });
      }
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast({ title: t('common:error'), description: t('common:adn.couldNotDelete'), variant: "destructive" });
    }
  }, [companyData?.id, toast, t]);

  const addNewObjective = useCallback(() => {
    const tempId = `temp-${Date.now()}`;
    const newObj = {
      id: tempId,
      title: '',
      description: '',
      objective_type: 'short_term',
      priority: 1,
      target_date: '',
      isNew: true
    };
    setObjectives(prev => [...prev, newObj]);
  }, []);

  const generateStrategy = useCallback(async () => {
    if (!companyData?.id) return;
    
    setIsGeneratingStrategy(true);
    try {
      const { data, error } = await supabase.functions.invoke('company-strategy', {
        body: { companyId: companyData.id }
      });
      
      if (error) throw error;
      
      if (data?.data_stored) {
        setStrategyData((prev: any) => ({
          ...prev,
          mision: data.data_stored.mision || prev?.mision,
          vision: data.data_stored.vision || prev?.vision,
          propuesta_valor: data.data_stored.propuesta_valor || prev?.propuesta_valor
        }));
      }
      
      toast({
        title: t('company:strategy.generated'),
        description: t('company:strategy.generatedDesc')
      });
    } catch (error: any) {
      console.error('Error generating strategy:', error);
      toast({
        title: t('common:error'),
        description: error.message || t('common:adn.couldNotGenerateStrategy'),
        variant: "destructive"
      });
    } finally {
      setIsGeneratingStrategy(false);
    }
  }, [companyData?.id, toast, t]);

  const enrichCompanyData = useCallback(async () => {
    if (!companyData?.id) return;
    
    setIsEnrichingData(true);
    try {
      const { data, error } = await supabase.functions.invoke('company-info-extractor', {
        body: { companyId: companyData.id }
      });
      
      if (error) throw error;
      
      await loadData();
      
      toast({
        title: t('company:enrich.success'),
        description: t('company:enrich.successDesc')
      });
    } catch (error: any) {
      console.error('Error enriching data:', error);
      toast({
        title: t('common:error'),
        description: error.message || t('common:adn.couldNotEnrich'),
        variant: "destructive"
      });
    } finally {
      setIsEnrichingData(false);
    }
  }, [companyData?.id, toast, t]);

  const generateBrandIdentity = useCallback(async () => {
    if (!companyData?.id) return;
    
    setIsGeneratingBrand(true);
    try {
      const { data, error } = await supabase.functions.invoke('brand-identity', {
        body: { companyId: companyData.id }
      });
      
      if (error) throw error;
      
      const { data: newBranding } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', companyData.id)
        .maybeSingle();
      
      if (newBranding) {
        setBrandingData(newBranding);
      }
      
      toast({
        title: t('company:brand.generated'),
        description: t('company:brand.generatedDesc')
      });
    } catch (error: any) {
      console.error('Error generating brand identity:', error);
      toast({
        title: t('common:error'),
        description: error.message || t('common:adn.couldNotGenerateBrand'),
        variant: "destructive"
      });
    } finally {
      setIsGeneratingBrand(false);
    }
  }, [companyData?.id, toast, t]);

  const generateObjectives = useCallback(async () => {
    if (!companyData?.id) return;
    
    setIsGeneratingObjectives(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-business-objectives', {
        body: { companyId: companyData.id, language: 'es' }
      });
      
      if (error) throw error;
      
      if (data?.objectives) {
        setObjectives(prev => [...prev, ...data.objectives]);
      }
      
      toast({
        title: t('company:objectives.generated'),
        description: t('company:objectives.generatedDesc', { count: data?.count || 0 })
      });
    } catch (error: any) {
      console.error('Error generating objectives:', error);
      toast({
        title: t('common:error'),
        description: error.message || t('common:adn.couldNotGenerateObjectives'),
        variant: "destructive"
      });
    } finally {
      setIsGeneratingObjectives(false);
    }
  }, [companyData?.id, toast, t]);

  // Extract brand voice for communication tab
  const brandVoice = brandingData?.brand_voice as { personalidad?: string; descripcion?: string; palabras_clave?: string[] } | undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Building2 className="w-12 h-12 mb-4 text-muted-foreground/40" />
        <p className="text-muted-foreground">{t('common:adn.noCompanyInfo')}</p>
        <p className="text-sm text-muted-foreground/60">{t('common:adn.completeOnboardingFirst')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">{t('common:adn.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('common:adn.subtitle')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common:adn.tabs.empresa', 'Mi Empresa')}</span>
          </TabsTrigger>
          <TabsTrigger value="estrategia" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common:adn.tabs.estrategia', 'Estrategia')}</span>
          </TabsTrigger>
          <TabsTrigger value="marca" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common:adn.tabs.marca', 'Marca')}</span>
          </TabsTrigger>
          <TabsTrigger value="canales" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common:adn.tabs.canales', 'Canales')}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: MI EMPRESA - Info + Team + Products */}
        <TabsContent value="empresa" className="space-y-6">
          <ADNInfoTab
            companyData={companyData}
            setCompanyData={setCompanyData}
            saveField={saveField}
            isEnrichingData={isEnrichingData}
            enrichCompanyData={enrichCompanyData}
          />
          
          <ADNProductsTab companyId={companyData?.id} />
          
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">{t('common:adn.team', 'Equipo')}</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <ADNTeamTab />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: ESTRATEGIA - Strategy + Objectives + Competitors */}
        <TabsContent value="estrategia" className="space-y-6">
          <ADNStrategyTab
            companyData={companyData}
            strategyData={strategyData}
            objectives={objectives}
            saveField={saveField}
            saveObjective={saveObjective}
            deleteObjective={deleteObjective}
            addNewObjective={addNewObjective}
            isGeneratingStrategy={isGeneratingStrategy}
            generateStrategy={generateStrategy}
            isGeneratingObjectives={isGeneratingObjectives}
            generateObjectives={generateObjectives}
          />
          
          <ADNCompetitorsTab companyId={companyData?.id} />
        </TabsContent>

        {/* TAB 3: MARCA - Brand Identity + Voice/Communication + Agent Preferences */}
        <TabsContent value="marca" className="space-y-6">
          <ADNBrandTab
            companyData={companyData}
            brandingData={brandingData}
            saveField={saveField}
            isGeneratingBrand={isGeneratingBrand}
            generateBrandIdentity={generateBrandIdentity}
          />
          
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">{t('common:adn.voice_communication', 'Voz y Comunicación')}</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <ADNVoiceCommunicationTab 
                companyId={companyData?.id} 
                brandVoice={brandVoice}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">{t('common:adn.agent_prefs', 'Preferencias de Agentes')}</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <ADNAgentPrefsSimplified companyId={companyData?.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: CANALES - Social Connections + Platform Config + Files + Email */}
        <TabsContent value="canales" className="space-y-6">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">{t('common:adn.social_connections', 'Conexiones Sociales')}</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <ADNSocialTab profile={profile} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">{t('common:adn.platform_config', 'Configuración de Plataformas')}</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <ADNChannelsConsolidatedView companyId={companyData?.id} />
            </CardContent>
          </Card>
          
          <ADNScheduleSimplified companyId={companyData?.id} />
          
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">{t('common:adn.knowledge_base', 'Base de Conocimiento')}</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <ADNFilesTab />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">{t('common:adn.email_config', 'Configuración de Email')}</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <ADNEmailTab companyData={companyData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ADNEmpresa;
