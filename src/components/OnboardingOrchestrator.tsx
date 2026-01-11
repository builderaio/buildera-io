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
          console.log('✅ Company data found, starting extraction');
          setCompanyData(company);
          startExtraction(company.id);
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

  // Save basic company data and start extraction
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

      startExtraction(companyId!);
    } catch (error) {
      console.error('Error saving company data:', error);
      toast({
        title: t('common:errors.saveFailed'),
        description: t('common:errors.tryAgain'),
        variant: "destructive"
      });
    }
  };

  // Phase 2: Run company-info-extractor directly (NO other agents!)
  // This API can take up to 3 minutes, so we show progressive feedback
  const startExtraction = async (companyId: string) => {
    setPhase('loading');
    setProgress(5);
    const startTime = Date.now();

    try {
      console.log('🚀 Starting company-info-extractor for company:', companyId);
      
      // Simulate progress more realistically for ~3 minute operation
      // Total expected time: 180 seconds
      // Progress milestones: 0-30 (analyzing), 30-60 (evaluating), 60-90 (diagnosing), 90-100 (completing)
      const progressInterval = setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        
        setProgress(prev => {
          // Phase 1: 0-30% in first 60 seconds (analyzing)
          if (elapsedSeconds < 60) {
            const target = Math.min(30, (elapsedSeconds / 60) * 30);
            return Math.max(prev, Math.floor(target));
          }
          // Phase 2: 30-60% in 60-120 seconds (evaluating)
          if (elapsedSeconds < 120) {
            const target = 30 + ((elapsedSeconds - 60) / 60) * 30;
            return Math.max(prev, Math.floor(target));
          }
          // Phase 3: 60-85% in 120-180 seconds (diagnosing)
          if (elapsedSeconds < 180) {
            const target = 60 + ((elapsedSeconds - 120) / 60) * 25;
            return Math.max(prev, Math.floor(target));
          }
          // After 180s, slowly approach 90 but never reach 100 until done
          if (prev < 90) return prev + 1;
          return prev;
        });
      }, 2000);

      // Call company-info-extractor directly
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
        
        // Transform data for OnboardingWowResults
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
        description: t('common:errors.tryAgain'),
        variant: "destructive"
      });
      setPhase('form');
      setProgress(0);
    }
  };

  // Transform company-info-extractor results to display format
  const transformExtractorResults = (data: any) => {
    const bp = data.business_profile || {};
    const sp = data.social_presence || {};
    const diag = data.diagnosis || {};

    return {
      success: true,
      // Raw data for display
      business_profile: bp,
      social_presence: sp,
      diagnosis: diag,
      // Legacy format for summary header
      summary: {
        title: bp.identity?.company_name || companyData?.name || 'Tu Empresa',
        description: diag.executive_summary || bp.seo?.description?.[0] || 'Análisis completo de tu presencia digital',
        highlights: [
          bp.identity?.slogan ? `"${bp.identity.slogan}"` : null,
          bp.trust?.rating ? `⭐ ${bp.trust.rating} Rating` : null,
          sp.activity?.active_platforms?.length ? `${sp.activity.active_platforms.length} plataformas activas` : null,
          diag.prioritized_actions?.length ? `${diag.prioritized_actions.length} acciones recomendadas` : null
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

  // Determine current phase for loader
  const getCurrentPhase = (): 'analyzing' | 'evaluating' | 'diagnosing' | 'complete' => {
    if (progress < 30) return 'analyzing';
    if (progress < 60) return 'evaluating';
    if (progress < 90) return 'diagnosing';
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
