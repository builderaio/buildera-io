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
        // 1. Verificar si existe un perfil y estado de onboarding
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*, user_onboarding_status(*)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error checking profile:', profileError);
          setChecking(false);
          return;
        }

        // 2. Verificar si el usuario es miembro de alguna empresa (especialmente como owner)
        const { data: companyMemberships, error: companyError } = await supabase
          .from('company_members')
          .select('*, companies(*)')
          .eq('user_id', user.id)
          .eq('is_primary', true); // Verificar empresa principal

        if (companyError) {
          console.error('Error checking company memberships:', companyError);
          setChecking(false);
          return;
        }

        const hasCompany = companyMemberships && companyMemberships.length > 0;

        // 2b. Obtener estado de onboarding del usuario
        const { data: onboardingStatus } = await supabase
          .from('user_onboarding_status')
          .select('first_login_completed, dna_empresarial_completed, onboarding_completed_at, current_step')
          .eq('user_id', user.id)
          .maybeSingle();

        // 2c. Inicializar o actualizar el paso de onboarding si no existe
        if (!onboardingStatus) {
          await supabase
            .from('user_onboarding_status')
            .upsert({
              user_id: user.id,
              current_step: 1,
              first_login_completed: false,
              dna_empresarial_completed: false
            }, {
              onConflict: 'user_id'
            });
        }

        // 3. Determinar el flujo basado en auth_provider y user_type
        const authProvider = (profile?.auth_provider as string) || (user?.app_metadata?.provider as string) || 'email';
        const userType = profile?.user_type;
        const isSocialRegistration = authProvider !== 'email';

        console.log('🔍 Onboarding check:', {
          hasProfile: !!profile,
          hasCompany,
          authProvider,
          userType,
          isSocialRegistration,
          onboardingCompleted: !!onboardingStatus?.onboarding_completed_at,
          companiesCount: companyMemberships?.length,
          primaryCompany: companyMemberships?.[0]?.companies?.name
        });

        // 4. Lógica de redirección basada en user_type
        
        // Si user_type es NULL, ir a complete-profile para definirlo
        if (userType === null || userType === undefined) {
          console.log('🔄 Usuario sin user_type definido, ir a complete-profile');
          navigate('/complete-profile');
          return;
        }

        // Lógica específica por tipo de usuario
        switch (userType) {
          case 'company':
            // Para usuarios empresa, verificar si necesitan completar perfil o ya tienen empresa
            if (isSocialRegistration && !hasCompany) {
              // Usuario empresa registrado con social SIN empresa - debe ir a complete-profile para crearla
              console.log('🔄 Usuario empresa social sin empresa, ir a complete-profile para crear empresa');
              navigate('/complete-profile');
              return;
            }
            
            if (hasCompany) {
              // Revisar estado de onboarding
              if (!onboardingStatus || !onboardingStatus.onboarding_completed_at) {
                console.log('🔄 Onboarding pendiente, ir al nuevo flujo');
                navigate('/company-dashboard?view=onboarding');
                return;
              }
              console.log('✅ Onboarding completado, ir al dashboard');
              navigate('/company-dashboard');
              return;
            }
            
            // Usuario empresa por email sin empresa (debería tener empresa por el trigger)
            console.log('🔄 Usuario empresa por email sin empresa, ir al nuevo onboarding');
            navigate('/company-dashboard?view=onboarding');
            break;

          case 'developer':
            console.log('🔄 Usuario developer, ir a developer dashboard');
            navigate('/developer-dashboard');
            break;

          case 'expert':
            console.log('🔄 Usuario expert, ir a expert dashboard');
            navigate('/expert-dashboard');
            break;

          default:
            console.log('🔄 Tipo de usuario desconocido, ir a complete-profile');
            navigate('/complete-profile');
            break;
        }

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