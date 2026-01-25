import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Globe, Building2, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OnboardingWowLoader } from '@/components/onboarding/OnboardingWowLoader';
import { OnboardingWowResults } from '@/components/onboarding/OnboardingWowResults';
import JourneySelector, { JourneyType } from '@/components/onboarding/JourneySelector';

interface OnboardingOrchestratorProps {
  user: any;
}

type OnboardingPhase = 
  | 'checking' 
  | 'journey-selection'  // NEW: Bifurcation step
  | 'form' 
  | 'loading' 
  | 'results';

interface CompanyBasicData {
  id: string;
  name: string;
  website_url: string;
  industry_sector?: string;
  journey_type?: JourneyType;
}

const OnboardingOrchestrator = ({ user }: OnboardingOrchestratorProps) => {
  const [phase, setPhase] = useState<OnboardingPhase>('checking');
  const [companyData, setCompanyData] = useState<CompanyBasicData | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<JourneyType | null>(null);
  const [results, setResults] = useState<any>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Form state for companies without data
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    industry_sector: ''
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation(['common']);

  // Phase 1: Check if company has basic data and journey type
  useEffect(() => {
    const checkCompanyData = async () => {
      if (!user?.id) return;

      try {
        // Get user's primary company
        const { data: companyMembers } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .limit(1);

        if (!companyMembers || companyMembers.length === 0) {
          console.log('📋 No company found, showing journey selection');
          setPhase('journey-selection');
          return;
        }

        const { data: company } = await supabase
          .from('companies')
          .select('id, name, website_url, industry_sector, journey_type')
          .eq('id', companyMembers[0].company_id)
          .single();

        // Check if journey type has been selected
        if (!company?.journey_type || company.journey_type === 'new_business') {
          // For new businesses or unselected, check if we need journey selection
          if (!company?.name || !company?.website_url) {
            console.log('📋 Company missing data, showing journey selection');
            if (company) {
              setCompanyData(company as CompanyBasicData);
              setFormData({
                name: company.name || '',
                website_url: company.website_url || '',
                industry_sector: company.industry_sector || ''
              });
            }
            setPhase('journey-selection');
            return;
          }
        }

        // If company has data and journey type, proceed based on journey
        if (company?.name && company?.website_url) {
          console.log('✅ Company data found, journey:', company.journey_type);
          setCompanyData(company as CompanyBasicData);
          setSelectedJourney((company.journey_type as JourneyType) || 'existing_business');
          startExtraction(company.id);
        } else {
          console.log('📋 Company missing data, showing form');
          if (company) {
            setCompanyData(company as CompanyBasicData);
            setFormData({
              name: company.name || '',
              website_url: company.website_url || '',
              industry_sector: company.industry_sector || ''
            });
          }
          setPhase('form');
        }
      } catch (error) {
        console.error('Error checking company data:', error);
        setPhase('journey-selection');
      }
    };

    checkCompanyData();
  }, [user?.id]);

  // Handle journey selection
  const handleJourneySelect = async (journeyType: JourneyType) => {
    console.log('🎯 Journey selected:', journeyType);
    setSelectedJourney(journeyType);
    
    // If company exists, update journey type
    if (companyData?.id) {
      await supabase
        .from('companies')
        .update({ 
          journey_type: journeyType,
          journey_current_step: 1
        })
        .eq('id', companyData.id);
    }
    
    // Move to form phase
    setPhase('form');
  };

  // Check if website is required based on journey type
  const isWebsiteRequired = selectedJourney === 'existing_business';

  // Save basic company data and start extraction or go to PTW
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Name is always required, website only for existing businesses
    if (!formData.name) {
      toast({
        title: t('common:validation.required'),
        description: t('common:onboarding.fillRequiredFields'),
        variant: "destructive"
      });
      return;
    }

    // For existing businesses, website is required
    if (isWebsiteRequired && !formData.website_url) {
      toast({
        title: t('common:validation.required'),
        description: t('common:onboarding.websiteRequired'),
        variant: "destructive"
      });
      return;
    }

    try {
      let companyId = companyData?.id;

      if (companyId) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            name: formData.name,
            website_url: formData.website_url || null,
            industry_sector: formData.industry_sector || null,
            journey_type: selectedJourney
          })
          .eq('id', companyId);

        if (error) throw error;
      } else {
        // Create new company with journey type
        const { data: newCompany, error } = await supabase
          .from('companies')
          .insert({
            name: formData.name,
            website_url: formData.website_url || null,
            industry_sector: formData.industry_sector || null,
            journey_type: selectedJourney || 'new_business',
            journey_current_step: 1,
            created_by: user.id
          })
          .select()
          .single();

        if (error) throw error;
        companyId = newCompany.id;

        // Add user as company member
        await supabase
          .from('company_members')
          .insert({
            company_id: companyId,
            user_id: user.id,
            role: 'owner',
            is_primary: true
          });
      }

      // Sync primary_company_id in profiles
      await supabase
        .from('profiles')
        .update({ primary_company_id: companyId })
        .eq('user_id', user.id);

      setCompanyData({
        id: companyId!,
        name: formData.name,
        website_url: formData.website_url,
        industry_sector: formData.industry_sector
      });

      // Decide next step based on journey and website availability
      if (selectedJourney === 'new_business' && !formData.website_url) {
        // New business without website: skip diagnostic, complete onboarding
        // and redirect to Play to Win wizard
        await completeOnboardingAndRedirectToPTW(companyId!);
      } else {
        // Has website: run diagnostic extraction
        startExtraction(companyId!);
      }
    } catch (error) {
      console.error('Error saving company data:', error);
      toast({
        title: t('common:errors.saveFailed'),
        description: t('common:errors.tryAgain'),
        variant: "destructive"
      });
    }
  };

  // Complete onboarding without diagnostic and redirect to PTW
  const completeOnboardingAndRedirectToPTW = async (companyId: string) => {
    try {
      // Mark onboarding as complete (partial - no diagnostic)
      await supabase
        .from('user_onboarding_status')
        .upsert({
          user_id: user.id,
          onboarding_completed_at: new Date().toISOString(),
          dna_empresarial_completed: true,
          first_login_completed: true,
          current_step: 5
        }, {
          onConflict: 'user_id'
        });

      // Update company journey step
      await supabase
        .from('companies')
        .update({ journey_current_step: 2 })
        .eq('id', companyId);

      // Dispatch completion event
      window.dispatchEvent(new CustomEvent('onboarding-completed'));

      toast({
        title: t('common:onboarding.completed'),
        description: t('common:journey.founder.redirectToPTW', 'Vamos a definir tu estrategia'),
        duration: 2000
      });

      // Navigate to Founder PTW Simplified wizard (3 steps for new businesses)
      setTimeout(() => {
        navigate('/company-dashboard?view=founder-ptw&onboarding_completed=true', { replace: true });
      }, 1000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigate('/company-dashboard', { replace: true });
    }
  };

  // Phase 2: Run extraction with NEW optimized APIs
  // API 1 (company-info-extractor): ~1 min - basic info
  // API 2 (company-digital-presence): ~2 min - digital analysis
  // Total: ~3 minutes with better feedback
  const startExtraction = async (companyId: string) => {
    setPhase('loading');
    setProgress(5);
    const startTime = Date.now();

    try {
      console.log('🚀 Starting company extraction for company:', companyId);
      
      // Progress simulation for ~3 minute operation with NEW phases:
      // Phase 1 (0-40%): Extracting basic info (~60s)
      // Phase 2 (40-80%): Analyzing digital presence (~90s)
      // Phase 3 (80-95%): Generating executive diagnosis (~30s)
      const progressInterval = setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        
        setProgress(prev => {
          // Phase 1: 0-40% in first 60 seconds (extracting basic info)
          if (elapsedSeconds < 60) {
            const target = Math.min(40, (elapsedSeconds / 60) * 40);
            return Math.max(prev, Math.floor(target));
          }
          // Phase 2: 40-80% in 60-150 seconds (analyzing digital presence)
          if (elapsedSeconds < 150) {
            const target = 40 + ((elapsedSeconds - 60) / 90) * 40;
            return Math.max(prev, Math.floor(target));
          }
          // Phase 3: 80-95% in 150-180 seconds (generating diagnosis)
          if (elapsedSeconds < 180) {
            const target = 80 + ((elapsedSeconds - 150) / 30) * 15;
            return Math.max(prev, Math.floor(target));
          }
          // After 180s, slowly approach 95 but never reach 100 until done
          if (prev < 95) return prev + 0.5;
          return prev;
        });
      }, 1500);

      // Call company-info-extractor directly (handles both APIs internally)
      const { data, error } = await supabase.functions.invoke('company-info-extractor', {
        body: { companyId }
      });

      clearInterval(progressInterval);
      setProgress(100);

      const endTime = Date.now();
      setTotalTime(endTime - startTime);

      if (error) throw error;

      if (data?.success) {
        console.log('✅ Extraction completed successfully:', data);
        
        // Transform data for OnboardingWowResults with NEW structure
        const transformedResults = transformExtractorResults(data);
        setResults(transformedResults);
        setPhase('results');
      } else {
        throw new Error(data?.error || 'Extraction failed');
      }
    } catch (error) {
      console.error('❌ Extraction error:', error);
      toast({
        title: t('common:errors.processingFailed'),
        description: 'Error al analizar tu empresa. El análisis será reintentado.',
        variant: "destructive"
      });
      // En lugar de volver al form, mostrar un estado de error con opción de reintentar
      // No redirigir a ningún lado - mantener al usuario en onboarding
      setProgress(0);
      // Si ya tenemos datos de empresa, permitir reintentar
      if (companyData?.id) {
        // Mostrar toast con opción de reintentar
        toast({
          title: "¿Reintentar análisis?",
          description: "Haz clic en el botón para intentar nuevamente",
          duration: 10000
        });
      }
      setPhase('form');
    }
  };

  // Transform NEW API structure to display format
  const transformExtractorResults = (data: any) => {
    const basicInfo = data.basic_info || {};
    const digitalPresence = data.digital_presence || {};

    // Map from NEW structure (identity, seo, products, contact, market, audience)
    const identity = basicInfo.identity || {};
    const seo = basicInfo.seo || {};
    const products = basicInfo.products || {};
    const contact = basicInfo.contact || {};
    const market = basicInfo.market || {};
    const audience = basicInfo.audience || {};

    // Map from digital presence (what_is_working, what_is_missing, executive_diagnosis, action_plan)
    const execDiag = digitalPresence.executive_diagnosis || {};

    return {
      success: true,
      // NEW structure for tabs
      basic_info: {
        identity: {
          company_name: identity.company_name,
          legal_name: identity.legal_name,
          slogan: identity.slogan,
          founding_date: identity.founding_date,
          logo: identity.logo,
          url: identity.url
        },
        seo: {
          title: seo.title,
          description: seo.description,
          keywords: seo.keyword || []
        },
        products: {
          services: products.service || [],
          offers: products.offer || []
        },
        contact: {
          emails: contact.email || [],
          phones: contact.phone || [],
          addresses: contact.address || [],
          social_links: contact.social_links || []
        },
        market: {
          countries: market.country || [],
          cities: market.city || []
        },
        audience: {
          segments: audience.segment || [],
          professions: audience.profession || [],
          target_users: audience.target_user || []
        }
      },
      digital_presence: {
        digital_footprint_summary: digitalPresence.digital_footprint_summary,
        what_is_working: digitalPresence.what_is_working || [],
        what_is_missing: digitalPresence.what_is_missing || [],
        key_risks: digitalPresence.key_risks || [],
        competitive_positioning: digitalPresence.competitive_positioning,
        action_plan: digitalPresence.action_plan || {},
        executive_diagnosis: execDiag
      },
      // Summary for header
      summary: {
        title: identity.company_name || companyData?.name || 'Tu Empresa',
        description: execDiag.current_state || seo.description || 'Análisis completo de tu presencia digital',
        highlights: [
          identity.slogan ? `"${identity.slogan}"` : null,
          products.service?.length ? `${products.service.length} servicios` : null,
          digitalPresence.what_is_working?.length ? `${digitalPresence.what_is_working.length} fortalezas` : null,
          digitalPresence.action_plan?.short_term?.length ? `${digitalPresence.action_plan.short_term.length} acciones inmediatas` : null
        ].filter(Boolean)
      }
    };
  };

  // Complete onboarding and redirect
  const handleContinue = async () => {
    try {
      // Mark onboarding as complete
      await supabase
        .from('user_onboarding_status')
        .upsert({
          user_id: user.id,
          onboarding_completed_at: new Date().toISOString(),
          dna_empresarial_completed: true,
          first_login_completed: true,
          current_step: 5
        }, {
          onConflict: 'user_id'
        });

      // Dispatch completion event
      window.dispatchEvent(new CustomEvent('onboarding-completed'));

      toast({
        title: t('common:onboarding.completed'),
        description: t('common:onboarding.redirecting'),
        duration: 2000
      });

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/company-dashboard?view=adn-empresa&onboarding_completed=true', { replace: true });
      }, 1000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigate('/company-dashboard', { replace: true });
    }
  };

  // Determine current phase for loader - NEW phases
  const getCurrentPhase = (): 'analyzing' | 'evaluating' | 'diagnosing' | 'complete' => {
    if (progress < 40) return 'analyzing';      // Extracting basic info
    if (progress < 80) return 'evaluating';     // Analyzing digital presence
    if (progress < 95) return 'diagnosing';     // Generating executive diagnosis
    return 'complete';
  };

  // Render based on phase
  if (phase === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t('common:onboarding.checkingData')}</p>
        </div>
      </div>
    );
  }

  // NEW: Journey selection phase
  if (phase === 'journey-selection') {
    return (
      <JourneySelector 
        onSelect={handleJourneySelect}
        companyName={companyData?.name}
      />
    );
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <OnboardingWowLoader 
          progress={progress} 
          currentPhase={getCurrentPhase()}
          estimatedTotalSeconds={180}
        />
      </div>
    );
  }

  if (phase === 'results' && results) {
    return (
      <div className="min-h-screen bg-background p-4 py-8">
        <div className="max-w-4xl mx-auto">
          <OnboardingWowResults
            results={results}
            summary={results.summary}
            totalTime={totalTime}
            onContinue={handleContinue}
          />
        </div>
      </div>
    );
  }

  // Phase: Form - Collect basic company data
  // Form adapts based on selected journey
  const isNewBusiness = selectedJourney === 'new_business';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {isNewBusiness 
              ? t('common:journey.founder.step1Title', 'Cuéntanos sobre tu visión')
              : t('common:onboarding.welcomeTitle')
            }
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            {isNewBusiness
              ? t('common:journey.founder.step1Description', 'Empecemos por lo básico de tu negocio')
              : t('common:onboarding.welcomeDescription')
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {isNewBusiness 
                  ? t('common:journey.founder.businessName', 'Nombre de tu negocio')
                  : t('common:company.name')
                } *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={isNewBusiness 
                  ? t('common:journey.founder.businessNamePlaceholder', 'Ej: Mi Startup')
                  : t('common:company.namePlaceholder')
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('common:company.website')} {isWebsiteRequired ? '*' : `(${t('common:optional', 'opcional')})`}
              </Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://ejemplo.com"
                required={isWebsiteRequired}
              />
              {isNewBusiness && (
                <p className="text-xs text-muted-foreground">
                  {t('common:journey.founder.noWebsiteHint', '¿Aún no tienes sitio web? No hay problema, te ayudaremos a construir tu estrategia desde cero.')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry_sector" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                {t('common:company.sector')}
              </Label>
              <Input
                id="industry_sector"
                value={formData.industry_sector}
                onChange={(e) => setFormData(prev => ({ ...prev, industry_sector: e.target.value }))}
                placeholder={t('common:company.sectorPlaceholder')}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6"
              disabled={!formData.name || (isWebsiteRequired && !formData.website_url)}
            >
              {isNewBusiness && !formData.website_url
                ? t('common:journey.founder.startStrategyWithoutWeb', 'Comenzar sin sitio web')
                : isNewBusiness
                  ? t('common:journey.founder.analyzeAndStart', 'Analizar y comenzar')
                  : t('common:onboarding.startAnalysis')
              }
            </Button>

            {/* Back button to journey selection */}
            <Button 
              type="button"
              variant="ghost" 
              className="w-full"
              onClick={() => setPhase('journey-selection')}
            >
              {t('common:actions.back')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingOrchestrator;
