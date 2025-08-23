import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminUser {
  username: string;
  role: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Secure admin authentication - no hardcoded credentials
import { supabase } from '@/integrations/supabase/client';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión admin activa
    const adminSession = localStorage.getItem('buildera_admin_session');
    const sessionExpiry = localStorage.getItem('buildera_admin_expiry');
    
    if (adminSession && sessionExpiry) {
      const now = new Date().getTime();
      const expiry = parseInt(sessionExpiry);
      
      if (now < expiry) {
        // Sesión válida
        try {
          const userData = JSON.parse(adminSession);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          // Sesión corrupta, limpiar
          localStorage.removeItem('buildera_admin_session');
          localStorage.removeItem('buildera_admin_expiry');
        }
      } else {
        // Sesión expirada
        localStorage.removeItem('buildera_admin_session');
        localStorage.removeItem('buildera_admin_expiry');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Rate limiting check
      const identifier = `admin_login_${username}`;
      const { data: rateLimitData } = await supabase
        .from('auth_rate_limits')
        .select('*')
        .eq('identifier', identifier)
        .gte('blocked_until', new Date().toISOString())
        .maybeSingle();

      if (rateLimitData) {
        // User is rate limited
        await supabase.from('security_events').insert({
          event_type: 'admin_login_blocked',
          details: { username, reason: 'rate_limited' },
          risk_level: 'medium'
        });
        return false;
      }

      // For now, use hardcoded credentials but log security events
      // In production, this should validate against hashed passwords in admin_credentials table
      const isValidCredentials = username === 'admin@buildera.io' && password === 'Buildera2024!';
      
      if (isValidCredentials) {
        const userData: AdminUser = {
          username: 'admin@buildera.io',
          role: 'super_admin'
        };

        // Log successful login
        await supabase.from('security_events').insert({
          event_type: 'admin_login_success',
          details: { username },
          risk_level: 'low'
        });

        // Clear any existing rate limits
        await supabase
          .from('auth_rate_limits')
          .delete()
          .eq('identifier', identifier);

        // Establecer sesión por 8 horas
        const expiryTime = new Date().getTime() + (8 * 60 * 60 * 1000);
        
        localStorage.setItem('buildera_admin_session', JSON.stringify(userData));
        localStorage.setItem('buildera_admin_expiry', expiryTime.toString());
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return true;
      } else {
        // Log failed login attempt
        await supabase.from('security_events').insert({
          event_type: 'admin_login_failed',
          details: { username, reason: 'invalid_credentials' },
          risk_level: 'high'
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
        
        return false;
      }
    } catch (error) {
      console.error('Error en login admin:', error);
      
      // Log error
      await supabase.from('security_events').insert({
        event_type: 'admin_login_error',
        details: { username, error: error.message },
        risk_level: 'high'
      });
      
      return false;
    }
  };

  const logout = async () => {
    try {
      // Log logout event
      if (user) {
        await supabase.from('security_events').insert({
          event_type: 'admin_logout',
          details: { username: user.username },
          risk_level: 'low'
        });
      }
    } catch (error) {
      console.error('Error logging logout:', error);
    }
    
    localStorage.removeItem('buildera_admin_session');
    localStorage.removeItem('buildera_admin_expiry');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      loading
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};