import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityEvent {
  event_type: string;
  details: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  ip_address?: string;
  user_agent?: string;
}

export const useSecureAuth = () => {
  const { toast } = useToast();

  // Log security events
  const logSecurityEvent = async (event: SecurityEvent) => {
    try {
      await supabase.from('security_events').insert({
        ...event,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  // Get client IP (best effort)
  const getClientIP = async (): Promise<string | null> => {
    try {
      // This is a simplified approach - in production you'd want a more robust solution
      return null; // Will be handled by the database trigger or edge function
    } catch {
      return null;
    }
  };

  // Check for suspicious activity
  const detectSuspiciousActivity = async (userId?: string) => {
    if (!userId) return false;

    try {
      const { data: recentEvents } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
        .order('created_at', { ascending: false });

      if (recentEvents && recentEvents.length > 10) {
        await logSecurityEvent({
          event_type: 'suspicious_activity_detected',
          details: { 
            user_id: userId, 
            event_count: recentEvents.length,
            reason: 'rapid_requests' 
          },
          risk_level: 'high'
        });
        return true;
      }
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
    }

    return false;
  };

  // Enhanced sign out with cleanup
  const secureSignOut = async () => {
    console.log('🚪 [useSecureAuth] Secure sign out - cleaning localStorage');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await logSecurityEvent({
          event_type: 'user_logout',
          details: { user_id: user.id },
          risk_level: 'low'
        });
      }

      // Limpiar localStorage de forma exhaustiva incluyendo guías y estados de UI
      Object.keys(localStorage).forEach(key => {
        if (
          key.startsWith('supabase.auth.') || 
          key.includes('sb-') ||
          key.startsWith('simple-era-guide-') ||
          key.includes('era-optimizer-') ||
          key.includes('coach-mark-') ||
          key.includes('onboarding-')
        ) {
          console.log('🗑️ Removing:', key);
          localStorage.removeItem(key);
        }
      });

      // Global sign out
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force page reload for clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('❌ Error during secure sign out:', error);
      toast({
        title: "Sign Out Error",
        description: "There was an issue signing out. Please clear your browser cache and try again.",
        variant: "destructive"
      });
      // Even on error, attempt to redirect
      window.location.href = '/auth';
    }
  };

  // Enhanced sign in with security checks
  const secureSignIn = async (email: string, password: string) => {
    try {
      // Check rate limiting
      const identifier = `login_${email}`;
      const { data: rateLimitData } = await supabase
        .from('auth_rate_limits')
        .select('*')
        .eq('identifier', identifier)
        .gte('blocked_until', new Date().toISOString())
        .maybeSingle();

      if (rateLimitData) {
        toast({
          title: "Too Many Attempts",
          description: "Please wait before trying to sign in again.",
          variant: "destructive"
        });
        return { data: null, error: new Error('Rate limited') };
      }

      // Clean up existing state first
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      // Attempt sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log failed attempt
        await logSecurityEvent({
          event_type: 'login_failed',
          details: { email, error: error.message },
          risk_level: 'medium'
        });

        // Update rate limiting
        const { data: existingLimit } = await supabase
          .from('auth_rate_limits')
          .select('*')
          .eq('identifier', identifier)
          .maybeSingle();

        if (existingLimit) {
          const newAttemptCount = existingLimit.attempt_count + 1;
          const blockedUntil = newAttemptCount >= 5 
            ? new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
            : null;

          await supabase
            .from('auth_rate_limits')
            .update({
              attempt_count: newAttemptCount,
              last_attempt: new Date().toISOString(),
              blocked_until: blockedUntil
            })
            .eq('id', existingLimit.id);
        } else {
          await supabase.from('auth_rate_limits').insert({
            identifier,
            attempt_count: 1,
            first_attempt: new Date().toISOString(),
            last_attempt: new Date().toISOString()
          });
        }

        return { data: null, error };
      }

      if (data.user) {
        // Log successful login
        await logSecurityEvent({
          event_type: 'login_success',
          details: { user_id: data.user.id, email },
          risk_level: 'low'
        });

        // Clear rate limits on success
        await supabase
          .from('auth_rate_limits')
          .delete()
          .eq('identifier', identifier);

        // Force page reload for clean state
        window.location.href = '/';
      }

      return { data, error: null };
    } catch (error) {
      await logSecurityEvent({
        event_type: 'login_error',
        details: { email, error: error.message },
        risk_level: 'high'
      });
      
      return { data: null, error };
    }
  };

  return {
    logSecurityEvent,
    detectSuspiciousActivity,
    secureSignOut,
    secureSignIn
  };
};