

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFirstTimeSave } from "@/hooks/useFirstTimeSave";

import MandoCentral from "@/components/company/MandoCentral";
import Dashboard360 from "@/components/company/Dashboard360";
import ADNEmpresa from "@/components/company/ADNEmpresa";
import MarketingHub from "@/components/company/MarketingHubSimplified";
import InteligenciaCompetitiva from "@/components/company/InteligenciaCompetitiva";
import MisArchivos from "@/components/company/BaseConocimiento";
import AcademiaBuildiera from "@/components/company/AcademiaBuildera";
import Marketplace from "@/components/company/Marketplace";
import Expertos from "@/components/company/Expertos";
import Configuracion from "@/components/company/Configuracion";
import UserProfile from "./UserProfile";
import CompanyAgents from "./CompanyAgents";
import EraCoachMark from "@/components/ui/era-coach-mark";
import { useEraCoachMark } from "@/hooks/useEraCoachMark";
import { User } from "@supabase/supabase-js";

const CompanyDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Era coach mark
  const { shouldShowCoachMark, hideCoachMark, resetTutorial, isLoading: coachMarkLoading } = useEraCoachMark(user?.id);
  
  // Hook para detectar primera vez guardando cambios (registro social)
  const { triggerWebhookOnFirstSave } = useFirstTimeSave(user?.id);

  useEffect(() => {
    // Check for view parameter in URL and update activeView
    const viewParam = searchParams.get('view');
    if (viewParam) {
      console.log('Setting activeView from URL param:', viewParam);
      setActiveView(viewParam);
    } else {
      console.log('No view param, defaulting to dashboard');
      setActiveView('dashboard');
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      
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
            company_name: session.user.user_metadata?.company_name || 'Mi Negocio',
            industry_sector: session.user.user_metadata?.industry_sector || 'Tecnología'
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
      
      // Verificar si la información está completa y actualizar campos faltantes
      const isProfileIncomplete = !profileData?.company_name || 
                                   !profileData?.company_size ||
                                   !profileData?.industry_sector ||
                                   !profileData?.website_url ||
                                   !profileData?.full_name;
      
      // Si faltan datos y están disponibles en user_metadata, actualizarlos
      if (isProfileIncomplete && session.user.user_metadata) {
        const updateData: any = {};
        
        if (!profileData?.company_size && session.user.user_metadata.company_size) {
          updateData.company_size = session.user.user_metadata.company_size;
        }
        
        if (!profileData?.website_url && session.user.user_metadata.website_url) {
          updateData.website_url = session.user.user_metadata.website_url;
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
      const stillIncomplete = !profileData?.company_name || 
                              !profileData?.company_size ||
                              !profileData?.industry_sector ||
                              !profileData?.website_url ||
                              !profileData?.full_name;
      
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
    
    // Si es registro social y es la primera vez guardando, ejecutar webhook
    if (isRegisteredViaSocial) {
      await triggerWebhookOnFirstSave(
        updatedProfile.company_name || 'sin nombre', 
        updatedProfile.website_url
      );
    }
  };

  const renderContent = () => {
    console.log('Rendering content for activeView:', activeView);
    switch (activeView) {
      case "dashboard":
        return <Dashboard360 profile={profile} onNavigate={setActiveView} />;
      case "marketing":
        return <MarketingHub profile={profile} />;
      case "agents":
        return <CompanyAgents />;
      case "profile":
        return <ADNEmpresa profile={profile} onProfileUpdate={handleProfileUpdate} />;
      default:
        return <Dashboard360 profile={profile} onNavigate={setActiveView} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30">
      {/* Simplified Navigation */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-foreground">
                {profile?.company_name || 'Mi Negocio'}
              </h1>
              
              {/* Simplified Navigation */}
              <nav className="hidden md:flex space-x-1">
                {[
                  { id: 'dashboard', label: 'Panel', icon: '📊' },
                  { id: 'marketing', label: 'Marketing', icon: '🎯' },
                  { id: 'agents', label: 'Agentes', icon: '🤖' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeView === item.id
                        ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveView('profile')}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                title="Perfil"
              >
                ⚙️
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                title="Cerrar sesión"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-fade-in">
        {renderContent()}
      </div>
      
      {/* Era Coach Mark */}
      {user && shouldShowCoachMark && (
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
