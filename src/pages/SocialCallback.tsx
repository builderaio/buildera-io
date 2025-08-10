import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SocialCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleSocialAuthCallback = async () => {
      try {
        console.log("🔄 Procesando callback de autenticación social...");
        console.log("📍 URL actual:", window.location.href);
        
        // Esperar más tiempo para que Supabase procese completamente el hash y establezca la sesión
        console.log("⏳ Esperando establecimiento de sesión...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar la sesión con múltiples intentos
        let session = null;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!session && attempts < maxAttempts) {
          console.log(`🔄 Intento ${attempts + 1}/${maxAttempts} de obtener sesión...`);
          
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error(`❌ Error en intento ${attempts + 1}:`, sessionError);
            throw sessionError;
          }

          if (currentSession && currentSession.user) {
            session = currentSession;
            console.log("✅ Sesión encontrada:", session.user.email);
            break;
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            console.log("⏳ Esperando antes del siguiente intento...");
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!session || !session.user) {
          throw new Error("No se pudo establecer la sesión después de múltiples intentos");
        }

        // Verificar si ya existe un perfil (el trigger debería haberlo creado)
        console.log("🔍 Verificando perfil creado por trigger...");
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, auth_provider, user_type, full_name')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("❌ Error verificando perfil:", profileError);
          throw profileError;
        }

        console.log("📊 Estado del perfil:", profile);

        // Obtener el tipo de usuario de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const userType = urlParams.get('user_type');
        
        // Si no hay perfil, es un problema con el trigger
        if (!profile) {
          console.error("❌ CRÍTICO: El trigger handle_new_user no creó el perfil");
          throw new Error("El perfil no fue creado automáticamente. Por favor, contacta soporte.");
        }

        // Si el perfil no tiene user_type, NO actualizarlo aquí
        // Dejar que el usuario lo defina en /complete-profile
        if (!profile.user_type && userType) {
          console.log(`📋 user_type desde URL: ${userType} - se definirá en complete-profile`);
          // NO actualizar aquí - el usuario debe ir a complete-profile para definirlo
        }

        toast({
          title: "¡Autenticación exitosa!",
          description: "Verificando tu estado de registro...",
        });

        // Pequeña pausa para mostrar el toast
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Determinar si el usuario ya tiene empresa principal
        const { data: companyMemberships } = await supabase
          .from('company_members')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('is_primary', true);

        const hasCompany = !!(companyMemberships && companyMemberships.length > 0);

        // Reglas de redirección inmediatas post OAuth
        // 1) Si no hay user_type en perfil o es company sin empresa -> ir a complete-profile
        if (!profile.user_type || (profile.user_type === 'company' && !hasCompany)) {
          const qs = !profile.user_type && userType ? `?user_type=${encodeURIComponent(userType)}` : '';
          window.location.href = `/complete-profile${qs}`;
          return;
        }

        // 2) Si ya está completamente configurado, redirigir al dashboard correspondiente
        switch (profile.user_type) {
          case 'company':
            window.location.href = '/company-dashboard';
            return;
          case 'developer':
            window.location.href = '/developer-dashboard';
            return;
          case 'expert':
            window.location.href = '/expert-dashboard';
            return;
          default:
            window.location.href = '/complete-profile';
            return;
        }

      } catch (error: any) {
        console.error("❌ Error en callback social:", error);
        
        // Logs adicionales para debugging
        console.log("🔍 Estado del localStorage:");
        const keys = Object.keys(localStorage);
        const supabaseKeys = keys.filter(key => key.includes('supabase') || key.includes('sb-'));
        supabaseKeys.forEach(key => {
          console.log(`🔑 ${key}:`, localStorage.getItem(key));
        });
        
        toast({
          title: "Error de Sesión",
          description: "No se pudo completar la autenticación. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    handleSocialAuthCallback();
  }, [navigate, toast]);

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