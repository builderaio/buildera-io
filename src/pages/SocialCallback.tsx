import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWelcomeEmail } from "@/hooks/useWelcomeEmail";
import { supabase } from "@/integrations/supabase/client";

const SocialCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { sendWelcomeEmail } = useWelcomeEmail();

  useEffect(() => {
    const handleSocialAuthCallback = async () => {
      try {
        console.log("🔄 Procesando callback de autenticación social...");
        console.log("📍 URL actual:", window.location.href);
        console.log("📍 Search params:", window.location.search);
        
        // Verificar si hay hash fragments que Supabase necesita procesar
        const hashFragment = window.location.hash;
        console.log("📍 Hash fragment:", hashFragment);
        
        // Intentar procesar parámetros de hash para sesión OAuth
        if (hashFragment && hashFragment.includes('access_token')) {
          console.log("🔍 Detectado access_token en hash, procesando...");
          try {
            // Supabase maneja automáticamente los hash fragments OAuth
            console.log("📦 Hash contiene tokens OAuth");
          } catch (urlError) {
            console.error("❌ Error parseando URL:", urlError);
          }
        }
        
        // Esperar un momento para que la sesión se establezca
        console.log("⏳ Esperando que la sesión se establezca...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar el estado del cliente de Supabase
        console.log("🔍 Verificando estado del cliente Supabase...");
        const authClient = supabase.auth;
        console.log("📊 Cliente auth:", authClient);
        
        // Intentar obtener la sesión actual
        console.log("🔄 Obteniendo sesión actual...");
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        console.log("📦 Datos de sesión:", sessionData);
        console.log("❌ Error de sesión:", sessionError);
        
        if (sessionError) {
          console.error("❌ Error obteniendo sesión:", sessionError);
          throw sessionError;
        }

        let user = null;

        if (!sessionData || !sessionData.session || !sessionData.session.user) {
          console.error("❌ No se encontró sesión válida en sessionData");
          console.log("🔄 Intentando método alternativo - getUser()...");
          
          // Intentar obtener el usuario directamente como fallback
          const { data: userData, error: userError } = await supabase.auth.getUser();
          console.log("👤 Datos de usuario:", userData);
          console.log("❌ Error de usuario:", userError);
          
          if (userError || !userData || !userData.user) {
            console.error("❌ Fallback también falló:", userError);
            console.log("🔍 Verificando localStorage para tokens...");
            
            // Verificar qué hay en localStorage
            const keys = Object.keys(localStorage);
            const supabaseKeys = keys.filter(key => key.includes('supabase') || key.includes('sb-'));
            console.log("🗄️ Claves de Supabase en localStorage:", supabaseKeys);
            
            supabaseKeys.forEach(key => {
              console.log(`🔑 ${key}:`, localStorage.getItem(key));
            });
            
            toast({
              title: "Error de Sesión",
              description: "No se pudo completar la autenticación. La sesión no se estableció correctamente. Revisa la consola para más detalles.",
              variant: "destructive",
            });
            
            // Redirigir después de un momento para que el usuario pueda ver los logs
            setTimeout(() => {
              navigate('/auth');
            }, 5000);
            return;
          }
          
          console.log("✅ Usuario encontrado en fallback:", userData.user.email);
          user = userData.user;
        } else {
          console.log("✅ Sesión establecida para usuario:", sessionData.session.user.email);
          user = sessionData.session.user;
        }

        // Obtener tipo de usuario de los parámetros
        const userType = searchParams.get('user_type') || 'company';
        
        // Enviar email de bienvenida
        try {
          const validUserType = userType === 'company' || userType === 'developer' || userType === 'expert' ? userType : 'company';
          await sendWelcomeEmail(
            user.email || '', 
            user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario',
            validUserType
          );
          console.log("✅ Email de bienvenida enviado");
        } catch (emailError) {
          console.error("❌ Error enviando email de bienvenida:", emailError);
          // No bloquear el flujo si falla el email
        }

        // Llamar webhook para usuarios de empresa (opcional - no bloquear el flujo)
        if (userType === 'company') {
          try {
            // Extraer datos disponibles del perfil social
            const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
            
            await supabase.functions.invoke('process-company-webhooks', {
              body: {
                user_id: user.id,
                company_name: 'Mi Empresa', // Nombre temporal para registro social
                website_url: user.user_metadata?.website || '',
                country: user.user_metadata?.country || 'No especificado',
                full_name: fullName,
                email: user.email,
                trigger_type: 'social_registration'
              }
            });
            console.log("✅ Webhook de registro enviado");
          } catch (webhookError) {
            console.error("❌ Error enviando webhook:", webhookError);
            // No bloquear el flujo si falla el webhook
          }
        }

        // Verificar si el usuario ya tiene un perfil completo con user_type definido
        try {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('user_type, full_name, auth_provider')
            .eq('user_id', user.id)
            .single();

          console.log("🔍 Perfil existente encontrado:", existingProfile);

          // LÓGICA ACTUALIZADA: Para registros sociales, verificar auth_provider
          // Si auth_provider != 'email' Y user_type es NULL, forzar complete-profile
          if (existingProfile) {
            const isSocialUser = existingProfile.auth_provider && existingProfile.auth_provider !== 'email';
            const needsCompleteProfile = existingProfile.user_type === null;
            
            console.log("🔍 Verificando perfil social:", {
              authProvider: existingProfile.auth_provider,
              userType: existingProfile.user_type,
              isSocialUser,
              needsCompleteProfile
            });

            if (isSocialUser && !needsCompleteProfile) {
              console.log("✅ Usuario social con perfil completo, ir al onboarding");
              
              toast({
                title: "¡Bienvenido de nuevo!",
                description: "Te hemos enviado un email de bienvenida. Te llevamos al primer paso de tu configuración.",
              });

              // Ir directo al onboarding paso 1
              navigate(`/company-dashboard?view=adn-empresa&first_login=true&provider=${searchParams.get('provider') || 'unknown'}`);
              return;
            }
          }
        } catch (profileError) {
          console.log("ℹ️ No se encontró perfil existente, proceder a completar:", profileError);
        }

        // Si no tiene perfil completo, ir a completar información
        console.log(`🔄 Redirigiendo a completar perfil para tipo: ${userType}`);
        
        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada exitosamente. Te hemos enviado un email de bienvenida. Completa tu perfil para comenzar.",
        });

        // Redirigir a completar perfil con el tipo de usuario
        navigate(`/complete-profile?user_type=${userType}&from=social&provider=${searchParams.get('provider') || 'unknown'}`);

      } catch (error: any) {
        console.error("❌ Error en callback social:", error);
        toast({
          title: "Error",
          description: error.message || "Ocurrió un error durante el registro. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    handleSocialAuthCallback();
  }, [navigate, searchParams, toast, sendWelcomeEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Completando tu registro...
        </h2>
        <p className="text-gray-500">
          Estamos configurando tu cuenta y enviando tu email de bienvenida.
        </p>
      </div>
    </div>
  );
};

export default SocialCallback;