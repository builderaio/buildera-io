import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaYoutube, FaXTwitter } from 'react-icons/fa6';

interface ContentCalendarProps {
  profile: any;
}

interface ScheduledPost {
  id: string;
  platform: string;
  content: any;
  scheduled_for: string;
  status: string;
  company_page_id: string;
  published_at?: string;
  error_message?: string;
}

const ContentCalendar = ({ profile }: ContentCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    scheduled: 0,
    published: 0,
    failed: 0,
    today: 0
  });

  const { toast } = useToast();

  const platforms = {
    linkedin: { name: 'LinkedIn', icon: FaLinkedin, color: 'bg-blue-700' },
    instagram: { name: 'Instagram', icon: FaInstagram, color: 'bg-pink-600' },
    tiktok: { name: 'TikTok', icon: FaTiktok, color: 'bg-[#000000]' },
    facebook: { name: 'Facebook', icon: FaFacebook, color: 'bg-blue-600' },
    twitter: { name: 'Twitter/X', icon: FaXTwitter, color: 'bg-[#000000]' },
    youtube: { name: 'YouTube', icon: FaYoutube, color: 'bg-red-600' }
  };

  useEffect(() => {
    if (profile?.user_id) {
      loadScheduledPosts();
    }
  }, [profile?.user_id, currentDate]);

  const loadScheduledPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;

      setScheduledPosts(data || []);
      
      // Calculate stats
      const today = new Date().toDateString();
      const newStats = {
        scheduled: data?.filter(p => p.status === 'scheduled').length || 0,
        published: data?.filter(p => p.status === 'published').length || 0,
        failed: data?.filter(p => p.status === 'failed').length || 0,
        today: data?.filter(p => new Date(p.scheduled_for).toDateString() === today).length || 0
      };
      setStats(newStats);

    } catch (error) {
      console.error('Error loading scheduled posts:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los posts programados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programado';
      case 'published': return 'Publicado';
      case 'failed': return 'Error';
      case 'processing': return 'Procesando';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return Clock;
      case 'published': return CheckCircle2;
      case 'failed': return AlertCircle;
      case 'processing': return RefreshCw;
      default: return Clock;
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduled_for);
      return postDate.toDateString() === date.toDateString();
    });
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: 'Post eliminado',
        description: 'El post programado ha sido eliminado'
      });

      await loadScheduledPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el post',
        variant: 'destructive'
      });
    }
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Días de la semana
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    // Header de días de la semana
    const headerDays = weekDays.map(day => (
      <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
        {day}
      </div>
    ));

    // Espacios vacíos al inicio del mes
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-2 border-b border-r min-h-[120px]"></div>
      );
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const postsForDay = getPostsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push(
        <div 
          key={day} 
          className={`p-2 border-b border-r min-h-[120px] cursor-pointer hover:bg-muted/50 transition-colors ${
            isToday ? 'bg-primary/5 border-primary' : ''
          } ${isSelected ? 'bg-primary/10' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className={`text-sm font-medium mb-2 ${isToday ? 'text-primary' : ''}`}>
            {day}
          </div>
          <div className="space-y-1">
            {postsForDay.slice(0, 3).map((post) => {
              const platform = platforms[post.platform as keyof typeof platforms];
              const IconComponent = platform?.icon || FaInstagram;
              const StatusIcon = getStatusIcon(post.status);
              
              return (
                <div 
                  key={post.id} 
                  className={`text-xs p-1 rounded ${platform?.color || 'bg-gray-500'} text-white truncate flex items-center gap-1`}
                >
                  <IconComponent className="h-3 w-3 flex-shrink-0" />
                  <StatusIcon className="h-2 w-2 flex-shrink-0" />
                  <span className="truncate">
                    {new Date(post.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            {postsForDay.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{postsForDay.length - 3} más
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 border border-border rounded-lg overflow-hidden">
        {headerDays}
        {days}
      </div>
    );
  };

  const renderUpcomingPosts = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Próximas Publicaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {scheduledPosts
          .filter(post => post.status === 'scheduled' && new Date(post.scheduled_for) > new Date())
          .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
          .slice(0, 5)
          .map((post) => {
            const platform = platforms[post.platform as keyof typeof platforms];
            const IconComponent = platform?.icon || FaInstagram;
            const StatusIcon = getStatusIcon(post.status);
            const content = typeof post.content === 'string' ? post.content : 
                           post.content?.content || post.content?.text || 'Sin contenido';
            
            return (
              <div key={post.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded ${platform?.color || 'bg-gray-500'}`}>
                  <IconComponent className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{platform?.name || post.platform}</span>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(post.status)}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {getStatusLabel(post.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-2">
                    {content.substring(0, 80)}...
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {new Date(post.scheduled_for).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(post.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {post.error_message && (
                    <p className="text-xs text-red-600 mt-1">
                      Error: {post.error_message}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive"
                    onClick={() => deletePost(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        {scheduledPosts.filter(post => post.status === 'scheduled' && new Date(post.scheduled_for) > new Date()).length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarIcon className="h-8 w-8 mx-auto mb-2" />
            <p>No hay publicaciones programadas</p>
            <p className="text-sm">Crea contenido programado desde las pestañas de creación</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando calendario...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendario de Contenido</h2>
          <p className="text-muted-foreground">
            Visualiza y gestiona todo tu contenido programado
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => loadScheduledPosts()}
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
            <div className="text-sm text-muted-foreground">Posts programados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <div className="text-sm text-muted-foreground">Posts publicados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.today}</div>
            <div className="text-sm text-muted-foreground">Para hoy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Con errores</div>
          </CardContent>
        </Card>
      </div>

      {/* Controles del calendario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h3>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {['month', 'week', 'day'].map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(mode as any)}
                  className="h-8 px-3"
                >
                  {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Día'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderCalendarGrid()}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderUpcomingPosts()}
        
        {/* Plantillas rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Crear contenido', action: 'create', time: '2 min' },
              { name: 'Programar campaña', action: 'campaign', time: '5 min' },
              { name: 'Revisar errores', action: 'errors', time: '1 min' },
              { name: 'Ver métricas', action: 'metrics', time: '1 min' }
            ].map((action, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <div>
                  <p className="font-medium text-sm">{action.name}</p>
                  <p className="text-xs text-muted-foreground">~{action.time} para completar</p>
                </div>
                <Button variant="outline" size="sm">
                  Ir
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentCalendar;