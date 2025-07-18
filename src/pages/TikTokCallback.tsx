import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TikTokCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    handleTikTokCallback();
  }, []);

  const handleTikTokCallback = async () => {
    try {
      // Obtener parámetros de la URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        throw new Error(`TikTok OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Parámetros de autorización incompletos');
      }

      // Verificar estado
      const storedState = localStorage.getItem('tiktok_oauth_state');
      const userId = localStorage.getItem('tiktok_oauth_user_id');

      if (state !== storedState) {
        throw new Error('Estado de autorización inválido');
      }

      if (!userId) {
        throw new Error('Usuario no identificado');
      }

      toast({
        title: "Procesando autorización",
        description: "Intercambiando código por token de acceso...",
      });

      // Intercambiar código por token usando edge function
      const { data, error: exchangeError } = await supabase.functions.invoke('tiktok-auth', {
        body: {
          action: 'exchange_code',
          code: code
        }
      });

      if (exchangeError) throw exchangeError;

      if (data.success) {
        toast({
          title: "¡TikTok Conectado!",
          description: `Bienvenido @${data.user_info?.username || 'Usuario TikTok'}. Ya puedes publicar contenido.`,
        });

        // Limpiar localStorage
        localStorage.removeItem('tiktok_oauth_state');
        localStorage.removeItem('tiktok_oauth_user_id');

        // Redirigir al dashboard
        navigate('/company-dashboard');
      } else {
        throw new Error('Error procesando la autorización de TikTok');
      }

    } catch (error: any) {
      console.error('Error en callback de TikTok:', error);
      
      toast({
        title: "Error conectando TikTok",
        description: error.message || 'Error procesando la autorización',
        variant: "destructive",
      });

      // Limpiar localStorage en caso de error
      localStorage.removeItem('tiktok_oauth_state');
      localStorage.removeItem('tiktok_oauth_user_id');

      // Redirigir al dashboard con error
      navigate('/company-dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Conectando TikTok</h2>
        <p className="text-muted-foreground">
          Procesando la autorización, por favor espera...
        </p>
      </div>
    </div>
  );
};

export default TikTokCallback;