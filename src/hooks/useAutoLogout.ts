import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos en millisegundos (aumentado para evitar logouts prematuros)

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
      console.log('⏰ Auto-logout por inactividad iniciado');
      
      // Verificar si realmente hay una sesión antes de hacer logout
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('⚠️ No hay sesión activa, cancelando auto-logout');
        return;
      }

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
      // Solo redirigir si hay error crítico
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/auth';
      }
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

  // Detectar cuando el usuario cambia de pestaña (solo para pausar el timer)
  const handleVisibilityChange = () => {
    if (document.hidden) {
      isActiveRef.current = false;
      // Solo pausar el timer, NO cerrar sesión
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else {
      isActiveRef.current = true;
      // Reiniciar timer cuando regrese a la pestaña
      resetTimer();
    }
  };

  // Removido handleBeforeUnload - era demasiado agresivo

    document.addEventListener('visibilitychange', handleVisibilityChange);

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
    };
  }, []);

  return { resetTimer };
};