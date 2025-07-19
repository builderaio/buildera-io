import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseEraOptimizerProps {
  onOptimized?: (optimizedText: string) => void;
}

export const useEraOptimizer = ({ onOptimized }: UseEraOptimizerProps = {}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedText, setOptimizedText] = useState<string>('');
  const [showOptimizedDialog, setShowOptimizedDialog] = useState(false);
  const { toast } = useToast();

  const optimizeWithEra = async (
    currentText: string, 
    fieldType: string, 
    context?: any
  ) => {
    if (!currentText.trim()) {
      toast({
        title: "Texto requerido",
        description: "Ingresa algún texto para que Era pueda optimizarlo",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);
    
    try {
      toast({
        title: "Era está optimizando...",
        description: "Analizando y mejorando tu contenido con IA",
      });

      const response = await supabase.functions.invoke('era-content-optimizer', {
        body: {
          text: currentText,
          fieldType,
          context: context || {}
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al conectar con Era');
      }

      const { data } = response;
      
      if (!data.success) {
        throw new Error(data.error || 'Era no pudo optimizar el contenido');
      }

      setOptimizedText(data.optimizedText);
      setShowOptimizedDialog(true);

      toast({
        title: "¡Era ha optimizado tu contenido!",
        description: "Revisa las mejoras sugeridas",
      });

    } catch (error: any) {
      console.error('Error optimizing with Era:', error);
      toast({
        title: "Error de Era",
        description: error.message || "No se pudo optimizar el contenido. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const acceptOptimization = () => {
    if (onOptimized && optimizedText) {
      onOptimized(optimizedText);
    }
    setShowOptimizedDialog(false);
    setOptimizedText('');
    
    toast({
      title: "¡Optimización aplicada!",
      description: "Tu contenido ha sido mejorado por Era",
    });
  };

  const rejectOptimization = () => {
    setShowOptimizedDialog(false);
    setOptimizedText('');
  };

  return {
    optimizeWithEra,
    isOptimizing,
    optimizedText,
    showOptimizedDialog,
    acceptOptimization,
    rejectOptimization,
    setShowOptimizedDialog
  };
};