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
  basic_info?: {
    name?: string;
    description?: string;
    website?: string;
    linkedin_url?: string;
    industries?: string[];
    is_verified?: boolean;
    founded_info?: {
      year?: number;
      month?: number;
      day?: number;
    };
  };
  stats?: {
    employee_count?: number;
    follower_count?: number;
    employee_count_range?: {
      start?: number;
      end?: number;
    };
  };
  locations?: {
    headquarters?: {
      country?: string;
      state?: string;
      city?: string;
      postal_code?: string;
      line1?: string;
      line2?: string;
    };
  };
  media?: {
    logo_url?: string;
    cover_url?: string;
  };
}

interface LinkedInPost {
  activity_urn?: string;
  full_urn?: string;
  post_url?: string;
  posted_at?: {
    relative?: string;
    is_edited?: boolean;
    date?: string;
    timestamp?: number;
  };
  text?: string;
  post_language_code?: string;
  post_type?: string;
  author?: {
    name?: string;
    follower_count?: number;
    company_url?: string;
    logo_url?: string;
  };
  stats?: {
    total_reactions?: number;
    like?: number;
    support?: number;
    love?: number;
    insight?: number;
    celebrate?: number;
    entertainment?: number;
    comments?: number;
    reposts?: number;
  };
  media?: {
    type?: string;
    items?: Array<{
      url?: string;
      width?: number;
      height?: number;
      duration?: number;
      thumbnail?: string;
    }>;
  };
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
        setLinkedinDetails(data.data.data);
        setSelectedNetwork(network); // Asegurar que selectedNetwork esté establecido
        console.log('✅ LinkedIn company details loaded:', data.data.data);
        
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
        setLinkedinPosts(data.data.data.posts || []);
        setSelectedNetwork(network); // Asegurar que selectedNetwork esté establecido
        console.log('✅ LinkedIn company posts loaded:', data.data);
        
        toast({
          title: "Posts cargados",
          description: `Se cargaron ${data.data.data.posts?.length || 0} posts de LinkedIn`,
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

  const loadYoutubeDetails = async (network: SocialNetwork) => {
    if (!network.url || !network.isValid) return;

    setLoadingYoutube(true);
    try {
      const identifier = extractYouTubeIdentifier(network.url);
      
      console.log('🔍 Loading YouTube details for:', identifier);
      
      toast({
        title: "Conectando YouTube",
        description: "Esta funcionalidad estará disponible próximamente",
      });
      
      // Placeholder data for now
      setYoutubeDetails({
        channel_name: identifier,
        subscriber_count: 'Próximamente',
        video_count: 'Próximamente',
        total_views: 'Próximamente'
      });
      setSelectedNetwork(network);
      
    } catch (error: any) {
      console.error('Error loading YouTube details:', error);
      toast({
        title: "Error cargando YouTube",
        description: error.message || "No se pudieron cargar los detalles de YouTube",
        variant: "destructive",
      });
    } finally {
      setLoadingYoutube(false);
    }
  };

  const loadYoutubePosts = async (network: SocialNetwork) => {
    if (!network.url || !network.isValid) return;

    setLoadingYoutube(true);
    try {
      const identifier = extractYouTubeIdentifier(network.url);
      
      console.log('📹 Loading YouTube posts for:', identifier);
      
      toast({
        title: "Cargando videos",
        description: "Esta funcionalidad estará disponible próximamente",
      });
      
      // Placeholder data for now
      setYoutubePosts([]);
      
    } catch (error: any) {
      console.error('Error loading YouTube posts:', error);
      toast({
        title: "Error cargando videos",
        description: error.message || "No se pudieron cargar los videos de YouTube",
        variant: "destructive",
      });
    } finally {
      setLoadingYoutube(false);
    }
  };

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
                            } else if (network.id === 'youtube') {
                              loadYoutubeDetails(network);
                            } else if (network.id === 'facebook') {
                              loadFacebookDetails(network);
                            }
                          }}
                           disabled={(loadingLinkedIn || loadingInstagram || loadingTikTok || loadingYoutube || loadingFacebook) && selectedNetwork?.id === network.id}
                        >
                            {(loadingLinkedIn && selectedNetwork?.id === 'linkedin') || (loadingInstagram && selectedNetwork?.id === 'instagram') || (loadingTikTok && selectedNetwork?.id === 'tiktok') || (loadingYoutube && selectedNetwork?.id === 'youtube') || (loadingFacebook && selectedNetwork?.id === 'facebook') ? (
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
                              } else if (network.id === 'youtube') {
                                loadYoutubePosts(network);
                              }
                            }}
                            disabled={(loadingLinkedIn || loadingInstagram || loadingTikTok || loadingYoutube) && selectedNetwork?.id === network.id}
                        >
                          {(loadingLinkedIn && selectedNetwork?.id === 'linkedin') || (loadingInstagram && selectedNetwork?.id === 'instagram') || (loadingTikTok && selectedNetwork?.id === 'tiktok') || (loadingYoutube && selectedNetwork?.id === 'youtube') ? (
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
              Detalles de LinkedIn - {linkedinDetails.basic_info?.name || 'Empresa'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Descripción</h4>
                  <p className="text-sm">{linkedinDetails.basic_info?.description || 'No disponible'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Industria</h4>
                  <p className="text-sm">{linkedinDetails.basic_info?.industries?.join(', ') || 'No disponible'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Sitio Web</h4>
                  <p className="text-sm">{linkedinDetails.basic_info?.website || 'No disponible'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Verificado</h4>
                  <p className="text-sm">{linkedinDetails.basic_info?.is_verified ? '✅ Verificado' : '❌ No verificado'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Seguidores</h4>
                  <p className="text-sm">{linkedinDetails.stats?.follower_count?.toLocaleString() || 'No disponible'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Empleados</h4>
                  <p className="text-sm">
                    {linkedinDetails.stats?.employee_count || 
                     (linkedinDetails.stats?.employee_count_range ? 
                      `${linkedinDetails.stats.employee_count_range.start}-${linkedinDetails.stats.employee_count_range.end}` : 
                      'No disponible')}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Año de Fundación</h4>
                  <p className="text-sm">{linkedinDetails.basic_info?.founded_info?.year || 'No disponible'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Ubicación</h4>
                  <p className="text-sm">
                    {linkedinDetails.locations?.headquarters ? 
                      `${linkedinDetails.locations.headquarters.city}, ${linkedinDetails.locations.headquarters.state}, ${linkedinDetails.locations.headquarters.country}` : 
                      'No disponible'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Dirección</h4>
                  <p className="text-sm">{linkedinDetails.locations?.headquarters?.line1 || 'No disponible'}</p>
                </div>
                {linkedinDetails.media?.logo_url && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Logo</h4>
                    <img 
                      src={linkedinDetails.media.logo_url} 
                      alt="Company Logo" 
                      className="w-16 h-16 object-contain rounded-lg border"
                    />
                  </div>
                )}
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
                <div key={post.activity_urn || index} className="bg-white border border-blue-200 rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-relaxed flex-1">{post.text || 'Sin contenido de texto'}</p>
                    {post.media?.items?.[0] && (
                      <div className="flex-shrink-0">
                        {post.media.type === 'image' && (
                          <img 
                            src={post.media.items[0].url} 
                            alt="Post media" 
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                        )}
                        {post.media.type === 'video' && (
                          <div className="relative">
                            <img 
                              src={post.media.items[0].thumbnail} 
                              alt="Video thumbnail" 
                              className="w-20 h-20 object-cover rounded-lg border"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M8 5v10l8-5-8-5z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 text-xs text-blue-600">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      <span className="font-medium">{post.stats?.total_reactions || 0}</span>
                      <span className="text-muted-foreground">Reacciones</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                      <span className="font-medium">{post.stats?.comments || 0}</span>
                      <span className="text-muted-foreground">Comentarios</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                      <span className="font-medium">{post.stats?.reposts || 0}</span>
                      <span className="text-muted-foreground">Reposts</span>
                    </div>
                    {post.posted_at?.date && (
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-muted-foreground">{new Date(post.posted_at.date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {post.posted_at?.is_edited && (
                      <span className="text-xs text-amber-600">• Editado</span>
                    )}
                  </div>
                  
                  {post.post_url && (
                    <div className="pt-2">
                      <a 
                        href={post.post_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Ver post en LinkedIn →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análisis Inteligente con IA para LinkedIn */}
      {selectedNetwork && linkedinPosts.length > 0 && selectedNetwork.id === 'linkedin' && (
        <Card className="overflow-hidden border-l-4 border-l-blue-500">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Brain className="w-5 h-5" />
              Análisis Inteligente con IA
              <Badge variant="outline" className="ml-auto">
                LinkedIn Analytics
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Rendimiento por Tipo de Contenido */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-blue-800 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Rendimiento por Tipo
                </h4>
                <div className="space-y-3">
                  {(() => {
                    const regularPosts = linkedinPosts.filter(post => post.post_type === 'regular');
                    const avgRegularEngagement = regularPosts.length > 0 ? 
                      regularPosts.reduce((acc, post) => acc + (post.stats?.total_reactions || 0) + (post.stats?.comments || 0), 0) / regularPosts.length : 0;
                    
                    const repostPosts = linkedinPosts.filter(post => post.post_type === 'repost');
                    const avgRepostEngagement = repostPosts.length > 0 ? 
                      repostPosts.reduce((acc, post) => acc + (post.stats?.total_reactions || 0) + (post.stats?.comments || 0), 0) / repostPosts.length : 0;

                    return (
                      <>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Posts Originales</p>
                            <p className="text-xs text-muted-foreground">{regularPosts.length} posts</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-blue-600">{avgRegularEngagement.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">Engagement promedio</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Reposts</p>
                            <p className="text-xs text-muted-foreground">{repostPosts.length} posts</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-600">{avgRepostEngagement.toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">Engagement promedio</p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Posts con Mejor Rendimiento */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-blue-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Posts Top
                </h4>
                <div className="space-y-3">
                  {linkedinPosts
                    .sort((a, b) => ((b.stats?.total_reactions || 0) + (b.stats?.comments || 0)) - ((a.stats?.total_reactions || 0) + (a.stats?.comments || 0)))
                    .slice(0, 2)
                    .map((post, index) => (
                      <div key={post.activity_urn || index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {post.text?.substring(0, 80)}...
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2 text-xs">
                            <span className="text-blue-600">{post.stats?.total_reactions || 0} reacciones</span>
                            <span className="text-green-600">{post.stats?.comments || 0} comentarios</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Patrones de Engagement */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-blue-800 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Patrones de Engagement
                </h4>
                <div className="space-y-3">
                  {(() => {
                    const totalReactions = linkedinPosts.reduce((acc, post) => acc + (post.stats?.total_reactions || 0), 0);
                    const totalComments = linkedinPosts.reduce((acc, post) => acc + (post.stats?.comments || 0), 0);
                    const totalReposts = linkedinPosts.reduce((acc, post) => acc + (post.stats?.reposts || 0), 0);
                    const avgReactions = linkedinPosts.length > 0 ? totalReactions / linkedinPosts.length : 0;
                    const avgComments = linkedinPosts.length > 0 ? totalComments / linkedinPosts.length : 0;
                    const avgReposts = linkedinPosts.length > 0 ? totalReposts / linkedinPosts.length : 0;

                    return (
                      <>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm">Reacciones promedio</span>
                          <span className="font-bold text-blue-600">{avgReactions.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <span className="text-sm">Comentarios promedio</span>
                          <span className="font-bold text-green-600">{avgComments.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                          <span className="text-sm">Reposts promedio</span>
                          <span className="font-bold text-purple-600">{avgReposts.toFixed(1)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Insights con IA */}
              <div className="md:col-span-2 lg:col-span-3 space-y-4">
                <h4 className="font-semibold text-sm text-blue-800 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Insights Generados por IA
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    const postsWithMedia = linkedinPosts.filter(post => post.media?.items?.length > 0);
                    const mediaEngagement = postsWithMedia.length > 0 ? 
                      postsWithMedia.reduce((acc, post) => acc + (post.stats?.total_reactions || 0) + (post.stats?.comments || 0), 0) / postsWithMedia.length : 0;
                    
                    const textOnlyPosts = linkedinPosts.filter(post => !post.media?.items?.length);
                    const textEngagement = textOnlyPosts.length > 0 ? 
                      textOnlyPosts.reduce((acc, post) => acc + (post.stats?.total_reactions || 0) + (post.stats?.comments || 0), 0) / textOnlyPosts.length : 0;

                    const editedPosts = linkedinPosts.filter(post => post.posted_at?.is_edited);
                    const editedPercentage = linkedinPosts.length > 0 ? (editedPosts.length / linkedinPosts.length) * 100 : 0;

                    return (
                      <>
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Camera className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-blue-900 mb-1">Contenido Visual</h5>
                              <p className="text-sm text-blue-700">
                                Los posts con media obtienen {mediaEngagement > textEngagement ? 'mejor' : 'menor'} engagement 
                                ({mediaEngagement.toFixed(1)} vs {textEngagement.toFixed(1)} promedio)
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Edit className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-green-900 mb-1">Edición de Posts</h5>
                              <p className="text-sm text-green-700">
                                {editedPercentage.toFixed(1)}% de tus posts han sido editados, 
                                {editedPercentage > 20 ? ' considera planificar mejor el contenido' : ' buen control de calidad'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Recomendaciones */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <h5 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Recomendaciones para Mejorar
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {(() => {
                       // Análisis del propósito de LinkedIn basado en contenido
                       const analyzeLinkedInPurpose = () => {
                         const jobKeywords = ['hiring', 'trabajo', 'empleo', 'únete', 'team', 'equipo', 'talento', 'carrera', 'oportunidad', 'vacante', 'job', 'careers'];
                         const salesKeywords = ['producto', 'servicio', 'venta', 'cliente', 'compra', 'oferta', 'descuento', 'lanzamiento', 'product', 'service', 'sale'];
                         const thoughtLeadershipKeywords = ['insight', 'tendencia', 'futuro', 'industria', 'opinión', 'experiencia', 'aprendizaje', 'reflexión', 'trend', 'future'];
                         const companyUpdateKeywords = ['empresa', 'company', 'anuncio', 'noticia', 'actualización', 'logro', 'milestone', 'achievement'];

                         let jobPostsCount = 0;
                         let salesPostsCount = 0;
                         let thoughtLeadershipCount = 0;
                         let companyUpdatesCount = 0;

                         linkedinPosts.forEach(post => {
                           const text = post.text?.toLowerCase() || '';
                           
                           if (jobKeywords.some(keyword => text.includes(keyword))) jobPostsCount++;
                           if (salesKeywords.some(keyword => text.includes(keyword))) salesPostsCount++;
                           if (thoughtLeadershipKeywords.some(keyword => text.includes(keyword))) thoughtLeadershipCount++;
                           if (companyUpdateKeywords.some(keyword => text.includes(keyword))) companyUpdatesCount++;
                         });

                         const total = linkedinPosts.length;
                         const jobPercentage = (jobPostsCount / total) * 100;
                         const salesPercentage = (salesPostsCount / total) * 100;
                         const thoughtPercentage = (thoughtLeadershipCount / total) * 100;
                         const updatesPercentage = (companyUpdatesCount / total) * 100;

                         let primaryPurpose = '';
                         let recommendations = [];

                         if (jobPercentage > 40) {
                           primaryPurpose = 'Marca Empleadora';
                           recommendations = [
                             'Incluye testimonios de empleados para aumentar credibilidad',
                             'Muestra la cultura empresarial con fotos del equipo',
                             'Comparte historias de crecimiento profesional',
                             'Destaca beneficios únicos para atraer talento'
                           ];
                         } else if (salesPercentage > 30) {
                           primaryPurpose = 'Generación de Leads/Ventas';
                           recommendations = [
                             'Incluye casos de éxito de clientes',
                             'Crea contenido educativo sobre tu industria',
                             'Añade llamadas a la acción claras',
                             'Comparte demostraciones de producto'
                           ];
                         } else if (thoughtPercentage > 25) {
                           primaryPurpose = 'Thought Leadership';
                           recommendations = [
                             'Comparte insights únicos de la industria',
                             'Participa en conversaciones trending',
                             'Publica análisis de tendencias del mercado',
                             'Invita a la reflexión con preguntas abiertas'
                           ];
                         } else {
                           primaryPurpose = 'Mix Equilibrado';
                           recommendations = [
                             'Mantén el balance entre contenido personal y corporativo',
                             'Experimenta con diferentes tipos de contenido',
                             'Monitorea qué tipo de post genera más engagement',
                             'Considera enfocar más en el propósito que mejor funcione'
                           ];
                         }

                         return {
                           primaryPurpose,
                           distribution: { jobPercentage, salesPercentage, thoughtPercentage, updatesPercentage },
                           recommendations
                         };
                       };

                       const purposeAnalysis = analyzeLinkedInPurpose();
                       
                       return (
                         <div className="col-span-full space-y-4">
                           {/* Análisis del Propósito */}
                           <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                             <h6 className="font-medium text-indigo-900 mb-3 flex items-center gap-2">
                               <Target className="w-4 h-4" />
                               Propósito Identificado: {purposeAnalysis.primaryPurpose}
                             </h6>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                               <div className="text-center p-2 bg-white rounded">
                                 <div className="text-lg font-bold text-blue-600">{purposeAnalysis.distribution.jobPercentage.toFixed(0)}%</div>
                                 <div className="text-xs text-muted-foreground">Marca Empleadora</div>
                               </div>
                               <div className="text-center p-2 bg-white rounded">
                                 <div className="text-lg font-bold text-green-600">{purposeAnalysis.distribution.salesPercentage.toFixed(0)}%</div>
                                 <div className="text-xs text-muted-foreground">Ventas/Leads</div>
                               </div>
                               <div className="text-center p-2 bg-white rounded">
                                 <div className="text-lg font-bold text-purple-600">{purposeAnalysis.distribution.thoughtPercentage.toFixed(0)}%</div>
                                 <div className="text-xs text-muted-foreground">Thought Leadership</div>
                               </div>
                               <div className="text-center p-2 bg-white rounded">
                                 <div className="text-lg font-bold text-orange-600">{purposeAnalysis.distribution.updatesPercentage.toFixed(0)}%</div>
                                 <div className="text-xs text-muted-foreground">Noticias Empresa</div>
                               </div>
                             </div>
                           </div>
                           
                           {/* Recomendaciones Específicas */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {purposeAnalysis.recommendations.map((rec, index) => (
                               <div key={index} className="text-sm text-purple-700 flex items-start gap-2">
                                 <span className="text-purple-500 mt-1">•</span>
                                 <span>{rec}</span>
                               </div>
                             ))}
                           </div>
                         </div>
                       );
                      })()}
                   </div>
                 </div>
               </div>
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

            {/* Análisis de Propósito para Instagram basado en Posts */}
            {instagramPosts && instagramPosts.posts && instagramPosts.posts.length > 0 && (
             <Card className="overflow-hidden border-l-4 border-l-purple-500">
               <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-100">
                 <CardTitle className="flex items-center gap-2 text-purple-900">
                   <Brain className="w-5 h-5" />
                   Análisis Inteligente con IA
                   <Badge variant="outline" className="ml-auto">
                     Instagram Analytics
                   </Badge>
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                 <div className="space-y-6">
                   {(() => {
                     // Análisis del propósito de Instagram basado en contenido
                     const analyzeInstagramPurpose = () => {
                       const ecommerceKeywords = ['shop', 'buy', 'sale', 'discount', 'product', 'order', 'purchase', 'compra', 'venta', 'producto', 'descuento', 'pedido'];
                       const brandingKeywords = ['brand', 'lifestyle', 'story', 'behind', 'values', 'mission', 'marca', 'estilo', 'historia', 'valores', 'misión'];
                       const communityKeywords = ['community', 'together', 'family', 'team', 'friends', 'comunidad', 'juntos', 'familia', 'equipo', 'amigos'];
                       const educationalKeywords = ['tips', 'how', 'tutorial', 'learn', 'guide', 'consejos', 'cómo', 'aprende', 'guía', 'tutorial'];

                       let ecommerceCount = 0;
                       let brandingCount = 0;
                       let communityCount = 0;
                       let educationalCount = 0;

                       instagramPosts.posts.forEach((post: any) => {
                         const caption = post.caption?.toLowerCase() || '';
                         
                         if (ecommerceKeywords.some(keyword => caption.includes(keyword))) ecommerceCount++;
                         if (brandingKeywords.some(keyword => caption.includes(keyword))) brandingCount++;
                         if (communityKeywords.some(keyword => caption.includes(keyword))) communityCount++;
                         if (educationalKeywords.some(keyword => caption.includes(keyword))) educationalCount++;
                       });

                       const total = instagramPosts.posts.length;
                       const ecommercePercentage = (ecommerceCount / total) * 100;
                       const brandingPercentage = (brandingCount / total) * 100;
                       const communityPercentage = (communityCount / total) * 100;
                       const educationalPercentage = (educationalCount / total) * 100;

                       let primaryPurpose = '';
                       let recommendations = [];

                       if (ecommercePercentage > 35) {
                         primaryPurpose = 'E-commerce/Ventas';
                         recommendations = [
                           'Usa Instagram Shopping para facilitar las compras',
                           'Incluye testimonios de clientes en Stories',
                           'Crea contenido de product placement natural',
                           'Aprovecha las funciones de carrito de compras'
                         ];
                       } else if (brandingPercentage > 30) {
                         primaryPurpose = 'Brand Awareness';
                         recommendations = [
                           'Mantén consistencia visual en tu feed',
                           'Comparte el behind-the-scenes de tu marca',
                           'Utiliza Stories para mostrar personalidad',
                           'Colabora con influencers afines a tu marca'
                         ];
                       } else if (communityPercentage > 25) {
                         primaryPurpose = 'Community Building';
                         recommendations = [
                           'Responde activamente a comentarios y DMs',
                           'Crea contenido generado por usuarios',
                           'Usa hashtags para fomentar participación',
                           'Organiza concursos y actividades interactivas'
                         ];
                       } else if (educationalPercentage > 20) {
                         primaryPurpose = 'Contenido Educativo';
                         recommendations = [
                           'Crea carruseles informativos y tutoriales',
                           'Usa Reels para tips rápidos y consejos',
                           'Comparte infografías valiosas',
                           'Establece una serie educativa semanal'
                         ];
                       } else {
                         primaryPurpose = 'Mix Estratégico';
                         recommendations = [
                           'Analiza qué tipo de contenido genera más engagement',
                           'Experimenta con diferentes formatos de contenido',
                           'Considera especializarte en el propósito que mejor funcione',
                           'Mantén un calendario de contenido equilibrado'
                         ];
                       }

                       return {
                         primaryPurpose,
                         distribution: { ecommercePercentage, brandingPercentage, communityPercentage, educationalPercentage },
                         recommendations
                       };
                     };

                     const purposeAnalysis = analyzeInstagramPurpose();
                     
                     return (
                       <>
                         {/* Análisis del Propósito */}
                         <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                           <h6 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                             <Target className="w-4 h-4" />
                             Propósito Identificado: {purposeAnalysis.primaryPurpose}
                           </h6>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                             <div className="text-center p-2 bg-white rounded">
                               <div className="text-lg font-bold text-green-600">{purposeAnalysis.distribution.ecommercePercentage.toFixed(0)}%</div>
                               <div className="text-xs text-muted-foreground">E-commerce</div>
                             </div>
                             <div className="text-center p-2 bg-white rounded">
                               <div className="text-lg font-bold text-blue-600">{purposeAnalysis.distribution.brandingPercentage.toFixed(0)}%</div>
                               <div className="text-xs text-muted-foreground">Branding</div>
                             </div>
                             <div className="text-center p-2 bg-white rounded">
                               <div className="text-lg font-bold text-purple-600">{purposeAnalysis.distribution.communityPercentage.toFixed(0)}%</div>
                               <div className="text-xs text-muted-foreground">Comunidad</div>
                             </div>
                             <div className="text-center p-2 bg-white rounded">
                               <div className="text-lg font-bold text-orange-600">{purposeAnalysis.distribution.educationalPercentage.toFixed(0)}%</div>
                               <div className="text-xs text-muted-foreground">Educativo</div>
                             </div>
                           </div>
                         </div>
                         
                         {/* Recomendaciones Específicas */}
                         <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                           <h5 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                             <Lightbulb className="w-4 h-4" />
                             Recomendaciones Específicas para {purposeAnalysis.primaryPurpose}
                           </h5>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {purposeAnalysis.recommendations.map((rec, index) => (
                               <div key={index} className="text-sm text-purple-700 flex items-start gap-2">
                                 <span className="text-purple-500 mt-1">•</span>
                                 <span>{rec}</span>
                               </div>
                             ))}
                           </div>
                         </div>
                       </>
                     );
                   })()}
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

      {/* Detalles de TikTok */}
      {selectedNetwork && tikTokDetails && selectedNetwork.id === 'tiktok' && (
        <div className="space-y-6">
          {/* Resumen del perfil */}
          <Card className="border-gray-800 bg-gradient-to-r from-gray-900 to-black text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Music className="w-5 h-5" />
                Análisis de TikTok - @{tikTokDetails.unique_id}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {tikTokDetails.follower_count?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-300">Seguidores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {tikTokDetails.following_count?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-300">Siguiendo</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {tikTokDetails.video_count?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-300">Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">
                    {tikTokDetails.heart_count?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-300">Me gusta</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">Nombre:</span> {tikTokDetails.nickname || 'No disponible'}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Descripción:</span> {tikTokDetails.signature || 'No disponible'}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Verificado:</span> {tikTokDetails.verified ? 'Sí' : 'No'}
                </p>
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
                    <h4 className="font-semibold text-sm text-muted-foreground">ID de usuario</h4>
                    <p className="text-sm">{tikTokDetails.user_id || 'No disponible'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Nombre único</h4>
                    <p className="text-sm">@{tikTokDetails.unique_id || 'No disponible'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Descripción</h4>
                    <p className="text-sm">{tikTokDetails.signature || 'No disponible'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Estado de verificación</h4>
                    <Badge variant={tikTokDetails.verified ? "default" : "outline"}>
                      {tikTokDetails.verified ? "Verificado" : "No verificado"}
                    </Badge>
                  </div>
                  {tikTokDetails.avatar_thumb && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Avatar</h4>
                      <img 
                        src={tikTokDetails.avatar_thumb} 
                        alt="Avatar de TikTok"
                        className="w-16 h-16 rounded-full border"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
          {instagramPosts && instagramPosts.posts && instagramPosts.posts.length > 0 && (
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

      {/* Posts de TikTok */}
      {selectedNetwork && tikTokPosts && selectedNetwork.id === 'tiktok' && (
        <div className="space-y-6">
          {/* Estadísticas de posts */}
          <Card className="border-gray-800 bg-gradient-to-r from-gray-900/20 to-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <BarChart3 className="w-5 h-5" />
                Análisis de Videos de TikTok
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  🎵 TikTok
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {tikTokPosts.videos?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Videos analizados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {tikTokPosts.videos?.reduce((acc: number, video: any) => acc + (video.play_count || 0), 0)?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Reproducciones totales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {tikTokPosts.videos?.reduce((acc: number, video: any) => acc + (video.digg_count || 0), 0)?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Likes totales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {tikTokPosts.videos?.reduce((acc: number, video: any) => acc + (video.comment_count || 0), 0)?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Comentarios totales</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Análisis Inteligente con IA */}
          <Card className="overflow-hidden border-l-4 border-l-purple-500">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Brain className="w-5 h-5" />
                Análisis Inteligente con IA
                <Badge variant="outline" className="ml-auto">
                  TikTok Analytics
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Rendimiento por Duración */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Rendimiento por Duración
                  </h4>
                  {tikTokPosts.videos && (() => {
                    const shortVideos = tikTokPosts.videos.filter((v: any) => v.duration <= 30);
                    const mediumVideos = tikTokPosts.videos.filter((v: any) => v.duration > 30 && v.duration <= 60);
                    const longVideos = tikTokPosts.videos.filter((v: any) => v.duration > 60);
                    
                    const shortAvg = shortVideos.length > 0 ? Math.round(shortVideos.reduce((acc: number, v: any) => acc + (v.play_count || 0), 0) / shortVideos.length) : 0;
                    const mediumAvg = mediumVideos.length > 0 ? Math.round(mediumVideos.reduce((acc: number, v: any) => acc + (v.play_count || 0), 0) / mediumVideos.length) : 0;
                    const longAvg = longVideos.length > 0 ? Math.round(longVideos.reduce((acc: number, v: any) => acc + (v.play_count || 0), 0) / longVideos.length) : 0;
                    
                    return (
                      <div className="space-y-3">
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">0-30s ({shortVideos.length} videos)</span>
                            <span className="text-sm font-bold text-purple-600">{shortAvg.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">reproducciones promedio</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">31-60s ({mediumVideos.length} videos)</span>
                            <span className="text-sm font-bold text-blue-600">{mediumAvg.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">reproducciones promedio</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">+60s ({longVideos.length} videos)</span>
                            <span className="text-sm font-bold text-green-600">{longAvg.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">reproducciones promedio</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Top Performers */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Videos Destacados
                  </h4>
                  {tikTokPosts.videos && (
                    <div className="space-y-3">
                      {tikTokPosts.videos
                        .sort((a: any, b: any) => (b.play_count || 0) - (a.play_count || 0))
                        .slice(0, 3)
                        .map((video: any, index: number) => (
                        <div key={index} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-l-yellow-400">
                          <p className="text-sm mb-2 line-clamp-2">{video.title}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Play className="h-3 w-3" />
                              {video.play_count?.toLocaleString() || 0}
                            </div>
                            <div className="flex items-center gap-2">
                              <Heart className="h-3 w-3" />
                              {video.digg_count?.toLocaleString() || 0}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Engagement Patterns */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Patrones de Engagement
                  </h4>
                  {tikTokPosts.videos && (() => {
                    const totalPlays = tikTokPosts.videos.reduce((acc: number, v: any) => acc + (v.play_count || 0), 0);
                    const totalLikes = tikTokPosts.videos.reduce((acc: number, v: any) => acc + (v.digg_count || 0), 0);
                    const totalComments = tikTokPosts.videos.reduce((acc: number, v: any) => acc + (v.comment_count || 0), 0);
                    
                    const likeRate = totalPlays > 0 ? ((totalLikes / totalPlays) * 100).toFixed(2) : 0;
                    const commentRate = totalPlays > 0 ? ((totalComments / totalPlays) * 100).toFixed(2) : 0;
                    
                    return (
                      <div className="space-y-3">
                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Tasa de Likes</span>
                            <span className="text-sm font-bold text-red-600">{likeRate}%</span>
                          </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Tasa de Comentarios</span>
                            <span className="text-sm font-bold text-blue-600">{commentRate}%</span>
                          </div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="text-sm font-medium mb-1">Engagement Total</div>
                          <div className="text-lg font-bold text-purple-600">{(totalLikes + totalComments).toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">interacciones totales</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Análisis de Propósito y Recomendaciones de IA */}
              <div className="mt-8 space-y-6">
                {(() => {
                  // Análisis del propósito de TikTok basado en contenido
                  const analyzeTikTokPurpose = () => {
                    if (!tikTokPosts.videos || tikTokPosts.videos.length === 0) {
                      return {
                        primaryPurpose: 'Datos Insuficientes',
                        distribution: { viral: 0, educational: 0, entertainment: 0, brand: 0 },
                        recommendations: [
                          'Publica más contenido para obtener análisis detallado',
                          'Experimenta con diferentes tipos de videos',
                          'Usa hashtags trending para aumentar alcance',
                          'Mantén consistencia en la publicación'
                        ]
                      };
                    }

                    const viralKeywords = ['trend', 'viral', 'challenge', 'dance', 'music', 'tendencia', 'reto', 'baile', 'música'];
                    const educationalKeywords = ['tips', 'how', 'tutorial', 'learn', 'guide', 'diy', 'consejos', 'cómo', 'aprende', 'guía'];
                    const entertainmentKeywords = ['funny', 'comedy', 'fun', 'entertainment', 'joke', 'divertido', 'comedia', 'entretenimiento', 'gracioso'];
                    const brandKeywords = ['product', 'brand', 'behind', 'company', 'business', 'producto', 'marca', 'empresa', 'negocio'];

                    let viralCount = 0;
                    let educationalCount = 0;
                    let entertainmentCount = 0;
                    let brandCount = 0;

                    tikTokPosts.videos.forEach((video: any) => {
                      const title = video.title?.toLowerCase() || '';
                      const desc = video.desc?.toLowerCase() || '';
                      const content = `${title} ${desc}`;
                      
                      if (viralKeywords.some(keyword => content.includes(keyword))) viralCount++;
                      if (educationalKeywords.some(keyword => content.includes(keyword))) educationalCount++;
                      if (entertainmentKeywords.some(keyword => content.includes(keyword))) entertainmentCount++;
                      if (brandKeywords.some(keyword => content.includes(keyword))) brandCount++;
                    });

                    const total = tikTokPosts.videos.length;
                    const viralPercentage = (viralCount / total) * 100;
                    const educationalPercentage = (educationalCount / total) * 100;
                    const entertainmentPercentage = (entertainmentCount / total) * 100;
                    const brandPercentage = (brandCount / total) * 100;

                    let primaryPurpose = '';
                    let recommendations = [];

                    if (viralPercentage > 40) {
                      primaryPurpose = 'Marketing Viral';
                      recommendations = [
                        'Mantente al día con trends y challenges populares',
                        'Crea contenido que invite a participar y compartir',
                        'Usa música trending para aumentar alcance',
                        'Publica en horarios de máxima actividad (7-9 PM)'
                      ];
                    } else if (educationalPercentage > 30) {
                      primaryPurpose = 'Contenido Educativo';
                      recommendations = [
                        'Crea series de tutoriales cortos y concisos',
                        'Usa texto en pantalla para destacar puntos clave',
                        'Estructura el contenido con principio, desarrollo y conclusión',
                        'Responde preguntas frecuentes en formato video'
                      ];
                    } else if (entertainmentPercentage > 25) {
                      primaryPurpose = 'Entretenimiento';
                      recommendations = [
                        'Mantén un tono divertido y auténtico',
                        'Experimenta con efectos y filtros creativos',
                        'Crea contenido que genere sonrisas y reacciones',
                        'Colabora con otros creadores para variedad'
                      ];
                    } else if (brandPercentage > 20) {
                      primaryPurpose = 'Brand Awareness';
                      recommendations = [
                        'Muestra el behind-the-scenes de tu empresa',
                        'Presenta tu equipo de manera auténtica',
                        'Comparte la historia y valores de tu marca',
                        'Equilibra contenido promocional con entretenimiento'
                      ];
                    } else {
                      primaryPurpose = 'Estrategia Mixta';
                      recommendations = [
                        'Identifica qué tipo de contenido genera más engagement',
                        'Experimenta con diferentes formatos y estilos',
                        'Analiza las métricas para optimizar el enfoque',
                        'Considera especializarte en el contenido más exitoso'
                      ];
                    }

                    return {
                      primaryPurpose,
                      distribution: { viralPercentage, educationalPercentage, entertainmentPercentage, brandPercentage },
                      recommendations
                    };
                  };

                  const purposeAnalysis = analyzeTikTokPurpose();
                  
                  return (
                    <>
                      {/* Análisis del Propósito */}
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <h6 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Propósito Identificado: {purposeAnalysis.primaryPurpose}
                        </h6>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-lg font-bold text-red-600">{purposeAnalysis.distribution.viralPercentage.toFixed(0)}%</div>
                            <div className="text-xs text-muted-foreground">Viral</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-lg font-bold text-blue-600">{purposeAnalysis.distribution.educationalPercentage.toFixed(0)}%</div>
                            <div className="text-xs text-muted-foreground">Educativo</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-lg font-bold text-green-600">{purposeAnalysis.distribution.entertainmentPercentage.toFixed(0)}%</div>
                            <div className="text-xs text-muted-foreground">Entretenimiento</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-lg font-bold text-purple-600">{purposeAnalysis.distribution.brandPercentage.toFixed(0)}%</div>
                            <div className="text-xs text-muted-foreground">Branding</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Recomendaciones Específicas */}
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <h5 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Recomendaciones Específicas para {purposeAnalysis.primaryPurpose}
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {purposeAnalysis.recommendations.map((rec, index) => (
                            <div key={index} className="text-sm text-purple-700 flex items-start gap-2">
                              <span className="text-purple-500 mt-1">•</span>
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Grid de videos */}
          {tikTokPosts.videos && tikTokPosts.videos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Videos Recientes ({tikTokPosts.videos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tikTokPosts.videos.slice(0, 9).map((video: any, index: number) => (
                    <div key={index} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {video.cover_url && (
                        <div className="aspect-video bg-muted relative">
                          <img 
                            src={video.cover_url} 
                            alt="TikTok video thumbnail"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                            🎵 TikTok
                          </div>
                          {video.duration && (
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                              {Math.floor(video.duration / 1000)}s
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-4 space-y-3">
                        {video.title && (
                          <p className="text-sm line-clamp-3 font-medium">{video.title}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span>👁️ {video.play_count?.toLocaleString() || 0}</span>
                            <span>❤️ {video.digg_count?.toLocaleString() || 0}</span>
                            <span>💬 {video.comment_count?.toLocaleString() || 0}</span>
                          </div>
                          {video.create_time && (
                            <span>{new Date(video.create_time * 1000).toLocaleDateString()}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span>🔗 {video.share_count || 0} shares</span>
                          {video.collect_count > 0 && (
                            <span>💾 {video.collect_count} guardados</span>
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