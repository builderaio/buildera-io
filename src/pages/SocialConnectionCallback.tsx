import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const SocialConnectionCallback = () => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      setLoading(true);
      
      // Obtener parámetros de la URL
      const status = searchParams.get('status');
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');
      const source = searchParams.get('source');
      
      // Log para debug
      console.log('Callback parameters:', {
        status,
        token,
        error: errorParam,
        source,
        allParams: Object.fromEntries(searchParams.entries())
      });

      if (errorParam) {
        throw new Error(decodeURIComponent(errorParam));
      }

      // Aceptar múltiples indicadores de éxito
      const isSuccess = status === 'success' || 
                       source === 'upload_post' || 
                       searchParams.has('connected') ||
                       (!errorParam && (token || searchParams.size > 0));

      if (isSuccess) {
        // Validar token si está presente
        if (token) {
          const { data, error } = await supabase.functions.invoke('upload-post-manager', {
            body: { 
              action: 'validate_token', 
              data: { token } 
            }
          });

          if (error) {
            console.warn('Token validation failed:', error);
          }
        }

        // Actualizar conexiones inmediatamente después del éxito
        await refreshConnections();
        
        setSuccess(true);
        
        toast({
          title: "✅ Conexión actualizada",
          description: "Sus redes sociales han sido conectadas exitosamente",
        });

        // Esperar un poco antes de redirigir
        setTimeout(() => {
          returnToMarketingHub();
        }, 2000);

      } else {
        // Si no hay indicadores de éxito claros, intentar refresh conexiones de todas formas
        console.warn('No success indicators found, but attempting connection refresh');
        await refreshConnections();
        
        // Si no hay errores explícitos, tratar como éxito
        if (!errorParam) {
          setSuccess(true);
          toast({
            title: "✅ Proceso completado",
            description: "Verificando el estado de las conexiones...",
          });
          
          setTimeout(() => {
            returnToMarketingHub();
          }, 2000);
        } else {
          throw new Error('Estado de conexión no válido');
        }
      }

    } catch (err: any) {
      console.error('Error in callback:', err);
      setError(err.message || 'Error desconocido en la conexión');
      
      toast({
        title: "❌ Error de conexión",
        description: err.message || 'No se pudo completar la conexión',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshConnections = async () => {
    try {
      // Obtener user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener company username desde la base de datos
      const { data: socialAccounts } = await supabase
        .from('social_accounts')
        .select('company_username')
        .eq('user_id', user.id)
        .limit(1);

      if (socialAccounts?.[0]?.company_username) {
        console.log('🔄 Refreshing connections for:', socialAccounts[0].company_username);
        
        const { data, error } = await supabase.functions.invoke('upload-post-manager', {
          body: { 
            action: 'get_connections', 
            data: { companyUsername: socialAccounts[0].company_username } 
          }
        });

        if (error) {
          console.warn('Could not refresh connections:', error);
        } else if (data?.success) {
          console.log('✅ Connections refreshed successfully:', data.connections);
        }
      } else {
        console.warn('No company username found for user');
      }
    } catch (error) {
      console.error('Error refreshing connections:', error);
    }
  };

  const returnToMarketingHub = () => {
    // Cerrar la ventana si es un popup
    if (window.opener) {
      window.close();
      return;
    }

    // Respetar el contexto de origen para redirigir correctamente
    const origin = searchParams.get('origin');
    const targetView = origin === 'activation-wizard' ? 'activation-wizard' : 'marketing-hub';
    navigate(`/company-dashboard?view=${targetView}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          {loading && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Procesando conexión...</h2>
                <p className="text-muted-foreground">
                  Actualizando el estado de sus redes sociales
                </p>
              </div>
            </>
          )}

          {success && !loading && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-700 mb-2">
                  ¡Conexión exitosa!
                </h2>
                <p className="text-muted-foreground">
                  Sus redes sociales han sido conectadas correctamente. 
                  Regresando al Marketing Hub...
                </p>
              </div>
            </>
          )}

          {error && !loading && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-red-700 mb-2">
                  Error de conexión
                </h2>
                <p className="text-muted-foreground text-sm mb-4">
                  {error}
                </p>
                <Button onClick={returnToMarketingHub} className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Marketing Hub
                </Button>
              </div>
            </>
          )}

          {/* Manual return button */}
          {(success || error) && (
            <div className="pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={returnToMarketingHub}
                className="w-full"
              >
                Volver manualmente
              </Button>
            </div>
          )}

          {/* Auto-close info for popups */}
          {window.opener && (
            <div className="text-xs text-muted-foreground border-t border-border pt-4">
              Esta ventana se cerrará automáticamente
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};