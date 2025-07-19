
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CompanySidebar from "@/components/company/CompanySidebar";
import MandoCentral from "@/components/company/MandoCentral";
import ADNEmpresa from "@/components/company/ADNEmpresa";
import MarketingHub from "@/components/company/MarketingHub";
import InteligenciaCompetitiva from "@/components/company/InteligenciaCompetitiva";
import MisArchivos from "@/components/company/BaseConocimiento";
import AcademiaBuildiera from "@/components/company/AcademiaBuildera";
import Marketplace from "@/components/company/Marketplace";
import Expertos from "@/components/company/Expertos";
import Configuracion from "@/components/company/Configuracion";
import UserProfile from "./UserProfile";
import EraCoachMark from "@/components/ui/era-coach-mark";
import { useEraCoachMark } from "@/hooks/useEraCoachMark";
import { User } from "@supabase/supabase-js";

const CompanyDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeView, setActiveView] = useState("mando-central");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Era coach mark
  const { shouldShowCoachMark, hideCoachMark, resetTutorial, isLoading: coachMarkLoading } = useEraCoachMark(user?.id);

  useEffect(() => {
    // Check for view parameter in URL
    const viewParam = searchParams.get('view');
    if (viewParam) {
      setActiveView(viewParam);
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
            company_name: session.user.user_metadata?.company_name || 'Mi Empresa',
            industry_sector: session.user.user_metadata?.industry_sector || 'Tecnología'
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creando perfil:', insertError);
          toast({
            title: "Error",
            description: "No se pudo crear el perfil de empresa. Intente nuevamente.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        profileData = newProfile;
        toast({
          title: "Perfil creado",
          description: "Se ha creado su perfil de empresa. Complete su información en ADN de la Empresa.",
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
          description: "Este dashboard es solo para empresas.",
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
        setActiveView("adn-empresa");
        toast({
          title: "Complete su perfil",
          description: "Debe completar toda la información de su empresa para continuar.",
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
  }, [navigate, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const renderContent = () => {
    switch (activeView) {
      case "mando-central":
        return <MandoCentral profile={profile} onNavigate={setActiveView} />;
      case "adn-empresa":
        return <ADNEmpresa profile={profile} onProfileUpdate={setProfile} />;
      case "marketing-hub":
        return <MarketingHub profile={profile} />;
      case "inteligencia-competitiva":
        return <InteligenciaCompetitiva />;
      case "base-conocimiento":
        return <MisArchivos />;
      case "academia-buildera":
        return <AcademiaBuildiera />;
      case "marketplace":
        return <Marketplace />;
      case "expertos":
        return <Expertos />;
      case "configuracion":
        return <Configuracion profile={profile} resetTutorial={resetTutorial} />;
      case "profile":
        return <UserProfile />;
      default:
        return <MandoCentral profile={profile} onNavigate={setActiveView} />;
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
    <div className="flex h-screen bg-gray-100">
      <CompanySidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        profile={profile}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 p-8 overflow-y-auto ml-64">
        {renderContent()}
      </main>
      
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
