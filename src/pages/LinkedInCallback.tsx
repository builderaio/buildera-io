import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const LinkedInCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Procesando autorización de LinkedIn...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔗 Procesando callback de LinkedIn...');

        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Verificar si hay errores de LinkedIn
        if (error) {
          console.error('❌ Error de LinkedIn OAuth:', error, errorDescription);
          throw new Error(errorDescription || `LinkedIn OAuth error: ${error}`);
        }

        // Verificar que tenemos el código de autorización
        if (!code) {
          throw new Error('Authorization code not received from LinkedIn');
        }

        // Verificar el estado para prevenir CSRF
        const savedState = localStorage.getItem('linkedin_oauth_state');
        const savedUserId = localStorage.getItem('linkedin_oauth_user_id');

        if (!savedState || state !== savedState) {
          throw new Error('Invalid state parameter - possible CSRF attack');
        }

        if (!savedUserId) {
          throw new Error('User ID not found in session');
        }

        console.log('✅ Validaciones de OAuth exitosas');

        setMessage('Intercambiando código de autorización...');

        // Llamar a la edge function para procesar el callback
        console.log('📡 Invocando edge function con:', { code: code?.substring(0, 10) + '...', state, userId: savedUserId });
        
        const { data, error: callbackError } = await supabase.functions.invoke('linkedin-oauth-callback', {
          body: {
            code,
            state,
            userId: savedUserId,
          }
        });

        console.log('📡 Respuesta de edge function:', { data, error: callbackError });

        if (callbackError) {
          console.error('❌ Error en edge function:', callbackError);
          throw new Error(callbackError.message || 'Error processing LinkedIn authorization');
        }

        if (!data.success) {
          console.error('❌ Error en respuesta:', data.error);
          throw new Error(data.error || 'Failed to process LinkedIn authorization');
        }

        console.log('✅ LinkedIn conectado exitosamente:', data.data);

        // Limpiar localStorage
        localStorage.removeItem('linkedin_oauth_state');
        localStorage.removeItem('linkedin_oauth_user_id');

        setStatus('success');
        setMessage(`¡LinkedIn conectado exitosamente! Página empresarial: ${data.data.companyPageName}`);

        toast({
          title: "¡LinkedIn Company Conectado!",
          description: `Página empresarial "${data.data.companyPageName}" vinculada exitosamente.`,
        });

        // Redirigir después de un delay
        setTimeout(() => {
          navigate('/company-dashboard?view=marketing-hub');
        }, 2000);

      } catch (error: any) {
        console.error('❌ Error en callback de LinkedIn:', error);

        // Limpiar localStorage en caso de error
        localStorage.removeItem('linkedin_oauth_state');
        localStorage.removeItem('linkedin_oauth_user_id');

        setStatus('error');
        setMessage(error.message || 'Error connecting to LinkedIn');

        toast({
          title: "Error LinkedIn Company",
          description: error.message || 'Error connecting to LinkedIn Company. Please try again.',
          variant: "destructive",
        });
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  const handleRetry = () => {
    navigate('/company-dashboard?view=adn-empresa');
  };

  const handleGoToDashboard = () => {
    navigate('/company-dashboard?view=marketing-hub');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <h2 className="text-xl font-semibold mb-2">Conectando LinkedIn</h2>
              <p className="text-muted-foreground mb-4">{message}</p>
              <div className="text-sm text-muted-foreground">
                Por favor, no cierre esta ventana...
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2 text-green-700">¡Conexión Exitosa!</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Button 
                onClick={handleGoToDashboard}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Ir al Marketing Hub
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold mb-2 text-red-700">Error de Conexión</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Button 
                  onClick={handleRetry}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Intentar de Nuevo
                </Button>
                <Button 
                  onClick={handleGoToDashboard}
                  variant="outline"
                  className="w-full"
                >
                  Ir al Dashboard
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedInCallback;