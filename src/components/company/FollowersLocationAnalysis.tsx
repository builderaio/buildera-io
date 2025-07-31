import { useState, useEffect } from 'react';
import { MapPin, Globe, Users, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  id: string;
  country: string;
  country_code: string;
  region?: string;
  city?: string;
  followers_count: number;
  percentage: number;
  avg_age?: number;
  gender_distribution?: any;
  language_distribution?: any;
  peak_activity_hours?: number[];
  market_potential_score?: number;
  confidence_score: number;
}

interface AudienceInsight {
  insight_type: string;
  audience_segment: string;
  age_ranges?: any;
  gender_split?: any;
  interests?: any;
  online_activity_patterns?: any;
  content_preferences?: any;
  conversion_potential?: number;
}

export function FollowersLocationAnalysis() {
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [audienceInsights, setAudienceInsights] = useState<AudienceInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const { toast } = useToast();

  const platforms = ['instagram', 'facebook', 'tiktok', 'linkedin'];

  useEffect(() => {
    loadLocationData();
    loadAudienceInsights();
  }, [selectedPlatform]);

  const loadLocationData = async () => {
    try {
      const { data, error } = await supabase
        .from('followers_location_analysis')
        .select('*')
        .eq('platform', selectedPlatform)
        .order('followers_count', { ascending: false });

      if (error) throw error;
      setLocationData(data || []);

    } catch (error: any) {
      console.error('Error loading location data:', error);
    }
  };

  const loadAudienceInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('audience_insights')
        .select('*')
        .eq('platform', selectedPlatform)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudienceInsights(data || []);

    } catch (error: any) {
      console.error('Error loading audience insights:', error);
    }
  };

  const analyzeFollowersLocation = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('advanced-social-analyzer', {
        body: {
          platform: selectedPlatform,
          action: 'analyze_followers_location'
        }
      });

      if (error) throw error;

      toast({
        title: "Análisis Completado",
        description: `Se analizaron las ubicaciones de seguidores para ${selectedPlatform}`,
      });

      loadLocationData();

    } catch (error: any) {
      console.error('Error analyzing followers location:', error);
      toast({
        title: "Error",
        description: "No se pudo completar el análisis de ubicaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAudienceInsights = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('advanced-social-analyzer', {
        body: {
          platform: selectedPlatform,
          action: 'generate_audience_insights'
        }
      });

      if (error) throw error;

      toast({
        title: "Insights Generados",
        description: "Se generaron nuevos insights de audiencia",
      });

      loadAudienceInsights();

    } catch (error: any) {
      console.error('Error generating audience insights:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar los insights de audiencia",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCountryFlag = (countryCode: string) => {
    const flags: { [key: string]: string } = {
      'US': '🇺🇸',
      'MX': '🇲🇽',
      'ES': '🇪🇸',
      'AR': '🇦🇷',
      'CO': '🇨🇴',
      'CL': '🇨🇱',
      'PE': '🇵🇪',
      'BR': '🇧🇷',
      'VE': '🇻🇪',
      'EC': '🇪🇨'
    };
    return flags[countryCode] || '🌍';
  };

  const getTotalFollowers = () => {
    return locationData.reduce((sum, location) => sum + location.followers_count, 0);
  };

  const getTopCountries = () => {
    return locationData.slice(0, 5);
  };

  const getMarketOpportunities = () => {
    return locationData
      .filter(location => location.market_potential_score && location.market_potential_score > 70)
      .slice(0, 3);
  };

  const getDemographicInsights = () => {
    return audienceInsights.find(insight => insight.insight_type === 'demographic');
  };

  const getBehavioralInsights = () => {
    return audienceInsights.find(insight => insight.insight_type === 'behavioral');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Análisis de Ubicación de Seguidores</h2>
          <p className="text-muted-foreground">
            Descubre dónde están tus seguidores y qué oportunidades de mercado tienes
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            {platforms.map(platform => (
              <option key={platform} value={platform}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </option>
            ))}
          </select>
          <Button onClick={analyzeFollowersLocation} disabled={loading}>
            <MapPin className="w-4 h-4 mr-2" />
            {loading ? 'Analizando...' : 'Analizar Ubicaciones'}
          </Button>
          <Button onClick={generateAudienceInsights} disabled={loading} variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Generar Insights
          </Button>
        </div>
      </div>

      {locationData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Seguidores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalFollowers().toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Analizados por ubicación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Países Identificados</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{locationData.length}</div>
              <p className="text-xs text-muted-foreground">
                Diversidad geográfica
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">País Principal</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getCountryFlag(getTopCountries()[0]?.country_code)} {getTopCountries()[0]?.country}
              </div>
              <p className="text-xs text-muted-foreground">
                {getTopCountries()[0]?.percentage.toFixed(1)}% de seguidores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Oportunidades</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getMarketOpportunities().length}</div>
              <p className="text-xs text-muted-foreground">
                Mercados con potencial
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="map">Mapa de Ubicaciones</TabsTrigger>
          <TabsTrigger value="demographics">Demografía</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
          <TabsTrigger value="insights">Insights Avanzados</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Países por Seguidores</CardTitle>
                <CardDescription>
                  Distribución geográfica de tu audiencia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getTopCountries().map((location, index) => (
                    <div key={location.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getCountryFlag(location.country_code)}</span>
                        <div>
                          <p className="font-medium">{location.country}</p>
                          <p className="text-sm text-muted-foreground">
                            {location.followers_count.toLocaleString()} seguidores
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{location.percentage.toFixed(1)}%</p>
                        <Progress value={location.percentage} className="w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Confianza del Análisis</CardTitle>
                <CardDescription>
                  Precisión de los datos geográficos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {locationData.slice(0, 5).map((location) => (
                    <div key={location.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {getCountryFlag(location.country_code)} {location.country}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Progress value={location.confidence_score} className="w-16" />
                        <span className="text-sm">{location.confidence_score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getDemographicInsights() && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Edad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(getDemographicInsights()?.age_ranges || {}).map(([range, percentage]) => (
                        <div key={range} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{range} años</span>
                           <div className="flex items-center space-x-2">
                             <Progress value={Number(percentage) || 0} className="w-20" />
                             <span className="text-sm">{Number(percentage) || 0}%</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Género</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(getDemographicInsights()?.gender_split || {}).map(([gender, percentage]) => (
                        <div key={gender} className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">{gender}</span>
                           <div className="flex items-center space-x-2">
                             <Progress value={Number(percentage) || 0} className="w-20" />
                             <span className="text-sm">{Number(percentage) || 0}%</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {locationData.some(l => l.language_distribution) && (
              <Card>
                <CardHeader>
                  <CardTitle>Idiomas de la Audiencia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Mostrar idiomas más comunes */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Español - 65%</Badge>
                      <Badge variant="outline">Inglés - 25%</Badge>
                      <Badge variant="outline">Portugués - 10%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="opportunities">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mercados con Mayor Potencial</CardTitle>
                <CardDescription>
                  Países con oportunidades de crecimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getMarketOpportunities().map((market) => (
                    <div key={market.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{getCountryFlag(market.country_code)}</span>
                          <span className="font-medium">{market.country}</span>
                        </div>
                        <Badge variant="secondary">
                          Score: {market.market_potential_score}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>• {market.followers_count.toLocaleString()} seguidores ({market.percentage.toFixed(1)}%)</p>
                        {market.peak_activity_hours && (
                          <p>• Picos de actividad: {market.peak_activity_hours.map(h => `${h}h`).join(', ')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recomendaciones Estratégicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">🎯 Localización de Contenido</h4>
                    <p className="text-blue-700 text-sm">
                      Adapta tu contenido a los principales mercados: {getTopCountries().slice(0, 3).map(c => c.country).join(', ')}
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">🌐 Expansión Geográfica</h4>
                    <p className="text-green-700 text-sm">
                      Considera campañas específicas para mercados emergentes con alto potencial
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">⏰ Horarios Óptimos</h4>
                    <p className="text-purple-700 text-sm">
                      Ajusta tus horarios de publicación según las zonas horarias principales
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getDemographicInsights()?.interests && (
              <Card>
                <CardHeader>
                  <CardTitle>Intereses de la Audiencia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(getDemographicInsights()?.interests || {}).map(([interest, score]) => (
                      <div key={interest} className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{interest}</span>
                         <div className="flex items-center space-x-2">
                           <Progress value={Number(score) || 0} className="w-20" />
                           <span className="text-sm">{Number(score) || 0}%</span>
                         </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {getBehavioralInsights() && (
              <Card>
                <CardHeader>
                  <CardTitle>Patrones de Comportamiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getBehavioralInsights()?.online_activity_patterns?.peak_hours && (
                      <div>
                        <h4 className="font-medium mb-2">Horarios de Mayor Actividad</h4>
                        <div className="flex flex-wrap gap-2">
                          {getBehavioralInsights()?.online_activity_patterns?.peak_hours.map(hour => (
                            <Badge key={hour} variant="outline">
                              {hour}:00
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {getBehavioralInsights()?.content_preferences && (
                      <div>
                        <h4 className="font-medium mb-2">Preferencias de Contenido</h4>
                        <div className="text-sm text-muted-foreground">
                          <p>• Videos y contenido visual</p>
                          <p>• Contenido con hashtags relevantes</p>
                          <p>• Stories interactivas</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}