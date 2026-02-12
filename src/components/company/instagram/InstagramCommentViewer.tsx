import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Send, MessageCircle, AlertCircle } from 'lucide-react';

interface InstagramCommentViewerProps {
  companyUsername: string;
  mediaId: string | null;
  postUrl?: string | null;
}

interface Comment {
  id: string;
  text: string;
  username?: string;
  timestamp?: string;
  like_count?: number;
  from?: { id: string; username: string };
}

export const InstagramCommentViewer = ({ companyUsername, mediaId, postUrl }: InstagramCommentViewerProps) => {
  const { t } = useTranslation('marketing');
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (mediaId || postUrl) loadComments();
  }, [mediaId, postUrl]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: {
          action: 'get_instagram_comments',
          data: { media_id: mediaId, post_url: postUrl, profile: companyUsername }
        }
      });
      if (error) throw error;
      setComments(data?.data || []);
    } catch (e: any) {
      console.error('Error loading comments:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (commentId: string) => {
    if (!replyMessage.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('upload-post-manager', {
        body: {
          action: 'reply_instagram_comment',
          data: { media_id: mediaId, comment_id: commentId, message: replyMessage, profile: companyUsername }
        }
      });
      if (error) throw error;
      toast({ title: t('hub.instagram.replySent') });
      setReplyingTo(null);
      setReplyMessage('');
    } catch (e: any) {
      toast({ title: t('hub.instagram.replyError'), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (!mediaId && !postUrl) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">{t('hub.instagram.selectPost')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('hub.instagram.noComments')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {comments.length} {t('hub.instagram.commentsFound')}
        </span>
        <Button variant="ghost" size="sm" onClick={loadComments}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="p-3 bg-muted/30 rounded-lg border">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm text-primary">
                  @{comment.from?.username || comment.username || 'user'}
                </span>
                <p className="text-sm mt-1 break-words">{comment.text}</p>
                {comment.timestamp && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.timestamp).toLocaleDateString()}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {replyingTo === comment.id && (
              <div className="mt-2 flex gap-2">
                <Input
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={t('hub.instagram.replyPlaceholder')}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleReply(comment.id)}
                />
                <Button
                  size="sm"
                  onClick={() => handleReply(comment.id)}
                  disabled={sending || !replyMessage.trim()}
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
