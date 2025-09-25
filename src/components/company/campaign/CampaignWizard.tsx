import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMarketingDataPersistence } from '@/hooks/useMarketingDataPersistence';
import { useCompanyManagement } from '@/hooks/useCompanyManagement';
import { supabase } from '@/integrations/supabase/client';
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  PenTool, 
  BarChart3,
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2
} from 'lucide-react';

import { CampaignObjective } from './steps/CampaignObjective';
import { TargetAudience } from './steps/TargetAudience';
import { MarketingStrategy } from './steps/MarketingStrategy';
import { ContentCalendar } from './steps/ContentCalendar';
import { ContentCreation } from './steps/ContentCreation';
import { ContentScheduling } from './steps/ContentScheduling';
import { CampaignMeasurement } from './steps/CampaignMeasurement';

interface CampaignData {
  objective: {
    goal: string;
    target_metrics: Record<string, number>;
    timeline: string;
    budget?: number;
  };
  company: {
    nombre_empresa: string;
    pais: string;
    objetivo_de_negocio: string;
    propuesta_de_valor: string;
    url_sitio_web: string;
    redes_sociales_activas: Array<{
      red: string;
      url: string;
      diagnostico: string;
    }>;
  };
  audience?: any;
  strategy?: any;
  calendar?: any;
  content?: any[];
  schedule?: any[];
  measurements?: any;
}

interface CampaignState {
  currentStep: number;
  completedSteps: number[];
  campaignId?: string;
  strategyId?: string;
  calendarId?: string;
}

const steps = [
  {
    id: 1,
    title: 'Objetivo de Crecimiento',
    description: 'Define metas claras para tu campaña',
    icon: Target,
    color: 'text-blue-600'
  },
  {
    id: 2,
    title: 'Audiencia Objetivo',
    description: 'Identifica tu público ideal',
    icon: TrendingUp,
    color: 'text-green-600'
  },
  {
    id: 3,
    title: 'Estrategia de Marketing',
    description: 'Crea una estrategia personalizada',
    icon: BarChart3,
    color: 'text-purple-600'
  },
  {
    id: 4,
    title: 'Calendario de Contenido',
    description: 'Programa tu contenido estratégicamente',
    icon: Calendar,
    color: 'text-orange-600'
  },
  {
    id: 5,
    title: 'Creación de Contenido',
    description: 'Genera contenido atractivo',
    icon: PenTool,
    color: 'text-pink-600'
  },
  {
    id: 6,
    title: 'Programación',
    description: 'Programa automáticamente',
    icon: Clock,
    color: 'text-indigo-600'
  },
  {
    id: 7,
    title: 'Medición y Análisis',
    description: 'Mide el impacto de tu campaña',
    icon: BarChart3,
    color: 'text-teal-600'
  }
];

export const CampaignWizard = () => {
  const [state, setState] = useState<CampaignState>({
    currentStep: 1,
    completedSteps: []
  });
  
  const [campaignData, setCampaignData] = useState<CampaignData>({
    objective: {
      goal: '',
      target_metrics: {},
      timeline: ''
    },
    company: {
      nombre_empresa: '',
      pais: '',
      objetivo_de_negocio: '',
      propuesta_de_valor: '',
      url_sitio_web: '',
      redes_sociales_activas: []
    }
  });

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  const { primaryCompany, loading: companyLoading } = useCompanyManagement();
  const { toast } = useToast();
  const { 
    storeTargetAudienceData, 
    storeMarketingStrategyData, 
    storeContentCalendarData,
    isProcessing 
  } = useMarketingDataPersistence();

  // Populate with real company data when available
  useEffect(() => {
    if (primaryCompany && !campaignData.company.nombre_empresa) {
      setCampaignData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          nombre_empresa: primaryCompany.name || '',
          url_sitio_web: primaryCompany.website_url || '',
          pais: '',
          objetivo_de_negocio: primaryCompany.description || '',
          propuesta_de_valor: '',
        }
      }));
    }
  }, [primaryCompany]);

  const generateCampaignsWithAI = async () => {
    if (!primaryCompany?.id) {
      toast({
        title: "Error",
        description: "No se encontró información de la empresa",
        variant: "destructive"
      });
      return;
    }

    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('campaign-ai-generator', {
        body: { companyId: primaryCompany.id }
      });

      if (error) throw error;

      setAiSuggestions(data);
      toast({
        title: "¡Campañas generadas!",
        description: `Se generaron ${data.campañas_recomendadas?.length || 0} campañas personalizadas`,
      });
    } catch (error: any) {
      console.error('Error generating AI campaigns:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron generar las campañas con IA",
        variant: "destructive"
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const progress = ((state.completedSteps.length) / steps.length) * 100;

  const handleStepComplete = async (stepData: any) => {
    const currentStep = steps.find(s => s.id === state.currentStep);
    
    // Update campaign data based on step
    setCampaignData(prev => {
      const updated = { ...prev };
      
      switch(state.currentStep) {
        case 1:
          updated.objective = { ...updated.objective, ...stepData };
          break;
        case 2:
          updated.audience = stepData;
          // Store target audience data in database
          if (stepData?.company && stepData?.analysis) {
            storeTargetAudienceData(stepData.company, stepData.analysis?.buyer_personas || []);
          }
          break;
        case 3:
          updated.strategy = stepData;
          // Store strategy data and save strategy ID for future steps (handled below)
          break;
        case 4:
          updated.calendar = stepData;
          // Store calendar data (handled below)
          break;
        case 5:
          updated.content = stepData;
          break;
        case 6:
          updated.schedule = stepData;
          break;
        case 7:
          updated.measurements = stepData;
          break;
      }
      
      return updated;
    });

    // Handle async operations outside of setState
    try {
      if (state.currentStep === 3 && stepData?.strategy) {
        const strategyId = await storeMarketingStrategyData(stepData.strategy, stepData.tactics || []);
        setState(prev => ({ ...prev, strategyId }));
      }
      
      if (state.currentStep === 4 && stepData?.calendar_items && Array.isArray(stepData.calendar_items) && state.strategyId) {
        await storeContentCalendarData(stepData, state.strategyId);
      }
    } catch (error) {
      console.error('Error storing data:', error);
    }

    // Mark step as completed
    setState(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps.filter(s => s !== state.currentStep), state.currentStep]
    }));

    // Show success message with confetti effect
    toast({
      title: "¡Paso completado! 🎉",
      description: `${currentStep?.title} configurado exitosamente`,
    });

    // Auto-advance to next step after a short delay for better UX
    if (state.currentStep < steps.length) {
      setTimeout(() => {
        nextStep();
      }, 1500);
    }
  };

  const goToStep = (stepNumber: number) => {
    setState(prev => ({ ...prev, currentStep: stepNumber }));
  };

  const nextStep = () => {
    if (state.currentStep < steps.length) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const prevStep = () => {
    if (state.currentStep > 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const canProceed = (stepNumber: number) => {
    return state.completedSteps.includes(stepNumber - 1) || stepNumber === 1;
  };

  const isStepCompleted = (stepNumber: number) => {
    return state.completedSteps.includes(stepNumber);
  };

  const renderCurrentStep = () => {
    const stepProps = {
      campaignData,
      onComplete: handleStepComplete,
      loading: loading || isProcessing || companyLoading,
      companyData: primaryCompany
    };

    switch(state.currentStep) {
      case 1:
        return <CampaignObjective {...stepProps} />;
      case 2:
        return <TargetAudience {...stepProps} />;
      case 3:
        return <MarketingStrategy {...stepProps} />;
      case 4:
        return <ContentCalendar {...stepProps} />;
      case 5:
        return <ContentCreation {...stepProps} />;
      case 6:
        return <ContentScheduling {...stepProps} />;
      case 7:
        return <CampaignMeasurement {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary animate-pulse drop-shadow-lg" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent drop-shadow-sm">
              Campaña Inteligente
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Crea campañas de marketing que generen resultados reales con el poder de la IA
          </p>
          
          {/* Progress */}
          <div className="max-w-lg mx-auto space-y-3">
            <div className="relative">
              <Progress value={progress} className="h-3 bg-muted/50" />
              <div className="absolute top-0 left-0 h-3 bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700 ease-out"
                   style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg animate-pulse"></div>
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Paso {state.currentStep} de {steps.length} • {Math.round(progress)}% completado
            </p>
          </div>
        </div>

        {/* Steps Navigation */}
        <Card className="bg-card/60 backdrop-blur-md border-2 border-border/50 shadow-xl animate-slide-up">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = state.currentStep === step.id;
                const isCompleted = isStepCompleted(step.id);
                const canAccess = canProceed(step.id);
                
                return (
                  <div 
                    key={step.id}
                    className={`relative flex flex-col items-center text-center p-4 rounded-xl transition-all duration-300 cursor-pointer group ${
                      isActive 
                        ? 'bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/40 shadow-xl scale-105 animate-pulse-soft' 
                        : canAccess
                        ? 'hover:bg-gradient-to-br hover:from-muted/60 hover:to-muted/20 hover:scale-[1.02] hover:shadow-lg'
                        : 'opacity-40 cursor-not-allowed'
                    }`}
                    onClick={() => canAccess && goToStep(step.id)}
                  >
                    {/* Connection Line */}
                    {index < steps.length - 1 && (
                      <div className={`hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 transition-colors ${
                        isCompleted ? 'bg-green-500' : isActive ? 'bg-primary/50' : 'bg-muted'
                      }`} />
                    )}
                    
                    <div className={`relative p-3 rounded-full mb-3 transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-green-100 to-green-50 text-green-600 shadow-lg' 
                        : isActive 
                        ? 'bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg' 
                        : 'bg-muted/60 text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6 animate-scale-in" />
                      ) : (
                        <IconComponent className={`h-6 w-6 ${isActive ? 'animate-bounce-gentle' : ''}`} />
                      )}
                      
                      {/* Glow effect for active step */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className={`font-semibold text-sm transition-colors ${
                        isActive ? 'text-primary' : isCompleted ? 'text-green-700' : 'text-foreground'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-tight opacity-80">
                        {step.description}
                      </p>
                    </div>
                    
                    {isCompleted && (
                      <Badge variant="default" className="mt-2 text-xs bg-green-100 text-green-700 border-green-200 animate-fade-in">
                        ✓ Completado
                      </Badge>
                    )}
                    
                    {/* Step number indicator */}
                    <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.id}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content */}
        <div className="max-w-5xl mx-auto">
          <div className="animate-slide-up-delayed">
            {renderCurrentStep()}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between max-w-5xl mx-auto animate-slide-up-delayed">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={state.currentStep === 1 || loading || isProcessing}
            className="flex items-center gap-2 hover:scale-105 transition-all duration-200 disabled:hover:scale-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div 
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index + 1 <= state.currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {state.currentStep} / {steps.length}
            </span>
          </div>

          <Button 
            onClick={nextStep}
            disabled={state.currentStep === steps.length || !isStepCompleted(state.currentStep) || loading || isProcessing}
            className={`flex items-center gap-2 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 ${
              state.currentStep === steps.length 
                ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600' 
                : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70'
            }`}
          >
            {state.currentStep === steps.length ? 'Finalizar' : 'Siguiente'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};