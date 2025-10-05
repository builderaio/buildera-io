

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { useEraCoachMark } from "@/hooks/useEraCoachMark";
import EraCoachMark from "@/components/ui/era-coach-mark";

import MandoCentral from "@/components/company/MandoCentral";
import Dashboard360 from "@/components/company/Dashboard360";
import ADNEmpresa from "@/components/company/ADNEmpresa";
import MarketingHub from "@/components/company/MarketingHubWow";
import InteligenciaCompetitiva from "@/components/company/InteligenciaCompetitiva";
import MisArchivos from "@/components/company/BaseConocimiento";
import AcademiaBuildiera from "@/components/company/AcademiaBuildera";
import Marketplace from "@/components/company/Marketplace";
import Expertos from "@/components/company/Expertos";
import Configuracion from "@/components/company/Configuracion";
import AudienciasManager from "@/components/company/AudienciasManager";
import { ContentAnalysisDashboard } from "@/components/company/ContentAnalysisDashboard";
import AIWorkforce from "@/pages/AIWorkforce";

import UserProfile from "./UserProfile";
import CompanyAgents from "./CompanyAgents";
import OnboardingOrchestrator from "@/components/OnboardingOrchestrator";
import SimpleEraGuide from "@/components/SimpleEraGuide";
import { User } from "@supabase/supabase-js";

const CompanyDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeView, setActiveView] = useState("mando-central");
  const [loading, setLoading] = useState(true);
  const [showCoachMarkAfterGuide, setShowCoachMarkAfterGuide] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const { shouldShowCoachMark, hideCoachMark, showCoachMark } = useEraCoachMark(user?.id);

  useEffect(() => {
    const checkAuth = async () => {
      console.group('🔐 [CompanyDashboard] checkAuth');
      console.log('Timestamp:', new Date().toISOString());
      
      // Intentar obtener sesión (perfil ya validado por ResponsiveLayout)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('❌ No session found');
        console.groupEnd();
        navigate('/auth');
        return;
      }

      console.log('✅ Session found for user:', session.user.id);
      setUser(session.user);

      // Check for view parameter in URL
      const viewParam = searchParams.get('view');
      const onboardingCompletedParam = searchParams.get('onboarding_completed');
      
      console.log('📍 URL params:', { viewParam, onboardingCompletedParam });
      
      // Si viene con parámetro onboarding, mostrar el flujo de 5 pasos
      if (viewParam === 'onboarding') {
        console.log('🔄 Showing onboarding orchestrator');
        setActiveView('onboarding');
        setLoading(false);
        console.groupEnd();
        return;
      } else if (viewParam === 'mando-central') {
        console.log('📊 Showing mando-central');
        setActiveView('mando-central');
        setLoading(false);
        console.groupEnd();
        return;
      } else if (viewParam === 'adn-empresa') {
        console.log('🏢 Showing adn-empresa');
        setActiveView('adn-empresa');
        
        // Cargar el perfil para asegurar que ADNEmpresa pueda obtener datos de la BD
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (profileData) {
          setProfile(profileData);
        } else {
          // Fallback mínimo para disparar el cargue por user_id en el hijo
          setProfile({ user_id: session.user.id, email: session.user.email });
        }
        
        // 🆕 NUEVO: Verificar si debe mostrar SimpleEraGuide automáticamente
        const { data: guideTour } = await supabase
          .from('user_guided_tour')
          .select('tour_completed')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        // Si NO ha completado el tour Y viene de onboarding, forzar parámetro
        if (!guideTour?.tour_completed && onboardingCompletedParam !== 'true') {
          const { data: onboarding } = await supabase
            .from('user_onboarding_status')
            .select('onboarding_completed_at')
            .eq('user_id', session.user.id)
            .maybeSingle();
            
          if (onboarding?.onboarding_completed_at) {
            const completedDate = new Date(onboarding.onboarding_completed_at);
            const hoursDiff = (new Date().getTime() - completedDate.getTime()) / (1000 * 3600);
            
            // Si completó hace menos de 7 días, forzar mostrar guía
            if (hoursDiff <= 168) {
              console.log('🎯 [CompanyDashboard] Forzando parámetro onboarding_completed para SimpleEraGuide');
              window.history.replaceState({}, '', '/company-dashboard?view=adn-empresa&onboarding_completed=true');
            }
          }
        }
        
        setLoading(false);
        console.groupEnd();
        return;
      } else if (viewParam) {
        console.log('🎯 Setting activeView from URL:', viewParam);
        setActiveView(viewParam);
        
        // Asegurar que el perfil esté cargado para vistas que lo necesitan
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

      // Solo verificar onboarding si no viene con parámetros específicos
      console.log('🔍 Checking onboarding status');
      const registrationMethod = session.user.app_metadata?.provider || 'email';
      
      // Verificar estado de onboarding para usuarios sin parámetros de vista
      const { data: onboardingStatus } = await supabase
        .from('user_onboarding_status')
        .select('onboarding_completed_at, dna_empresarial_completed')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // Si el usuario ya completó onboarding, cargar perfil y continuar al dashboard
      if (onboardingStatus?.onboarding_completed_at) {
        console.log('✅ Usuario ya completó onboarding, cargando perfil y continuando');
        
        // Cargar perfil del usuario
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
          // Fallback: crear perfil mínimo
          console.log('⚠️ No se encontró perfil, usando fallback mínimo');
          setProfile({ 
            user_id: session.user.id, 
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || 'Usuario',
            user_type: 'company'
          });
        }
        
        // IMPORTANTE: Desactivar loading para permitir renderizado
        setLoading(false);
        console.groupEnd();
        return;
      } else {
        // Solo mostrar onboarding si NO está completado
        const { data: companies } = await supabase
          .from('companies')
          .select('*')
          .eq('created_by', session.user.id);

        const hasCompany = companies && companies.length > 0;

        console.log('🔍 CompanyDashboard onboarding check:', {
          hasCompany,
          companiesLength: companies?.length,
          registrationMethod,
          userId: session.user.id,
          viewParam,
          onboardingCompleted: !!onboardingStatus?.onboarding_completed_at
        });

        // Si no tiene empresa Y no viene con view param Y no ha completado onboarding
        if (!hasCompany && !viewParam && !onboardingStatus?.onboarding_completed_at) {
          console.log('❌ Usuario sin empresa ni onboarding completado, redirigir a complete-profile');
          navigate('/complete-profile');
          console.groupEnd();
          setLoading(false);
          return;
        }
      }
      
      // Buscar perfil de empresa existente (usar maybeSingle para robustez)
      console.log('🔍 Buscando perfil de empresa existente...');
      let { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // Si no existe perfil, crear uno básico para empresa
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
            title: "Error",
            description: "No se pudo crear el perfil del negocio. Intente nuevamente.",
            variant: "destructive",
          });
          setLoading(false);
          navigate('/auth');
          return;
        }

        profileData = newProfile;
        console.log('✅ Perfil creado exitosamente');
        toast({
          title: "Perfil creado",
          description: "Se ha creado tu perfil de negocio. Completa tu información en ADN del Negocio.",
        });
      } else if (error) {
        console.error('❌ Error obteniendo perfil:', error);
        toast({
          title: "Error de acceso",
          description: "No se pudo obtener la información del perfil.",
          variant: "destructive",
        });
        setLoading(false);
        navigate('/auth');
        return;
      }

      // Verificar que el perfil sea de tipo empresa
      if (profileData && profileData.user_type !== 'company') {
        console.log('❌ Usuario no es de tipo empresa, redirigiendo');
        toast({
          title: "Acceso denegado",
          description: "Este dashboard es solo para negocios.",
          variant: "destructive",
        });
        setLoading(false);
        navigate('/auth');
        return;
      }

      console.log('✅ Perfil validado y establecido');
      setProfile(profileData);
      
      // Verificar si la información está completa (solo verificamos info personal ahora)
      const isProfileIncomplete = !profileData?.full_name;
      
      // Si faltan datos personales y están disponibles en user_metadata, actualizarlos
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
      
      // Verificar de nuevo si la información está completa después de la actualización
      const stillIncomplete = !profileData?.full_name;
      
      if (stillIncomplete) {
        setActiveView("profile");
        toast({
          title: "Complete su perfil",
          description: "Debes completar toda la información de tu negocio para continuar.",
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

    // Listener para cuando el SimpleEraGuide se complete
    const handleGuideCompleted = () => {
      console.log('✅ SimpleEraGuide completado, activando coachmark');
      setShowCoachMarkAfterGuide(true);
      setTimeout(() => {
        showCoachMark();
      }, 500);
    };

    window.addEventListener('simple-era-guide-completed', handleGuideCompleted);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('simple-era-guide-completed', handleGuideCompleted);
    };
  }, [navigate, toast, searchParams, showCoachMark]); // Agregar searchParams como dependencia

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleProfileUpdate = async (updatedProfile: any) => {
    // Actualizar el perfil en el estado
    setProfile(updatedProfile);
    
    // Detectar si es un usuario registrado por redes sociales (no tiene auth_provider 'email')
    const isRegisteredViaSocial = profile?.auth_provider !== 'email';
    
    // Removed: Webhook logic simplificada - ahora se ejecuta en "Comenzar configuración"
  };

  const handleNavigate = (section: string, params?: Record<string, string>) => {
    console.log('🎯 Navegando desde SimpleEraGuide a:', section, 'con params:', params);
    setActiveView(section);
    
    // También actualizar la URL para reflejar el cambio
    const url = new URL(window.location.href);
    url.searchParams.set('view', section);
    
    // Agregar parámetros adicionales si existen
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    
    window.history.pushState({}, '', url);
  };

  const renderContent = () => {
    console.log('🔄 Rendering content for activeView:', activeView, 'profile:', profile);
    console.log('🔄 Current URL search params:', searchParams.get('view'));
    switch (activeView) {
      case "onboarding":
        return <OnboardingOrchestrator user={user!} />;
      case "mando-central":
      case "dashboard":
        console.log('📊 Rendering MandoCentral with profile:', profile);
        return <MandoCentral profile={profile} />;
      case "adn-empresa":
        return <ADNEmpresa profile={profile} onProfileUpdate={handleProfileUpdate} />;
      case "base-conocimiento":
        return <MisArchivos />;
      case "marketing-hub":
        return <MarketingHub profile={profile} />;
      case "inteligencia-competitiva":
        return <InteligenciaCompetitiva />;
      case "audiencias-manager":
        return <AudienciasManager profile={profile} />;
      case "content-analysis-dashboard":
        return <ContentAnalysisDashboard profile={profile} />;
      case "academia-buildera":
        return <AcademiaBuildiera />;
      case "expertos":
        return <Expertos />;
      case "configuracion":
        return <Configuracion profile={profile} />;
      case "marketplace":
        return <Marketplace />;
      case "ai-workforce":
        return <AIWorkforce />;
      case "mis-agentes":
        return <CompanyAgents />;
      case "profile":
        return <UserProfile />;
      default:
        return <MandoCentral profile={profile} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full">;
      {/* Content Area optimizado para sidebar con padding y espaciado correcto */}
      <div className="animate-fade-in w-full">
        <div className="max-w-full">
          {renderContent()}
        </div>
      </div>
      
      {/* CoachMark solo después de completar el SimpleEraGuide */}
      {shouldShowCoachMark && showCoachMarkAfterGuide && user && (
        <EraCoachMark
          isOpen={shouldShowCoachMark}
          onClose={hideCoachMark}
          userId={user.id}
        />
      )}
      
      {/* Guía de Era para experiencia paso a paso */}
      {user && activeView !== 'onboarding' && (
        <SimpleEraGuide
          userId={user.id}
          currentSection={activeView}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

export default CompanyDashboard;
