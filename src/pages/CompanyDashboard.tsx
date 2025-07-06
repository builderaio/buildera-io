import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CompanySidebar from "@/components/company/CompanySidebar";
import MandoCentral from "@/components/company/MandoCentral";
import ADNEmpresa from "@/components/company/ADNEmpresa";
import MarketingHub from "@/components/company/MarketingHub";
import InteligenciaCompetitiva from "@/components/company/InteligenciaCompetitiva";
import BaseConocimiento from "@/components/company/BaseConocimiento";
import AcademiaBuildiera from "@/components/company/AcademiaBuildera";
import Marketplace from "@/components/company/Marketplace";
import Expertos from "@/components/company/Expertos";
import Configuracion from "@/components/company/Configuracion";
import { User } from "@supabase/supabase-js";

const CompanyDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeView, setActiveView] = useState("mando-central");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      
      // Verificar perfil de empresa
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('user_type', 'company')
        .single();

      if (error || !profileData) {
        toast({
          title: "Error de acceso",
          description: "No tiene permisos para acceder al dashboard de empresa.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setProfile(profileData);
      
      // Si es la primera vez (sin misión, visión o propuesta de valor), ir a ADN
      if (!profileData.company_name || 
          (!profileData.industry && !profileData.industry_sector)) {
        setActiveView("adn-empresa");
        toast({
          title: "¡Bienvenido!",
          description: "Complete el ADN de su empresa para comenzar a usar la plataforma.",
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
        return <MandoCentral profile={profile} />;
      case "adn-empresa":
        return <ADNEmpresa profile={profile} onProfileUpdate={setProfile} />;
      case "marketing-hub":
        return <MarketingHub />;
      case "inteligencia-competitiva":
        return <InteligenciaCompetitiva />;
      case "base-conocimiento":
        return <BaseConocimiento />;
      case "academia-buildera":
        return <AcademiaBuildiera />;
      case "marketplace":
        return <Marketplace />;
      case "expertos":
        return <Expertos />;
      case "configuracion":
        return <Configuracion profile={profile} />;
      default:
        return <MandoCentral profile={profile} />;
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
    </div>
  );
};

export default CompanyDashboard;