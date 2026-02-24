import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Share2, Palette, Rocket, Check, ChevronRight, 
  ChevronLeft, SkipForward, Loader2, Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useJourneyProgression } from '@/hooks/useJourneyProgression';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ADNInfoTab } from '@/components/company/adn-tabs/ADNInfoTab';
import { ADNBrandTab } from '@/components/company/adn-tabs/ADNBrandTab';
import { SocialConnectionManager } from '@/components/company/SocialConnectionManager';

interface PostOnboardingActivationWizardProps {
  profile: any;
  onComplete: () => void;
}

const STEPS = ['company-info', 'connect-social', 'configure-brand', 'activate-autopilot'] as const;

const PostOnboardingActivationWizard = ({ profile, onComplete }: PostOnboardingActivationWizardProps) => {
  const { t } = useTranslation(['common', 'company']);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { company } = useCompany();
  const companyId = company?.id || profile?.primary_company_id;
  const { advanceToStep } = useJourneyProgression(companyId);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activatingAutopilot, setActivatingAutopilot] = useState(false);

  // Data states for company info & brand tabs
  const [companyData, setCompanyData] = useState<any>(null);
  const [brandingData, setBrandingData] = useState<any>(null);
  const [isEnrichingData, setIsEnrichingData] = useState(false);
  const [isGeneratingBrand, setIsGeneratingBrand] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Load company & branding data
  useEffect(() => {
    const loadData = async () => {
      if (!companyId) { setDataLoading(false); return; }
      try {
        const [companyRes, brandingRes] = await Promise.all([
          supabase.from('companies').select('*').eq('id', companyId).maybeSingle(),
          supabase.from('company_branding').select('*').eq('company_id', companyId).maybeSingle(),
        ]);
        setCompanyData(companyRes.data || null);
        if (!brandingRes.data && companyId) {
          const { data: newBranding } = await supabase
            .from('company_branding')
            .insert({ company_id: companyId })
            .select()
            .single();
          setBrandingData(newBranding);
        } else {
          setBrandingData(brandingRes.data);
        }
      } catch (err) {
        console.error('Error loading wizard data:', err);
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  // Check existing state for step completion
  useEffect(() => {
    const checkExistingState = async () => {
      if (!companyId) return;
      
      const [socialRes, brandRes, autopilotRes] = await Promise.all([
        supabase.from('social_accounts').select('platform').eq('is_connected', true),
        supabase.from('company_branding').select('id, primary_color, brand_voice').eq('company_id', companyId).maybeSingle(),
        supabase.from('company_autopilot_config').select('autopilot_enabled').eq('company_id', companyId).eq('autopilot_enabled', true).maybeSingle(),
      ]);

      const done = new Set<number>();
      
      // Step 0: company info - check if basic fields are filled
      if (companyData?.name && companyData?.description) done.add(0);
      // Step 1: social networks
      if ((socialRes.data || []).length > 0) done.add(1);
      // Step 2: brand
      if (brandRes.data?.primary_color || brandRes.data?.brand_voice) done.add(2);
      // Step 3: autopilot
      if (autopilotRes.data) done.add(3);
      
      setCompletedSteps(done);
      
      // Navigate to first incomplete step
      for (let i = 0; i < STEPS.length; i++) {
        if (!done.has(i)) { setCurrentStep(i); break; }
      }
      if (done.size === STEPS.length) onComplete();
    };
    if (!dataLoading) checkExistingState();
  }, [companyId, dataLoading, companyData]);

  const saveField = useCallback(async (field: string, value: any, table: string = 'companies') => {
    try {
      const updateData: any = { [field]: value };
      
      if (table === 'companies' && companyData?.id) {
        const { error } = await supabase.from('companies').update(updateData).eq('id', companyData.id);
        if (error) throw error;
        setCompanyData((prev: any) => ({ ...prev, [field]: value }));
      } else if (table === 'company_branding' && brandingData?.id) {
        const { error } = await supabase.from('company_branding').update(updateData).eq('id', brandingData.id);
        if (error) throw error;
        setBrandingData((prev: any) => ({ ...prev, [field]: value }));
      }
    } catch (error) {
      console.error('Error saving field:', error);
      toast({ title: t('common:error'), variant: "destructive" });
    }
  }, [companyData?.id, brandingData?.id, toast, t]);

  const enrichCompanyData = useCallback(async () => {
    if (!companyData?.website_url || !companyId) return;
    setIsEnrichingData(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-company-data', {
        body: { companyId, websiteUrl: companyData.website_url }
      });
      if (error) throw error;
      if (data?.enrichedData) {
        setCompanyData((prev: any) => ({ ...prev, ...data.enrichedData }));
        toast({ title: "✓", description: t('company:enrich.success', 'Datos enriquecidos') });
      }
    } catch (err) {
      console.error('Error enriching:', err);
    } finally {
      setIsEnrichingData(false);
    }
  }, [companyData?.website_url, companyId, toast, t]);

  const generateBrandIdentity = useCallback(async () => {
    if (!companyId) return;
    setIsGeneratingBrand(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-brand-identity', {
        body: { companyId }
      });
      if (error) throw error;
      if (data) {
        const { data: updated } = await supabase
          .from('company_branding')
          .select('*')
          .eq('company_id', companyId)
          .maybeSingle();
        if (updated) setBrandingData(updated);
        toast({ title: "✓", description: t('company:brand.generated', 'Marca generada con IA') });
      }
    } catch (err) {
      console.error('Error generating brand:', err);
    } finally {
      setIsGeneratingBrand(false);
    }
  }, [companyId, toast, t]);

  const handleSkipStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleNextStep = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleActivateAutopilot = async () => {
    if (!companyId || !profile?.user_id) return;
    setActivatingAutopilot(true);
    
    try {
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
        setCompletedSteps(prev => new Set([...prev, 3]));
        toast({ title: "🚀", description: t('common:activationWizard.autopilotActivated', 'Autopilot activado') });
        setTimeout(() => onComplete(), 1500);
      }
    } catch (err) {
      console.error('Error activating autopilot:', err);
    } finally {
      setActivatingAutopilot(false);
    }
  };

  const progressPercent = ((completedSteps.size) / STEPS.length) * 100;

  const stepLabels = [
    t('common:activationWizard.step1Label', 'Mi Empresa'),
    t('common:activationWizard.step2Label', 'Redes Sociales'),
    t('common:activationWizard.step3Label', 'Marca'),
    t('common:activationWizard.step4Label', 'Autopilot'),
  ];

  const stepIcons = [Building2, Share2, Palette, Rocket];

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
          {t('common:activationWizard.subtitle4Steps', 'Sigue estos 4 pasos para activar la automatización')}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>{t('common:activationWizard.progress', 'Progreso')}</span>
          <span>{completedSteps.size}/{STEPS.length}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="flex gap-2 mb-6">
        {STEPS.map((_, idx) => {
          const Icon = stepIcons[idx];
          const isActive = idx === currentStep;
          const isDone = completedSteps.has(idx);
          return (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={cn(
                "flex-1 py-2 px-2 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : isDone 
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30" 
                    : "bg-muted text-muted-foreground"
              )}
            >
              {isDone && !isActive ? (
                <Check className="w-3 h-3 shrink-0" />
              ) : (
                <Icon className="w-3 h-3 shrink-0" />
              )}
              <span className="truncate">{stepLabels[idx]}</span>
            </button>
          );
        })}
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
          {/* Step 0: Company Info */}
          {currentStep === 0 && (
            <div className="space-y-4">
              {dataLoading ? (
                <Card><CardContent className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </CardContent></Card>
              ) : (
                <ADNInfoTab
                  companyData={companyData}
                  setCompanyData={setCompanyData}
                  saveField={saveField}
                  isEnrichingData={isEnrichingData}
                  enrichCompanyData={enrichCompanyData}
                />
              )}
              <StepFooter
                onSkip={handleSkipStep}
                onNext={handleNextStep}
                nextLabel={t('common:actions.next', 'Siguiente')}
                skipLabel={t('common:activationWizard.skipForNow', 'Omitir por ahora')}
              />
            </div>
          )}

          {/* Step 1: Social Networks */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">
                        {t('common:activationWizard.step2Title', 'Conecta tus redes sociales')}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {t('common:activationWizard.step2Desc', 'Para que Buildera pueda gestionar tu contenido automáticamente')}
                      </p>
                    </div>
                  </div>
                  <SocialConnectionManager 
                    profile={profile} 
                    onConnectionsUpdated={() => {
                      setCompletedSteps(prev => new Set([...prev, 1]));
                    }}
                  />
                </CardContent>
              </Card>
              <StepFooter
                onSkip={handleSkipStep}
                onNext={handleNextStep}
                nextLabel={t('common:actions.next', 'Siguiente')}
                skipLabel={t('common:activationWizard.skipForNow', 'Omitir por ahora')}
              />
            </div>
          )}

          {/* Step 2: Brand */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {dataLoading ? (
                <Card><CardContent className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </CardContent></Card>
              ) : (
                <ADNBrandTab
                  companyData={companyData}
                  brandingData={brandingData}
                  saveField={saveField}
                  generateBrandIdentity={generateBrandIdentity}
                  isGeneratingBrand={isGeneratingBrand}
                />
              )}
              <StepFooter
                onSkip={handleSkipStep}
                onNext={handleNextStep}
                nextLabel={t('common:actions.next', 'Siguiente')}
                skipLabel={t('common:activationWizard.skipForNow', 'Omitir por ahora')}
              />
            </div>
          )}

          {/* Step 3: Activate Autopilot */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Rocket className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">
                        {t('common:activationWizard.step4Title', 'Activa el Autopilot')}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {t('common:activationWizard.step4Desc', 'Buildera creará y publicará contenido por ti')}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="font-semibold">
                        {t('common:activationWizard.marketingDept', 'Marketing Autopilot')}
                      </span>
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
                </CardContent>
              </Card>
              <StepFooter
                onSkip={handleSkipStep}
                skipLabel={t('common:activationWizard.skipForNow', 'Omitir por ahora')}
              />
            </div>
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

// Reusable footer for each step
const StepFooter = ({ 
  onSkip, 
  onNext, 
  skipLabel, 
  nextLabel 
}: { 
  onSkip: () => void; 
  onNext?: () => void; 
  skipLabel: string; 
  nextLabel?: string;
}) => (
  <div className="flex justify-between items-center">
    <Button variant="ghost" size="sm" onClick={onSkip}>
      <SkipForward className="w-4 h-4 mr-1" />
      {skipLabel}
    </Button>
    {onNext && nextLabel && (
      <Button size="sm" onClick={onNext}>
        {nextLabel}
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    )}
  </div>
);

export default PostOnboardingActivationWizard;
