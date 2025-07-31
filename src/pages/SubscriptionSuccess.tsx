import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      toast.error('Sesión inválida');
      navigate('/pricing');
      return;
    }

    // Wait a moment for webhook to process, then check subscription
    setTimeout(async () => {
      await fetchSubscription();
      setLoading(false);
    }, 3000);
  }, [sessionId, navigate]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription-status');
      
      if (error) {
        console.error('Error fetching subscription:', error);
        toast.error('Error al verificar la suscripción');
        return;
      }

      setSubscription(data);
      toast.success('¡Suscripción activada exitosamente!');
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast.error('Error al verificar la suscripción');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
              <h2 className="text-xl font-semibold">Procesando tu suscripción...</h2>
              <p className="text-muted-foreground">
                Estamos configurando tu cuenta. Esto puede tomar unos segundos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">¡Bienvenido a Buildera!</CardTitle>
          <CardDescription>
            Tu suscripción ha sido activada exitosamente
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {subscription && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Detalles de tu plan:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium">{subscription.plan_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <span className="font-medium text-green-600 capitalize">{subscription.status}</span>
                </div>
                {subscription.current_period_end && (
                  <div className="flex justify-between">
                    <span>Próxima renovación:</span>
                    <span className="font-medium">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold">¿Qué sigue?</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Accede a tu dashboard personalizado</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Configura tus especialistas de IA</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Conecta tus redes sociales</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Comienza a automatizar tu crecimiento</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => navigate('/company-dashboard')}
            >
              Ir a mi Dashboard
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/pricing')}
            >
              Ver todos los planes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;