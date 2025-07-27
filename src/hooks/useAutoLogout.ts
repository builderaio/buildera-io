import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos en millisegundos

export const useAutoLogout = () => {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        handleLogout();
      }
    }, INACTIVITY_TIMEOUT);
  };

  const handleLogout = async () => {
    try {
      // Limpiar estado de autenticación
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Cerrar sesión globalmente
      await supabase.auth.signOut({ scope: 'global' });

      toast({
        title: "Sesión cerrada",
        description: "Tu sesión ha sido cerrada por inactividad",
        variant: "destructive",
      });

      // Redireccionar al login
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error during auto logout:', error);
      // Forzar redirección incluso si hay error
      window.location.href = '/auth';
    }
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const resetTimerOnActivity = () => {
      resetTimer();
    };

    // Agregar event listeners para detectar actividad
    events.forEach(event => {
      document.addEventListener(event, resetTimerOnActivity, true);
    });

    // Detectar cuando el usuario cambia de pestaña o cierra el navegador
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false;
        // Cerrar sesión inmediatamente si el usuario cambia de pestaña/cierra navegador
        handleLogout();
      } else {
        isActiveRef.current = true;
        resetTimer();
      }
    };

    const handleBeforeUnload = () => {
      handleLogout();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Inicializar timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      events.forEach(event => {
        document.removeEventListener(event, resetTimerOnActivity, true);
      });

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return { resetTimer };
};