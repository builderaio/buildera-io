import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseEraCoachMarkReturn {
  shouldShowCoachMark: boolean;
  showCoachMark: () => void;
  hideCoachMark: () => void;
  resetTutorial: () => Promise<void>;
  isLoading: boolean;
}

export const useEraCoachMark = (userId: string | undefined): UseEraCoachMarkReturn => {
  const [shouldShowCoachMark, setShouldShowCoachMark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_tutorials')
          .select('*')
          .eq('user_id', userId)
          .eq('tutorial_name', 'era_introduction')
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned, que es lo que esperamos para usuarios nuevos
          console.error('Error checking tutorial status:', error);
          return;
        }

        // Si no hay registro, mostrar el tutorial
        if (!data) {
          // Delay para que no aparezca inmediatamente al cargar
          setTimeout(() => {
            setShouldShowCoachMark(true);
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkTutorialStatus();
  }, [userId]);

  const showCoachMark = () => {
    setShouldShowCoachMark(true);
  };

  const hideCoachMark = () => {
    setShouldShowCoachMark(false);
  };

  const resetTutorial = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Usuario no autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      // Eliminar el registro del tutorial para que vuelva a aparecer
      await supabase
        .from('user_tutorials')
        .delete()
        .eq('user_id', userId)
        .eq('tutorial_name', 'era_introduction');

      toast({
        title: "Tutorial reiniciado",
        description: "El tutorial de Era aparecerá la próxima vez que cargues la página",
      });

      // Opcional: mostrar inmediatamente
      setTimeout(() => {
        setShouldShowCoachMark(true);
      }, 1000);

    } catch (error) {
      console.error('Error resetting tutorial:', error);
      toast({
        title: "Error",
        description: "No se pudo reiniciar el tutorial",
        variant: "destructive",
      });
    }
  };

  return {
    shouldShowCoachMark,
    showCoachMark,
    hideCoachMark,
    resetTutorial,
    isLoading
  };
};