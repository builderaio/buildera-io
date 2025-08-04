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
        
        // Esperar que Supabase procese el hash y establezca la sesión
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar la sesión
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("❌ Error obteniendo sesión:", sessionError);
          throw sessionError;
        }

        if (!session || !session.user) {
          throw new Error("No se pudo establecer la sesión de usuario");
        }

        console.log("✅ Sesión establecida para usuario:", session.user.email);

        // Usar OnboardingRedirect para manejar la lógica de redirección
        // Este componente ya maneja toda la lógica de perfiles y empresas
        toast({
          title: "¡Autenticación exitosa!",
          description: "Verificando tu estado de registro...",
        });

        // Pequeña pausa para mostrar el toast
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirigir a la página principal - OnboardingRedirect se encargará del resto
        navigate('/');

      } catch (error: any) {
        console.error("❌ Error en callback social:", error);
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