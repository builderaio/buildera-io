import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, ArrowRight, X, Sparkles, Brain, Target, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EraCoachMarkProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const EraCoachMark: React.FC<EraCoachMarkProps> = ({ isOpen, onClose, userId }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const steps = [
    {
      title: "¡Conoce a Era! 🎉",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-bounce" />
              </div>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold mb-3">
              Tu nuevo asistente de{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Inteligencia Artificial
              </span>
            </h3>
            <p className="text-muted-foreground">
              Era es el corazón inteligente de Buildera. Está diseñada para ayudarte a optimizar y mejorar todo el contenido de tu empresa de forma automática.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "¿Qué puede hacer Era por ti?",
      content: (
        <div className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Optimización Inteligente</h4>
                <p className="text-xs text-muted-foreground">
                  Mejora automáticamente la misión, visión, descripciones de productos y todo tu contenido empresarial
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Enfoque Estratégico</h4>
                <p className="text-xs text-muted-foreground">
                  Adapta el contenido según tu industria, tamaño de empresa y objetivos específicos
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Comunicación Profesional</h4>
                <p className="text-xs text-muted-foreground">
                  Convierte ideas simples en contenido profesional y persuasivo
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "¿Cómo usar Era?",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <Zap className="w-3 h-3 mr-1" />
                Era
              </Badge>
              <span className="text-sm font-medium">Aparece automáticamente</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Cuando escribas en cualquier campo de texto (misión, visión, productos, etc.), verás el botón "Optimizar con Era" aparecer automáticamente.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <span>Escribe tu contenido inicial</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <span>Haz clic en "Optimizar con Era"</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <span>Revisa y acepta las mejoras sugeridas</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Principales funciones de Buildera",
      content: (
        <div className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-xs">ADN Empresa</h4>
                <p className="text-xs text-muted-foreground">Define misión, visión e identidad visual</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-xs">Marketing Hub</h4>
                <p className="text-xs text-muted-foreground">Genera contenido optimizado para redes sociales</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-green-600">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-xs">Marketplace & Expertos</h4>
                <p className="text-xs text-muted-foreground">Conecta con especialistas para tus proyectos</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-orange-600">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-xs">Inteligencia Competitiva</h4>
                <p className="text-xs text-muted-foreground">Analiza competencia y tendencias del mercado</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "¡Listo para empezar!",
      content: (
        <div className="space-y-6 text-center">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-2">¡Era está lista para ayudarte!</h3>
            <p className="text-muted-foreground text-sm">
              Explora cada sección y usa el chat de Era (botón flotante) para obtener ayuda personalizada en tiempo real.
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 <strong>Tip:</strong> Haz clic en el ícono de chat para conversar con Era en cualquier momento.
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Marcar el tutorial como completado
      await supabase
        .from('user_tutorials')
        .insert({
          user_id: userId,
          tutorial_name: 'era_introduction'
        });

      toast({
        title: "¡Tutorial completado!",
        description: "Era está lista para ayudarte a optimizar tu contenido",
      });
      
      onClose();
    } catch (error) {
      console.error('Error marking tutorial as completed:', error);
      onClose(); // Cerrar de todas formas
    }
  };

  const handleSkip = async () => {
    try {
      await supabase
        .from('user_tutorials')
        .insert({
          user_id: userId,
          tutorial_name: 'era_introduction'
        });
    } catch (error) {
      console.error('Error marking tutorial as completed:', error);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
          <DialogTitle className="text-center pr-8">
            {steps[currentStep].title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          {steps[currentStep].content}
        </div>
        
        {/* Progress indicator */}
        <div className="flex justify-center mb-4">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-primary'
                    : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="opacity-70 hover:opacity-100"
          >
            Anterior
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Saltar
            </Button>
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  ¡Empezar!
                  <Target className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EraCoachMark;