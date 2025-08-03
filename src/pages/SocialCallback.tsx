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
        
        // Obtener el usuario actual
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("❌ Error obteniendo usuario:", userError);
          throw userError;
        }

        if (!user) {
          console.error("❌ No se encontró usuario autenticado");
          toast({
            title: "Error",
            description: "No se pudo completar la autenticación. Por favor, intenta de nuevo.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        console.log("✅ Usuario autenticado:", user.email);

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

        // Llamar webhook para usuarios de empresa
        if (userType === 'company') {
          try {
            await supabase.functions.invoke('process-company-webhooks', {
              body: {
                user_id: user.id,
                company_name: user.user_metadata?.company_name || '',
                website_url: user.user_metadata?.website_url || '',
                country: user.user_metadata?.country || '',
                trigger_type: 'social_registration'
              }
            });
            console.log("✅ Webhook de registro enviado");
          } catch (webhookError) {
            console.error("❌ Error enviando webhook:", webhookError);
            // No bloquear el flujo si falla el webhook
          }
        }

        // Mostrar mensaje de éxito y redirigir al dashboard
        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada exitosamente. Te hemos enviado un email de bienvenida. ¡Bienvenido a Buildera!",
        });

        // Redirigir al dashboard después de un breve delay
        setTimeout(() => {
          navigate('/company-dashboard');
        }, 2000);

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