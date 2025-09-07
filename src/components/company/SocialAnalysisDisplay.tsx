import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  Shield, 
  Clock,
  Globe,
  Calendar,
  Target,
  Zap,
  Star,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Music,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  BarChart3
} from "lucide-react";

interface SocialAnalysisData {
  id: string;
  user_id: string;
  cid: string | null;
  social_type: string;
  group_id: string | null;
  url: string;
  name: string | null;
  image: string | null;
  description: string | null;
  screen_name: string | null;
  users_count: number;
  community_status: string | null;
  is_blocked: boolean;
  is_closed: boolean;
  verified: boolean;
  tags: string[];
  suggested_tags: string[];
  rating_tags: any;
  categories: string[];
  avg_er: number;
  avg_interactions: number;
  avg_views: number;
  rating_index: number;
  quality_score: number;
  time_statistics: string | null;
  time_posts_loaded: string | null;
  time_short_loop: string | null;
  start_date: string | null;
  members_cities: any;
  members_countries: any;
  members_genders_ages: any;
  country: string | null;
  country_code: string | null;
  city: string | null;
  profile_type: string | null;
  gender: string | null;
  age: string | null;
  last_posts: any;
  last_from_mentions: any;
  similar_profiles: any;
  members_types: any;
  members_reachability: any;
  countries: any;
  cities: any;
  genders: any;
  ages: any;
  interests: any;
  brand_safety: any;
  pct_fake_followers: number;
  audience_severity: number;
  contact_email: string | null;
  raw_api_response: any;
  created_at: string;
  updated_at: string;
}

interface SocialAnalysisDisplayProps {
  userId: string;
}

const SocialAnalysisDisplay = ({ userId }: SocialAnalysisDisplayProps) => {
  const [analyses, setAnalyses] = useState<SocialAnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSocialAnalyses();
  }, [userId]);

  const loadSocialAnalyses = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('social_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (err) {
      console.error('Error loading social analyses:', err);
      setError('Error al cargar los análisis de redes sociales');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (socialType: string) => {
    switch (socialType) {
      case 'INST': return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'FB': return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'TW': return <Twitter className="w-5 h-5 text-blue-400" />;
      case 'TT': return <Music className="w-5 h-5 text-black" />;
      case 'YT': return <Youtube className="w-5 h-5 text-red-500" />;
      default: return <Globe className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPlatformName = (socialType: string) => {
    switch (socialType) {
      case 'INST': return 'Instagram';
      case 'FB': return 'Facebook';
      case 'TW': return 'Twitter';
      case 'TT': return 'TikTok';
      case 'YT': return 'YouTube';
      default: return socialType;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando análisis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </Card>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No se encontraron análisis de redes sociales</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Seguidores</p>
                <p className="text-2xl font-bold">
                  {formatNumber(analyses.reduce((sum, a) => sum + (a.users_count || 0), 0))}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engagement Promedio</p>
                <p className="text-2xl font-bold">
                  {(analyses.reduce((sum, a) => sum + (a.avg_er || 0), 0) / analyses.length * 100).toFixed(1)}%
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plataformas</p>
                <p className="text-2xl font-bold">{analyses.length}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Platform Analysis */}
      {analyses.map((analysis) => (
        <Card key={analysis.id} className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getPlatformIcon(analysis.social_type)}
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {analysis.name}
                    {analysis.verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    @{analysis.screen_name} • {getPlatformName(analysis.social_type)}
                  </p>
                </div>
              </div>
              <Badge variant={analysis.community_status === 'COLLECTING' ? 'default' : 'secondary'}>
                {analysis.community_status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Profile Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {analysis.image && (
                    <img 
                      src={analysis.image} 
                      alt={analysis.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-border"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{formatNumber(analysis.users_count)} Seguidores</p>
                    <p className="text-sm text-muted-foreground">{analysis.profile_type}</p>
                  </div>
                </div>
                {analysis.description && (
                  <p className="text-sm text-muted-foreground">{analysis.description}</p>
                )}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-xs text-muted-foreground">Engagement Rate</p>
                  <p className="text-lg font-bold text-primary">
                    {(analysis.avg_er * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 bg-green-500/5 rounded-lg">
                  <p className="text-xs text-muted-foreground">Quality Score</p>
                  <p className="text-lg font-bold text-green-600">
                    {(analysis.quality_score * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="p-3 bg-blue-500/5 rounded-lg">
                  <p className="text-xs text-muted-foreground">Avg Views</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatNumber(analysis.avg_views)}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/5 rounded-lg">
                  <p className="text-xs text-muted-foreground">Fake Followers</p>
                  <p className="text-lg font-bold text-purple-600">
                    {analysis.pct_fake_followers.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Tags and Categories */}
            {(analysis.tags.length > 0 || analysis.categories.length > 0) && (
              <div className="space-y-3">
                {analysis.categories.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Categorías</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.categories.map((category, index) => (
                        <Badge key={index} variant="secondary">{category}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.tags.slice(0, 8).map((tag, index) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Audience Demographics */}
            {(analysis.countries.length > 0 || analysis.ages.length > 0) && (
              <div className="space-y-4">
                <h4 className="font-semibold">Demografia de la Audiencia</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.countries.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Top Países</p>
                      <div className="space-y-2">
                        {analysis.countries.slice(0, 3).map((country: any, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm">{country.name}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={country.percent * 100} className="w-20" />
                              <span className="text-xs text-muted-foreground">
                                {(country.percent * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.ages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Rangos de Edad</p>
                      <div className="space-y-2">
                        {analysis.ages.slice(0, 3).map((age: any, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm">{age.name.replace('_', '-')}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={age.percent * 100} className="w-20" />
                              <span className="text-xs text-muted-foreground">
                                {(age.percent * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Posts Preview */}
            {analysis.last_posts.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Últimas Publicaciones</h4>
                <div className="space-y-3">
                  {analysis.last_posts.slice(0, 2).map((post: any, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-muted/50">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">{post.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2">{post.text}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {post.comments}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Updated */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Actualizado: {new Date(analysis.updated_at).toLocaleDateString()}
              </div>
              {analysis.contact_email && (
                <div className="text-sm text-muted-foreground">
                  Contacto: {analysis.contact_email}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SocialAnalysisDisplay;