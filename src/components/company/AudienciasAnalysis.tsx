import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Target, 
  CheckCircle,
  Loader2,
  RefreshCw,
  Eye,
  WifiOff,
  Wifi,
  ArrowRight,
  Sparkles,
  Globe,
  Users2,
  TrendingUp,
  Mail,
  MessageSquare,
  Building,
  Heart,
  Share2,
  ThumbsUp,
  Calendar,
  Shield,
  BarChart3
} from "lucide-react";
import { FaInstagram, FaFacebook, FaXTwitter, FaTiktok, FaYoutube } from 'react-icons/fa6';
import { SocialConnectionManager } from "./SocialConnectionManager";
import { AudienceInsightsPanel } from "./AudienceInsightsPanel";

interface AudienciasAnalysisProps {
  profile: any;
}

const AudienciasAnalysis = ({ profile }: AudienciasAnalysisProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(profile?.user_id || null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [socialStats, setSocialStats] = useState<any[]>([]);
  const [socialStatsLoading, setSocialStatsLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingUrls, setAnalyzingUrls] = useState(false);
  const [hasSocialConnections, setHasSocialConnections] = useState(false);
  const [socialUrls, setSocialUrls] = useState<any>({});
  const [confirmedUrls, setConfirmedUrls] = useState<string[]>([]);
  const [showUrlConfirmation, setShowUrlConfirmation] = useState(false);
  const [existingAnalysisCount, setExistingAnalysisCount] = useState(0);
  const [lastAnalysisDate, setLastAnalysisDate] = useState<string | null>(null);
  const [showConnectionsView, setShowConnectionsView] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  // Helper para normalizar respuestas del edge a formato snake_case de la DB
  const mapEdgeResultToDbRow = (edgeResult: any) => {
    return {
      id: edgeResult.id,
      user_id: edgeResult.user_id || edgeResult.userId,
      platform: edgeResult.platform,
      social_type: edgeResult.socialType || edgeResult.social_type,
      screen_name: edgeResult.screenName || edgeResult.screen_name,
      name: edgeResult.name,
      users_count: edgeResult.usersCount || edgeResult.users_count,
      quality_score: edgeResult.qualityScore || edgeResult.quality_score,
      avg_er: edgeResult.avgER || edgeResult.avg_er,
      avg_views: edgeResult.avgViews || edgeResult.avg_views,
      countries: edgeResult.countries,
      genders: edgeResult.genders,
      ages: edgeResult.ages,
      interests: edgeResult.interests,
      last_posts: edgeResult.lastPosts || edgeResult.last_posts,
      categories: edgeResult.categories,
      tags: edgeResult.tags,
      brand_safety: edgeResult.brandSafety || edgeResult.brand_safety,
      members_types: edgeResult.membersTypes || edgeResult.members_types,
      members_reachability: edgeResult.membersReachability || edgeResult.members_reachability,
      raw_data: edgeResult.raw_data,
      image: edgeResult.image,
      description: edgeResult.description,
      verified: edgeResult.verified,
      created_at: edgeResult.created_at
    };
  };

  // Helper para traducir tipos de alcanzabilidad a texto legible
  const getReachabilityLabel = (key: string): string => {
    const labels: Record<string, string> = {
      'r0_500': '0-500 seguidores',
      'r500_1000': '500-1K seguidores',
      'r1000_1500': '1K-1.5K seguidores',
      'r1500_plus': '1.5K+ seguidores'
    };
    return labels[key] || key;
  };

  // Helper para traducir tipos de seguidores a texto legible
  const getFollowerTypeLabel = (key: string): string => {
    const labels: Record<string, string> = {
      'real': 'Seguidores Reales',
      'influencer': 'Influencers',
      'massfollowers': 'Seguidores Masivos',
      'suspicious': 'Seguidores Sospechosos'
    };
    return labels[key] || key;
  };

  // Helper para descripciones adicionales de tipos de seguidores
  const getFollowerTypeDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      'real': 'Cuentas genuinas con actividad orgánica',
      'influencer': 'Cuentas con alta influencia y engagement',
      'massfollowers': 'Cuentas que siguen a muchos usuarios',
      'suspicious': 'Cuentas con patrones inusuales'
    };
    return descriptions[key] || '';
  };

  // Helper para descripción de alcanzabilidad
  const getReachabilityDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      'r0_500': 'Micro-audiencias personales',
      'r500_1000': 'Audiencias pequeñas',
      'r1000_1500': 'Audiencias emergentes',
      'r1500_plus': 'Audiencias establecidas'
    };
    return descriptions[key] || '';
  };

  useEffect(() => {
    const init = async () => {
      try {
        let uid = profile?.user_id || userId;
        if (!uid) {
          const { data: { session } } = await supabase.auth.getSession();
          uid = session?.user?.id || null;
          if (uid) setUserId(uid);
        }
        
        if (uid) {
          await Promise.all([
            loadCompanyData(uid),
            loadSocialAudienceStats(uid),
          ]);
        }
      } catch (e) {
        console.error('Error inicializando:', e);
      }
    };
    init();
  }, [profile?.user_id, userId]);

  useEffect(() => {
    if (!companyData) return;
    const urls = extractSocialUrls(companyData);
    setSocialUrls(urls);
  }, [companyData]);

  const loadCompanyData = async (uid?: string) => {
    const resolvedUid = uid || profile?.user_id || userId;
    if (!resolvedUid) return;

    try {
      const { data: memberData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', resolvedUid)
        .single();

      if (memberData) {
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('id', memberData.company_id)
          .single();
        
        setCompanyData(company);
        setCompanyId(company?.id || null);
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  };

  const extractSocialUrls = (company: any) => {
    const urls: any = {};
    const supported = ['instagram', 'youtube', 'twitter', 'tiktok', 'facebook'];
    if (company?.instagram_url && supported.includes('instagram')) urls.instagram = company.instagram_url;
    if (company?.facebook_url && supported.includes('facebook')) urls.facebook = company.facebook_url;
    if (company?.twitter_url && supported.includes('twitter')) urls.twitter = company.twitter_url;
    if (company?.tiktok_url && supported.includes('tiktok')) urls.tiktok = company.tiktok_url;
    if (company?.youtube_url && supported.includes('youtube')) urls.youtube = company.youtube_url;
    return urls;
  };

  const validateUrls = (urls: Record<string, string>): boolean => {
    const urlPatterns = {
      instagram: /instagram\.com\/[^\/\?]+/,
      facebook: /facebook\.com\/[^\/\?]+/,
      twitter: /(?:twitter|x)\.com\/[^\/\?]+/,
      tiktok: /tiktok\.com\/@[^\/\?]+/,
      youtube: /youtube\.com\/(?:@|channel\/|user\/)[^\/\?]+/
    };

    for (const [platform, url] of Object.entries(urls)) {
      if (!urlPatterns[platform as keyof typeof urlPatterns]?.test(url)) {
        return false;
      }
    }
    return true;
  };

  const analyzeWithConfirmedUrls = async () => {
    if (confirmedUrls.length === 0 || !userId) return;
    
    setAnalyzingUrls(true);
    try {
      const selectedUrls = confirmedUrls.reduce((acc, platform) => {
        if (socialUrls[platform]) {
          acc[platform] = socialUrls[platform];
        }
        return acc;
      }, {} as any);

      console.log('📤 Sending analysis request with URLs:', selectedUrls);

      if (!validateUrls(selectedUrls)) {
        toast({
          title: "URLs inválidas",
          description: "Una o más URLs no tienen el formato correcto. Verifica e intenta de nuevo.",
          variant: "destructive"
        });
        return;
      }

      const urlsPayload = Object.entries(selectedUrls).map(([platform, url]) => ({ platform, url }));
      const { data, error } = await supabase.functions.invoke('analyze-social-audience', {
        body: {
          urls: urlsPayload
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      console.log('📥 Received response:', data);

      // Validar que realmente haya datos
      if (data.success && data.data && data.data.length > 0) {
        // Normalizar resultados y mostrar inmediatamente
        const normalizedData = data.data.map(mapEdgeResultToDbRow);
        setSocialStats(normalizedData);
        setHasSocialConnections(true);
        setShowUrlConfirmation(false);
        setShowInsights(true);
        setExistingAnalysisCount(normalizedData.length);
        setLastAnalysisDate(new Date().toISOString());
        
        toast({
          title: "Análisis Completado",
          description: `Se analizaron ${normalizedData.length} redes sociales exitosamente. Generando insights...`,
        });
        
        // Refrescar en segundo plano desde la BD
        loadSocialAudienceStats(userId);
        
        // Auto-generar insights si no existen
        await autoGenerateInsightsIfNeeded(userId);
      } else if (data.success && (!data.data || data.data.length === 0)) {
        // Análisis "exitoso" pero sin datos
        toast({
          title: "Sin resultados",
          description: data.message || "No se encontraron datos de audiencia. Verifica las URLs.",
          variant: "destructive"
        });
        // NO volver a loadSocialAudienceStats porque sabemos que no hay datos
      } else {
        throw new Error(data.error || 'Error al analizar audiencias');
      }
    } catch (error: any) {
      console.error('❌ Error analizando con URLs confirmadas:', error);
      toast({
        title: "Error en el Análisis",
        description: error.message || "No se pudieron analizar las audiencias. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setAnalyzingUrls(false);
    }
  };

  const analyzeAllNetworksWithUrls = async () => {
    if (!userId || !companyData) return;
    
    const urls = extractSocialUrls(companyData);
    if (Object.keys(urls).length === 0) {
      toast({
        title: "No hay URLs configuradas",
        description: "Por favor, agrega URLs de redes sociales en el ADN de tu empresa.",
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);
    try {
      const urlsPayload = Object.entries(urls).map(([platform, url]) => ({ platform, url }));
      const { data, error } = await supabase.functions.invoke('analyze-social-audience', {
        body: {
          urls: urlsPayload
        }
      });

      if (error) throw error;

      if (data.success) {
        if (data.data && data.data.length > 0) {
          const normalizedData = data.data.map(mapEdgeResultToDbRow);
          setSocialStats(normalizedData);
          setHasSocialConnections(true);
          setShowInsights(true);
          setExistingAnalysisCount(normalizedData.length);
          setLastAnalysisDate(new Date().toISOString());
          
          toast({
            title: "Análisis Completado",
            description: `Se analizaron todas las redes sociales exitosamente. Generando insights...`,
          });
          
          // Refrescar en segundo plano desde la BD
          loadSocialAudienceStats(userId);
          
          // Auto-generar insights si no existen
          await autoGenerateInsightsIfNeeded(userId);
        }
      } else {
        throw new Error(data.error || 'Error al analizar audiencias');
      }
    } catch (error) {
      console.error('Error analizando todas las redes:', error);
      toast({
        title: "Error en el Análisis",
        description: "No se pudieron analizar las audiencias. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Función para auto-generar insights si no existen
  const autoGenerateInsightsIfNeeded = async (uid: string) => {
    try {
      // Verificar si ya existen insights
      const { data: existingInsights, error: insightsError } = await supabase
        .from('audience_insights')
        .select('id')
        .eq('user_id', uid)
        .limit(1);

      if (insightsError) {
        console.error('Error checking existing insights:', insightsError);
        return;
      }

      // Si no hay insights previos, generar automáticamente
      if (!existingInsights || existingInsights.length === 0) {
        console.log('No se encontraron insights previos, generando automáticamente...');
        
        const { data: invokeData, error: invokeError } = await supabase.functions.invoke(
          'audience-intelligence-analysis',
          {
            body: {
              userId: uid,
              companyId: companyId,
              socialStats: socialStats
            }
          }
        );

        if (invokeError) {
          console.error('Error auto-generating insights:', invokeError);
          toast({
            title: "Aviso",
            description: "No se pudieron generar insights automáticamente. Puedes generarlos manualmente.",
            variant: "destructive"
          });
        } else if (invokeData?.success) {
          toast({
            title: "🎯 Insights generados",
            description: "Los insights de IA están listos para visualizar.",
          });
        }
      }
    } catch (error) {
      console.error('Error in autoGenerateInsightsIfNeeded:', error);
    }
  };

  const loadSocialAudienceStats = async (uid?: string) => {
    const resolvedUid = uid || profile?.user_id || userId;
    if (!resolvedUid) return;
    
    setSocialStatsLoading(true);
    
    try {
      const { data: existingAnalyses, error } = await supabase
        .from('social_analysis')
        .select('*')
        .eq('user_id', resolvedUid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (existingAnalyses && existingAnalyses.length > 0) {
        setExistingAnalysisCount(existingAnalyses.length);
        setLastAnalysisDate(existingAnalyses[0].created_at);
        setSocialStats(existingAnalyses);
        setHasSocialConnections(true);
        setShowInsights(true); // Activar insights cuando hay datos previos
        setShowUrlConfirmation(false);
      } else {
        // Evitar sobreescribir el estado si ya tenemos resultados en memoria
        if (socialStats.length > 0) {
          return;
        }
        setSocialStats([]);
        setHasSocialConnections(false);
        setExistingAnalysisCount(0);
        setLastAnalysisDate(null);
        
        if (companyData) {
          const urls = extractSocialUrls(companyData);
          setSocialUrls(urls);
          
          if (Object.keys(urls).length > 0) {
            setShowUrlConfirmation(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading social audience stats:', error);
      if (socialStats.length === 0) {
        setSocialStats([]);
        setHasSocialConnections(false);
      }
    } finally {
      setSocialStatsLoading(false);
    }
  };

  if (showConnectionsView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowConnectionsView(false)}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Volver
          </Button>
          <h2 className="text-2xl font-bold">Conectar Redes Sociales</h2>
        </div>
        <SocialConnectionManager profile={profile} />
      </div>
    );
  }

  if (socialStatsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center animate-fade-in">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">🚀 Analizando tu Audiencia</h3>
          <p className="text-muted-foreground">Extrayendo insights valiosos de tus redes sociales...</p>
        </div>
      </div>
    );
  }

  if (showUrlConfirmation) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center">
          <Target className="h-16 w-16 mx-auto text-primary mb-4" />
          <h3 className="text-2xl font-bold mb-2">🎯 Confirma tus Redes Sociales</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Hemos encontrado estas URLs en tu perfil de empresa. Confirma cuáles quieres analizar.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {Object.entries(socialUrls).map(([platform, url]: [string, any]) => (
            <div key={platform} className="flex items-center space-x-4 p-4 border rounded-lg bg-card">
              <div className="flex items-center space-x-3 flex-1">
                {platform === 'instagram' && <FaInstagram className="w-5 h-5 text-pink-500" />}
                {platform === 'facebook' && <FaFacebook className="w-5 h-5 text-blue-600" />}
                {platform === 'twitter' && <FaXTwitter className="w-5 h-5 text-black" />}
                {platform === 'tiktok' && <FaTiktok className="w-5 h-5 text-black" />}
                {platform === 'youtube' && <FaYoutube className="w-5 h-5 text-red-500" />}
                
                <div className="flex-1">
                  <p className="font-medium capitalize">{platform}</p>
                  <p className="text-sm text-muted-foreground truncate">{url}</p>
                </div>
              </div>
              
              <input
                type="checkbox"
                checked={confirmedUrls.includes(platform)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setConfirmedUrls([...confirmedUrls, platform]);
                  } else {
                    setConfirmedUrls(confirmedUrls.filter(p => p !== platform));
                  }
                }}
                className="w-5 h-5"
              />
            </div>
          ))}
        </div>

        <div className="text-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setShowUrlConfirmation(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={analyzeWithConfirmedUrls}
            disabled={confirmedUrls.length === 0 || analyzingUrls}
            className="gap-2"
          >
            {analyzingUrls ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analizar {confirmedUrls.length} Red{confirmedUrls.length > 1 ? 'es' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (!hasSocialConnections) {
    return (
      <div className="text-center py-16">
        <WifiOff className="h-20 w-20 mx-auto text-muted-foreground/60 mb-6" />
        <h3 className="text-2xl font-bold mb-3">🔗 Conecta tu Ecosistema Digital</h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Desbloquea insights profundos de audiencia conectando tus redes sociales.
        </p>
        <div className="space-y-4">
          {companyData && Object.keys(extractSocialUrls(companyData)).length > 0 ? (
            <Button 
              onClick={analyzeAllNetworksWithUrls}
              size="lg"
              disabled={analyzing}
              className="gap-3 px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Target className="h-5 w-5" />
                  Analizar Todas las Redes (Un Solo Clic)
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : null}
          
          <Button 
            onClick={() => setShowConnectionsView(true)} 
            size="lg"
            variant="outline"
            className="gap-3 px-8 py-6 text-lg font-semibold"
          >
            <Wifi className="h-5 w-5" />
            Conectar Nuevas Redes Sociales
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const mainProfile = socialStats[0] || {};
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner de Estado Existente */}
      {existingAnalysisCount > 0 && lastAnalysisDate && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                    ✓ Análisis de Audiencia Existente
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {existingAnalysisCount} {existingAnalysisCount === 1 ? 'red social analizada' : 'redes sociales analizadas'} • 
                    Última actualización: {new Date(lastAnalysisDate).toLocaleDateString('es', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <Button 
                onClick={analyzeAllNetworksWithUrls}
                disabled={analyzing}
                variant="outline"
                className="gap-2 border-green-300 hover:bg-green-100 dark:hover:bg-green-900/40"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Actualizar Análisis
                  </>
                )}
              </Button>
            </div>
            <div className="mt-4 flex gap-2 text-xs text-green-700 dark:text-green-300">
              <Eye className="w-4 h-4" />
              <span>Los datos se muestran a continuación. Puedes actualizarlos para obtener información más reciente.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de Análisis */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold">🎯 Análisis de Audiencias</h2>
        <div className="flex gap-3">
          <Button 
            onClick={analyzeAllNetworksWithUrls}
            disabled={analyzing}
            size="lg"
            className="gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold px-6 py-3"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analizando Todas las Redes...
              </>
            ) : (
              <>
                <Target className="h-5 w-5" />
                {existingAnalysisCount > 0 ? 'Actualizar Análisis' : 'Analizar Todas las Redes'}
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => loadSocialAudienceStats()}
            disabled={socialStatsLoading}
            variant="outline"
            className="gap-2"
          >
            {socialStatsLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Actualizar Vista
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Header del Perfil Principal */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 rounded-2xl p-6">
        <div className="flex items-center gap-6">
          <div className="flex gap-3">
            {socialStats.map((profile, index) => (
              <div key={index} className="flex items-center gap-2">
                {profile.social_type === 'INST' && <FaInstagram className="w-5 h-5 text-pink-500" />}
                {profile.social_type === 'FB' && <FaFacebook className="w-5 h-5 text-blue-600" />}
                {profile.social_type === 'TW' && <FaXTwitter className="w-5 h-5 text-black" />}
                {profile.social_type === 'TT' && <FaTiktok className="w-5 h-5 text-black" />}
                {profile.social_type === 'YT' && <FaYoutube className="w-5 h-5 text-red-500" />}
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-4 flex-1">
            {mainProfile.image && (
              <img 
                src={mainProfile.image} 
                alt={mainProfile.name}
                className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {mainProfile.name || 'Mi Perfil'}
                {mainProfile.verified && <CheckCircle className="w-5 h-5 text-blue-500" />}
              </h1>
              <p className="text-lg text-muted-foreground">@{mainProfile.screen_name || 'usuario'}</p>
              <p className="text-sm text-muted-foreground mt-1">{mainProfile.description}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-3xl font-bold">{((socialStats.reduce((acc, s) => acc + (s.users_count || 0), 0)) / 1000).toFixed(1)}K</p>
            <p className="text-sm text-muted-foreground">Total Seguidores</p>
          </div>
        </div>
      </div>

      {/* Vista Unificada: Radiografía de la Audiencia */}
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-3">🔬 Radiografía de la Audiencia</h2>
          <p className="text-xl text-muted-foreground">¿Quiénes son realmente tus seguidores?</p>
        </div>
        
        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Calidad de Audiencia</p>
                  <p className="text-2xl font-bold text-green-600">{Math.round((mainProfile.quality_score || 0) * 100)}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Engagement Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{((mainProfile.avg_er || 0) * 100).toFixed(2)}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Seguidores</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {((socialStats.reduce((acc, s) => acc + (s.users_count || 0), 0)) / 1000).toFixed(1)}K
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Users2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vistas Promedio</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {((mainProfile.avg_views || 0) / 1000).toFixed(1)}K
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demografía Simplificada */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Demografía de la Audiencia
            </h3>
            
            <div className="space-y-6">
              {/* Países */}
              {mainProfile.countries && mainProfile.countries.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    Principales Países
                  </h4>
                  <div className="space-y-2">
                    {mainProfile.countries.slice(0, 5).map((country: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{country.name}</span>
                        <div className="flex items-center gap-3 flex-1 ml-4">
                          <Progress value={country.percentage || 0} className="h-2" />
                          <span className="text-sm font-medium min-w-[45px]">{country.percentage?.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Géneros */}
              {mainProfile.genders && mainProfile.genders.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Distribución por Género</h4>
                  <div className="space-y-2">
                    {mainProfile.genders.map((gender: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{gender.code === 'MALE' ? 'Masculino' : 'Femenino'}</span>
                        <div className="flex items-center gap-3 flex-1 ml-4">
                          <Progress value={gender.percentage || 0} className="h-2" />
                          <span className="text-sm font-medium min-w-[45px]">{gender.percentage?.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Intereses */}
              {mainProfile.interests && mainProfile.interests.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Principales Intereses</h4>
                  <div className="flex flex-wrap gap-2">
                    {mainProfile.interests.slice(0, 10).map((interest: any, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {interest.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Últimos Posts */}
        {mainProfile.last_posts && mainProfile.last_posts.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 w-5 text-primary" />
                Últimos Posts
              </h3>
              <div className="space-y-4">
                {mainProfile.last_posts.slice(0, 3).map((post: any, idx: number) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-lg bg-accent/10 border">
                    {post.image && (
                      <img src={post.image} alt="Post" className="w-24 h-24 rounded object-cover" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.text}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {post.views !== undefined && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {post.views.toLocaleString()}
                          </span>
                        )}
                        {post.likes !== undefined && (
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" /> {post.likes}
                          </span>
                        )}
                        {post.comments !== undefined && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {post.comments}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categorías y Tags */}
        {((mainProfile.categories && mainProfile.categories.length > 0) || 
          (mainProfile.tags && mainProfile.tags.length > 0)) && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Categorías y Tags</h3>
              <div className="space-y-3">
                {mainProfile.categories && mainProfile.categories.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Categorías:</p>
                    <div className="flex flex-wrap gap-2">
                      {mainProfile.categories.map((cat: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{cat}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {mainProfile.tags && mainProfile.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {mainProfile.tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Brand Safety */}
        {mainProfile.brand_safety && Object.values(mainProfile.brand_safety).some((v: any) => v > 0) && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Seguridad de Marca
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(mainProfile.brand_safety)
                  .filter(([_, value]) => (value as number) > 0)
                  .map(([key, value], idx) => (
                    <Badge key={idx} variant="destructive">
                      {key}: {String(value)}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calidad y Alcanzabilidad de Audiencia */}
        {((mainProfile.members_types && mainProfile.members_types.length > 0) ||
          (mainProfile.members_reachability && mainProfile.members_reachability.length > 0)) && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Composición de Audiencia
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {mainProfile.members_types && mainProfile.members_types.length > 0 && (
                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-foreground mb-1">Calidad de Seguidores</p>
                      <p className="text-xs text-muted-foreground">
                        Composición y autenticidad de tu audiencia
                      </p>
                    </div>
                    <div className="space-y-4">
                      {mainProfile.members_types.map((type: any, idx: number) => {
                        const isPositive = type.name === 'real' || type.name === 'influencer';
                        const isNegative = type.name === 'suspicious';
                        const colorClass = isPositive ? 'text-green-600 dark:text-green-400' : 
                                         isNegative ? 'text-red-600 dark:text-red-400' : 
                                         'text-yellow-600 dark:text-yellow-400';
                        
                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">
                                    {getFollowerTypeLabel(type.name)}
                                  </span>
                                  <span className={`text-sm font-bold ${colorClass}`}>
                                    {(type.percent * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {getFollowerTypeDescription(type.name)}
                                </p>
                              </div>
                            </div>
                            <Progress value={type.percent * 100} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {mainProfile.members_reachability && mainProfile.members_reachability.length > 0 && (
                  <div>
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-foreground mb-1">Alcanzabilidad de Seguidores</p>
                      <p className="text-xs text-muted-foreground">
                        Distribución según el tamaño de audiencia de tus seguidores
                      </p>
                    </div>
                    <div className="space-y-4">
                      {mainProfile.members_reachability.map((reach: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {getReachabilityLabel(reach.name)}
                                </span>
                                <span className="text-sm font-bold text-primary">
                                  {(reach.percent * 100).toFixed(1)}%
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {getReachabilityDescription(reach.name)}
                              </p>
                            </div>
                          </div>
                          <Progress value={reach.percent * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edades */}
        {mainProfile.ages && mainProfile.ages.filter((a: any) => a.percent > 0).length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Distribución por Edad</h3>
              <div className="space-y-3">
                {mainProfile.ages
                  .filter((age: any) => age.percent > 0)
                  .sort((a: any, b: any) => b.percent - a.percent)
                  .map((age: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{age.name}</span>
                        <span className="text-sm font-medium">
                          {(age.percent * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={age.percent * 100} className="h-2" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sección de Insights con IA */}
        {showInsights && userId && companyId && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">🧠 Análisis Profundo de Audiencia</h3>
                      <p className="text-sm text-muted-foreground">
                        Genera insights avanzados y segmentos detallados con IA
                      </p>
                    </div>
                  </div>
                </div>
                
                <AudienceInsightsPanel
                  userId={userId}
                  companyId={companyId}
                  socialStats={socialStats}
                  autoGenerate={true}
                  onInsightsGenerated={() => {
                    toast({
                      title: "✨ Insights Generados",
                      description: "Análisis de audiencia completado exitosamente",
                    });
                  }}
                />
              </CardContent>
            </Card>

            {/* CTA para Crear Audiencias */}
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <Target className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">🎯 Crea Audiencias Accionables</h4>
                      <p className="text-sm text-muted-foreground">
                        Usa los insights para crear segmentos optimizados para tus campañas
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/company-dashboard?view=audiencias-create')}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Sparkles className="w-4 h-4" />
                    Crear Audiencias con IA
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudienciasAnalysis;
