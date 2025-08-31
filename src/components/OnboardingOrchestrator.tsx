import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Loader2, Globe, Target, Palette, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  loading: boolean;
}

interface OnboardingOrchestratorProps {
  user: any;
}

const OnboardingOrchestrator = ({ user }: OnboardingOrchestratorProps) => {
  const [companyUrl, setCompanyUrl] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [companyId, setCompanyId] = useState('');
  const [companyData, setCompanyData] = useState<any>(null);
  const [strategyData, setStrategyData] = useState<any>(null);
  const [isStarted, setIsStarted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 1,
      title: "Obteniendo la información de tu negocio",
      description: "Extrayendo datos básicos de tu empresa",
      icon: <Globe className="h-5 w-5" />,
      completed: false,
      loading: false
    },
    {
      id: 2,
      title: "Estructurando tu estrategia de negocio",
      description: "Definiendo misión, visión y propuesta de valor",
      icon: <Target className="h-5 w-5" />,
      completed: false,
      loading: false
    },
    {
      id: 3,
      title: "Analizando tu marca",
      description: "Creando tu identidad visual y branding",
      icon: <Palette className="h-5 w-5" />,
      completed: false,
      loading: false
    },
    {
      id: 4,
      title: "Creando tu asistente ERA",
      description: "Configurando tu copiloto empresarial personalizado",
      icon: <Bot className="h-5 w-5" />,
      completed: false,
      loading: false
    }
  ]);

  const updateStepStatus = (stepId: number, loading: boolean, completed: boolean = false) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId 
          ? { ...step, loading, completed: completed || step.completed }
          : step
      )
    );
  };

  const callOnboardingFunction = async (functionName: string, body: any) => {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw new Error(`Error en ${functionName}: ${error.message}`);
    }

    return data;
  };

  const executeStep1 = async () => {
    updateStepStatus(1, true);
    setCurrentStep(1);

    try {
      const result = await callOnboardingFunction('company-info-extractor', {
        url: companyUrl
      });

      setCompanyId(result.companyId);
      setCompanyData(result.data);
      updateStepStatus(1, false, true);
      
      toast({
        title: "✅ Información extraída",
        description: "Los datos de tu empresa han sido procesados correctamente"
      });

      // Auto-advance to step 2
      setTimeout(() => executeStep2(result.companyId, result.data), 1000);
      
    } catch (error) {
      updateStepStatus(1, false);
      toast({
        title: "❌ Error en el paso 1",
        description: "No pudimos extraer la información de tu empresa. Intenta de nuevo.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const executeStep2 = async (companyIdParam?: string, companyDataParam?: any) => {
    updateStepStatus(2, true);
    setCurrentStep(2);

    try {
      const result = await callOnboardingFunction('company-strategy', {
        companyId: companyIdParam || companyId,
        input: { data: companyDataParam || companyData }
      });

      setStrategyData(result.data_stored);
      updateStepStatus(2, false, true);
      
      toast({
        title: "✅ Estrategia estructurada",
        description: "Tu estrategia empresarial ha sido definida"
      });

      // Auto-advance to step 3
      setTimeout(() => executeStep3(companyIdParam || companyId, result.data_stored), 1000);
      
    } catch (error) {
      updateStepStatus(2, false);
      toast({
        title: "❌ Error en el paso 2",
        description: "No pudimos estructurar tu estrategia. Intenta de nuevo.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const executeStep3 = async (companyIdParam?: string, strategyDataParam?: any) => {
    updateStepStatus(3, true);
    setCurrentStep(3);

    try {
      const strategy = strategyDataParam || strategyData;
      const result = await callOnboardingFunction('brand-identity', {
        companyId: companyIdParam || companyId,
        nombre_empresa: companyData?.name || 'Tu Empresa',
        mision: strategy?.mision || '',
        vision: strategy?.vision || '',
        propuesta_valor: strategy?.propuesta_valor || ''
      });

      updateStepStatus(3, false, true);
      
      toast({
        title: "✅ Marca analizada",
        description: "Tu identidad de marca ha sido creada"
      });

      // Auto-advance to step 4
      setTimeout(() => executeStep4(companyIdParam || companyId), 1000);
      
    } catch (error) {
      updateStepStatus(3, false);
      toast({
        title: "❌ Error en el paso 3",
        description: "No pudimos analizar tu marca. Intenta de nuevo.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const executeStep4 = async (companyIdParam?: string) => {
    updateStepStatus(4, true);
    setCurrentStep(4);

    try {
      const result = await callOnboardingFunction('create-company-agent', {
        user_id: user.id,
        company_id: companyIdParam || companyId
      });

      updateStepStatus(4, false, true);
      
      toast({
        title: "✅ Asistente ERA creado",
        description: "Tu copiloto empresarial personalizado está listo"
      });

      // Complete onboarding
      setTimeout(() => completeOnboarding(), 1000);
      
    } catch (error) {
      updateStepStatus(4, false);
      toast({
        title: "❌ Error en el paso 4",
        description: "No pudimos crear tu asistente ERA. Intenta de nuevo.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      // Mark onboarding as complete in database
      const { error } = await supabase
        .from('user_onboarding_status')
        .upsert({
          user_id: user.id,
          onboarding_completed_at: new Date().toISOString(),
          dna_empresarial_completed: true,
          first_login_completed: true,
          current_step: 4
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error marking onboarding complete:', error);
        toast({
          title: "❌ Error final",
          description: "Hubo un problema al finalizar el onboarding",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "🎉 ¡Onboarding completado!",
        description: "Tu cuenta está configurada. Redirigiendo al dashboard..."
      });

      // Redirect to company dashboard
      setTimeout(() => {
        navigate('/company-dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "❌ Error final",
        description: "Hubo un problema al finalizar el onboarding",
        variant: "destructive"
      });
    }
  };

  const startOnboarding = async () => {
    if (!companyUrl.trim()) {
      toast({
        title: "⚠️ URL requerida",
        description: "Por favor ingresa la URL de tu empresa",
        variant: "destructive"
      });
      return;
    }

    setIsStarted(true);
    
    try {
      await executeStep1();
    } catch (error) {
      console.error('Onboarding failed:', error);
      setIsStarted(false);
    }
  };

  const retryCurrentStep = async () => {
    switch (currentStep) {
      case 1:
        await executeStep1();
        break;
      case 2:
        await executeStep2();
        break;
      case 3:
        await executeStep3();
        break;
      case 4:
        await executeStep4();
        break;
    }
  };

  const getStepIcon = (step: OnboardingStep) => {
    if (step.loading) {
      return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    }
    if (step.completed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  const allStepsCompleted = steps.every(step => step.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            ¡Bienvenido a Buildera! 🚀
          </h1>
          <p className="text-xl text-muted-foreground">
            Configuremos tu empresa en 4 pasos simples para crear tu asistente ERA
          </p>
        </div>

        {!isStarted ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6" />
                Información de tu empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyUrl">URL de tu empresa</Label>
                <Input
                  id="companyUrl"
                  type="url"
                  placeholder="https://www.tuempresa.com"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Ingresa la URL de tu sitio web para extraer información básica de tu empresa
                </p>
              </div>
              <Button 
                onClick={startOnboarding}
                className="w-full"
                size="lg"
              >
                Comenzar configuración automática
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 mb-8">
              {steps.map((step, index) => (
                <Card key={step.id} className={`transition-all duration-300 ${
                  step.completed ? 'border-green-500 bg-green-50/50' :
                  step.loading ? 'border-primary bg-primary/5' :
                  'border-border'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {getStepIcon(step)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {step.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant={
                          step.completed ? 'default' :
                          step.loading ? 'secondary' :
                          'outline'
                        }>
                          {step.completed ? 'Completado' :
                           step.loading ? 'Procesando...' :
                           'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {allStepsCompleted && (
              <Card className="border-green-500 bg-green-50/50">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-700 mb-2">
                    ¡Configuración completada!
                  </h3>
                  <p className="text-green-600 mb-4">
                    Tu empresa y asistente ERA están listos. Serás redirigido al dashboard automáticamente.
                  </p>
                </CardContent>
              </Card>
            )}

            {!allStepsCompleted && currentStep > 0 && (
              <div className="text-center">
                <Button
                  onClick={retryCurrentStep}
                  variant="outline"
                  className="mr-4"
                >
                  Reintentar paso actual
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OnboardingOrchestrator;