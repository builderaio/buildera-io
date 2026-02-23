import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// New consolidated components
import BusinessHealthDashboard from "@/components/company/BusinessHealthDashboard";
import BusinessConfigurationHub from "@/components/company/BusinessConfigurationHub";
import UnifiedAgentsView from "@/components/company/UnifiedAgentsView";
import MarketingHub from "@/components/company/MarketingHubWow";
import AcademiaBuildiera from "@/components/company/AcademiaBuildera";
import EnterpriseAutopilotDashboard from "@/components/company/EnterpriseAutopilotDashboard";

// Strategy components
import PlayToWinModule from "@/components/strategy/PlayToWinModule";
import FounderPTWSimplified from "@/components/strategy/founder/FounderPTWSimplified";
import StrategicControlCenter from "@/components/strategy/StrategicControlCenter";

// CRM
import { CRMDashboard } from "@/components/crm/CRMDashboard";

// Governance & Department Config
import GovernanceDashboard from "@/components/company/GovernanceDashboard";
import DepartmentConfigPanel from "@/components/company/departments/DepartmentConfigPanel";
import DepartmentActivationGuide from "@/components/company/departments/DepartmentActivationGuide";

// Legacy components (for backwards compatibility during transition)
import MisArchivos from "@/components/company/BaseConocimiento";
import { ContentAnalysisDashboard } from "@/components/company/ContentAnalysisDashboard";
import { CreatifyStudio } from "@/components/company/creatify/CreatifyStudio";

import UserProfile from "./UserProfile";
import OnboardingOrchestrator from "@/components/OnboardingOrchestrator";
import PostOnboardingActivationWizard from "@/components/onboarding/PostOnboardingActivationWizard";
import { User } from "@supabase/supabase-js";
import { useCompany } from "@/contexts/CompanyContext";

const CompanyDashboard = () => {
  const { t } = useTranslation(['company', 'common']);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeView, setActiveView] = useState("mando-central");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const checkAuth = async () => {
      console.group('🔐 [CompanyDashboard] checkAuth');
      console.log('Timestamp:', new Date().toISOString());
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('❌ No session found');
        console.groupEnd();
        navigate('/auth');
        return;
      }

      console.log('✅ Session found for user:', session.user.id);
      setUser(session.user);

      const viewParam = searchParams.get('view');
      const onboardingCompletedParam = searchParams.get('onboarding_completed');
      
      console.log('📍 URL params:', { viewParam, onboardingCompletedParam });
      
      if (viewParam === 'onboarding') {
        console.log('🔄 Showing onboarding orchestrator');
        setActiveView('onboarding');
        setLoading(false);
        console.groupEnd();
        return;
      } else if (viewParam) {
        console.log('🎯 Setting activeView from URL:', viewParam);
        setActiveView(viewParam);
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
          
        if (profileData) {
          setProfile(profileData);
        } else {
          setProfile({ user_id: session.user.id, email: session.user.email });
        }
        
        setLoading(false);
        console.groupEnd();
        return;
      }

      console.log('🔍 Checking onboarding status');
      
      const { data: onboardingStatus } = await supabase
        .from('user_onboarding_status')
        .select('onboarding_completed_at, dna_empresarial_completed')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (onboardingStatus?.onboarding_completed_at) {
        console.log('✅ Usuario ya completó onboarding, cargando perfil y continuando');
        
        // Check if user should see activation wizard (journey_current_step <= 2)
        const { data: companyData } = await supabase
          .from('companies')
          .select('journey_current_step')
          .eq('created_by', session.user.id)
          .maybeSingle();
        
        const journeyStep = companyData?.journey_current_step || 1;
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (profileError) {
          console.error('⚠️ Error cargando perfil:', profileError);
        }
        
        if (profileData) {
          console.log('✅ Perfil cargado:', {
            userId: profileData.user_id,
            email: profileData.email,
            userType: profileData.user_type
          });
          setProfile(profileData);
        } else {
          console.log('⚠️ No se encontró perfil, usando fallback mínimo');
          setProfile({ 
            user_id: session.user.id, 
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || 'Usuario',
            user_type: 'company'
          });
        }
        
        // Auto-redirect to activation wizard for new users (no view param specified)
        if (!viewParam && journeyStep <= 2) {
          console.log('🚀 Nuevo usuario post-onboarding, mostrando activation wizard');
          setActiveView('activation-wizard');
        }
        
        setLoading(false);
        console.groupEnd();
        return;
      } else {
        const { data: companies } = await supabase
          .from('companies')
          .select('*')
          .eq('created_by', session.user.id);

        const hasCompany = companies && companies.length > 0;

        console.log('🔍 CompanyDashboard onboarding check:', {
          hasCompany,
          companiesLength: companies?.length,
          userId: session.user.id,
          viewParam,
          onboardingCompleted: !!onboardingStatus?.onboarding_completed_at
        });

        // Solo redirigir a complete-profile si NO tiene empresa Y no está intentando hacer onboarding
        // Verificar también first_login_completed para evitar loops
        if (!hasCompany && !viewParam && !onboardingStatus?.onboarding_completed_at) {
          // Verificar si el usuario tiene first_login_completed (ya pasó por complete-profile)
          const { data: fullOnboarding } = await supabase
            .from('user_onboarding_status')
            .select('first_login_completed')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (!fullOnboarding?.first_login_completed) {
            console.log('❌ Usuario sin empresa ni first_login completado, redirigir a complete-profile');
            navigate('/complete-profile');
          } else {
            // Ya pasó por complete-profile pero algo falló en la creación de empresa
            // Mostrar el onboarding para que pueda reintentar
            console.log('⚠️ Usuario completó first_login pero sin empresa, mostrar onboarding');
            setActiveView('onboarding');
          }
          console.groupEnd();
          setLoading(false);
          return;
        }
      }
      
      console.log('🔍 Buscando perfil de empresa existente...');
      let { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!profileData) {
        console.log('⚠️ No se encontró perfil, creando uno nuevo para empresa...');
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Usuario',
            user_type: 'company',
            company_name: session.user.user_metadata?.company_name || '',
            industry_sector: session.user.user_metadata?.industry_sector || ''
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creando perfil:', insertError);
          toast({
            title: t('common:status.error'),
            description: t('company:errors.profileCreate'),
            variant: "destructive",
          });
          setLoading(false);
          navigate('/auth');
          return;
        }

        profileData = newProfile;
        console.log('✅ Perfil creado exitosamente');
        toast({
          title: t('company:toast.profileCreated'),
          description: t('company:toast.profileCreatedDesc'),
        });
      } else if (error) {
        console.error('❌ Error obteniendo perfil:', error);
        toast({
          title: t('company:errors.accessDenied'),
          description: t('company:errors.profileAccess'),
          variant: "destructive",
        });
        setLoading(false);
        navigate('/auth');
        return;
      }

      if (profileData && profileData.user_type !== 'company') {
        console.log('❌ Usuario no es de tipo empresa, redirigiendo');
        toast({
          title: t('company:errors.accessDenied'),
          description: t('company:errors.companyOnly'),
          variant: "destructive",
        });
        setLoading(false);
        navigate('/auth');
        return;
      }

      console.log('✅ Perfil validado y establecido');
      setProfile(profileData);
      
      const isProfileIncomplete = !profileData?.full_name;
      
      if (isProfileIncomplete && session.user.user_metadata) {
        const updateData: any = {};
        
        if (!profileData?.full_name && session.user.user_metadata.full_name) {
          updateData.full_name = session.user.user_metadata.full_name;
        }
        
        if (Object.keys(updateData).length > 0) {
          console.log('Actualizando campos faltantes:', updateData);
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('user_id', session.user.id)
            .select()
            .single();
            
          if (!updateError && updatedProfile) {
            profileData = updatedProfile;
            setProfile(updatedProfile);
          }
        }
      }
      
      const stillIncomplete = !profileData?.full_name;
      
      if (stillIncomplete) {
        setActiveView("profile");
        toast({
          title: t('company:toast.completeProfile'),
          description: t('company:toast.completeProfileDesc'),
        });
      }
      
      console.log('✅ Auth check complete');
      console.groupEnd();
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && viewParam !== activeView) {
      console.log('🔄 URL changed, updating activeView from:', activeView, 'to:', viewParam);
      setActiveView(viewParam);
    }
  }, [searchParams]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleProfileUpdate = async (updatedProfile: any) => {
    setProfile(updatedProfile);
  };

  const handleNavigate = (section: string, params?: Record<string, string>) => {
    console.log('🎯 Navegando a:', section, 'con params:', params);
    setActiveView(section);
    
    const nextParams = new URLSearchParams(window.location.search);
    nextParams.set('view', section);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        nextParams.set(key, value);
      });
    }
    
    console.log('🧭 [CompanyDashboard] Navegando con React Router:', `?${nextParams.toString()}`);
    navigate(`?${nextParams.toString()}`);
  };

  const renderContent = () => {
    console.log('🔄 Rendering content for activeView:', activeView);
    switch (activeView) {
      // Onboarding
      case "onboarding":
        return <OnboardingOrchestrator user={user!} />;
      
      // Post-Onboarding Activation Wizard
      case "activation-wizard":
        return (
          <PostOnboardingActivationWizard 
            profile={profile}
            onComplete={() => handleNavigate('panel')}
          />
        );
      
      // === STRATEGY VIEWS ===
      // Play to Win Full (5 steps)
      case "estrategia-ptw":
        return (
          <PlayToWinModule 
            companyId={profile?.primary_company_id} 
            companyName={profile?.company_name}
          />
        );
      
      // Founder PTW Simplified (3 steps) - for new businesses
      case "founder-ptw":
        return (
          <FounderPTWSimplified 
            companyId={profile?.primary_company_id}
            companyName={profile?.company_name}
            onComplete={() => handleNavigate('strategic-control')}
          />
        );
      
      // Strategic Control Center (post-activation)
      case "strategic-control":
        return <StrategicControlCenter profile={profile} />;
      
      // === NEW CONSOLIDATED VIEWS ===
      // Panel Principal (Centro de Comando Estratégico)
      case "panel":
      case "mando-central":
      case "dashboard":
      case "dashboard-360":
        return <BusinessHealthDashboard profile={profile} />;
      
      // Marketing Hub (Simplificado)
      case "marketing":
      case "marketing-hub":
        return <MarketingHub profile={profile} />;
      
      // Mis Agentes (Unificado: habilitados + marketplace)
      case "agentes":
      case "mis-agentes":
      case "marketplace":
      case "ai-workforce":
        return <UnifiedAgentsView profile={profile} />;
      
      // Mi Negocio (ADN + Configuración consolidada)
      case "negocio":
      case "adn-empresa":
      case "configuracion":
      case "inteligencia":
      case "inteligencia-competitiva":
      case "audiencias-manager":
      case "audiencias-analysis":
      case "audiencias-create":
        return <BusinessConfigurationHub profile={profile} onProfileUpdate={handleProfileUpdate} />;
      
      // Academia
      case "academia":
      case "academia-buildera":
        return <AcademiaBuildiera />;
      
      // Enterprise Autopilot
      case "autopilot":
      case "enterprise-autopilot":
        return <EnterpriseAutopilotDashboard profile={profile} companyId={profile?.primary_company_id} />;
      
      // === CREATIFY STUDIO ===
      case "creatify-studio":
        return <CreatifyStudio />;

      // === CRM / VENTAS ===
      case "ventas":
      case "crm":
        return <CRMDashboard />;

      // === GOVERNANCE ===
      case "gobernanza":
      case "governance":
        return <GovernanceDashboard profile={profile} />;

      // === DEPARTMENT CONFIG ===
      case "departamentos":
      case "department-config":
        return <DepartmentConfigPanel profile={profile} />;

      // === DEPARTMENT ACTIVATION GUIDE ===
      case "activacion":
      case "department-activation":
        return <DepartmentActivationGuide profile={profile} onNavigate={handleNavigate} />;

      // === LEGACY VIEWS (backwards compatibility) ===
      case "base-conocimiento":
        return <MisArchivos />;
      case "content-analysis-dashboard":
        return <ContentAnalysisDashboard profile={profile} />;
      case "profile":
        return <UserProfile />;
      
      // Default: Panel Principal
      default:
        return <BusinessHealthDashboard profile={profile} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('company:loading.profile')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full">
      <div className="animate-fade-in w-full">
        <div className="max-w-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
