import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Linkedin, Instagram, Facebook, Video, 
  Palette, Sparkles, Rocket, Check, ChevronRight, 
  SkipForward, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useJourneyProgression } from '@/hooks/useJourneyProgression';
import { useCompany } from '@/contexts/CompanyContext';
import { cn } from '@/lib/utils';

interface PostOnboardingActivationWizardProps {
  profile: any;
  onComplete: () => void;
}

const STEPS = ['connect-social', 'configure-brand', 'activate-department'] as const;

const PostOnboardingActivationWizard = ({ profile, onComplete }: PostOnboardingActivationWizardProps) => {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const { company } = useCompany();
  const companyId = company?.id || profile?.primary_company_id;
  const { advanceToStep } = useJourneyProgression(companyId);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activatingAutopilot, setActivatingAutopilot] = useState(false);
  const [connectedNetworks, setConnectedNetworks] = useState<string[]>([]);

  // Check what's already done
  useEffect(() => {
    const checkExistingState = async () => {
      if (!companyId) return;
      
      const [socialRes, brandRes, autopilotRes] = await Promise.all([
        supabase.from('social_accounts').select('platform').eq('is_connected', true),
        supabase.from('company_branding').select('id').eq('company_id', companyId).maybeSingle(),
        supabase.from('company_autopilot_config').select('autopilot_enabled').eq('company_id', companyId).eq('autopilot_enabled', true).maybeSingle(),
      ]);

      const connected = (socialRes.data || []).map(s => s.platform);
      setConnectedNetworks(connected);
      
      const done = new Set<number>();
      if (connected.length > 0) done.add(0);
      if (brandRes.data) done.add(1);
      if (autopilotRes.data) done.add(2);
      setCompletedSteps(done);
      
      // Skip to first incomplete step
      if (done.has(0) && !done.has(1)) setCurrentStep(1);
      else if (done.has(0) && done.has(1) && !done.has(2)) setCurrentStep(2);
      else if (done.size === 3) onComplete();
    };
    checkExistingState();
  }, [companyId]);

  const handleSkipStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleConnectNetwork = (platform: string) => {
    // Navigate to the social connection flow
    navigate(`/company-dashboard?view=negocio`);
  };

  const handleConfigureBrand = () => {
    navigate(`/company-dashboard?view=negocio`);
  };

  const handleActivateAutopilot = async () => {
    if (!companyId || !profile?.user_id) return;
    setActivatingAutopilot(true);
    
    try {
      // Enable marketing autopilot
      const { error } = await supabase
        .from('company_autopilot_config')
        .upsert({
          company_id: companyId,
          user_id: profile.user_id,
          autopilot_enabled: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'company_id' });

      if (!error) {
        await advanceToStep(5);
        setCompletedSteps(prev => new Set([...prev, 2]));
        setTimeout(() => onComplete(), 1500);
      }
    } catch (err) {
      console.error('Error activating autopilot:', err);
    } finally {
      setActivatingAutopilot(false);
    }
  };

  const progressPercent = ((completedSteps.size) / STEPS.length) * 100;

  const socialNetworks = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-[#0A66C2]' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-[#1877F2]' },
    { id: 'tiktok', name: 'TikTok', icon: Video, color: 'bg-[#000000]' },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
        >
          <Rocket className="w-8 h-8 text-primary-foreground" />
        </motion.div>
        <h1 className="text-2xl font-bold mb-2">
          {t('common:activationWizard.title', '¡Tu negocio está listo!')}
        </h1>
        <p className="text-muted-foreground">
          {t('common:activationWizard.subtitle', 'Sigue estos 3 pasos para activar la automatización')}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>{t('common:activationWizard.progress', 'Progreso')}</span>
          <span>{completedSteps.size}/{STEPS.length}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="flex gap-2 mb-6">
        {STEPS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentStep(idx)}
            className={cn(
              "flex-1 h-1.5 rounded-full transition-all",
              idx === currentStep ? "bg-primary" : 
              completedSteps.has(idx) ? "bg-emerald-500" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-xl">📱</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">
                      {t('common:activationWizard.step1Title', 'Conecta tus redes sociales')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t('common:activationWizard.step1Desc', 'Para que Buildera pueda gestionar tu contenido automáticamente')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {socialNetworks.map(network => {
                    const isConnected = connectedNetworks.includes(network.id);
                    const Icon = network.icon;
                    return (
                      <Button
                        key={network.id}
                        variant={isConnected ? "default" : "outline"}
                        className={cn(
                          "h-auto py-4 flex-col gap-2",
                          isConnected && "bg-emerald-500 hover:bg-emerald-600 border-emerald-500"
                        )}
                        onClick={() => !isConnected && handleConnectNetwork(network.id)}
                        disabled={isConnected}
                      >
                        {isConnected ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                        <span className="text-xs">{network.name}</span>
                      </Button>
                    );
                  })}
                </div>

                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" onClick={handleSkipStep}>
                    <SkipForward className="w-4 h-4 mr-1" />
                    {t('common:activationWizard.skipForNow', 'Omitir por ahora')}
                  </Button>
                  {connectedNetworks.length > 0 && (
                    <Button size="sm" onClick={() => { 
                      setCompletedSteps(prev => new Set([...prev, 0]));
                      advanceToStep(3);
                      setCurrentStep(1);
                    }}>
                      {t('common:actions.next')}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 1 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">
                      {t('common:activationWizard.step2Title', 'Configura tu marca')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t('common:activationWizard.step2Desc', 'Define los colores y tono de voz de tu negocio')}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-lg border bg-muted/30 text-center">
                    <Sparkles className="w-8 h-8 mx-auto text-primary mb-2" />
                    <p className="text-sm font-medium mb-1">
                      {t('common:activationWizard.aiGenerate', 'Generación automática con IA')}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {t('common:activationWizard.aiGenerateDesc', 'Usaremos los datos de tu diagnóstico para configurar tu marca automáticamente')}
                    </p>
                    <Button onClick={handleConfigureBrand}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('common:activationWizard.configureBrand', 'Configurar Marca')}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" onClick={handleSkipStep}>
                    <SkipForward className="w-4 h-4 mr-1" />
                    {t('common:activationWizard.skipForNow', 'Omitir por ahora')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">
                      {t('common:activationWizard.step3Title', 'Activa tu primer departamento')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t('common:activationWizard.step3Desc', 'Buildera creará y publicará contenido por ti')}
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📣</span>
                      <span className="font-semibold">{t('common:activationWizard.marketingDept', 'Marketing')}</span>
                    </div>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                      {t('common:activationWizard.recommended', 'Recomendado')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('common:activationWizard.marketingDesc', 'Genera contenido, programa publicaciones y analiza resultados automáticamente.')}
                  </p>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleActivateAutopilot}
                    disabled={activatingAutopilot}
                  >
                    {activatingAutopilot ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('common:activationWizard.activating', 'Activando...')}
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        {t('common:activationWizard.activateAutopilot', 'Activar Marketing Autopilot')}
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" onClick={handleSkipStep}>
                    <SkipForward className="w-4 h-4 mr-1" />
                    {t('common:activationWizard.skipForNow', 'Omitir por ahora')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Skip all */}
      <div className="text-center mt-6">
        <Button variant="link" size="sm" className="text-muted-foreground" onClick={onComplete}>
          {t('common:activationWizard.skipAll', 'Ir al dashboard directamente')}
        </Button>
      </div>
    </div>
  );
};

export default PostOnboardingActivationWizard;
