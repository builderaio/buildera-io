import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Instagram,
  Linkedin,
  Music,
  Facebook,
  Twitter,
  Youtube,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface MarketingCalendarProps {
  profile: any;
}

interface ScheduledPost {
  id: string;
  platform: string;
  content: string;
  scheduledTime: Date;
  status: 'scheduled' | 'published' | 'failed';
  type: 'text' | 'image' | 'video';
}

const MarketingCalendar = ({ profile }: MarketingCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Mock data para posts programados
  const scheduledPosts: ScheduledPost[] = [
    {
      id: '1',
      platform: 'linkedin',
      content: 'Nuevo artículo sobre tendencias de marketing digital...',
      scheduledTime: new Date(2024, 0, 15, 14, 0),
      status: 'scheduled',
      type: 'text'
    },
    {
      id: '2',
      platform: 'instagram',
      content: 'Behind the scenes de nuestro equipo...',
      scheduledTime: new Date(2024, 0, 16, 10, 30),
      status: 'scheduled',
      type: 'image'
    },
    {
      id: '3',
      platform: 'tiktok',
      content: 'Tutorial rápido sobre productividad...',
      scheduledTime: new Date(2024, 0, 17, 16, 0),
      status: 'scheduled',
      type: 'video'
    }
  ];

  const platforms = {
    linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
    instagram: { name: 'Instagram', icon: Instagram, color: 'bg-pink-600' },
    tiktok: { name: 'TikTok', icon: Music, color: 'bg-black' },
    facebook: { name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
    twitter: { name: 'Twitter/X', icon: Twitter, color: 'bg-black' },
    youtube: { name: 'YouTube', icon: Youtube, color: 'bg-red-600' }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programado';
      case 'published': return 'Publicado';
      case 'failed': return 'Error';
      default: return status;
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
      const postDate = new Date(post.scheduledTime);
      return postDate.toDateString() === date.toDateString();
    });
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
              const IconComponent = platform.icon;
              
              return (
                <div 
                  key={post.id} 
                  className={`text-xs p-1 rounded ${platform.color} text-white truncate flex items-center gap-1`}
                >
                  <IconComponent className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {post.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
          .slice(0, 5)
          .map((post) => {
            const platform = platforms[post.platform as keyof typeof platforms];
            const IconComponent = platform.icon;
            
            return (
              <div key={post.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded ${platform.color}`}>
                  <IconComponent className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{platform.name}</span>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(post.status)}`}>
                      {getStatusLabel(post.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-2">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {post.scheduledTime.toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendario de Marketing</h2>
          <p className="text-muted-foreground">
            Programa y gestiona tus publicaciones en redes sociales
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Programar Post
        </Button>
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

      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-primary">12</div>
            <div className="text-sm text-muted-foreground">Posts programados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-sm text-muted-foreground">Publicados esta semana</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">4</div>
            <div className="text-sm text-muted-foreground">Pendientes hoy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">95%</div>
            <div className="text-sm text-muted-foreground">Tasa de éxito</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderUpcomingPosts()}
        
        {/* Plantillas rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Plantillas Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Post promocional', time: '2 min' },
              { name: 'Contenido educativo', time: '3 min' },
              { name: 'Behind the scenes', time: '1 min' },
              { name: 'Testimonio cliente', time: '4 min' }
            ].map((template, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <div>
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground">~{template.time} para completar</p>
                </div>
                <Button variant="outline" size="sm">
                  Usar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketingCalendar;