import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { SmartLoader } from "@/components/ui/smart-loader";
import { Image, Heart, MessageCircle, Copy, Eye, RefreshCw } from "lucide-react";

interface Profile { user_id?: string }

export default function ContentLibraryTab({ profile }: { profile: Profile }) {
  const { toast } = useToast();
  const { t } = useTranslation(['marketing', 'errors']);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [savedContent, setSavedContent] = useState<any[]>([]);

  const loadSavedContent = async () => {
    if (!profile?.user_id) return;
    try {
      const { data, error } = await supabase
        .from('content_library')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSavedContent(data || []);
    } catch (error) {
      console.error('Error loading saved content:', error);
    }
  };

  useEffect(() => {
    setLibraryLoading(true);
    loadSavedContent().finally(() => setLibraryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.user_id]);

  const deleteFromLibrary = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_library')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: t('marketing:contentLibrary.deleted'), description: t('marketing:contentLibrary.deletedDesc') });
      loadSavedContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({ title: t('errors:general.title'), description: t('marketing:contentLibrary.deleteError'), variant: "destructive" });
    }
  };

  const refreshLibrary = async () => {
    setLibraryLoading(true);
    await loadSavedContent();
    setLibraryLoading(false);
    toast({ title: t('marketing:contentLibrary.refreshed'), description: t('marketing:contentLibrary.refreshedDesc') });
  };

  if (libraryLoading) {
    return (
      <SmartLoader
        isVisible={true}
        type="generic"
        message={t('marketing:contentLibrary.loading')}
        size="md"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              {t('marketing:contentLibrary.title')}
              <Badge variant="secondary" className="ml-2">{savedContent.length} {t('marketing:contentLibrary.items')}</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshLibrary}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t('marketing:contentLibrary.refresh')}
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('marketing:contentLibrary.subtitle')}</p>
        </CardHeader>
        <CardContent>
          {savedContent.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full flex items-center justify-center">
                <Image className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('marketing:contentLibrary.emptyTitle')}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t('marketing:contentLibrary.emptyDesc')}</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{t('marketing:contentLibrary.tip1')}</p>
                <p>{t('marketing:contentLibrary.tip2')}</p>
                <p>{t('marketing:contentLibrary.tip3')}</p>
                <p>{t('marketing:contentLibrary.tip4')}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedContent.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{item.file_type}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {item.file_url && (
                      <div className="relative">
                        {item.file_type === 'video' ? (
                          <video 
                            src={item.file_url} 
                            className="w-full h-32 object-cover rounded-md"
                            controls={false}
                            muted
                            preload="metadata"
                          />
                        ) : (
                          <img 
                            src={item.file_url} 
                            alt={item.title || 'Content'} 
                            className="w-full h-32 object-cover rounded-md"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-sm mb-1">{item.title || t('marketing:contentLibrary.untitled')}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description || t('marketing:contentLibrary.noDescription')}</p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 3).map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {item.metadata?.metrics && (
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {item.metadata.metrics.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {item.metadata.metrics.comments || 0}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                        navigator.clipboard.writeText(item.file_url);
                        toast({ title: t('marketing:contentLibrary.urlCopied'), description: t('marketing:contentLibrary.urlCopiedDesc') });
                      }}>
                        <Copy className="h-3 w-3 mr-1" />{t('marketing:contentLibrary.copyUrl')}
                      </Button>
                      
                      <Button size="sm" variant="outline" onClick={() => {
                        window.open(item.file_url, '_blank');
                      }}>
                        <Image className="h-3 w-3" />
                      </Button>
                      
                      <Button size="sm" variant="ghost" onClick={() => deleteFromLibrary(item.id)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}