import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Linkedin, 
  Music, 
  Instagram, 
  Facebook,
  Twitter,
  Youtube,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  BarChart3,
  Settings,
  RefreshCw,
  Link,
  Globe,
  Users,
  TrendingUp,
  UserPlus
} from "lucide-react";

interface SocialMediaHubProps {
  profile: any;
}

interface SocialNetwork {
  id: string;
  name: string;
  icon: any;
  color: string;
  url: string | null;
  isValid: boolean;
  isActive: boolean;
  hasDetails: boolean;
  hasPosts: boolean;
}

interface LinkedInCompanyDetails {
  name?: string;
  description?: string;
  followers?: number;
  employees?: string;
  industry?: string;
  website?: string;
  logo?: string;
}

interface LinkedInPost {
  id?: string;
  text?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  date?: string;
  media?: any[];
}

const SocialMediaHub = ({ profile }: SocialMediaHubProps) => {
  const { toast } = useToast();
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [socialNetworks, setSocialNetworks] = useState<SocialNetwork[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<SocialNetwork | null>(null);
  const [urlInputs, setUrlInputs] = useState<{[key: string]: string}>({});
  const [linkedinDetails, setLinkedinDetails] = useState<LinkedInCompanyDetails | null>(null);
  const [linkedinPosts, setLinkedinPosts] = useState<LinkedInPost[]>([]);
  const [loadingLinkedIn, setLoadingLinkedIn] = useState(false);
  const [instagramDetails, setInstagramDetails] = useState<any>(null);
  const [instagramPosts, setInstagramPosts] = useState<any>(null);
  const [loadingInstagram, setLoadingInstagram] = useState(false);
  const [tikTokDetails, setTikTokDetails] = useState<any>(null);
  const [tikTokPosts, setTikTokPosts] = useState<any>(null);
  const [loadingTikTok, setLoadingTikTok] = useState(false);

  // Initialize social networks
  const initializeSocialNetworks = (companyData: any): SocialNetwork[] => {
    return [
      {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: Linkedin,
        color: 'bg-blue-700',
        url: companyData?.linkedin_url || null,
        isValid: validateLinkedInUrl(companyData?.linkedin_url),
        isActive: !!companyData?.linkedin_url && validateLinkedInUrl(companyData?.linkedin_url),
        hasDetails: true,
        hasPosts: true
      },
      {
        id: 'tiktok',
        name: 'TikTok',
        icon: Music,
        color: 'bg-black',
        url: companyData?.tiktok_url || null,
        isValid: validateTikTokUrl(companyData?.tiktok_url),
        isActive: !!companyData?.tiktok_url && validateTikTokUrl(companyData?.tiktok_url),
        hasDetails: true,
        hasPosts: true
      },
      {
        id: 'instagram',
        name: 'Instagram',
        icon: Instagram,
        color: 'bg-gradient-to-r from-purple-500 to-pink-500',
        url: companyData?.instagram_url || null,
        isValid: validateInstagramUrl(companyData?.instagram_url),
        isActive: !!companyData?.instagram_url && validateInstagramUrl(companyData?.instagram_url),
        hasDetails: true,
        hasPosts: true
      },
      {
        id: 'facebook',
        name: 'Facebook',
        icon: Facebook,
        color: 'bg-blue-600',
        url: companyData?.facebook_url || null,
        isValid: validateFacebookUrl(companyData?.facebook_url),
        isActive: !!companyData?.facebook_url && validateFacebookUrl(companyData?.facebook_url),
        hasDetails: false,
        hasPosts: false
      },
      {
        id: 'twitter',
        name: 'Twitter/X',
        icon: Twitter,
        color: 'bg-black',
        url: companyData?.twitter_url || null,
        isValid: validateTwitterUrl(companyData?.twitter_url),
        isActive: !!companyData?.twitter_url && validateTwitterUrl(companyData?.twitter_url),
        hasDetails: false,
        hasPosts: false
      },
      {
        id: 'youtube',
        name: 'YouTube',
        icon: Youtube,
        color: 'bg-red-600',
        url: companyData?.youtube_url || null,
        isValid: validateYouTubeUrl(companyData?.youtube_url),
        isActive: !!companyData?.youtube_url && validateYouTubeUrl(companyData?.youtube_url),
        hasDetails: false,
        hasPosts: false
      }
    ];
  };

  // URL validation functions
  const validateLinkedInUrl = (url: string | null): boolean => {
    if (!url) return false;
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/company\/[a-zA-Z0-9-_]+\/?$/;
    return linkedinRegex.test(url);
  };

  const validateTikTokUrl = (url: string | null): boolean => {
    if (!url) return false;
    const tiktokRegex = /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+\/?$/;
    return tiktokRegex.test(url);
  };

  const validateInstagramUrl = (url: string | null): boolean => {
    if (!url) return false;
    const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._-]+\/?$/;
    return instagramRegex.test(url);
  };

  const validateFacebookUrl = (url: string | null): boolean => {
    if (!url) return false;
    const facebookRegex = /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9.-]+\/?$/;
    return facebookRegex.test(url);
  };

  const validateTwitterUrl = (url: string | null): boolean => {
    if (!url) return false;
    const twitterRegex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/;
    return twitterRegex.test(url);
  };

  const validateYouTubeUrl = (url: string | null): boolean => {
    if (!url) return false;
    const youtubeRegex = /^https?:\/\/(www\.)?youtube\.com\/(c\/|channel\/|user\/|@)[a-zA-Z0-9_-]+\/?$/;
    return youtubeRegex.test(url);
  };

  // Extract company identifier from LinkedIn URL
  const extractLinkedInIdentifier = (url: string): string => {
    const match = url.match(/linkedin\.com\/company\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  };

  // Extract company identifier from TikTok URL
  const extractTikTokIdentifier = (url: string): string => {
    const match = url.match(/tiktok\.com\/@([a-zA-Z0-9._-]+)/);
    return match ? match[1] : '';
  };

  // Load company data
  useEffect(() => {
    if (profile?.user_id) {
      fetchCompanyData();
    }
  }, [profile?.user_id]);

  // Update social networks when company data changes
  useEffect(() => {
    if (companyData) {
      const networks = initializeSocialNetworks(companyData);
      setSocialNetworks(networks);
    }
  }, [companyData]);

  const fetchCompanyData = async () => {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .eq('created_by', profile?.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (companies && companies.length > 0) {
        setCompanyData(companies[0]);
      }
    } catch (error: any) {
      console.error('Error fetching company data:', error);
    }
  };

  const updateSocialUrl = async (networkId: string, url: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('companies')
        .update({ [`${networkId}_url`]: url })
        .eq('id', companyData.id);

      if (error) throw error;

      // Update local state
      setCompanyData((prev: any) => ({
        ...prev,
        [`${networkId}_url`]: url
      }));

      toast({
        title: "URL actualizada",
        description: `La URL de ${networkId} se ha actualizado correctamente`,
      });

      // Clear input
      setUrlInputs(prev => ({ ...prev, [networkId]: '' }));
      
    } catch (error: any) {
      console.error('Error updating social URL:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la URL",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedInCompanyDetails = async (network: SocialNetwork) => {
    if (!network.url || !network.isValid) return;

    setLoadingLinkedIn(true);
    try {
      const identifier = extractLinkedInIdentifier(network.url);
      
      console.log('🔍 Loading LinkedIn company details for:', identifier);
      
      const { data, error } = await supabase.functions.invoke('linkedin-scraper', {
        body: {
          action: 'get_company_details',
          company_identifier: identifier
        }
      });

      if (error) throw error;

      if (data.success) {
        setLinkedinDetails(data.data);
        console.log('✅ LinkedIn company details loaded:', data.data);
        
        toast({
          title: "Detalles cargados",
          description: "Los detalles de LinkedIn se han cargado exitosamente",
        });
      }
    } catch (error: any) {
      console.error('Error loading LinkedIn details:', error);
      toast({
        title: "Error cargando LinkedIn",
        description: error.message || "No se pudieron cargar los detalles de LinkedIn",
        variant: "destructive",
      });
    } finally {
      setLoadingLinkedIn(false);
    }
  };

  const loadLinkedInCompanyPosts = async (network: SocialNetwork) => {
    if (!network.url || !network.isValid) return;

    setLoadingLinkedIn(true);
    try {
      const identifier = extractLinkedInIdentifier(network.url);
      
      console.log('📰 Loading LinkedIn company posts for:', identifier);
      
      const { data, error } = await supabase.functions.invoke('linkedin-scraper', {
        body: {
          action: 'get_company_posts',
          company_identifier: identifier
        }
      });

      if (error) throw error;

      if (data.success) {
        setLinkedinPosts(data.data.posts || []);
        console.log('✅ LinkedIn company posts loaded:', data.data);
        
        toast({
          title: "Posts cargados",
          description: `Se cargaron ${data.data.posts?.length || 0} posts de LinkedIn`,
        });
      }
    } catch (error: any) {
      console.error('Error loading LinkedIn posts:', error);
      toast({
        title: "Error cargando posts",
        description: error.message || "No se pudieron cargar los posts de LinkedIn",
        variant: "destructive",
      });
    } finally {
      setLoadingLinkedIn(false);
    }
  };

  const loadTikTokDetails = async (network: SocialNetwork) => {
    if (!network.url || !network.isValid) return;

    setLoadingTikTok(true);
    try {
      const identifier = extractTikTokIdentifier(network.url);
      
      console.log('🔍 Loading TikTok details for:', identifier);
      
      const { data, error } = await supabase.functions.invoke('tiktok-scraper', {
        body: {
          action: 'get_user_details',
          unique_id: identifier
        }
      });

      if (error) throw error;

      if (data.success) {
        setTikTokDetails(data.data);
        console.log('✅ TikTok details loaded:', data.data);
        
        toast({
          title: "Análisis de TikTok completo",
          description: "Se ha cargado exitosamente la información de TikTok",
        });
      } else {
        toast({
          title: "Error cargando TikTok",
          description: data.message || "No se pudieron cargar los detalles de TikTok",
          variant: "destructive",
        });
      }
      
    } catch (error: any) {
      console.error('Error loading TikTok details:', error);
      toast({
        title: "Error cargando TikTok",
        description: error.message || "No se pudieron cargar los detalles de TikTok",
        variant: "destructive",
      });
    } finally {
      setLoadingTikTok(false);
    }
  };

  const loadTikTokPosts = async (network: SocialNetwork) => {
    if (!network.url || !network.isValid) return;

    setLoadingTikTok(true);
    try {
      const identifier = extractTikTokIdentifier(network.url);
      
      console.log('📱 Loading TikTok posts for:', identifier);
      
      const { data, error } = await supabase.functions.invoke('tiktok-scraper', {
        body: {
          action: 'get_posts',
          unique_id: identifier
        }
      });

      if (error) throw error;

      if (data.success) {
        setTikTokPosts(data.data);
        console.log('✅ TikTok posts loaded:', data.data);
        
        toast({
          title: "Posts de TikTok cargados",
          description: `Se cargaron ${data.data.videos?.length || 0} posts para análisis`,
        });
      } else {
        toast({
          title: "Error cargando posts",
          description: data.message || "No se pudieron cargar los posts de TikTok",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error loading TikTok posts:', error);
      toast({
        title: "Error cargando posts",
        description: error.message || "No se pudieron cargar los posts de TikTok",
        variant: "destructive",
      });
    } finally {
      setLoadingTikTok(false);
    }
  };

  const loadInstagramDetails = async (network: SocialNetwork) => {
    if (!network.url || !network.isValid) return;

    setLoadingInstagram(true);
    try {
      const usernameOrUrl = network.url;
      
      console.log('📸 Loading Instagram details for:', usernameOrUrl);
      
      const { data, error } = await supabase.functions.invoke('instagram-scraper', {
        body: {
          action: 'get_complete_analysis',
          username_or_url: usernameOrUrl
        }
      });

      if (error) throw error;

      if (data.success) {
        setInstagramDetails(data.data);
        console.log('✅ Instagram details loaded:', data.data);
        console.log('🔍 Current selectedNetwork:', selectedNetwork);
        console.log('🔍 Instagram details set:', data.data);
        
        toast({
          title: "Análisis de Instagram completo",
          description: "Se ha cargado exitosamente la información de Instagram",
        });
      } else {
        console.log('❌ Function returned success: false');
        console.log('❌ Data received:', data);
      }
    } catch (error: any) {
      console.error('Error loading Instagram details:', error);
      toast({
        title: "Error cargando Instagram",
        description: error.message || "No se pudieron cargar los detalles de Instagram",
        variant: "destructive",
      });
    } finally {
      setLoadingInstagram(false);
    }
  };

  const loadInstagramPosts = async (network: SocialNetwork) => {
    if (!network.url || !network.isValid) return;

    setLoadingInstagram(true);
    try {
      const usernameOrUrl = network.url;
      
      console.log('📱 Loading Instagram posts for:', usernameOrUrl);
      
      const { data, error } = await supabase.functions.invoke('instagram-scraper', {
        body: {
          action: 'get_posts',
          username_or_url: usernameOrUrl
        }
      });

      if (error) throw error;

      if (data.success) {
        setInstagramPosts(data.data);
        console.log('✅ Instagram posts loaded:', data.data);
        
        toast({
          title: "Posts de Instagram cargados",
          description: `Se cargaron ${data.data.posts?.length || 0} posts para análisis`,
        });
      } else {
        console.log('❌ Function returned success: false');
        console.log('❌ Data received:', data);
      }
    } catch (error: any) {
      console.error('Error loading Instagram posts:', error);
      toast({
        title: "Error cargando posts",
        description: error.message || "No se pudieron cargar los posts de Instagram",
        variant: "destructive",
      });
    } finally {
      setLoadingInstagram(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hub de Redes Sociales</h2>
          <p className="text-muted-foreground">
            Gestiona y analiza la presencia de tu empresa en redes sociales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary">
            <Globe className="h-3 w-3 mr-1" />
            {socialNetworks.filter(n => n.isActive).length} conectadas
          </Badge>
        </div>
      </div>

      {/* Estado general */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Link className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Estado de Conexiones</h3>
                <p className="text-sm text-muted-foreground">
                  {socialNetworks.filter(n => n.isActive).length} de {socialNetworks.length} plataformas activas
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {Math.round((socialNetworks.filter(n => n.isActive).length / socialNetworks.length) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">Configuración completa</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redes sociales grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {socialNetworks.map((network) => {
          const IconComponent = network.icon;
          
          return (
            <Card 
              key={network.id} 
              className={`transition-all duration-200 hover:shadow-lg hover-scale group ${
                network.isActive ? 'border-green-200 bg-green-50/50' : 'border-muted bg-muted/20'
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${network.color} flex items-center justify-center shadow-md`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{network.name}</CardTitle>
                      {network.isActive ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Conectado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground border-muted-foreground">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Desconectado
                        </Badge>
                      )}
                    </div>
                  </div>
                  {network.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(network.url!, '_blank')}
                      className="opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {network.isActive ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-white rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Link className="h-3 w-3" />
                        URL configurada
                      </div>
                      <p className="font-mono text-xs truncate text-green-700">
                        {network.url}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-2">
                      {network.hasDetails && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 h-auto py-3 px-3"
                          onClick={() => {
                            setSelectedNetwork(network);
                            if (network.id === 'linkedin') {
                              loadLinkedInCompanyDetails(network);
                            } else if (network.id === 'tiktok') {
                              loadTikTokDetails(network);
                            } else if (network.id === 'instagram') {
                              loadInstagramDetails(network);
                            }
                          }}
                           disabled={(loadingLinkedIn || loadingInstagram || loadingTikTok) && selectedNetwork?.id === network.id}
                        >
                           {(loadingLinkedIn && selectedNetwork?.id === 'linkedin') || (loadingInstagram && selectedNetwork?.id === 'instagram') || (loadingTikTok && selectedNetwork?.id === 'tiktok') ? (
                             <Loader2 className="w-4 h-4 animate-spin" />
                           ) : (
                             <Eye className="w-4 h-4" />
                           )}
                          <div className="text-left">
                            <div className="text-xs font-medium">Ver Detalles</div>
                            <div className="text-xs text-muted-foreground">Información</div>
                          </div>
                        </Button>
                      )}
                      
                      {network.hasPosts && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 h-auto py-3 px-3"
                            onClick={() => {
                              setSelectedNetwork(network);
                              if (network.id === 'linkedin') {
                                loadLinkedInCompanyPosts(network);
                              } else if (network.id === 'instagram') {
                                loadInstagramPosts(network);
                              } else if (network.id === 'tiktok') {
                                loadTikTokPosts(network);
                              }
                            }}
                            disabled={(loadingLinkedIn || loadingInstagram || loadingTikTok) && selectedNetwork?.id === network.id}
                        >
                          {(loadingLinkedIn && selectedNetwork?.id === 'linkedin') || (loadingInstagram && selectedNetwork?.id === 'instagram') || (loadingTikTok && selectedNetwork?.id === 'tiktok') ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <BarChart3 className="w-4 h-4" />
                          )}
                          <div className="text-left">
                            <div className="text-xs font-medium">Analizar</div>
                            <div className="text-xs text-muted-foreground">Posts</div>
                          </div>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        {network.url && !network.isValid
                          ? "URL inválida. Verifica el formato correcto."
                          : "Configura la URL para activar las funciones de análisis."
                        }
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-3">
                      <Label htmlFor={`${network.id}-url`} className="text-sm font-medium">
                        URL de {network.name}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`${network.id}-url`}
                          placeholder={getUrlPlaceholder(network.id)}
                          value={urlInputs[network.id] || network.url || ''}
                          onChange={(e) => setUrlInputs(prev => ({ ...prev, [network.id]: e.target.value }))}
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => updateSocialUrl(network.id, urlInputs[network.id] || '')}
                          disabled={loading || !urlInputs[network.id]?.trim()}
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Settings className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Details Section */}
      {selectedNetwork && linkedinDetails && selectedNetwork.id === 'linkedin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Linkedin className="w-5 h-5" />
              Detalles de LinkedIn - {linkedinDetails.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Descripción</h4>
                  <p className="text-sm">{linkedinDetails.description || 'No disponible'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Industria</h4>
                  <p className="text-sm">{linkedinDetails.industry || 'No disponible'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Sitio Web</h4>
                  <p className="text-sm">{linkedinDetails.website || 'No disponible'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Seguidores</h4>
                  <p className="text-sm">{linkedinDetails.followers?.toLocaleString() || 'No disponible'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Empleados</h4>
                  <p className="text-sm">{linkedinDetails.employees || 'No disponible'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts de LinkedIn */}
      {selectedNetwork && linkedinPosts.length > 0 && selectedNetwork.id === 'linkedin' && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <BarChart3 className="w-5 h-5" />
              Análisis de Posts de LinkedIn ({linkedinPosts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {linkedinPosts.slice(0, 5).map((post, index) => (
                <div key={index} className="bg-white border border-blue-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                  <p className="text-sm leading-relaxed">{post.text || 'Sin contenido de texto'}</p>
                  <div className="flex items-center gap-6 text-xs text-blue-600">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      <span className="font-medium">{post.likes || 0}</span>
                      <span className="text-muted-foreground">Me gusta</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      <span className="font-medium">{post.comments || 0}</span>
                      <span className="text-muted-foreground">Comentarios</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                      <span className="font-medium">{post.shares || 0}</span>
                      <span className="text-muted-foreground">Compartidos</span>
                    </div>
                    {post.date && (
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-muted-foreground">{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Detalles de Instagram */}
      {selectedNetwork && instagramDetails && selectedNetwork.id === 'instagram' && (
        <div className="space-y-6">
          {/* Resumen del perfil */}
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Instagram className="w-5 h-5" />
                Análisis de Instagram - @{instagramDetails.profile?.username}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {instagramDetails.summary?.total_followers?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Seguidores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {instagramDetails.summary?.total_following?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Siguiendo</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {instagramDetails.summary?.total_posts?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Publicaciones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {(instagramDetails.summary?.engagement_ratio * 100)?.toFixed(1) || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Engagement</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">Tipo de cuenta:</span> {instagramDetails.summary?.account_type}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Estado:</span> {instagramDetails.summary?.verification_status}
                </p>
                {instagramDetails.summary?.followers_sample && (
                  <p className="text-sm">
                    <span className="font-semibold">Muestra de seguidores:</span> {instagramDetails.summary.followers_sample}
                  </p>
                )}
                {instagramDetails.summary?.following_sample && (
                  <p className="text-sm">
                    <span className="font-semibold">Muestra de seguidos:</span> {instagramDetails.summary.following_sample}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información del perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Nombre completo</h4>
                    <p className="text-sm">{instagramDetails.profile?.full_name || 'No disponible'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Biografía</h4>
                    <p className="text-sm">{instagramDetails.profile?.biography || 'No disponible'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Estado de verificación</h4>
                    <Badge variant={instagramDetails.profile?.is_verified ? "default" : "outline"}>
                      {instagramDetails.profile?.is_verified ? "Verificado" : "No verificado"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Cuenta de empresa</h4>
                    <Badge variant={instagramDetails.profile?.is_business ? "default" : "outline"}>
                      {instagramDetails.profile?.is_business ? "Sí" : "No"}
                    </Badge>
                  </div>
                  {instagramDetails.profile?.business_category && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Categoría de negocio</h4>
                      <p className="text-sm">{instagramDetails.profile.business_category}</p>
                    </div>
                  )}
                  {instagramDetails.profile?.external_url && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Enlace externo</h4>
                      <a 
                        href={instagramDetails.profile.external_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {instagramDetails.profile.external_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Análisis con IA */}
          {instagramDetails.analysis && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <TrendingUp className="w-5 h-5" />
                  Análisis Inteligente con IA
                  {instagramDetails.analysis.ai_powered && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ✨ Potenciado por IA
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Resumen del análisis */}
                  {instagramDetails.analysis.summary && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                        {instagramDetails.analysis.ai_powered ? 'Resumen Ejecutivo (IA)' : 'Resumen'}
                      </h4>
                      <p className="text-sm leading-relaxed bg-white p-3 rounded border">{instagramDetails.analysis.summary}</p>
                    </div>
                  )}

                  {/* Métricas clave (solo si hay análisis IA) */}
                  {instagramDetails.analysis.metrics && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Métricas Clave</h4>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm leading-relaxed">{instagramDetails.analysis.metrics}</p>
                      </div>
                    </div>
                  )}

                  {/* Análisis de audiencia (solo si hay análisis IA) */}
                  {instagramDetails.analysis.audience && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Análisis de Audiencia</h4>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm leading-relaxed">{instagramDetails.analysis.audience}</p>
                      </div>
                    </div>
                  )}

                  {/* Estrategia (solo si hay análisis IA) */}
                  {instagramDetails.analysis.strategy && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Análisis de Estrategia</h4>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm leading-relaxed">{instagramDetails.analysis.strategy}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Recomendaciones */}
                  {instagramDetails.analysis.recommendations && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Recomendaciones</h4>
                      <div className="bg-white p-3 rounded border">
                        {Array.isArray(instagramDetails.analysis.recommendations) ? (
                          <ul className="text-sm space-y-2">
                            {instagramDetails.analysis.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm leading-relaxed">{instagramDetails.analysis.recommendations}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Oportunidades */}
                  {instagramDetails.analysis.opportunities && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Oportunidades</h4>
                      <div className="bg-white p-3 rounded border">
                        {Array.isArray(instagramDetails.analysis.opportunities) ? (
                          <ul className="text-sm space-y-2">
                            {instagramDetails.analysis.opportunities.map((opp: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                {opp}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm leading-relaxed">{instagramDetails.analysis.opportunities}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Indicador de estado de IA */}
                  <div className="text-xs text-muted-foreground p-2 bg-white rounded border">
                    {instagramDetails.summary?.has_ai_analysis ? 
                      '✅ Este análisis fue generado con inteligencia artificial avanzada' : 
                      '⚠️ Análisis básico - La IA mejorará el análisis en la próxima consulta'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seguidores destacados */}
          {instagramDetails.followers && instagramDetails.followers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Seguidores Destacados (muestra de {instagramDetails.followers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {instagramDetails.followers.slice(0, 12).map((follower: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {follower.username ? follower.username[0].toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">@{follower.username || 'Usuario'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {follower.full_name || 'Sin nombre'}
                        </p>
                        {follower.is_verified && (
                          <Badge variant="outline" className="text-xs">Verificado</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Posts de Instagram */}
      {selectedNetwork && instagramPosts && selectedNetwork.id === 'instagram' && (
        <div className="space-y-6">
          {/* Estadísticas de posts */}
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <BarChart3 className="w-5 h-5" />
                Análisis de Posts de Instagram
                {instagramPosts.analysis?.ai_powered && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    ✨ Potenciado por IA
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {instagramPosts.stats?.total_posts || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Posts analizados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {instagramPosts.stats?.avg_likes?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Likes promedio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {instagramPosts.stats?.avg_comments || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Comentarios promedio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {instagramPosts.stats?.video_count || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Videos</div>
                </div>
              </div>

              {/* Análisis con IA de posts */}
              {instagramPosts.analysis && (
                <div className="space-y-4">
                  {instagramPosts.analysis.summary && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Resumen del Contenido</h4>
                      <p className="text-sm leading-relaxed bg-white p-3 rounded border">{instagramPosts.analysis.summary}</p>
                    </div>
                  )}

                  {instagramPosts.analysis.content_analysis && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Análisis de Contenido</h4>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm leading-relaxed">{instagramPosts.analysis.content_analysis}</p>
                      </div>
                    </div>
                  )}

                  {instagramPosts.analysis.performance && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Análisis de Rendimiento</h4>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm leading-relaxed">{instagramPosts.analysis.performance}</p>
                      </div>
                    </div>
                  )}

                  {instagramPosts.analysis.recommendations && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Recomendaciones</h4>
                      <div className="bg-white p-3 rounded border">
                        {Array.isArray(instagramPosts.analysis.recommendations) ? (
                          <ul className="text-sm space-y-2">
                            {instagramPosts.analysis.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm leading-relaxed">{instagramPosts.analysis.recommendations}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grid de posts */}
          {instagramPosts.posts && instagramPosts.posts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="w-5 h-5" />
                  Posts Recientes ({instagramPosts.posts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {instagramPosts.posts.slice(0, 9).map((post: any, index: number) => (
                    <div key={index} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {post.display_url && (
                        <div className="aspect-square bg-muted relative">
                          <img 
                            src={post.display_url} 
                            alt="Instagram post"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {post.is_video && (
                            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                              📹 Video
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-4 space-y-3">
                        {post.caption && (
                          <p className="text-sm line-clamp-3">{post.caption}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span>❤️ {post.like_count?.toLocaleString() || 0}</span>
                            <span>💬 {post.comment_count?.toLocaleString() || 0}</span>
                            {post.is_video && post.video_view_count && (
                              <span>👁️ {post.video_view_count?.toLocaleString()}</span>
                            )}
                          </div>
                          {post.taken_at_timestamp && (
                            <span>{new Date(post.taken_at_timestamp * 1000).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to get URL placeholders
const getUrlPlaceholder = (networkId: string): string => {
  const placeholders: {[key: string]: string} = {
    linkedin: 'https://linkedin.com/company/tu-empresa',
    tiktok: 'https://tiktok.com/@tu-empresa',
    instagram: 'https://instagram.com/tu-empresa',
    facebook: 'https://facebook.com/tu-empresa',
    twitter: 'https://twitter.com/tu-empresa',
    youtube: 'https://youtube.com/@tu-empresa'
  };
  
  return placeholders[networkId] || 'URL de la red social';
};

export default SocialMediaHub;