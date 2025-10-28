import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { edgeFunctions } from '@/services/edgeFunctions';
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: any;
  limits: any;
  is_active: boolean;
  sort_order: number;
}

interface UserSubscription {
  plan_name: string;
  plan_slug: string;
  limits: Record<string, any>;
  status: string;
  current_period_end: string | null;
  usage?: Record<string, number>;
}

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetchPlans();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    if (user) {
      fetchUserSubscription();
    }
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching plans:', error);
      toast.error('Error al cargar los planes');
      return;
    }

    setPlans(data || []);
  };

  const fetchUserSubscription = async () => {
    try {
      const { data, error } = await edgeFunctions.business.checkSubscriptionStatus();
      
      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      setUserSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSubscribe = async (planSlug: string) => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para suscribirte');
      return;
    }

    if (planSlug === 'starter') {
      toast.info('Ya estás en el plan Starter gratuito');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await edgeFunctions.business.createSubscriptionCheckout(planSlug);

      if (error) {
        console.error('Error creating checkout:', error);
        toast.error('Error al crear la sesión de pago');
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar la suscripción');
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = (plan: SubscriptionPlan) => {
    if (!isAuthenticated) return "Iniciar Sesión";
    if (plan.slug === 'starter') return "Plan Actual";
    if (userSubscription?.plan_slug === plan.slug) return "Plan Actual";
    if (plan.slug === 'starter') return "Comenzar Gratis";
    if (plan.slug === 'growth') return "Acelerar mi Crecimiento";
    if (plan.slug === 'scale') return "Dominar mi Mercado";
    if (plan.slug === 'enterprise') return "Transformar mi Empresa";
    return "Seleccionar Plan";
  };

  const getButtonVariant = (plan: SubscriptionPlan) => {
    if (userSubscription?.plan_slug === plan.slug) return "outline";
    if (plan.slug === 'growth') return "default";
    return "outline";
  };

  const formatPrice = (monthly: number, yearly: number) => {
    if (monthly === 0) return "Gratis";
    const price = isYearly ? yearly : monthly;
    const period = isYearly ? "/año" : "/mes";
    return `$${price}${period}`;
  };

  const getSavingsText = (monthly: number, yearly: number) => {
    if (monthly === 0 || !isYearly) return null;
    const yearlySavings = (monthly * 12) - yearly;
    if (yearlySavings > 0) {
      return `Ahorra $${yearlySavings}/año`;
    }
    return null;
  };

  return (
    <div className="py-20 bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading mb-4">
            Elige tu Plan de Crecimiento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Desde emprendedores que inician hasta empresas que quieren liderar su industria
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
              Mensual
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={`text-sm ${isYearly ? 'font-semibold' : 'text-muted-foreground'}`}>
              Anual
            </span>
            {isYearly && (
              <Badge variant="secondary" className="ml-2">
                2 meses gratis
              </Badge>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = userSubscription?.plan_slug === plan.slug;
            const isPopular = plan.slug === 'growth';
            const savings = getSavingsText(plan.price_monthly, plan.price_yearly);
            
            return (
              <Card key={plan.id} className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Más Popular
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="outline" className="bg-background">
                      Plan Actual
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="text-3xl font-bold">
                      {formatPrice(plan.price_monthly, plan.price_yearly)}
                    </div>
                    {savings && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        {savings}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={getButtonVariant(plan)}
                    onClick={() => handleSubscribe(plan.slug)}
                    disabled={loading || isCurrentPlan}
                  >
                    {getButtonText(plan)}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {userSubscription && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
              <span className="text-sm text-muted-foreground">
                Plan actual: <strong>{userSubscription.plan_name}</strong>
              </span>
              {userSubscription.current_period_end && (
                <span className="text-sm text-muted-foreground">
                  • Renueva el {new Date(userSubscription.current_period_end).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-2">🎁</div>
              <h3 className="font-semibold mb-2">2 meses gratis</h3>
              <p className="text-sm text-muted-foreground">Al pagar anual</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-2">🚀</div>
              <h3 className="font-semibold mb-2">Migración gratuita</h3>
              <p className="text-sm text-muted-foreground">Desde otras plataformas</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-2">💼</div>
              <h3 className="font-semibold mb-2">Onboarding personalizado</h3>
              <p className="text-sm text-muted-foreground">En planes Scale+</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;