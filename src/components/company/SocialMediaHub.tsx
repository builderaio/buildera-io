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
  RefreshCw
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Hub de Redes Sociales</h2>
          <p className="text-muted-foreground">
            Gestiona y analiza la presencia de tu empresa en redes sociales
          </p>
        </div>
      </div>

      {/* Social Networks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {socialNetworks.map((network) => {
          const IconComponent = network.icon;
          
          return (
            <Card key={network.id} className={`transition-all hover:shadow-md ${network.isActive ? 'border-green-200' : 'border-gray-200'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${network.color} flex items-center justify-center`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{network.name}</CardTitle>
                      {network.isActive ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  </div>
                  {network.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(network.url!, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {network.isActive ? (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      URL configurada: 
                      <span className="font-mono text-xs block mt-1 truncate">
                        {network.url}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      {network.hasDetails && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedNetwork(network);
                            if (network.id === 'linkedin') {
                              loadLinkedInCompanyDetails(network);
                            }
                          }}
                          disabled={loadingLinkedIn && selectedNetwork?.id === network.id}
                        >
                          {loadingLinkedIn && selectedNetwork?.id === network.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4 mr-2" />
                          )}
                          Ver Detalles
                        </Button>
                      )}
                      
                      {network.hasPosts && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedNetwork(network);
                            if (network.id === 'linkedin') {
                              loadLinkedInCompanyPosts(network);
                            }
                          }}
                          disabled={loadingLinkedIn && selectedNetwork?.id === network.id}
                        >
                          {loadingLinkedIn && selectedNetwork?.id === network.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <BarChart3 className="w-4 h-4 mr-2" />
                          )}
                          Analizar Posts
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {network.url && !network.isValid
                          ? "URL inválida. Por favor verifica el formato."
                          : "Configura la URL para habilitar funciones."
                        }
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`${network.id}-url`}>URL de {network.name}</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`${network.id}-url`}
                          placeholder={getUrlPlaceholder(network.id)}
                          value={urlInputs[network.id] || network.url || ''}
                          onChange={(e) => setUrlInputs(prev => ({ ...prev, [network.id]: e.target.value }))}
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

      {/* Posts Section */}
      {selectedNetwork && linkedinPosts.length > 0 && selectedNetwork.id === 'linkedin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Posts de LinkedIn ({linkedinPosts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {linkedinPosts.slice(0, 5).map((post, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm">{post.text || 'Sin texto'}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>👍 {post.likes || 0} Me gusta</span>
                    <span>💬 {post.comments || 0} Comentarios</span>
                    <span>🔄 {post.shares || 0} Compartidos</span>
                    {post.date && <span>📅 {new Date(post.date).toLocaleDateString()}</span>}
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