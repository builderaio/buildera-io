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
        
        // Esperar un poco para que la sesión se establezca completamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Obtener la sesión completa en lugar de solo el usuario
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("❌ Error obteniendo sesión:", sessionError);
          throw sessionError;
        }

        if (!session || !session.user) {
          console.error("❌ No se encontró sesión o usuario autenticado");
          
          // Intentar obtener el usuario directamente como fallback
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            console.error("❌ Fallback también falló:", userError);
            toast({
              title: "Error de Sesión",
              description: "No se pudo completar la autenticación. La sesión no se estableció correctamente.",
              variant: "destructive",
            });
            navigate('/auth');
            return;
          }
          
          console.log("✅ Usuario encontrado en fallback:", user.email);
        } else {
          console.log("✅ Sesión establecida para usuario:", session.user.email);
        }

        const user = session?.user;

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
            // Para registro social, crear empresa sin nombre específico - el usuario lo completará después
            const companyName = '';
            
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

        // Para usuarios de empresa, redirigir a completar perfil
        if (userType === 'company') {
          toast({
            title: "¡Registro exitoso!",
            description: "Tu cuenta ha sido creada exitosamente. Te hemos enviado un email de bienvenida. Completa tu perfil para comenzar.",
          });

          // Redirigir inmediatamente a completar perfil
          navigate('/complete-profile?user_type=company&from=social');
        } else {
          // Para otros tipos de usuario, redirigir al dashboard
          toast({
            title: "¡Registro exitoso!",
            description: "Tu cuenta ha sido creada exitosamente. Te hemos enviado un email de bienvenida.",
          });

          setTimeout(() => {
            navigate('/company-dashboard');
          }, 2000);
        }

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