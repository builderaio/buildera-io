import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Plus, Brain, Target, BarChart3, Zap, Edit, Trash2, Eye, Sparkles, TrendingUp, MessageSquare, Heart, Share2, Video, Camera, Briefcase, Music, Globe2, DollarSign, ShoppingCart, Clock, MapPin, Smartphone, Building } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Audience {
  id: string;
  name: string;
  description: string;
  estimated_size: number;
  confidence_score: number;
  platform_preferences: any;
  age_ranges?: any;
  gender_split?: any;
  interests?: any;
  pain_points: string[];
  motivations: string[];
  goals: string[];
  created_at: string;
  is_active: boolean;
  ai_insights?: any;
  facebook_targeting?: any;
  instagram_targeting?: any;
  linkedin_targeting?: any;
  tiktok_targeting?: any;
  twitter_targeting?: any;
  youtube_targeting?: any;
}

interface CompanyData {
  id: string;
  name: string;
  description: string;
  industry_sector: string;
  website_url: string;
  company_size: string;
}

interface ICPProfile {
  demographic: {
    age_range: string;
    gender: string;
    income_level: string;
    education: string;
    location: string;
  };
  professional: {
    job_title: string;
    industry: string;
    company_size: string;
    experience_level: string;
  };
  behavioral: {
    pain_points: string[];
    motivations: string[];
    goals: string[];
    preferred_channels: string[];
  };
  psychographic: {
    values: string[];
    interests: string[];
    lifestyle: string[];
  };
}

interface AudienciasManagerProps {
  profile: any;
}

const AudienciasManager: React.FC<AudienciasManagerProps> = ({ profile }) => {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [icpProfile, setIcpProfile] = useState<ICPProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingICP, setGeneratingICP] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null);
  const [analyzingAudience, setAnalyzingAudience] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const platforms = [
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: '📘',
      color: 'bg-blue-500',
      demographic: 'Amplia edad, enfoque familiar',
      content: 'Contenido educativo, noticias, comunidad'
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: '📸',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      demographic: '18-34 años, visual-oriented',
      content: 'Fotos, Stories, Reels, lifestyle'
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      icon: '💼',
      color: 'bg-blue-600',
      demographic: 'Profesionales, B2B',
      content: 'Contenido profesional, liderazgo'
    },
    { 
      id: 'tiktok', 
      name: 'TikTok', 
      icon: '🎵',
      color: 'bg-black',
      demographic: 'Gen Z, Millennials jóvenes',
      content: 'Videos cortos, tendencias, entretenimiento'
    },
    { 
      id: 'twitter', 
      name: 'X (Twitter)', 
      icon: '🐦',
      color: 'bg-black',
      demographic: 'Usuarios informados, influencers',
      content: 'Noticias, opiniones, conversaciones'
    },
    { 
      id: 'youtube', 
      name: 'YouTube', 
      icon: '📺',
      color: 'bg-red-500',
      demographic: 'Todas las edades, búsqueda visual',
      content: 'Videos largos, tutoriales, entretenimiento'
    }
  ];

  useEffect(() => {
    loadInitialData();
  }, [profile]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Get user's primary company
      const { data: companyMemberData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', profile?.user_id)
        .eq('is_primary', true)
        .single();

      if (!companyMemberData) {
        console.log('No primary company found');
        setLoading(false);
        return;
      }

      // Load company data
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyMemberData.company_id)
        .single();

      if (company) {
        setCompanyData(company);
      }

      // Load existing audiences
      const { data: audienceData, error } = await supabase
        .from('company_audiences')
        .select('*')
        .eq('company_id', companyMemberData.company_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAudiences(audienceData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateICPProfile = async () => {
    try {
      setGeneratingICP(true);

      if (!companyData) {
        throw new Error('No se encontraron datos de la empresa');
      }

      const { data, error } = await supabase.functions.invoke('audience-intelligence-analysis', {
        body: {
          action: 'generate_icp',
          companyData: companyData,
          existingAudiences: audiences
        }
      });

      if (error) throw error;

      setIcpProfile(data.icp_profile);

      toast({
        title: "ICP Generado",
        description: "Se ha creado el perfil de cliente ideal basado en tu empresa",
      });

    } catch (error) {
      console.error('Error generating ICP:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el perfil ICP",
        variant: "destructive",
      });
    } finally {
      setGeneratingICP(false);
    }
  };

  const generateAudienceFromICP = async () => {
    try {
      if (!icpProfile || !companyData) return;

      const { data, error } = await supabase.functions.invoke('audience-intelligence-analysis', {
        body: {
          action: 'create_audience_from_icp',
          icpProfile: icpProfile,
          companyData: companyData,
          platforms: ['facebook', 'instagram', 'linkedin']
        }
      });

      if (error) throw error;

      // Save the generated audience
      const { data: companyMemberData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', profile?.user_id)
        .eq('is_primary', true)
        .single();

      if (!companyMemberData) throw new Error('No se encontró la empresa');

      const audienceData = {
        company_id: companyMemberData.company_id,
        user_id: profile?.user_id,
        name: data.audience.name,
        description: data.audience.description,
        age_ranges: data.audience.demographics.age_ranges,
        gender_split: data.audience.demographics.gender_split,
        interests: { list: data.audience.interests },
        pain_points: data.audience.pain_points,
        motivations: data.audience.motivations,
        goals: data.audience.goals,
        platform_preferences: { platforms: data.audience.preferred_platforms },
        facebook_targeting: data.audience.platform_targeting.facebook,
        instagram_targeting: data.audience.platform_targeting.instagram,
        linkedin_targeting: data.audience.platform_targeting.linkedin,
        tiktok_targeting: data.audience.platform_targeting.tiktok,
        twitter_targeting: data.audience.platform_targeting.twitter,
        youtube_targeting: data.audience.platform_targeting.youtube,
        estimated_size: data.audience.estimated_size,
        confidence_score: data.audience.confidence_score,
        ai_insights: data.audience.insights
      };

      const { data: newAudience, error: insertError } = await supabase
        .from('company_audiences')
        .insert([audienceData])
        .select()
        .single();

      if (insertError) throw insertError;

      setAudiences(prev => [newAudience, ...prev]);

      toast({
        title: "Audiencia creada",
        description: "Se ha generado una audiencia basada en tu perfil ICP",
      });

    } catch (error) {
      console.error('Error creating audience from ICP:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la audiencia desde el ICP",
        variant: "destructive",
      });
    }
  };

  const analyzeAudienceForPlatforms = async (audience: Audience) => {
    try {
      setAnalyzingAudience(audience.id);

      const { data, error } = await supabase.functions.invoke('audience-intelligence-analysis', {
        body: {
          action: 'platform_optimization',
          audienceData: audience,
          companyData: companyData,
          platforms: audience.platform_preferences?.platforms || []
        }
      });

      if (error) throw error;

      // Update audience with platform-specific insights
      const updateData = {
        facebook_targeting: data.optimization.platform_strategies.facebook,
        instagram_targeting: data.optimization.platform_strategies.instagram,
        linkedin_targeting: data.optimization.platform_strategies.linkedin,
        tiktok_targeting: data.optimization.platform_strategies.tiktok,
        twitter_targeting: data.optimization.platform_strategies.twitter,
        youtube_targeting: data.optimization.platform_strategies.youtube,
        ai_insights: data.optimization,
        last_analysis_date: new Date().toISOString(),
        confidence_score: 0.9
      };

      const { error: updateError } = await supabase
        .from('company_audiences')
        .update(updateData)
        .eq('id', audience.id);

      if (updateError) throw updateError;

      // Reload audiences to show updated data
      loadInitialData();

      toast({
        title: "Análisis completado",
        description: "Se ha optimizado la audiencia para cada plataforma",
      });

    } catch (error) {
      console.error('Error analyzing audience:', error);
      toast({
        title: "Error en análisis",
        description: "No se pudo analizar la audiencia",
        variant: "destructive",
      });
    } finally {
      setAnalyzingAudience(null);
    }
  };

  const PlatformCharacterization = ({ audience }: { audience: Audience }) => {
    const getPlatformStrategy = (platform: string) => {
      const targeting = audience[`${platform}_targeting` as keyof Audience];
      return targeting as any;
    };

    return (
      <div className="grid gap-6 md:grid-cols-2">
        {platforms.map((platform) => {
          const strategy = getPlatformStrategy(platform.id);
          if (!strategy) return null;

          return (
            <Card key={platform.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full ${platform.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {platform.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{platform.name}</CardTitle>
                    <CardDescription className="text-sm">{platform.demographic}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Estrategia de Contenido</Label>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {strategy?.creative_recommendations?.slice(0, 3).map((rec: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {rec}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Targeting</Label>
                    <div className="mt-2 space-y-1 text-sm">
                      {strategy?.targeting_parameters && (
                        <div className="flex items-center space-x-2">
                          <Target className="w-3 h-3 text-primary" />
                          <span>{Object.keys(strategy.targeting_parameters).slice(0, 2).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">KPIs Principales</Label>
                    <div className="mt-2 flex space-x-2">
                      <Badge variant="outline" className="text-xs">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Engagement
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Reach
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando experiencia de audiencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-muted/30">
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center space-x-2 bg-gradient-primary px-4 py-2 rounded-full text-white text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Audiencias Inteligentes</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Conoce a tu Audiencia Perfecta
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Utiliza IA para generar perfiles ICP precisos y estrategias específicas para cada red social
          </p>
        </div>

        {/* Company Context */}
        {companyData && (
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5" />
                <span>Contexto Empresarial</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Empresa</Label>
                  <p className="text-lg font-medium">{companyData.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Industria</Label>
                  <p className="text-lg">{companyData.industry_sector}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Tamaño</Label>
                  <p className="text-lg">{companyData.company_size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            <TabsTrigger value="icp">Perfil ICP</TabsTrigger>
            <TabsTrigger value="audiences">Mis Audiencias</TabsTrigger>
            <TabsTrigger value="platforms">Por Plataforma</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    <span>Audiencias Creadas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-500">{audiences.length}</div>
                  <p className="text-muted-foreground">Perfiles activos</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <span>Análisis IA</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-500">
                    {audiences.filter(a => a.ai_insights).length}
                  </div>
                  <p className="text-muted-foreground">Con insights IA</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span>Confianza Promedio</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">
                    {audiences.length > 0 
                      ? Math.round(audiences.reduce((sum, a) => sum + a.confidence_score, 0) / audiences.length * 100)
                      : 0}%
                  </div>
                  <p className="text-muted-foreground">Precisión IA</p>
                </CardContent>
              </Card>
            </div>

            {/* Platform Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Estrategia por Plataforma</CardTitle>
                <CardDescription>Características únicas de cada red social</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {platforms.map((platform) => (
                    <div key={platform.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-8 h-8 rounded ${platform.color} flex items-center justify-center text-white text-sm`}>
                          {platform.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold">{platform.name}</h4>
                          <p className="text-xs text-muted-foreground">{platform.demographic}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{platform.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ICP Tab */}
          <TabsContent value="icp" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Perfil de Cliente Ideal (ICP)</span>
                    </CardTitle>
                    <CardDescription>
                      Genera un perfil detallado de tu cliente ideal basado en tu empresa
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={generateICPProfile}
                    disabled={generatingICP}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {generatingICP ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2"></div>
                        Generando...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Generar ICP con IA
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              {icpProfile && (
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Demographic Profile */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>Perfil Demográfico</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Edad:</span>
                          <span className="font-medium">{icpProfile.demographic.age_range}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Género:</span>
                          <span className="font-medium">{icpProfile.demographic.gender}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ingresos:</span>
                          <span className="font-medium">{icpProfile.demographic.income_level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Educación:</span>
                          <span className="font-medium">{icpProfile.demographic.education}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Professional Profile */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Briefcase className="w-4 h-4" />
                          <span>Perfil Profesional</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cargo:</span>
                          <span className="font-medium">{icpProfile.professional.job_title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Industria:</span>
                          <span className="font-medium">{icpProfile.professional.industry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tamaño empresa:</span>
                          <span className="font-medium">{icpProfile.professional.company_size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Experiencia:</span>
                          <span className="font-medium">{icpProfile.professional.experience_level}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Behavioral Profile */}
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Brain className="w-4 h-4" />
                          <span>Perfil Comportamental</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                          <div>
                            <Label className="font-semibold text-sm">Pain Points</Label>
                            <div className="mt-2 space-y-1">
                              {icpProfile.behavioral.pain_points.map((point, index) => (
                                <Badge key={index} variant="destructive" className="text-xs block w-fit">
                                  {point}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="font-semibold text-sm">Motivaciones</Label>
                            <div className="mt-2 space-y-1">
                              {icpProfile.behavioral.motivations.map((motivation, index) => (
                                <Badge key={index} variant="default" className="text-xs block w-fit">
                                  {motivation}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="font-semibold text-sm">Objetivos</Label>
                            <div className="mt-2 space-y-1">
                              {icpProfile.behavioral.goals.map((goal, index) => (
                                <Badge key={index} variant="secondary" className="text-xs block w-fit">
                                  {goal}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <Button 
                      onClick={generateAudienceFromICP}
                      className="bg-gradient-primary hover:opacity-90"
                      size="lg"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Crear Audiencia desde ICP
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Audiences Tab */}
          <TabsContent value="audiences" className="space-y-6">
            {audiences.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No hay audiencias definidas</h3>
                  <p className="text-muted-foreground mb-6">
                    Genera tu primer perfil ICP para crear audiencias precisas
                  </p>
                  <Button 
                    onClick={() => setActiveTab("icp")}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Generar ICP
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {audiences.map((audience) => (
                  <Card key={audience.id} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-xl">{audience.name}</CardTitle>
                          <CardDescription>{audience.description}</CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedAudience(audience)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Confidence Score */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">Confianza IA</span>
                            <span className="text-sm font-medium">{Math.round(audience.confidence_score * 100)}%</span>
                          </div>
                          <Progress value={audience.confidence_score * 100} className="h-2" />
                        </div>

                        {/* Platform badges */}
                        {audience.platform_preferences?.platforms && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Plataformas:</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {audience.platform_preferences.platforms.map((platformId: string) => {
                                const platform = platforms.find(p => p.id === platformId);
                                return platform ? (
                                  <Badge key={platformId} variant="outline" className="text-xs">
                                    {platform.icon} {platform.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}

                        {/* Quick insights */}
                        {audience.pain_points && audience.pain_points.length > 0 && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Pain Points:</Label>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {audience.pain_points.slice(0, 2).map((point, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {point}
                                </Badge>
                              ))}
                              {audience.pain_points.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{audience.pain_points.length - 2} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <Button
                          size="sm"
                          onClick={() => analyzeAudienceForPlatforms(audience)}
                          disabled={analyzingAudience === audience.id}
                          className="w-full bg-gradient-primary hover:opacity-90"
                        >
                          {analyzingAudience === audience.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-2"></div>
                              Optimizando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Optimizar por Plataforma
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Platforms Tab */}
          <TabsContent value="platforms">
            {selectedAudience ? (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedAudience(null)}
                    className="p-2"
                  >
                    ← Volver
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedAudience.name}</h2>
                    <p className="text-muted-foreground">Estrategias específicas por plataforma</p>
                  </div>
                </div>
                
                <PlatformCharacterization audience={selectedAudience} />
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Selecciona una Audiencia</h3>
                  <p className="text-muted-foreground mb-6">
                    Elige una audiencia para ver sus estrategias específicas por plataforma
                  </p>
                  <Button onClick={() => setActiveTab("audiences")}>
                    Ver Audiencias
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detailed Audience Modal */}
      {selectedAudience && (
        <Dialog open={!!selectedAudience} onOpenChange={() => setSelectedAudience(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedAudience.name}</DialogTitle>
              <DialogDescription>{selectedAudience.description}</DialogDescription>
            </DialogHeader>
            
            <PlatformCharacterization audience={selectedAudience} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AudienciasManager;