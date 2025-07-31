import { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, MapPin, Hash, Users, BarChart3, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarEntry {
  id: string;
  platform: string;
  post_type: string;
  post_title: string;
  published_at: string;
  day_of_week: number;
  hour_of_day: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  engagement_rate: number;
  hashtags: string[];
  location_name?: string;
  performance_score: number;
}

interface CalendarStats {
  total_posts: number;
  avg_engagement_rate: number;
  best_posting_hours: number[];
  best_posting_days: number[];
  posting_frequency: number;
  top_hashtags: string[];
  content_type_distribution: { [key: string]: number };
}

export function SocialMediaCalendar() {
  const [calendarData, setCalendarData] = useState<CalendarEntry[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const { toast } = useToast();

  const platforms = ['all', 'instagram', 'facebook', 'tiktok', 'linkedin'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  useEffect(() => {
    loadCalendarData();
  }, [selectedPlatform]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('social_media_calendar')
        .select('*')
        .order('published_at', { ascending: false });

      if (selectedPlatform !== 'all') {
        query = query.eq('platform', selectedPlatform);
      }

      const { data, error } = await query;

      if (error) throw error;

      setCalendarData(data || []);
      calculateStats(data || []);

    } catch (error: any) {
      console.error('Error loading calendar data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del calendario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: CalendarEntry[]) => {
    if (data.length === 0) {
      setStats(null);
      return;
    }

    const totalEngagement = data.reduce((sum, post) => sum + (post.engagement_rate || 0), 0);
    const avgEngagementRate = totalEngagement / data.length;

    // Calcular mejores horarios
    const hourStats: { [key: number]: { count: number, totalEngagement: number } } = {};
    const dayStats: { [key: number]: { count: number, totalEngagement: number } } = {};

    data.forEach(post => {
      const hour = post.hour_of_day;
      const day = post.day_of_week;

      if (!hourStats[hour]) hourStats[hour] = { count: 0, totalEngagement: 0 };
      if (!dayStats[day]) dayStats[day] = { count: 0, totalEngagement: 0 };

      hourStats[hour].count++;
      hourStats[hour].totalEngagement += post.engagement_rate || 0;
      dayStats[day].count++;
      dayStats[day].totalEngagement += post.engagement_rate || 0;
    });

    const bestHours = Object.entries(hourStats)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        avgEngagement: stats.totalEngagement / stats.count
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3)
      .map(item => item.hour);

    const bestDays = Object.entries(dayStats)
      .map(([day, stats]) => ({
        day: parseInt(day),
        avgEngagement: stats.totalEngagement / stats.count
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 3)
      .map(item => item.day);

    // Calcular hashtags más usados
    const hashtagCount: { [key: string]: number } = {};
    data.forEach(post => {
      (post.hashtags || []).forEach(hashtag => {
        hashtagCount[hashtag] = (hashtagCount[hashtag] || 0) + 1;
      });
    });

    const topHashtags = Object.entries(hashtagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([hashtag]) => hashtag);

    // Distribución de tipos de contenido
    const contentTypes: { [key: string]: number } = {};
    data.forEach(post => {
      const type = post.post_type || 'unknown';
      contentTypes[type] = (contentTypes[type] || 0) + 1;
    });

    // Calcular frecuencia de publicación
    const dates = data.map(post => new Date(post.published_at)).sort();
    const daysDiff = dates.length > 1 
      ? (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24)
      : 1;
    const postingFrequency = data.length / Math.max(daysDiff, 1);

    setStats({
      total_posts: data.length,
      avg_engagement_rate: avgEngagementRate,
      best_posting_hours: bestHours,
      best_posting_days: bestDays,
      posting_frequency: postingFrequency,
      top_hashtags: topHashtags,
      content_type_distribution: contentTypes
    });
  };

  const generateCalendarView = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Crear matriz del calendario
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendarDays = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayPosts = calendarData.filter(post => {
        const postDate = new Date(post.published_at);
        return postDate.toDateString() === date.toDateString();
      });

      calendarDays.push({
        date,
        posts: dayPosts,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === now.toDateString()
      });
    }

    return calendarDays;
  };

  const processCalendarData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('advanced-social-analyzer', {
        body: {
          platform: selectedPlatform === 'all' ? 'instagram' : selectedPlatform,
          action: 'process_calendar_data'
        }
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Datos del calendario procesados correctamente",
      });

      loadCalendarData();

    } catch (error: any) {
      console.error('Error processing calendar data:', error);
      toast({
        title: "Error",
        description: "No se pudieron procesar los datos del calendario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEngagementColor = (rate: number) => {
    if (rate >= 5) return 'bg-green-500';
    if (rate >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      instagram: '📸',
      facebook: '👥',
      tiktok: '🎵',
      linkedin: '💼'
    };
    return icons[platform] || '📱';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Calendario de Publicaciones</h2>
          <p className="text-muted-foreground">
            Análisis temporal de tu actividad en redes sociales
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
                {platform === 'all' ? 'Todas las plataformas' : platform.charAt(0).toUpperCase() + platform.slice(1)}
              </option>
            ))}
          </select>
          <Button onClick={processCalendarData} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Actualizar Datos
              </>
            )}
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_posts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.posting_frequency.toFixed(2)} posts/día
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avg_engagement_rate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                En todas las publicaciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mejores Horarios</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.best_posting_hours.map(h => `${h}h`).join(', ')}
              </div>
              <p className="text-xs text-muted-foreground">
                Horas con mayor engagement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mejores Días</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.best_posting_days.map(d => dayNames[d]).join(', ')}
              </div>
              <p className="text-xs text-muted-foreground">
                Días con mayor engagement
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Vista de Calendario</CardTitle>
              <CardDescription>
                Visualiza tus publicaciones distribuidas por días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarView().map((day, index) => (
                  <div
                    key={index}
                    className={`
                      p-2 min-h-[80px] border rounded-lg
                      ${day.isCurrentMonth ? 'bg-background' : 'bg-muted/50'}
                      ${day.isToday ? 'ring-2 ring-primary' : ''}
                    `}
                  >
                    <div className="text-sm font-medium mb-1">
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {day.posts.slice(0, 2).map((post, postIndex) => (
                        <div
                          key={postIndex}
                          className={`
                            w-full h-2 rounded-full text-xs px-1 flex items-center
                            ${getEngagementColor(post.engagement_rate)}
                          `}
                          title={`${getPlatformIcon(post.platform)} ${post.post_title} - ${post.engagement_rate.toFixed(1)}%`}
                        >
                          <span className="text-white text-xs">
                            {getPlatformIcon(post.platform)}
                          </span>
                        </div>
                      ))}
                      {day.posts.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{day.posts.length - 2} más
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo de Contenido</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && Object.entries(stats.content_type_distribution).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center mb-2">
                    <span className="capitalize">{type}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Patrones de Publicación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Horarios Óptimos</h4>
                    <div className="flex flex-wrap gap-2">
                      {stats?.best_posting_hours.map(hour => (
                        <Badge key={hour} variant="secondary">
                          {hour}:00
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Días Óptimos</h4>
                    <div className="flex flex-wrap gap-2">
                      {stats?.best_posting_days.map(day => (
                        <Badge key={day} variant="secondary">
                          {dayNames[day]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Frecuencia</h4>
                    <p className="text-sm text-muted-foreground">
                      {stats?.posting_frequency.toFixed(2)} publicaciones por día
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hashtags">
          <Card>
            <CardHeader>
              <CardTitle>Hashtags Más Utilizados</CardTitle>
              <CardDescription>
                Los hashtags que más utilizas en tus publicaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats?.top_hashtags.map((hashtag, index) => (
                  <Badge key={hashtag} variant={index < 3 ? "default" : "secondary"}>
                    <Hash className="w-3 h-3 mr-1" />
                    {hashtag.replace('#', '')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Insights del Calendario</CardTitle>
              <CardDescription>
                Recomendaciones basadas en tu historial de publicaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats && stats.avg_engagement_rate > 5 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800">✅ Excelente Engagement</h4>
                    <p className="text-green-700 text-sm">
                      Tu tasa de engagement promedio ({stats.avg_engagement_rate.toFixed(2)}%) está por encima del promedio.
                    </p>
                  </div>
                )}
                
                {stats && stats.posting_frequency < 0.5 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800">⚠️ Baja Frecuencia</h4>
                    <p className="text-yellow-700 text-sm">
                      Considera aumentar tu frecuencia de publicación para mantener el engagement.
                    </p>
                  </div>
                )}

                {stats && stats.best_posting_hours.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800">💡 Horarios Óptimos</h4>
                    <p className="text-blue-700 text-sm">
                      Tus mejores horarios para publicar son: {stats.best_posting_hours.map(h => `${h}:00`).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}