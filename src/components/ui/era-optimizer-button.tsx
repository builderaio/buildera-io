import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EraOptimizerButtonProps {
  currentText: string;
  fieldType: string;
  context?: any;
  onOptimized: (optimizedText: string) => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  disabled?: boolean;
}

interface OptimizationDialogProps {
  isOpen: boolean;
  originalText: string;
  optimizedText: string;
  fieldType: string;
  isOptimizing: boolean;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

const OptimizationDialog: React.FC<OptimizationDialogProps> = ({
  isOpen,
  originalText,
  optimizedText,
  fieldType,
  isOptimizing,
  onAccept,
  onReject,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="w-5 h-5" />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
                Era
              </span>
            </div>
            ha optimizado tu {fieldType}
          </DialogTitle>
          <DialogDescription>
            Compara el contenido original con la versión optimizada por Era y decide si quieres aplicar los cambios.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          {/* Contenido Original */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Original
              </Badge>
              <span className="text-sm text-muted-foreground">
                {originalText.length} caracteres
              </span>
            </div>
            <div className="p-4 bg-muted rounded-lg border min-h-[150px]">
              <p className="text-sm whitespace-pre-wrap">
                {originalText}
              </p>
            </div>
          </div>
          
          {/* Contenido Optimizado */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="text-xs bg-gradient-to-r from-purple-600 to-blue-600">
                <Sparkles className="w-3 h-3 mr-1" />
                Optimizado por Era
              </Badge>
              <span className="text-sm text-muted-foreground">
                {optimizedText.length} caracteres
              </span>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-800 min-h-[150px]">
              <p className="text-sm whitespace-pre-wrap">
                {optimizedText}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onReject}
            disabled={isOptimizing}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Mantener Original
          </Button>
          <Button 
            onClick={onAccept}
            disabled={isOptimizing}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Check className="w-4 h-4" />
            Aplicar Optimización
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const EraOptimizerButton: React.FC<EraOptimizerButtonProps> = ({
  currentText,
  fieldType,
  context,
  onOptimized,
  className,
  size = 'sm',
  variant = 'outline',
  disabled = false
}) => {
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [optimizedText, setOptimizedText] = React.useState('');
  const [showDialog, setShowDialog] = React.useState(false);

  const optimizeWithEra = async () => {
    if (!currentText.trim()) {
      return;
    }

    setIsOptimizing(true);
    
    try {
      // Simular llamada a la API - aquí iría la integración real con Supabase
      const response = await fetch('/api/era-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentText,
          fieldType,
          context: context || {}
        })
      });

      if (!response.ok) {
        throw new Error('Error al conectar con Era');
      }

      const data = await response.json();
      setOptimizedText(data.optimizedText);
      setShowDialog(true);

    } catch (error) {
      console.error('Error optimizing with Era:', error);
      // Por ahora, simulamos una optimización simple
      setOptimizedText(enhanceText(currentText, fieldType));
      setShowDialog(true);
    } finally {
      setIsOptimizing(false);
    }
  };

  const enhanceText = (text: string, type: string): string => {
    // Simulación simple de optimización hasta que la API esté lista
    switch (type.toLowerCase()) {
      case 'misión':
        return `${text}\n\nNuestra misión se fundamenta en la excelencia operacional y el compromiso con la satisfacción del cliente, creando valor sostenible para todos nuestros stakeholders.`;
      case 'visión':
        return `${text}\n\nAspiramos a ser líderes en innovación, estableciendo nuevos estándares de calidad y contribuyendo al desarrollo sostenible de nuestra industria.`;
      case 'descripción de producto':
        return `${text}\n\nEste producto ha sido diseñado con tecnología de vanguardia y los más altos estándares de calidad, garantizando una experiencia excepcional para nuestros usuarios.`;
      default:
        return `${text}\n\n[Optimizado por Era: Contenido mejorado con enfoque profesional y mayor impacto comunicacional]`;
    }
  };

  const handleAccept = () => {
    onOptimized(optimizedText);
    setShowDialog(false);
    setOptimizedText('');
  };

  const handleReject = () => {
    setShowDialog(false);
    setOptimizedText('');
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={optimizeWithEra}
        disabled={disabled || isOptimizing || !currentText.trim()}
        className={cn(
          "gap-2 transition-all duration-200",
          "hover:shadow-md hover:scale-105",
          "border-purple-200 dark:border-purple-800",
          "hover:border-purple-300 dark:hover:border-purple-700",
          "text-purple-700 dark:text-purple-300",
          "hover:text-purple-800 dark:hover:text-purple-200",
          className
        )}
      >
        {isOptimizing ? (
          <>
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600" />
            Era optimizando...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-medium">
              Era
            </span>
          </>
        )}
      </Button>

      <OptimizationDialog
        isOpen={showDialog}
        originalText={currentText}
        optimizedText={optimizedText}
        fieldType={fieldType}
        isOptimizing={isOptimizing}
        onAccept={handleAccept}
        onReject={handleReject}
        onClose={() => setShowDialog(false)}
      />
    </>
  );
};