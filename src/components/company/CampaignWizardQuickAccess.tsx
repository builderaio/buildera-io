import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Target, 
  TrendingUp, 
  Calendar, 
  BarChart3,
  ArrowRight,
  Rocket
} from 'lucide-react';

interface CampaignWizardQuickAccessProps {
  onNavigateToWizard: () => void;
}

const CampaignWizardQuickAccess: React.FC<CampaignWizardQuickAccessProps> = ({ onNavigateToWizard }) => {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 group">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
              <Rocket className="h-6 w-6 text-primary animate-bounce-gentle" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Campaña Inteligente
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Crea campañas completas con IA en 7 pasos
              </p>
            </div>
          </div>
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 animate-pulse">
            ✨ NUEVO
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Target, label: "Objetivos", color: "text-blue-600" },
            { icon: TrendingUp, label: "Audiencia", color: "text-green-600" },
            { icon: Calendar, label: "Calendario", color: "text-orange-600" },
            { icon: BarChart3, label: "Análisis", color: "text-purple-600" }
          ].map((step, index) => (
            <div key={index} className="flex flex-col items-center gap-1 p-2 bg-background/60 rounded-lg">
              <step.icon className={`h-4 w-4 ${step.color}`} />
              <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
            </div>
          ))}
        </div>
        
        <div className="pt-2">
          <Button 
            onClick={onNavigateToWizard}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
            Crear Mi Primera Campaña
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            • Define objetivos • Analiza audiencia • Crea contenido • Programa publicaciones • Mide resultados
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignWizardQuickAccess;