import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuthMethodsData {
  authProvider: string | null;
  linkedProviders: string[];
  canUseEmail: boolean;
  canUseGoogle: boolean;
  canUseLinkedIn: boolean;
}

export const useAuthMethods = (userId?: string) => {
  const [authMethods, setAuthMethods] = useState<AuthMethodsData>({
    authProvider: null,
    linkedProviders: [],
    canUseEmail: false,
    canUseGoogle: false,
    canUseLinkedIn: false
  });
  const [loading, setLoading] = useState(true);

  const fetchAuthMethods = async (targetUserId?: string) => {
    try {
      setLoading(true);
      
      // Get current user if not provided
      let currentUserId = targetUserId;
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUserId = session?.user?.id;
      }

      if (!currentUserId) {
        setAuthMethods({
          authProvider: null,
          linkedProviders: [],
          canUseEmail: true,
          canUseGoogle: true,
          canUseLinkedIn: true
        });
        return;
      }

      // Fetch user profile with auth methods
      const { data: profile } = await supabase
        .from('profiles')
        .select('auth_provider, linked_providers')
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (profile) {
        const linkedProviders = profile.linked_providers || [];
        setAuthMethods({
          authProvider: profile.auth_provider,
          linkedProviders,
          canUseEmail: linkedProviders.includes('email'),
          canUseGoogle: linkedProviders.includes('google'),
          canUseLinkedIn: linkedProviders.includes('linkedin_oidc')
        });
      } else {
        // New user - allow all methods
        setAuthMethods({
          authProvider: null,
          linkedProviders: [],
          canUseEmail: true,
          canUseGoogle: true,
          canUseLinkedIn: true
        });
      }
    } catch (error) {
      console.error('Error fetching auth methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAuthMethod = async (provider: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { error } = await supabase.rpc('add_linked_provider', {
        _user_id: session.user.id,
        _provider: provider
      });

      if (error) throw error;
      
      // Refresh auth methods
      await fetchAuthMethods(session.user.id);
      return { success: true };
    } catch (error: any) {
      console.error('Error adding auth method:', error);
      return { success: false, error: error.message };
    }
  };

  const removeAuthMethod = async (provider: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { error } = await supabase.rpc('remove_linked_provider', {
        _user_id: session.user.id,
        _provider: provider
      });

      if (error) throw error;
      
      // Refresh auth methods
      await fetchAuthMethods(session.user.id);
      return { success: true };
    } catch (error: any) {
      console.error('Error removing auth method:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchAuthMethods(userId);
  }, [userId]);

  return {
    authMethods,
    loading,
    refetch: () => fetchAuthMethods(userId),
    addAuthMethod,
    removeAuthMethod
  };
};