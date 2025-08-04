import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface OnboardingRedirectProps {
  user: User;
}

const OnboardingRedirect = ({ user }: OnboardingRedirectProps) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      try {
        // 1. Verificar si existe un perfil completo
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking profile:', profileError);
          setChecking(false);
          return;
        }

        // 2. Verificar si existe configuración de empresa
        const { data: companies, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('created_by', user.id);

        if (companyError) {
          console.error('Error checking companies:', companyError);
          setChecking(false);
          return;
        }

        const hasCompany = companies && companies.length > 0;

        // 3. Determinar el método de registro
        const registrationMethod = user.app_metadata?.provider || 'email';
        const isEmailRegistration = registrationMethod === 'email';
        const isSocialRegistration = !isEmailRegistration;

        console.log('🔍 Onboarding check:', {
          hasProfile: !!profile,
          profileComplete: profile?.user_type === 'company',
          hasCompany,
          registrationMethod,
          isEmailRegistration,
          isSocialRegistration,
          companiesCount: companies?.length
        });

        // 4. Lógica de redirección
        if (hasCompany) {
          // Ya tiene empresa configurada, ir al dashboard
          navigate('/company-dashboard');
          return;
        }

        if (isSocialRegistration) {
          // Para registro social, siempre crear empresa automáticamente si no existe
          if (!hasCompany) {
            console.log('🏭 Creando empresa para usuario social...');
            try {
              const { data: newCompany, error: companyError } = await supabase.rpc('create_company_with_owner', {
                company_name: 'Mi Empresa', 
                company_description: null,
                website_url: null,
                industry_sector: null,
                company_size: null,
                user_id_param: user.id
              });

              if (companyError) {
                console.error('Error creando empresa:', companyError);
                navigate('/complete-profile?user_type=company');
                return;
              } else {
                console.log('✅ Empresa creada exitosamente');
                // Redirigir al ADN empresa para completar el onboarding
                navigate('/company-dashboard?view=adn-empresa');
                return;
              }
            } catch (error) {
              console.error('Error en creación de empresa:', error);
              navigate('/complete-profile?user_type=company');
              return;
            }
          }
          
          // Si ya tiene empresa, ir directo al ADN empresa
          navigate('/company-dashboard?view=adn-empresa');
          return;
        }

        // Para registro por email, ir directo al ADN empresa
        if (isEmailRegistration) {
          navigate('/company-dashboard?view=adn-empresa');
          return;
        }

        // Fallback - completar perfil
        navigate('/complete-profile?user_type=company');

      } catch (error) {
        console.error('Error in onboarding check:', error);
        // En caso de error, ir al dashboard
        navigate('/company-dashboard');
      } finally {
        setChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando estado del onboarding...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default OnboardingRedirect;