import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserSubscription {
  plan_name: string;
  plan_slug: string;
  limits: Record<string, any>;
  status: string;
  current_period_end: string | null;
  usage?: Record<string, number>;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndFetchSubscription();
    
    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true);
          fetchSubscription();
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setSubscription(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authSub.unsubscribe();
    };
  }, []);

  const checkAuthAndFetchSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    
    if (user) {
      await fetchSubscription();
    } else {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription-status');
      
      if (error) {
        console.error('Error fetching subscription:', error);
        toast.error('Error al verificar la suscripción');
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast.error('Error al verificar la suscripción');
    } finally {
      setLoading(false);
    }
  };

  const checkUsageLimit = (usageType: string, limitKey: string): boolean => {
    if (!subscription) return false;
    
    const limit = subscription.limits[limitKey];
    if (limit === -1) return true; // Unlimited
    
    const currentUsage = subscription.usage?.[usageType] || 0;
    return currentUsage < limit;
  };

  const getUsagePercentage = (usageType: string, limitKey: string): number => {
    if (!subscription) return 0;
    
    const limit = subscription.limits[limitKey];
    if (limit === -1) return 0; // Unlimited
    
    const currentUsage = subscription.usage?.[usageType] || 0;
    return Math.min((currentUsage / limit) * 100, 100);
  };

  const getRemainingUsage = (usageType: string, limitKey: string): number => {
    if (!subscription) return 0;
    
    const limit = subscription.limits[limitKey];
    if (limit === -1) return Infinity; // Unlimited
    
    const currentUsage = subscription.usage?.[usageType] || 0;
    return Math.max(limit - currentUsage, 0);
  };

  const canUseFeature = (featureKey: string): boolean => {
    if (!subscription) return false;
    
    // Check if feature is available in current plan
    const feature = subscription.limits[featureKey];
    return feature === true || feature === -1 || (typeof feature === 'number' && feature > 0);
  };

  const incrementUsage = async (usageType: string, increment: number = 1) => {
    try {
      const { error } = await supabase.rpc('increment_usage', {
        user_id_param: (await supabase.auth.getUser()).data.user?.id,
        usage_type_param: usageType,
        increment_by: increment
      });

      if (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }

      // Refresh subscription data
      await fetchSubscription();
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  return {
    subscription,
    loading,
    isAuthenticated,
    refetch: fetchSubscription,
    checkUsageLimit,
    getUsagePercentage,
    getRemainingUsage,
    canUseFeature,
    incrementUsage
  };
};