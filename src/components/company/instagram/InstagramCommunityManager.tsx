import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Instagram, MessageCircle, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { InstagramPostGrid } from './InstagramPostGrid';
import { InstagramCommentViewer } from './InstagramCommentViewer';
import { InstagramDMInbox } from './InstagramDMInbox';

interface InstagramCommunityManagerProps {
  profile: any;
  companyUsername?: string;
}

export const InstagramCommunityManager = ({ profile, companyUsername }: InstagramCommunityManagerProps) => {
  const { t } = useTranslation('marketing');
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedPostUrl, setSelectedPostUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(companyUsername || null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInstagramConnection();
  }, [profile]);

  const checkInstagramConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('social_accounts')
        .select('company_username, is_connected')
        .eq('user_id', user.id)
        .eq('platform', 'instagram')
        .single();

      if (data?.is_connected) {
        setIsConnected(true);
        // Get the company username from upload_post_profile
        const { data: profileData } = await supabase
          .from('social_accounts')
          .select('company_username')
          .eq('user_id', user.id)
          .eq('platform', 'upload_post_profile')
          .single();
        setUsername(profileData?.company_username || companyUsername || null);
      }
    } catch (e) {
      console.warn('Error checking Instagram connection:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSelect = (mediaId: string, postUrl?: string) => {
    setSelectedMediaId(mediaId);
    setSelectedPostUrl(postUrl || null);
    setActiveTab('comments');
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            {t('hub.instagram.notConnected')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white">
        <CardTitle className="flex items-center gap-2">
          <Instagram className="w-5 h-5" />
          {t('hub.instagram.title')}
        </CardTitle>
        <CardDescription className="text-pink-100">
          {t('hub.instagram.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              <span className="hidden sm:inline">{t('hub.instagram.tabs.posts')}</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t('hub.instagram.tabs.comments')}</span>
            </TabsTrigger>
            <TabsTrigger value="dms" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">{t('hub.instagram.tabs.dms')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <InstagramPostGrid
              companyUsername={username || ''}
              onSelectPost={handlePostSelect}
            />
          </TabsContent>

          <TabsContent value="comments">
            <InstagramCommentViewer
              companyUsername={username || ''}
              mediaId={selectedMediaId}
              postUrl={selectedPostUrl}
            />
          </TabsContent>

          <TabsContent value="dms">
            <InstagramDMInbox
              companyUsername={username || ''}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
