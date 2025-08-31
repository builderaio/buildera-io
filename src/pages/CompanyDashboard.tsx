

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { useEraCoachMark } from "@/hooks/useEraCoachMark";
import EraCoachMark from "@/components/ui/era-coach-mark";

import MandoCentral from "@/components/company/MandoCentral";
import Dashboard360 from "@/components/company/Dashboard360";
import ADNEmpresa from "@/components/company/ADNEmpresa";
import OnboardingOrchestrator from "@/components/OnboardingOrchestrator";
import MarketingHub from "@/components/company/MarketingHubSimplified";
import InteligenciaCompetitiva from "@/components/company/InteligenciaCompetitiva";
import MisArchivos from "@/components/company/BaseConocimiento";
import AcademiaBuildiera from "@/components/company/AcademiaBuildera";
import Marketplace from "@/components/company/Marketplace";
import Expertos from "@/components/company/Expertos";
import Configuracion from "@/components/company/Configuracion";
import UserProfile from "./UserProfile";
import CompanyAgents from "./CompanyAgents";
import OnboardingRedirect from "@/components/OnboardingRedirect";
import { User } from "@supabase/supabase-js";

const CompanyDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeView, setActiveView] = useState("mando-central");
  const [loading, setLoading] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const { shouldShowCoachMark, hideCoachMark } = useEraCoachMark(user?.id);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);

      // Check for view parameter in URL - si viene onboarding o adn-empresa forzar mostrar
      const viewParam = searchParams.get('view');
      
      // Si viene con parámetro view, forzar esa vista sin verificaciones adicionales
      if (viewParam === 'onboarding') {
        setActiveView('onboarding');
        setShouldShowOnboarding(false);
        setLoading(false);
        return;
      } else if (viewParam === 'adn-empresa') {
        setActiveView('adn-empresa');
        setShouldShowOnboarding(false);
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
        setLoading(false);
        return;
      } else if (viewParam) {
        setActiveView(viewParam);
        setShouldShowOnboarding(false);
        setLoading(false);
        return;
      }

      // Solo verificar onboarding si no viene con parámetros específicos
      const registrationMethod = session.user.app_metadata?.provider || 'email';
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
        viewParam
      });

      // Si no tiene empresa Y no viene con view param, mostrar onboarding redirect
      if (!hasCompany && !viewParam) {
        console.log('❌ Usuario no tiene empresa, mostrando OnboardingRedirect');
        setShouldShowOnboarding(true);
        setLoading(false);
        return;
      }
      
      // Buscar perfil de empresa existente
      let { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      // Si no existe perfil, crear uno básico para empresa
      if (error && error.code === 'PGRST116') {
        console.log('No se encontró perfil, creando uno nuevo para empresa...');
        
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
          console.error('Error creando perfil:', insertError);
          toast({
            title: "Error",
            description: "No se pudo crear el perfil del negocio. Intente nuevamente.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        profileData = newProfile;
        toast({
          title: "Perfil creado",
          description: "Se ha creado tu perfil de negocio. Completa tu información en ADN del Negocio.",
        });
      } else if (error) {
        console.error('Error obteniendo perfil:', error);
        toast({
          title: "Error de acceso",
          description: "No se pudo obtener la información del perfil.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Verificar que el perfil sea de tipo empresa
      if (profileData && profileData.user_type !== 'company') {
        toast({
          title: "Acceso denegado",
          description: "Este dashboard es solo para negocios.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

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
      
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast, searchParams]); // Agregar searchParams como dependencia

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

  const renderContent = () => {
    console.log('Rendering content for activeView:', activeView);
    switch (activeView) {
      case "mando-central":
      case "dashboard":
        return <MandoCentral profile={profile} />;
      case "onboarding":
        return <OnboardingOrchestrator user={user} />;
      case "adn-empresa":
        return <ADNEmpresa profile={profile} onProfileUpdate={handleProfileUpdate} />;
      case "base-conocimiento":
        return <MisArchivos />;
      case "marketing-hub":
        return <MarketingHub profile={profile} />;
      case "inteligencia-competitiva":
        return <InteligenciaCompetitiva />;
      case "academia-buildera":
        return <AcademiaBuildiera />;
      case "expertos":
        return <Expertos />;
      case "configuracion":
        return <Configuracion profile={profile} />;
      case "marketplace":
        return <Marketplace />;
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
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Si debe mostrar onboarding, usar el componente de redirección
  if (shouldShowOnboarding && user) {
    return <OnboardingRedirect user={user} />;
  }

  return (
    <div className="w-full min-h-full">
      {/* Content Area optimizado para sidebar con padding y espaciado correcto */}
      <div className="animate-fade-in w-full">
        <div className="max-w-full">
          {renderContent()}
        </div>
      </div>
      
      {/* CoachMark solo para usuarios nuevos que completan onboarding */}
      {shouldShowCoachMark && user && (
        <EraCoachMark
          isOpen={shouldShowCoachMark}
          onClose={hideCoachMark}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default CompanyDashboard;
