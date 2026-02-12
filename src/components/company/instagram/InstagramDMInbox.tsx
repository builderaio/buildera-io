import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Send, Mail, User } from 'lucide-react';

interface InstagramDMInboxProps {
  companyUsername: string;
}

interface Conversation {
  id: string;
  participant?: { id: string; username?: string; name?: string };
  messages?: Array<{ id: string; message: string; created_time: string; from: { id: string; name?: string } }>;
  updated_time?: string;
  snippet?: string;
}

export const InstagramDMInbox = ({ companyUsername }: InstagramDMInboxProps) => {
  const { t } = useTranslation('marketing');
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (companyUsername) loadConversations();
  }, [companyUsername]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { action: 'get_instagram_conversations', data: { profile: companyUsername } }
      });
      if (error) throw error;
      setConversations(data?.data || []);
    } catch (e: any) {
      console.error('Error loading conversations:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendDM = async () => {
    if (!newMessage.trim() || !selectedConvo?.participant?.id) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('upload-post-manager', {
        body: {
          action: 'send_instagram_dm',
          data: { recipient_id: selectedConvo.participant.id, message: newMessage, profile: companyUsername }
        }
      });
      if (error) throw error;
      toast({ title: t('hub.instagram.dmSent') });
      setNewMessage('');
      loadConversations();
    } catch (e: any) {
      toast({ title: t('hub.instagram.dmError'), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">{t('hub.instagram.noConversations')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-h-[300px]">
      {/* Conversation list */}
      <div className="space-y-1 border-r pr-3 max-h-[400px] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{t('hub.instagram.conversations')}</span>
          <Button variant="ghost" size="sm" onClick={loadConversations}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        {conversations.map((convo) => (
          <div
            key={convo.id}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              selectedConvo?.id === convo.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
            } border`}
            onClick={() => setSelectedConvo(convo)}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {convo.participant?.username || convo.participant?.name || 'User'}
                </p>
                {convo.snippet && (
                  <p className="text-xs text-muted-foreground truncate">{convo.snippet}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message thread */}
      <div className="md:col-span-2 flex flex-col">
        {selectedConvo ? (
          <>
            <div className="flex-1 space-y-2 max-h-[320px] overflow-y-auto mb-3">
              {(selectedConvo.messages || []).map((msg) => (
                <div key={msg.id} className="p-2 bg-muted/30 rounded-lg">
                  <span className="text-xs font-medium text-primary">{msg.from?.name || 'User'}</span>
                  <p className="text-sm">{msg.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_time).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('hub.instagram.dmPlaceholder')}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSendDM()}
              />
              <Button onClick={handleSendDM} disabled={sending || !newMessage.trim()} size="sm">
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <p className="text-muted-foreground text-sm">{t('hub.instagram.selectConversation')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
