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
  Sparkles
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
  const { primaryCompany, loading: companyLoading } = useCompanyManagement();
  
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

  // Populate with real company data when available
  useEffect(() => {
    if (primaryCompany && !campaignData.company.nombre_empresa) {
      setCampaignData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          nombre_empresa: primaryCompany.name || '',
          url_sitio_web: primaryCompany.website_url || '',
          pais: '', // Usuario debe completar esto si no está en company
          objetivo_de_negocio: primaryCompany.description || '',
          propuesta_de_valor: '', // Usuario debe completar esto
        }
      }));
    }
  }, [primaryCompany]);

  const [state, setState] = useState<CampaignState>({
    currentStep: 1,
    completedSteps: []
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { 
    storeTargetAudienceData, 
    storeMarketingStrategyData, 
    storeContentCalendarData,
    isProcessing 
  } = useMarketingDataPersistence();

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

    // Show success message
    toast({
      title: "¡Paso completado!",
      description: `${currentStep?.title} configurado exitosamente`,
    });
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Campaña Inteligente
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Crea campañas de marketing que generen resultados reales con el poder de la IA
          </p>
          
          {/* Progress */}
          <div className="max-w-md mx-auto space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Paso {state.currentStep} de {steps.length} • {Math.round(progress)}% completado
            </p>
          </div>
        </div>

        {/* Steps Navigation */}
        <Card className="bg-card/50 backdrop-blur-sm border-2">
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
                    className={`flex flex-col items-center text-center p-4 rounded-lg transition-all cursor-pointer group ${
                      isActive 
                        ? 'bg-primary/10 border-2 border-primary shadow-lg scale-105' 
                        : canAccess
                        ? 'hover:bg-muted/50 hover:scale-102'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => canAccess && goToStep(step.id)}
                  >
                    <div className={`relative p-3 rounded-full mb-2 transition-colors ${
                      isCompleted 
                        ? 'bg-green-100 text-green-600' 
                        : isActive 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <IconComponent className="h-6 w-6" />
                      )}
                    </div>
                    
                    <h3 className={`font-medium text-sm ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight">
                      {step.description}
                    </p>
                    
                    {isCompleted && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Completado
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content */}
        <div className="max-w-4xl mx-auto">
          {renderCurrentStep()}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={state.currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {state.currentStep} / {steps.length}
            </span>
          </div>

          <Button 
            onClick={nextStep}
            disabled={state.currentStep === steps.length || !isStepCompleted(state.currentStep)}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            Siguiente
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};