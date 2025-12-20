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
import { useAgentExecution } from '@/hooks/useAgentExecution';
import { OnboardingWowLoader } from '@/components/onboarding/OnboardingWowLoader';
import { OnboardingWowResults } from '@/components/onboarding/OnboardingWowResults';

interface OnboardingOrchestratorProps {
  user: any;
}

type OnboardingPhase = 'checking' | 'form' | 'loading' | 'results';

interface CompanyBasicData {
  id: string;
  name: string;
  website_url: string;
  industry_sector?: string;
}

const OnboardingOrchestrator = ({ user }: OnboardingOrchestratorProps) => {
  const [phase, setPhase] = useState<OnboardingPhase>('checking');
  const [companyData, setCompanyData] = useState<CompanyBasicData | null>(null);
  const [results, setResults] = useState<any>(null);
  const [totalTime, setTotalTime] = useState(0);
  
  // Form state for companies without data
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    industry_sector: ''
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['common']);
  const { executeOnboardingOrchestrator, isExecuting, progress } = useAgentExecution();

  // Phase 1: Check if company has basic data
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
          console.log('📋 No company found, showing form');
          setPhase('form');
          return;
        }

        const { data: company } = await supabase
          .from('companies')
          .select('id, name, website_url, industry_sector')
          .eq('id', companyMembers[0].company_id)
          .single();

        if (company?.name && company?.website_url) {
          console.log('✅ Company data found, starting orchestration');
          setCompanyData(company);
          startOrchestration(company.id);
        } else {
          console.log('📋 Company missing data, showing form');
          if (company) {
            setCompanyData(company);
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
        setPhase('form');
      }
    };

    checkCompanyData();
  }, [user?.id]);

  // Save basic company data and start orchestration
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.website_url) {
      toast({
        title: t('common:validation.required'),
        description: t('common:onboarding.fillRequiredFields'),
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
            website_url: formData.website_url,
            industry_sector: formData.industry_sector || null
          })
          .eq('id', companyId);

        if (error) throw error;
      } else {
        // Create new company
        const { data: newCompany, error } = await supabase
          .from('companies')
          .insert({
            name: formData.name,
            website_url: formData.website_url,
            industry_sector: formData.industry_sector || null,
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

      startOrchestration(companyId!);
    } catch (error) {
      console.error('Error saving company data:', error);
      toast({
        title: t('common:errors.saveFailed'),
        description: t('common:errors.tryAgain'),
        variant: "destructive"
      });
    }
  };

  // Phase 2: Run parallel WOW orchestration
  const startOrchestration = async (companyId: string) => {
    setPhase('loading');
    const startTime = Date.now();

    try {
      console.log('🚀 Starting WOW orchestration for company:', companyId);
      
      const result = await executeOnboardingOrchestrator(
        user.id, 
        companyId, 
        i18n.language
      );

      const endTime = Date.now();
      setTotalTime(endTime - startTime);

      if (result?.success) {
        console.log('✅ Orchestration completed successfully');
        setResults(result);
        setPhase('results');
      } else {
        throw new Error('Orchestration failed');
      }
    } catch (error) {
      console.error('❌ Orchestration error:', error);
      toast({
        title: t('common:errors.processingFailed'),
        description: t('common:errors.tryAgain'),
        variant: "destructive"
      });
      // Allow retry
      setPhase('form');
    }
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

  // Determine current phase for loader
  const getCurrentPhase = (): 'strategy' | 'content' | 'insights' | 'complete' => {
    if (progress < 30) return 'strategy';
    if (progress < 60) return 'content';
    if (progress < 90) return 'insights';
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

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <OnboardingWowLoader 
          progress={progress} 
          currentPhase={getCurrentPhase()} 
        />
      </div>
    );
  }

  if (phase === 'results' && results) {
    return (
      <div className="min-h-screen bg-background p-4 py-8">
        <div className="max-w-4xl mx-auto">
          <OnboardingWowResults
            results={results.results}
            summary={results.summary}
            totalTime={totalTime}
            onContinue={handleContinue}
          />
        </div>
      </div>
    );
  }

  // Phase: Form - Collect basic company data
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {t('common:onboarding.welcomeTitle')}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            {t('common:onboarding.welcomeDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {t('common:company.name')} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('common:company.namePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('common:company.website')} *
              </Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://ejemplo.com"
                required
              />
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
              disabled={!formData.name || !formData.website_url}
            >
              {t('common:onboarding.startAnalysis')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingOrchestrator;
