import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminUser {
  username: string;
  role: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Credenciales admin hardcodeadas (en producción, deberían estar en variables de entorno)
const ADMIN_CREDENTIALS = {
  username: 'admin@buildera.io',
  password: 'Buildera2024!',
  role: 'super_admin'
};

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
      // Verificar credenciales
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        const userData: AdminUser = {
          username: ADMIN_CREDENTIALS.username,
          role: ADMIN_CREDENTIALS.role
        };

        // Establecer sesión por 8 horas
        const expiryTime = new Date().getTime() + (8 * 60 * 60 * 1000);
        
        localStorage.setItem('buildera_admin_session', JSON.stringify(userData));
        localStorage.setItem('buildera_admin_expiry', expiryTime.toString());
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error en login admin:', error);
      return false;
    }
  };

  const logout = () => {
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