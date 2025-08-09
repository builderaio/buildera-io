import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

import Hero from "@/components/Hero";
import ProblemSolution from "@/components/ProblemSolution";
import Ecosystem from "@/components/Ecosystem";
import UseCases from "@/components/UseCases";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import OnboardingRedirect from "@/components/OnboardingRedirect";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Get user profile and check onboarding status
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, user_onboarding_status(*)')
          .eq('user_id', session.user.id)
          .single();
        
        if (profileData) {
          const userType = profileData.user_type;
          const authProvider = profileData.auth_provider || 'email';
          const isSocialRegistration = authProvider !== 'email';
          
          // Check if user has company
          const { data: companyMemberships } = await supabase
            .from('company_members')
            .select('*, companies(*)')
            .eq('user_id', session.user.id)
            .eq('is_primary', true);
            
          const hasCompany = companyMemberships && companyMemberships.length > 0;
          
          console.log('🔍 Index onboarding check:', {
            hasProfile: !!profileData,
            hasCompany,
            authProvider,
            userType,
            isSocialRegistration
          });
          
          // Lógica basada en user_type
          if (userType === null || userType === undefined) {
            // Usuario sin tipo definido - necesita onboarding
            console.log('🔄 Usuario sin user_type, mostrando OnboardingRedirect');
            setShouldShowOnboarding(true);
            setLoading(false);
            return;
          }

          // Lógica específica por tipo de usuario
          switch (userType) {
            case 'company':
              if (hasCompany) {
                // Usuario empresa con empresa configurada - ir al dashboard
                console.log('✅ Usuario empresa con empresa, redirigiendo al dashboard');
                setTimeout(() => {
                  navigate('/company-dashboard');
                }, 100);
              } else {
                // Usuario empresa sin empresa - necesita onboarding
                console.log('🔄 Usuario empresa sin empresa, mostrando OnboardingRedirect');
                setShouldShowOnboarding(true);
                setLoading(false);
              }
              break;

            case 'developer':
            case 'expert':
              // Usuarios developer/expert van a sus dashboards específicos
              console.log(`✅ Usuario ${userType}, redirigiendo a ${userType} dashboard`);
              setTimeout(() => {
                navigate(`/${userType}-dashboard`);
              }, 100);
              break;

            default:
              // Tipo desconocido - mostrar onboarding
              console.log('🔄 Tipo de usuario desconocido, mostrando OnboardingRedirect');
              setShouldShowOnboarding(true);
              setLoading(false);
              break;
          }
          return;
        } else {
          // No hay perfil aún (posible retraso del trigger) -> mostrar onboarding
          setShouldShowOnboarding(true);
          setLoading(false);
          return;
        }
      }
      setLoading(false);
    };
    
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      // Solo recargar en casos específicos para evitar loops
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔄 Nuevo sign-in detectado, recargando para recheck');
        setTimeout(() => {
          checkAuth();
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Renderizar landing page para usuarios no autenticados
  const renderPublicContent = () => {
    return (
      <div className="min-h-screen">
        <main>
          <Hero />
          <ProblemSolution />
          <Ecosystem />
          <UseCases />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si debe mostrar onboarding, usar el componente de redirección
  if (shouldShowOnboarding && user) {
    return <OnboardingRedirect user={user} />;
  }

  // Solo mostrar landing page para usuarios no autenticados
  return renderPublicContent();
};

export default Index;
