import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LinkedInConnection {
  id: string;
  user_id: string;
  access_token: string;
  expires_at: string;
  scope: string;
  company_page_id: string;
  company_page_name: string;
  company_page_data: any;
  created_at: string;
  updated_at: string;
}

interface LinkedInData {
  name: string;
  followers: string;
  engagement: string;
  roi: string;
  leads: number;
  recentPosts: Array<{
    content: string;
    likes: number;
    comments: number;
    shares: number;
    date: string;
  }>;
  analytics: {
    impressions: string;
    clicks: string;
    conversions: number;
  };
  color: string;
  lastSync?: string;
}

export const useLinkedInConnection = () => {
  const [connection, setConnection] = useState<LinkedInConnection | null>(null);
  const [linkedinData, setLinkedinData] = useState<LinkedInData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: connectionData, error: connectionError } = await supabase
        .from('linkedin_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (connectionError) {
        console.error('Error fetching LinkedIn connection:', connectionError);
        throw new Error(connectionError.message);
      }

      setConnection(connectionData);
      return !!connectionData;

    } catch (err: any) {
      console.error('Error checking LinkedIn connection:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const syncLinkedInData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!connection) {
        throw new Error('No LinkedIn connection found');
      }

      // Check if token is expired
      const now = new Date();
      const expiresAt = new Date(connection.expires_at);
      
      if (now >= expiresAt) {
        throw new Error('LinkedIn access token has expired. Please reconnect your account.');
      }

      console.log('📊 Sincronizando datos de LinkedIn...');

      const { data, error } = await supabase.functions.invoke('linkedin-data-sync');

      if (error) {
        console.error('Error syncing LinkedIn data:', error);
        throw new Error(error.message || 'Failed to sync LinkedIn data');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to sync LinkedIn data');
      }

      setLinkedinData(data.data);
      console.log('✅ Datos de LinkedIn sincronizados:', data.data);

      return data.data;

    } catch (err: any) {
      console.error('Error syncing LinkedIn data:', err);
      setError(err.message);
      
      toast({
        title: "Error sincronizando LinkedIn",
        description: err.message,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const disconnectLinkedIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { error: deleteError } = await supabase
        .from('linkedin_connections')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error disconnecting LinkedIn:', deleteError);
        throw new Error(deleteError.message);
      }

      setConnection(null);
      setLinkedinData(null);

      toast({
        title: "LinkedIn desconectado",
        description: "La conexión con LinkedIn ha sido eliminada exitosamente.",
      });

      return true;

    } catch (err: any) {
      console.error('Error disconnecting LinkedIn:', err);
      setError(err.message);
      
      toast({
        title: "Error desconectando LinkedIn",
        description: err.message,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return {
    connection,
    linkedinData,
    loading,
    error,
    isConnected: !!connection,
    checkConnection,
    syncLinkedInData,
    disconnectLinkedIn,
  };
};