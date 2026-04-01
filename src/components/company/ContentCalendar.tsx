import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation(['marketing', 'errors']);

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
        title: t('errors:general.title'),
        description: t('marketing:calendar.loadError'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/10 text-blue-500';
      case 'published': return 'bg-green-500/10 text-green-500';
      case 'failed': return 'bg-red-500/10 text-red-500';
      case 'processing': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return t('marketing:calendar.status.scheduled');
      case 'published': return t('marketing:calendar.status.published');
      case 'failed': return t('marketing:calendar.status.failed');
      case 'processing': return t('marketing:calendar.status.processing');
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
        title: t('marketing:calendar.postDeleted'),
        description: t('marketing:calendar.postDeletedDesc')
      });

      await loadScheduledPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: t('errors:general.title'),
        description: t('marketing:calendar.deleteError'),
        variant: 'destructive'
      });
    }
  };

  const weekDaysKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    const headerDays = weekDaysKeys.map(day => (
      <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b border-border">
        {t(`marketing:calendar.weekDays.${day}`)}
      </div>
    ));

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-2 border-b border-r border-border min-h-[120px]"></div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const postsForDay = getPostsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push(
        <div 
          key={day} 
          className={`p-2 border-b border-r border-border min-h-[120px] cursor-pointer hover:bg-muted/50 transition-colors ${
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
                +{postsForDay.length - 3} {t('marketing:calendar.more')}
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
          {t('marketing:calendar.upcomingPosts')}
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
                           post.content?.content || post.content?.text || t('marketing:calendar.noContent');
            
            return (
              <div key={post.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
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
                      {new Date(post.scheduled_for).toLocaleDateString(i18n.language)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(post.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {post.error_message && (
                    <p className="text-xs text-destructive mt-1">
                      {t('errors:general.title')}: {post.error_message}
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
            <p>{t('marketing:calendar.noPosts')}</p>
            <p className="text-sm">{t('marketing:calendar.noPostsHint')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('marketing:calendar.loading')}</span>
      </div>
    );
  }

  const viewModeLabels: Record<string, string> = {
    month: t('marketing:calendar.viewMonth'),
    week: t('marketing:calendar.viewWeek'),
    day: t('marketing:calendar.viewDay')
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('marketing:calendar.title')}</h2>
          <p className="text-muted-foreground">
            {t('marketing:calendar.subtitle')}
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => loadScheduledPosts()}
        >
          <RefreshCw className="h-4 w-4" />
          {t('marketing:calendar.refresh')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.scheduled}</div>
            <div className="text-sm text-muted-foreground">{t('marketing:calendar.statsScheduled')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.published}</div>
            <div className="text-sm text-muted-foreground">{t('marketing:calendar.statsPublished')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-orange-500">{stats.today}</div>
            <div className="text-sm text-muted-foreground">{t('marketing:calendar.statsToday')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">{t('marketing:calendar.statsFailed')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {currentDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
              </h3>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {(['month', 'week', 'day'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(mode)}
                  className="h-8 px-3"
                >
                  {viewModeLabels[mode]}
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
        
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('marketing:calendar.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { nameKey: 'marketing:calendar.actions.createContent', time: '2 min' },
              { nameKey: 'marketing:calendar.actions.scheduleCampaign', time: '5 min' },
              { nameKey: 'marketing:calendar.actions.reviewErrors', time: '1 min' },
              { nameKey: 'marketing:calendar.actions.viewMetrics', time: '1 min' }
            ].map((action, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <div>
                  <p className="font-medium text-sm">{t(action.nameKey)}</p>
                  <p className="text-xs text-muted-foreground">~{action.time} {t('marketing:calendar.toComplete')}</p>
                </div>
                <Button variant="outline" size="sm">
                  {t('marketing:calendar.go')}
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