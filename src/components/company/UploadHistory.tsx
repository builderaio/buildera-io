import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  History, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface UploadHistoryProps {
  profile: any;
}

interface HistoryItem {
  user_email: string;
  profile_username: string;
  platform: string;
  media_type: 'video' | 'photo' | 'text';
  upload_timestamp: string;
  success: boolean;
  platform_post_id?: string | string[];
  post_url?: string;
  error_message?: string;
  media_size_bytes?: number;
  post_title?: string;
  post_caption?: string;
  is_async?: boolean;
  request_id?: string;
}

interface HistoryResponse {
  history: HistoryItem[];
  total: number;
  page: number;
  limit: number;
}

const platformConfig = {
  linkedin: { name: 'LinkedIn', icon: '💼', color: 'bg-blue-600' },
  instagram: { name: 'Instagram', icon: '📷', color: 'bg-pink-600' },
  facebook: { name: 'Facebook', icon: '📘', color: 'bg-blue-700' },
  tiktok: { name: 'TikTok', icon: '🎵', color: 'bg-black' },
  x: { name: 'X (Twitter)', icon: '🐦', color: 'bg-gray-900' },
  youtube: { name: 'YouTube', icon: '📹', color: 'bg-red-600' },
  threads: { name: 'Threads', icon: '🧵', color: 'bg-gray-800' },
  pinterest: { name: 'Pinterest', icon: '📌', color: 'bg-red-500' }
};

export const UploadHistory = ({ profile }: UploadHistoryProps) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [userId, setUserId] = useState<string | null>(profile?.user_id ?? null);
  const { toast } = useToast();

  const limit = 10;

  // Resolver userId de auth si no está en el profile
  useEffect(() => {
    if (!userId) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setUserId(user.id);
      });
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadHistory();
    }
  }, [userId, currentPage]);

  const loadHistory = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);

      // Initialize profile first to ensure we have the company username
      const initResponse = await supabase.functions.invoke('upload-post-manager', {
        body: { 
          action: 'init_profile', 
          data: {} 
        }
      });

      if (!initResponse.data?.success) {
        throw new Error('Error al inicializar perfil');
      }

      // Get history with the initialized profile
      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { 
          action: 'get_upload_history', 
          data: { page: currentPage, limit } 
        }
      });

      if (error) throw error;

      if (data?.success) {
        const historyData: HistoryResponse = data;
        setHistory(historyData.history || []);
        setTotalItems(historyData.total || 0);
        setTotalPages(Math.ceil((historyData.total || 0) / limit));
      } else {
        throw new Error('Error al obtener el historial');
      }
    } catch (error) {
      console.error('Error loading history:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de uploads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'photo': return <ImageIcon className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getPlatformInfo = (platform: string) => {
    return platformConfig[platform as keyof typeof platformConfig] || {
      name: platform,
      icon: '🌐',
      color: 'bg-gray-500'
    };
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Historial de Publicaciones
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && history.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <Alert>
            <History className="w-4 h-4" />
            <AlertDescription>
              No hay historial de publicaciones disponible.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-3">
              {history.map((item, index) => {
                const platformInfo = getPlatformInfo(item.platform);
                
                return (
                  <div
                    key={`${item.request_id || 'item'}-${index}`}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex flex-col items-center gap-1">
                        {item.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="text-lg">{platformInfo.icon}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {item.post_title || 'Sin título'}
                          </span>
                          {getMediaTypeIcon(item.media_type)}
                          <Badge variant="secondary" className="text-xs">
                            {platformInfo.name}
                          </Badge>
                        </div>
                        
                        {item.post_caption && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {item.post_caption}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.upload_timestamp)}
                          </span>
                          
                          {item.media_size_bytes && (
                            <span>{formatFileSize(item.media_size_bytes)}</span>
                          )}
                          
                          {item.is_async && (
                            <Badge variant="outline" className="text-xs">
                              Asíncrono
                            </Badge>
                          )}
                        </div>
                        
                        {!item.success && item.error_message && (
                          <p className="text-xs text-red-500 mt-1">
                            Error: {item.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {item.success && item.post_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(item.post_url, '_blank')}
                          className="h-8 px-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, totalItems)} de {totalItems} publicaciones
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};