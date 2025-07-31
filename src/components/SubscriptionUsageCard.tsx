import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { Zap, TrendingUp, MessageSquare, Share2 } from "lucide-react";

const SubscriptionUsageCard = () => {
  const { subscription, loading, checkUsageLimit, getUsagePercentage, getRemainingUsage } = useSubscription();
  const navigate = useNavigate();

  if (loading || !subscription) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usageItems = [
    {
      key: 'data_analysis',
      label: 'Análisis de datos',
      icon: TrendingUp,
      limitKey: 'data_analysis',
      usageType: 'data_analysis'
    },
    {
      key: 'content_generation',
      label: 'Generación de contenido',
      icon: MessageSquare,
      limitKey: 'content_generation',
      usageType: 'content_generation'
    },
    {
      key: 'social_integrations',
      label: 'Integraciones sociales',
      icon: Share2,
      limitKey: 'social_integrations',
      usageType: 'social_integrations'
    }
  ];

  const isNearLimit = (usageType: string, limitKey: string) => {
    const percentage = getUsagePercentage(usageType, limitKey);
    return percentage >= 80;
  };

  const isPlanUpgradeNeeded = usageItems.some(item => 
    isNearLimit(item.usageType, item.limitKey)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Plan {subscription.plan_name}
            </CardTitle>
            <CardDescription>
              Uso actual de funcionalidades
            </CardDescription>
          </div>
          <Badge variant={subscription.plan_slug === 'starter' ? 'secondary' : 'default'}>
            {subscription.plan_slug === 'starter' ? 'Gratuito' : 'Premium'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {usageItems.map((item) => {
          const Icon = item.icon;
          const limit = subscription.limits[item.limitKey];
          const currentUsage = subscription.usage?.[item.usageType] || 0;
          const percentage = getUsagePercentage(item.usageType, item.limitKey);
          const remaining = getRemainingUsage(item.usageType, item.limitKey);
          const isUnlimited = limit === -1;
          const isNearLimitItem = isNearLimit(item.usageType, item.limitKey);

          return (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {isUnlimited ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Ilimitado
                    </Badge>
                  ) : (
                    <>
                      {currentUsage}/{limit}
                      {isNearLimitItem && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Límite cerca
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {!isUnlimited && (
                <Progress 
                  value={percentage} 
                  className={`h-2 ${isNearLimitItem ? 'bg-red-100' : ''}`}
                />
              )}
              
              {!isUnlimited && remaining <= 10 && remaining > 0 && (
                <p className="text-xs text-orange-600">
                  Solo quedan {remaining} usos este mes
                </p>
              )}
              
              {!isUnlimited && remaining === 0 && (
                <p className="text-xs text-red-600 font-medium">
                  Límite alcanzado para este mes
                </p>
              )}
            </div>
          );
        })}

        {subscription.current_period_end && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              El uso se renueva el {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          </div>
        )}

        {(subscription.plan_slug === 'starter' || isPlanUpgradeNeeded) && (
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/pricing')}
            >
              {subscription.plan_slug === 'starter' ? 'Mejorar Plan' : 'Ver Planes Superiores'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionUsageCard;