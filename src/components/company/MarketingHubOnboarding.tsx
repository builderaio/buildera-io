import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  ArrowLeft,
  Linkedin,
  Instagram,
  Facebook,
  MessageCircle,
  Loader2,
  TrendingUp,
  Target,
  Lightbulb,
  BarChart3,
  Sparkles,
  ExternalLink,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OnboardingProps {
  profile: any;
  onComplete: () => void;
}

interface SocialPlatform {
  id: string;
  name: string;
  icon: any;
  color: string;
  url: string;
  connected: boolean;
  hasAccount: boolean | null;
}

interface AnalysisResult {
  platform: string;
  success: boolean;
  postsFound: number;
  insightsGenerated: number;
  actionablesGenerated: number;
  error?: string;
}

export default function MarketingHubOnboarding({ profile, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600', url: '', connected: false, hasAccount: null },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-600', url: '', connected: false, hasAccount: null },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-700', url: '', connected: false, hasAccount: null },
    { id: 'tiktok', name: 'TikTok', icon: MessageCircle, color: 'bg-black', url: '', connected: false, hasAccount: null }
  ]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [currentAnalyzing, setCurrentAnalyzing] = useState<string>('');
  const [consolidatedInsights, setConsolidatedInsights] = useState<any[]>([]);
  const [consolidatedActionables, setConsolidatedActionables] = useState<any[]>([]);

  const steps = [
    {
      title: "Configuración de Redes Sociales",
      description: "Configura tus redes sociales para comenzar el análisis",
      component: "social-config"
    },
    {
      title: "Análisis Automático",
      description: "Analizamos tus redes sociales y generamos insights",
      component: "analysis"
    },
    {
      title: "Insights Consolidados",
      description: "Revisa los insights y recomendaciones generadas",
      component: "insights"
    },
    {
      title: "¡Listo para Crecer!",
      description: "Tu Marketing Hub está configurado y listo",
      component: "complete"
    }
  ];

  useEffect(() => {
    loadExistingCompanyData();
  }, []);

  const loadExistingCompanyData = async () => {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .eq('created_by', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (companies && companies.length > 0) {
        const company = companies[0];
        setPlatforms(prev => prev.map(platform => ({
          ...platform,
          url: company[`${platform.id}_url`] || '',
          connected: !!(company[`${platform.id}_url`] && 
                       company[`${platform.id}_url`] !== '' && 
                       company[`${platform.id}_url`] !== 'No tiene'),
          hasAccount: company[`${platform.id}_url`] ? true : null
        })));
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  };

  const handlePlatformToggle = (platformId: string, hasAccount: boolean) => {
    setPlatforms(prev => prev.map(platform => 
      platform.id === platformId 
        ? { ...platform, hasAccount, connected: false, url: hasAccount ? platform.url : '' }
        : platform
    ));
  };

  const handleUrlChange = (platformId: string, url: string) => {
    setPlatforms(prev => prev.map(platform => 
      platform.id === platformId 
        ? { ...platform, url, connected: isValidUrl(url) }
        : platform
    ));
  };

  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const saveCompanyData = async () => {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('created_by', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      const updateData: any = {};
      platforms.forEach(platform => {
        if (platform.hasAccount === false) {
          updateData[`${platform.id}_url`] = 'No tiene';
        } else if (platform.connected && platform.url) {
          updateData[`${platform.id}_url`] = platform.url;
        }
      });

      if (companies && companies.length > 0) {
        await supabase
          .from('companies')
          .update(updateData)
          .eq('id', companies[0].id);
      } else {
        await supabase
          .from('companies')
          .insert({
            name: profile.company_name || 'Mi Empresa',
            created_by: profile.user_id,
            ...updateData
          });
      }

      toast.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving company data:', error);
      toast.error('Error al guardar la configuración');
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisResults([]);
    
    const connectedPlatforms = platforms.filter(p => p.connected);
    
    for (const platform of connectedPlatforms) {
      setCurrentAnalyzing(platform.name);
      
      try {
        console.log(`🚀 Analyzing ${platform.name}...`);
        
        let result: AnalysisResult;
        
        switch (platform.id) {
          case 'instagram':
            console.log(`📸 Analyzing Instagram: ${platform.url}`);
            
            // Scraping y análisis de Instagram
            const { data: instagramData, error: instagramError } = await supabase.functions.invoke('instagram-scraper', {
              body: { 
                action: 'get_posts', 
                username_or_url: platform.url
              }
            });
            
            if (instagramError) {
              console.error('Instagram scraper error:', instagramError);
              throw new Error(`Error en scraper: ${instagramError.message}`);
            }
            
            // Análisis inteligente profundo de Instagram
            const { data: instagramAnalysis, error: instagramAnalysisError } = await supabase.functions.invoke('instagram-intelligent-analysis', {
              body: { user_id: profile.user_id }
            });
            
            if (instagramAnalysisError) {
              console.error('Instagram analysis error:', instagramAnalysisError);
            }
            
            result = {
              platform: platform.name,
              success: true,
              postsFound: instagramData?.data?.posts?.length || 0,
              insightsGenerated: instagramAnalysis?.insights_generated || 0,
              actionablesGenerated: instagramAnalysis?.actionables_generated || 0
            };
            break;
            
          case 'facebook':
            console.log(`📘 Analyzing Facebook: ${platform.url}`);
            
            // Usar la misma implementación que SocialMediaHub
            const { data: fbPageData, error: fbPageError } = await supabase.functions.invoke('facebook-scraper', {
              body: { 
                action: 'get_page_details', 
                page_url: platform.url
              }
            });
            
            if (fbPageError) {
              console.error('Facebook scraper error:', fbPageError);
              throw new Error(`Error en scraper: ${fbPageError.message}`);
            }
            
            // Obtener posts si tenemos el page_id
            let fbPostsCount = 0;
            if (fbPageData?.success && fbPageData?.data?.page_details?.page_id) {
              const { data: fbPostsData } = await supabase.functions.invoke('facebook-scraper', {
                body: {
                  action: 'get_page_posts',
                  page_id: fbPageData.data.page_details.page_id
                }
              });
              fbPostsCount = fbPostsData?.data?.posts?.length || 0;
            }
            
            // Análisis inteligente de Facebook
            const { data: fbAnalysis, error: fbAnalysisError } = await supabase.functions.invoke('facebook-intelligent-analysis', {
              body: { user_id: profile.user_id }
            });
            
            if (fbAnalysisError) {
              console.error('Facebook analysis error:', fbAnalysisError);
            }
            
            result = {
              platform: platform.name,
              success: true,
              postsFound: fbPostsCount,
              insightsGenerated: fbAnalysis?.insights_generated || 0,
              actionablesGenerated: fbAnalysis?.actionables_generated || 0
            };
            break;
            
          case 'linkedin':
            // Extraer identificador como en SocialMediaHub
            const identifier = platform.url.match(/linkedin\.com\/company\/([a-zA-Z0-9-_]+)/)?.[1];
            if (identifier) {
              console.log(`💼 Analyzing LinkedIn: ${identifier}`);
              
              // Usar la misma implementación que SocialMediaHub
              const { data: linkedinData, error: linkedinError } = await supabase.functions.invoke('linkedin-scraper', {
                body: { 
                  action: 'get_company_posts', 
                  company_identifier: identifier
                }
              });
              
              if (linkedinError) {
                console.error('LinkedIn scraper error:', linkedinError);
                throw new Error(`Error en scraper: ${linkedinError.message}`);
              }
              
              // Análisis inteligente de LinkedIn
              const { data: linkedinAnalysis, error: linkedinAnalysisError } = await supabase.functions.invoke('linkedin-intelligent-analysis', {
                body: { user_id: profile.user_id }
              });
              
              if (linkedinAnalysisError) {
                console.error('LinkedIn analysis error:', linkedinAnalysisError);
              }
              
              result = {
                platform: platform.name,
                success: true,
                postsFound: linkedinData?.data?.data?.posts?.length || 0,
                insightsGenerated: linkedinAnalysis?.insights_generated || 0,
                actionablesGenerated: linkedinAnalysis?.actionables_generated || 0
              };
            } else {
              throw new Error('URL de LinkedIn no válida');
            }
            break;
            
          case 'tiktok':
            // Extraer unique_id como en SocialMediaHub
            const tiktokId = platform.url.match(/tiktok\.com\/@([a-zA-Z0-9._-]+)/)?.[1];
            if (tiktokId) {
              console.log(`🎵 Analyzing TikTok: @${tiktokId}`);
              
              // Usar la misma implementación que SocialMediaHub
              const { data: tiktokData, error: tiktokError } = await supabase.functions.invoke('tiktok-scraper', {
                body: { 
                  action: 'get_posts', 
                  unique_id: tiktokId
                }
              });
              
              if (tiktokError) {
                console.error('TikTok scraper error:', tiktokError);
                throw new Error(`Error en scraper: ${tiktokError.message}`);
              }
              
              // Análisis inteligente de TikTok
              const { data: tiktokAnalysis, error: tiktokAnalysisError } = await supabase.functions.invoke('tiktok-intelligent-analysis', {
                body: { user_id: profile.user_id }
              });
              
              if (tiktokAnalysisError) {
                console.error('TikTok analysis error:', tiktokAnalysisError);
              }
              
              result = {
                platform: platform.name,
                success: true,
                postsFound: tiktokData?.data?.videos?.length || 0,
                insightsGenerated: tiktokAnalysis?.insights_generated || 0,
                actionablesGenerated: tiktokAnalysis?.actionables_generated || 0
              };
            } else {
              throw new Error('Username de TikTok no válido');
            }
            break;
            
          default:
            result = {
              platform: platform.name,
              success: false,
              postsFound: 0,
              insightsGenerated: 0,
              actionablesGenerated: 0,
              error: 'Plataforma no soportada'
            };
        }
        
        console.log(`✅ ${platform.name} analysis completed:`, result);
        setAnalysisResults(prev => [...prev, result]);
        
      } catch (error) {
        console.error(`❌ Error analyzing ${platform.name}:`, error);
        setAnalysisResults(prev => [...prev, {
          platform: platform.name,
          success: false,
          postsFound: 0,
          insightsGenerated: 0,
          actionablesGenerated: 0,
          error: error.message || 'Error desconocido'
        }]);
      }
      
      // Esperar un poco entre análisis para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Generar insights avanzados de negocio después de todos los análisis
    setCurrentAnalyzing('Generando insights avanzados de negocio...');
    console.log('🧠 Starting advanced business insights generation');
    
    try {
      const { data: advancedInsights, error: advancedError } = await supabase.functions.invoke('advanced-business-insights', {
        body: { user_id: profile.user_id }
      });
      
      if (advancedError) {
        console.error('Advanced insights error:', advancedError);
      } else {
        console.log('✅ Advanced business insights generated:', advancedInsights);
        toast.success('Insights avanzados de negocio generados exitosamente');
      }
    } catch (error) {
      console.error('Error generating advanced insights:', error);
    }
    
    // Cargar insights consolidados después de todos los análisis
    await loadConsolidatedData();
    
    setCurrentAnalyzing('');
    setAnalyzing(false);
    
    console.log('🎉 All social media analysis completed');
  };

  const loadConsolidatedData = async () => {
    try {
      // Cargar insights
      const { data: insights } = await supabase
        .from('marketing_insights')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Cargar actionables
      const { data: actionables } = await supabase
        .from('marketing_actionables')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('status', 'pending')
        .order('priority', { ascending: true })
        .limit(10);
      
      setConsolidatedInsights(insights || []);
      setConsolidatedActionables(actionables || []);
    } catch (error) {
      console.error('Error loading consolidated data:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      // Mark onboarding as completed in the database
      const { error } = await supabase
        .from('marketing_onboarding_status')
        .insert({
          user_id: profile.user_id,
          onboarding_version: '1.0'
        });

      if (error) {
        console.error('Error saving onboarding completion:', error);
        toast.error('Error al completar el onboarding');
        return;
      }

      console.log('✅ Onboarding completed and saved');
      toast.success('¡Marketing Hub configurado exitosamente!');
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Error al completar el onboarding');
    }
  };

  const nextStep = async () => {
    if (currentStep === 0) {
      await saveCompanyData();
    }
    if (currentStep === 1) {
      await runAnalysis();
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return platforms.some(p => p.hasAccount !== null);
      case 1:
        return !analyzing;
      case 2:
        return true;
      default:
        return true;
    }
  };

  const renderSocialConfig = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Configura tus Redes Sociales</h2>
        <p className="text-muted-foreground">
          Para cada red social, indícanos si tienes cuenta y proporciona la URL si la tienes
        </p>
      </div>
      
      <div className="grid gap-6">
        {platforms.map((platform) => {
          const IconComponent = platform.icon;
          return (
            <Card key={platform.id} className={`border-2 ${platform.connected ? 'border-green-500' : 'border-border'}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${platform.color} text-white`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                    <CardDescription>
                      {platform.hasAccount === null && "¿Tienes cuenta en esta red?"}
                      {platform.hasAccount === true && "Proporciona la URL de tu perfil/página"}
                      {platform.hasAccount === false && "Confirmado: No tienes cuenta"}
                    </CardDescription>
                  </div>
                  {platform.connected && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {platform.hasAccount === null && (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handlePlatformToggle(platform.id, true)}
                      className="flex-1"
                    >
                      Sí, tengo cuenta
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePlatformToggle(platform.id, false)}
                      className="flex-1"
                    >
                      No tengo cuenta
                    </Button>
                  </div>
                )}
                
                {platform.hasAccount === true && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePlatformToggle(platform.id, null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <Label htmlFor={`${platform.id}-url`}>URL de {platform.name}</Label>
                        <Input
                          id={`${platform.id}-url`}
                          value={platform.url}
                          onChange={(e) => handleUrlChange(platform.id, e.target.value)}
                          placeholder={`https://${platform.id}.com/tu-perfil`}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    {platform.url && !platform.connected && (
                      <p className="text-sm text-red-500">URL no válida</p>
                    )}
                  </div>
                )}
                
                {platform.hasAccount === false && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">No se analizará esta red social</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePlatformToggle(platform.id, null)}
                    >
                      Cambiar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Analizando tus Redes Sociales</h2>
        <p className="text-muted-foreground">
          Estamos obteniendo y analizando tus datos para generar insights accionables
        </p>
      </div>
      
      {analyzing && (
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Analizando {currentAnalyzing}...</span>
          </div>
          <Progress value={(analysisResults.length / platforms.filter(p => p.connected).length) * 100} className="w-full max-w-md mx-auto" />
        </div>
      )}
      
      <div className="grid gap-4">
        {platforms.filter(p => p.connected).map((platform) => {
          const result = analysisResults.find(r => r.platform === platform.name);
          const IconComponent = platform.icon;
          const isAnalyzing = analyzing && currentAnalyzing === platform.name;
          
          return (
            <Card key={platform.id} className={`border-2 ${result?.success ? 'border-green-500' : result ? 'border-red-500' : 'border-border'}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${platform.color} text-white`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{platform.name}</h3>
                    {!result && !isAnalyzing && (
                      <p className="text-muted-foreground">Esperando análisis...</p>
                    )}
                    {isAnalyzing && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Analizando posts y generando insights...</span>
                      </div>
                    )}
                    {result && (
                      <div className="space-y-2">
                        {result.success ? (
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="font-medium">{result.postsFound}</p>
                              <p className="text-muted-foreground">Posts</p>
                            </div>
                            <div>
                              <p className="font-medium">{result.insightsGenerated}</p>
                              <p className="text-muted-foreground">Insights</p>
                            </div>
                            <div>
                              <p className="font-medium">{result.actionablesGenerated}</p>
                              <p className="text-muted-foreground">Accionables</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-red-500">Error: {result.error}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {result?.success && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                    {result && !result.success && <X className="h-6 w-6 text-red-500" />}
                    {isAnalyzing && <Loader2 className="h-6 w-6 animate-spin text-blue-500" />}
                    {!result && !isAnalyzing && <Circle className="h-6 w-6 text-muted-foreground" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {!analyzing && analysisResults.length === 0 && (
        <div className="text-center">
          <Button onClick={runAnalysis} size="lg" className="gap-2">
            <Sparkles className="h-5 w-5" />
            Iniciar Análisis
          </Button>
        </div>
      )}
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">¡Insights Generados!</h2>
        <p className="text-muted-foreground">
          Hemos analizado tus redes sociales y generado recomendaciones para hacer crecer tu negocio
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Insights Principales ({consolidatedInsights.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {consolidatedInsights.slice(0, 3).map((insight, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">{insight.title}</h4>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {insight.platforms?.join(', ') || 'General'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(insight.confidence_score * 100)}% confianza
                  </span>
                </div>
              </div>
            ))}
            {consolidatedInsights.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay insights disponibles aún
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Acciones Recomendadas ({consolidatedActionables.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {consolidatedActionables.slice(0, 3).map((actionable, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium">{actionable.title}</h4>
                <p className="text-sm text-muted-foreground">{actionable.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={actionable.priority === 'urgent' ? 'destructive' : 'default'} className="text-xs">
                    {actionable.priority}
                  </Badge>
                  {actionable.estimated_impact && (
                    <span className="text-xs text-green-600">
                      💡 {actionable.estimated_impact}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {consolidatedActionables.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay acciones recomendadas aún
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 text-white rounded-full">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Resumen del Análisis</h3>
              <p className="text-muted-foreground">
                Análisis completado para {analysisResults.filter(r => r.success).length} plataformas. 
                Total: {analysisResults.reduce((acc, r) => acc + r.postsFound, 0)} posts analizados, 
                {consolidatedInsights.length} insights y {consolidatedActionables.length} acciones generadas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderComplete = () => (
    <div className="space-y-6 text-center">
      <div className="mb-8">
        <div className="mx-auto w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-bold mb-2">¡Marketing Hub Configurado!</h2>
        <p className="text-muted-foreground text-lg">
          Tu centro de marketing está listo para ayudarte a hacer crecer tu negocio
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-3 text-blue-500" />
            <h3 className="font-semibold mb-2">Analytics Avanzados</h3>
            <p className="text-sm text-muted-foreground">
              Métricas detalladas y análisis de rendimiento
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Lightbulb className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
            <h3 className="font-semibold mb-2">IA Inteligente</h3>
            <p className="text-sm text-muted-foreground">
              Insights automatizados y recomendaciones personalizadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-3 text-green-500" />
            <h3 className="font-semibold mb-2">Acciones Claras</h3>
            <p className="text-sm text-muted-foreground">
              Tareas específicas para hacer crecer tu negocio
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="pt-6">
        <Button onClick={completeOnboarding} size="lg" className="gap-2">
          <Sparkles className="h-5 w-5" />
          Acceder al Marketing Hub
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Configuración del Marketing Hub</h1>
            <Badge variant="outline" className="text-sm">
              Paso {currentStep + 1} de {steps.length}
            </Badge>
          </div>
          
          <Progress value={((currentStep + 1) / steps.length) * 100} className="w-full" />
          
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div key={index} className={`text-center flex-1 ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                  index < currentStep ? 'bg-green-500 text-white' :
                  index === currentStep ? 'bg-primary text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index < currentStep ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                </div>
                <p className="text-xs font-medium">{step.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {currentStep === 0 && renderSocialConfig()}
            {currentStep === 1 && renderAnalysis()}
            {currentStep === 2 && renderInsights()}
            {currentStep === 3 && renderComplete()}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep < 3 && (
          <div className="flex justify-between">
            <Button
              onClick={prevStep}
              disabled={currentStep === 0}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="gap-2"
            >
              {currentStep === steps.length - 2 ? 'Finalizar' : 'Siguiente'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}