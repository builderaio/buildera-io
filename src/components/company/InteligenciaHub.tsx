import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { 
  FileSearch, 
  Target, 
  TrendingUp,
  RefreshCw,
  Building2,
  Brain
} from "lucide-react";
import { 
  ADNCompetitorsTab,
  ADNDiagnosticTab,
  ADNDiagnosticHistory,
} from "./adn-tabs";

interface InteligenciaHubProps {
  profile: any;
}

const InteligenciaHub = ({ profile }: InteligenciaHubProps) => {
  const { toast } = useToast();
  const { t } = useTranslation(['common']);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("diagnostico");
  const [companyData, setCompanyData] = useState<any>(null);

  useEffect(() => {
    if (!profile?.user_id) {
      setLoading(false);
      return;
    }
    loadCompanyData();
  }, [profile?.user_id]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      
      let companyId: string | null = null;
      
      // Get primary company
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

      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();

      setCompanyData(company);
    } catch (error) {
      console.error('Error loading company data:', error);
      toast({ 
        title: t('common:error'), 
        description: t('common:adn.errorLoadingData'), 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

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
    <div className="max-w-5xl mx-auto px-2 sm:px-4 space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="w-6 h-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold">{t('common:intelligence.title', 'Inteligencia')}</h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t('common:intelligence.subtitle', 'Diagnósticos, análisis de competencia y reportes de mercado')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto p-1">
          <TabsTrigger value="diagnostico" className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm">
            <FileSearch className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">{t('common:intelligence.tabs.diagnostic', 'Diagnóstico')}</span>
          </TabsTrigger>
          <TabsTrigger value="competidores" className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm">
            <Target className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">{t('common:intelligence.tabs.competitors', 'Competidores')}</span>
          </TabsTrigger>
          <TabsTrigger value="mercado" className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm">
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">{t('common:intelligence.tabs.market', 'Mercado')}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB: DIAGNÓSTICO */}
        <TabsContent value="diagnostico" className="space-y-6">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-primary" />
                {t('common:adn.diagnostic.title', 'Información Capturada')}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <ADNDiagnosticTab webhookData={companyData?.webhook_data} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">{t('common:adn.diagnostic.evolution', 'Evolución Digital')}</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <ADNDiagnosticHistory companyId={companyData?.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: COMPETIDORES */}
        <TabsContent value="competidores" className="space-y-6">
          <ADNCompetitorsTab companyId={companyData?.id} />
        </TabsContent>

        {/* TAB: MERCADO (Próximamente) */}
        <TabsContent value="mercado" className="space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-lg font-medium mb-2">
                {t('common:intelligence.market.comingSoon', 'Próximamente')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {t('common:intelligence.market.description', 'Análisis de tendencias del sector, oportunidades de mercado e insights de audiencia.')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InteligenciaHub;
