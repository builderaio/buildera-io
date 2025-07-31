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
  UserPlus,
  Brain,
  Timer,
  Award,
  Activity,
  Sparkles,
  Target,
  Hash,
  Clock,
  Play,
  Heart,
  MessageCircle,
  FileText,
  Camera,
  Edit,
  Lightbulb,
  Star
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
  follower_count?: number;
  industry?: string;
  description?: string;
  website?: string;
  specialties?: string[];
  company_size?: string;
  headquarters?: {
    city?: string;
    country?: string;
  };
  founded?: number;
  logo_url?: string;
}

interface LinkedInPost {
  activity_urn?: string;
  text?: string;
  posted_at?: string;
  stats?: {
    comments?: number;
    total_reactions?: number;
    reposts?: number;
  };
  post_type?: string;
  media?: {
    type?: string;
    url?: string;
    title?: string;
    description?: string;
  }[];
  document?: {
    title?: string;
    page_count?: number;
    url?: string;
    thumbnail?: string;
  };
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
  const [youtubeDetails, setYoutubeDetails] = useState<any>(null);
  const [youtubePosts, setYoutubePosts] = useState<any>(null);
  const [loadingYoutube, setLoadingYoutube] = useState(false);
  const [facebookDetails, setFacebookDetails] = useState<any>(null);
  const [facebookReviews, setFacebookReviews] = useState<any>(null);
  const [loadingFacebook, setLoadingFacebook] = useState(false);

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
        hasDetails: true,
        hasPosts: false
      },
      {
        id: 'twitter',
        name: 'Twitter',
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
        hasDetails: true,
        hasPosts: true
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

  // Extract channel identifier from YouTube URL
  const extractYouTubeIdentifier = (url: string): string => {
    const match = url.match(/youtube\.com\/(c\/|channel\/|user\/|@)([a-zA-Z0-9_-]+)/);
    return match ? match[2] : '';
  };

  // Load Facebook details function
  const loadFacebookDetails = async (network: SocialNetwork) => {
    if (!network.url || !network.isValid) return;

    setLoadingFacebook(true);
    try {
      console.log('📘 Loading Facebook details for:', network.url);
      
      const { data, error } = await supabase.functions.invoke('facebook-scraper', {
        body: {
          action: 'get_page_details',
          page_url: network.url
        }
      });

      if (error) throw error;

      if (data.success) {
        setFacebookDetails(data.data.page_details);
        setFacebookReviews(data.data.reviews);
        setSelectedNetwork(network);
        console.log('✅ Facebook details loaded:', data.data);
        
        toast({
          title: "Detalles de Facebook cargados",
          description: `Se cargaron ${data.data.total_reviews || 0} reseñas para análisis`,
        });
      } else {
        console.log('❌ Function returned success: false');
        console.log('❌ Data received:', data);
      }
    } catch (error: any) {
      console.error('Error loading Facebook details:', error);
      toast({
        title: "Error cargando Facebook",
        description: error.message || "No se pudieron cargar los detalles de Facebook",
        variant: "destructive",
      });
    } finally {
      setLoadingFacebook(false);
    }
  };

  // Load company data from Supabase
  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('No user found');
          return;
        }

        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error loading company data:', error);
          return;
        }

        if (data && data.length > 0) {
          const company = data[0];
          setCompanyData(company);
          setSocialNetworks(initializeSocialNetworks(company));
          console.log('Company data loaded:', company);
        }
      } catch (error) {
        console.error('Error loading company data:', error);
      }
    };

    loadCompanyData();
  }, []);

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
                <h3 className="font-semibold">Estado de Conexión</h3>
                <p className="text-sm text-muted-foreground">
                  {socialNetworks.filter(n => n.isActive).length} de {socialNetworks.length} redes sociales conectadas
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {Math.round((socialNetworks.filter(n => n.isActive).length / socialNetworks.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">completado</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de redes sociales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {socialNetworks.map((network) => {
          const IconComponent = network.icon;
          
          return (
            <Card 
              key={network.id} 
              className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                network.isActive ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
              }`}
            >
              <CardContent className="p-6 space-y-4">
                {/* Header con ícono y estado */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${network.color} text-white`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{network.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {network.isActive ? 'Conectado' : 'No conectado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {network.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                </div>

                {/* URL actual o input para nueva URL */}
                <div className="space-y-2">
                  {network.url ? (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{network.url}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(network.url!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor={`${network.id}-url`} className="text-sm font-medium">
                        URL de {network.name}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`${network.id}-url`}
                          placeholder={getUrlPlaceholder(network.id)}
                          value={urlInputs[network.id] || ''}
                          onChange={(e) => setUrlInputs(prev => ({ ...prev, [network.id]: e.target.value }))}
                          className="flex-1"
                        />
                        <Button 
                          size="sm"
                          disabled={!urlInputs[network.id] || loading}
                          onClick={() => {
                            // updateSocialUrl(network.id, urlInputs[network.id]);
                          }}
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                {network.isActive && (
                  <div className="flex gap-2 pt-2">
                    {network.hasDetails && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 h-auto py-3 px-3"
                        onClick={() => {
                          setSelectedNetwork(network);
                          if (network.id === 'facebook') {
                            loadFacebookDetails(network);
                          }
                        }}
                        disabled={loadingFacebook && selectedNetwork?.id === network.id}
                      >
                        {loadingFacebook && selectedNetwork?.id === 'facebook' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        <span className="text-xs">Ver Detalles</span>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detalles de Facebook */}
      {selectedNetwork && selectedNetwork.id === 'facebook' && facebookDetails && (
        <div className="space-y-6">
          {/* Información General de la Página de Facebook */}
          <Card className="overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Facebook className="w-5 h-5" />
                Información de la Página de Facebook
                <Badge variant="outline" className="ml-auto">
                  Facebook Analytics
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Imagen de perfil */}
                {facebookDetails.profile_picture && (
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden border-2 border-blue-200">
                      <img 
                        src={facebookDetails.profile_picture} 
                        alt="Facebook profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">Imagen de perfil</p>
                  </div>
                )}
                
                {/* Información básica */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Información General</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Nombre:</p>
                        <p className="text-sm text-muted-foreground">{facebookDetails.name || 'No disponible'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Categoría:</p>
                        <p className="text-sm text-muted-foreground">{facebookDetails.category || 'No disponible'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Teléfono:</p>
                        <p className="text-sm text-muted-foreground">{facebookDetails.phone || 'No disponible'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Métricas */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-blue-800">Métricas</h4>
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {facebookDetails.follower_count?.toLocaleString() || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Seguidores</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {facebookDetails.like_count?.toLocaleString() || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Me gusta</div>
                    </div>
                  </div>
                </div>
                
                {/* Información adicional */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-blue-800">Detalles</h4>
                  <div className="space-y-2">
                    {facebookDetails.website && (
                      <div>
                        <p className="text-sm font-medium">Sitio web:</p>
                        <a 
                          href={facebookDetails.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {facebookDetails.website}
                        </a>
                      </div>
                    )}
                    {facebookDetails.address && (
                      <div>
                        <p className="text-sm font-medium">Dirección:</p>
                        <p className="text-sm text-muted-foreground">{facebookDetails.address}</p>
                      </div>
                    )}
                    {facebookDetails.description && (
                      <div>
                        <p className="text-sm font-medium">Descripción:</p>
                        <p className="text-sm text-muted-foreground line-clamp-3">{facebookDetails.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reseñas de Facebook */}
          {facebookReviews && facebookReviews.length > 0 && (
            <Card className="overflow-hidden border-l-4 border-l-green-500">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Star className="w-5 h-5" />
                  Reseñas de Facebook ({facebookReviews.length})
                  <Badge variant="outline" className="ml-auto">
                    Facebook Reviews
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facebookReviews.slice(0, 6).map((review: any, index: number) => (
                    <div key={index} className="p-4 bg-white border rounded-lg shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {review.author_name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{review.author_name || 'Usuario anónimo'}</p>
                            {review.date && (
                              <p className="text-xs text-muted-foreground">{review.date}</p>
                            )}
                          </div>
                        </div>
                        {review.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {review.review_text && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {review.review_text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {facebookReviews.length > 6 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Mostrando las primeras 6 de {facebookReviews.length} reseñas
                    </p>
                  </div>
                )}
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