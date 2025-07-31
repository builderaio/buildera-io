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
  TrendingUp
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
        hasPosts: false
      },
      {
        id: 'instagram',
        name: 'Instagram',
        icon: Instagram,
        color: 'bg-gradient-to-r from-purple-500 to-pink-500',
        url: companyData?.instagram_url || null,
        isValid: validateInstagramUrl(companyData?.instagram_url),
        isActive: !!companyData?.instagram_url && validateInstagramUrl(companyData?.instagram_url),
        hasDetails: false,
        hasPosts: false
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

    setLoadingLinkedIn(true);
    try {
      const identifier = extractTikTokIdentifier(network.url);
      
      console.log('🔍 Loading TikTok details for:', identifier);
      
      toast({
        title: "Función en desarrollo",
        description: "La funcionalidad de detalles de TikTok estará disponible próximamente",
      });
      
    } catch (error: any) {
      console.error('Error loading TikTok details:', error);
      toast({
        title: "Error cargando TikTok",
        description: error.message || "No se pudieron cargar los detalles de TikTok",
        variant: "destructive",
      });
    } finally {
      setLoadingLinkedIn(false);
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
                            }
                          }}
                          disabled={loadingLinkedIn && selectedNetwork?.id === network.id}
                        >
                          {loadingLinkedIn && selectedNetwork?.id === network.id ? (
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
                            }
                          }}
                          disabled={loadingLinkedIn && selectedNetwork?.id === network.id}
                        >
                          {loadingLinkedIn && selectedNetwork?.id === network.id ? (
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