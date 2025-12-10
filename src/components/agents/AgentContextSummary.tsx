import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Target, 
  Users, 
  Palette, 
  Share2,
  Sparkles,
  Loader2,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PlatformAgent } from "@/hooks/usePlatformAgents";
import { getAgentDataRequirements } from "@/utils/agentPayloadMapper";

interface AgentContextSummaryProps {
  agent: PlatformAgent;
  companyId: string;
  userId: string;
  onDataGenerated?: () => void;
}

interface ContextStatus {
  strategy: {
    exists: boolean;
    isComplete: boolean;
    fields: { name: string; value: boolean }[];
  };
  audiences: {
    exists: boolean;
    count: number;
    names: string[];
  };
  branding: {
    exists: boolean;
    isComplete: boolean;
    hasColors: boolean;
    hasVoice: boolean;
  };
  social: {
    connected: string[];
    total: number;
  };
}

type StatusType = 'complete' | 'incomplete' | 'empty';

export const AgentContextSummary = ({ 
  agent, 
  companyId, 
  userId,
  onDataGenerated 
}: AgentContextSummaryProps) => {
  const { t, i18n } = useTranslation(['common']);
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [contextStatus, setContextStatus] = useState<ContextStatus>({
    strategy: { exists: false, isComplete: false, fields: [] },
    audiences: { exists: false, count: 0, names: [] },
    branding: { exists: false, isComplete: false, hasColors: false, hasVoice: false },
    social: { connected: [], total: 0 }
  });

  const requirements = getAgentDataRequirements(
    agent.internal_code, 
    (agent as any).context_requirements
  );

  useEffect(() => {
    loadContextData();
  }, [companyId, userId]);

  const loadContextData = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const [strategyResult, audiencesResult, brandingResult, linkedinResult, fbResult, tiktokResult] = await Promise.all([
        supabase.from('company_strategy').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('company_audiences').select('id, name').eq('company_id', companyId).eq('is_active', true),
        supabase.from('company_branding').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('linkedin_connections').select('id').eq('user_id', userId).maybeSingle(),
        supabase.from('facebook_instagram_connections').select('id').eq('user_id', userId).maybeSingle(),
        supabase.from('tiktok_connections').select('id').eq('user_id', userId).maybeSingle()
      ]);

      const strategy = strategyResult.data;
      const branding = brandingResult.data;
      const audiences = audiencesResult.data || [];

      const socialConnected: string[] = [];
      if (linkedinResult.data) socialConnected.push('LinkedIn');
      if (fbResult.data) {
        socialConnected.push('Facebook');
        socialConnected.push('Instagram');
      }
      if (tiktokResult.data) socialConnected.push('TikTok');

      setContextStatus({
        strategy: {
          exists: !!strategy,
          isComplete: !!(strategy?.mision && strategy?.vision && strategy?.propuesta_valor),
          fields: [
            { name: 'Misión', value: !!strategy?.mision },
            { name: 'Visión', value: !!strategy?.vision },
            { name: 'Propuesta de valor', value: !!strategy?.propuesta_valor }
          ]
        },
        audiences: {
          exists: audiences.length > 0,
          count: audiences.length,
          names: audiences.map((a: any) => a.name).slice(0, 3)
        },
        branding: {
          exists: !!branding,
          isComplete: !!(branding?.primary_color && branding?.brand_voice),
          hasColors: !!branding?.primary_color,
          hasVoice: !!branding?.brand_voice
        },
        social: {
          connected: socialConnected,
          total: socialConnected.length
        }
      });
    } catch (error) {
      console.error('Error loading context data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWithAI = async (type: 'strategy' | 'branding' | 'audiences') => {
    setGenerating(type);
    try {
      let functionName = '';
      let payload: Record<string, any> = { companyId, language: i18n.language };

      switch (type) {
        case 'strategy':
          functionName = 'company-strategy';
          break;
        case 'branding':
          functionName = 'brand-identity';
          break;
        case 'audiences':
          functionName = 'ai-audience-generator';
          payload = { ...payload, userId };
          break;
      }

      const { error } = await supabase.functions.invoke(functionName, { body: payload });
      
      if (error) throw error;

      toast({
        title: t('common:success', 'Éxito'),
        description: t('common:dataGeneratedSuccess', 'Datos generados correctamente')
      });

      await loadContextData();
      onDataGenerated?.();
    } catch (error) {
      console.error('Error generating data:', error);
      toast({
        title: t('common:error', 'Error'),
        description: t('common:generationFailed', 'No se pudo generar los datos'),
        variant: "destructive"
      });
    } finally {
      setGenerating(null);
    }
  };

  const getStatusIcon = (status: StatusType) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'incomplete':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'empty':
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: StatusType) => {
    switch (status) {
      case 'complete':
        return <Badge variant="outline" className="border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">Completo</Badge>;
      case 'incomplete':
        return <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30">Incompleto</Badge>;
      case 'empty':
        return <Badge variant="outline" className="border-muted-foreground text-muted-foreground">No configurado</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const strategyStatus: StatusType = !contextStatus.strategy.exists ? 'empty' 
    : contextStatus.strategy.isComplete ? 'complete' : 'incomplete';
  
  const audiencesStatus: StatusType = !contextStatus.audiences.exists ? 'empty' : 'complete';
  
  const brandingStatus: StatusType = !contextStatus.branding.exists ? 'empty' 
    : contextStatus.branding.isComplete ? 'complete' : 'incomplete';
  
  const socialStatus: StatusType = contextStatus.social.total === 0 ? 'empty' 
    : contextStatus.social.total >= 2 ? 'complete' : 'incomplete';

  // Filter to only show required context items
  const showStrategy = requirements.needsStrategy;
  const showAudiences = requirements.needsAudiences;
  const showBranding = requirements.needsBranding;
  const showSocial = requirements.needsSocialConnection;

  if (!showStrategy && !showAudiences && !showBranding && !showSocial) {
    return null; // No context requirements for this agent
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="w-4 h-4" />
          {t('common:dataUsedByAgent', 'Datos que usará el agente')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Strategy */}
        {showStrategy && (
          <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-3">
              {getStatusIcon(strategyStatus)}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">Estrategia</span>
                  {getStatusBadge(strategyStatus)}
                </div>
                {contextStatus.strategy.exists && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {contextStatus.strategy.fields.map(field => (
                      <div key={field.name} className="flex items-center gap-1">
                        {field.value ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-muted-foreground" />
                        )}
                        {field.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {strategyStatus !== 'complete' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => generateWithAI('strategy')}
                  disabled={generating === 'strategy'}
                  className="text-xs h-7"
                >
                  {generating === 'strategy' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Generar
                    </>
                  )}
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                <Link to="/company/dashboard?tab=adn&section=strategy">
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Audiences */}
        {showAudiences && (
          <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-3">
              {getStatusIcon(audiencesStatus)}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Audiencias</span>
                  {getStatusBadge(audiencesStatus)}
                </div>
                {contextStatus.audiences.exists && (
                  <div className="text-xs text-muted-foreground">
                    {contextStatus.audiences.count} audiencia{contextStatus.audiences.count !== 1 ? 's' : ''}: {contextStatus.audiences.names.join(', ')}
                    {contextStatus.audiences.count > 3 && '...'}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {audiencesStatus === 'empty' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => generateWithAI('audiences')}
                  disabled={generating === 'audiences'}
                  className="text-xs h-7"
                >
                  {generating === 'audiences' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Generar
                    </>
                  )}
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                <Link to="/company/dashboard?tab=audiencias">
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Branding */}
        {showBranding && (
          <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-3">
              {getStatusIcon(brandingStatus)}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Identidad de marca</span>
                  {getStatusBadge(brandingStatus)}
                </div>
                {contextStatus.branding.exists && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className={contextStatus.branding.hasColors ? 'text-emerald-600' : ''}>
                      {contextStatus.branding.hasColors ? '✓' : '○'} Colores
                    </span>
                    <span className={contextStatus.branding.hasVoice ? 'text-emerald-600' : ''}>
                      {contextStatus.branding.hasVoice ? '✓' : '○'} Voz de marca
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {brandingStatus !== 'complete' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => generateWithAI('branding')}
                  disabled={generating === 'branding'}
                  className="text-xs h-7"
                >
                  {generating === 'branding' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Generar
                    </>
                  )}
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                <Link to="/company/dashboard?tab=adn&section=branding">
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Social Connections */}
        {showSocial && (
          <div className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-start gap-3">
              {getStatusIcon(socialStatus)}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Redes sociales</span>
                  {getStatusBadge(socialStatus)}
                </div>
                {contextStatus.social.total > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Conectadas: {contextStatus.social.connected.join(', ')}
                  </div>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7">
              <Link to="/company/dashboard?tab=configuracion">
                <ExternalLink className="w-3 h-3" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
