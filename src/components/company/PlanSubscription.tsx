import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Zap, 
  Bot, 
  BarChart3, 
  Users, 
  Rocket, 
  Crown, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { useCompanyCredits } from "@/hooks/useCompanyCredits";
import { useCompany } from "@/contexts/CompanyContext";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: any;
  limits: any;
}

interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  plan?: SubscriptionPlan;
}

const PlanSubscription = () => {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { company } = useCompany();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const { totalCredits, usedCredits, availableCredits, loading: creditsLoading } = useCompanyCredits(
    company?.id,
    userId || undefined
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);

        // Fetch subscription plans
        const { data: plansData } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("price_monthly", { ascending: true });

        setPlans((plansData as unknown as SubscriptionPlan[]) || []);

        // Fetch user subscription
        if (user?.id) {
          const { data: subData } = await supabase
            .from("user_subscriptions")
            .select(`
              id,
              plan_id,
              status,
              current_period_end
            `)
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();

          if (subData && plansData) {
            const plan = (plansData as unknown as SubscriptionPlan[]).find((p) => p.id === subData.plan_id);
            setSubscription({ ...subData, plan: plan || undefined });
          }
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCurrentPlan = (): SubscriptionPlan | undefined => {
    if (subscription?.plan) return subscription.plan;
    // Default to starter/free plan
    return plans.find(p => p.name === "Assisted Mode") || plans[0] || undefined;
  };

  const currentPlan = getCurrentPlan();
  const planLimits = currentPlan?.limits as { credits_monthly?: number; agents_enabled?: number; team_members?: number } || {};
  const creditsLimit = planLimits.credits_monthly || 100;
  const agentsLimit = planLimits.agents_enabled || 1;
  const teamMembersLimit = planLimits.team_members || 1;
  const creditsPercentage = Math.min((usedCredits / creditsLimit) * 100, 100);
  
  const getPlanDisplayName = (plan: SubscriptionPlan) => {
    return plan.name.charAt(0).toUpperCase() + plan.name.slice(1);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "starter": return <Zap className="w-5 h-5" />;
      case "growth": return <Rocket className="w-5 h-5" />;
      case "scale": return <BarChart3 className="w-5 h-5" />;
      case "enterprise": return <Crown className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case "starter": return "bg-slate-500/20 text-slate-600 border-slate-500/30";
      case "growth": return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      case "scale": return "bg-purple-500/20 text-purple-600 border-purple-500/30";
      case "enterprise": return "bg-amber-500/20 text-amber-600 border-amber-500/30";
      default: return "bg-slate-500/20 text-slate-600 border-slate-500/30";
    }
  };

  if (loading || creditsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getPlanColor(currentPlan?.name || "starter")}`}>
                {getPlanIcon(currentPlan?.name || "starter")}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {t("config.plan.currentPlan")}
                </CardTitle>
                <Badge className={getPlanColor(currentPlan?.name || "starter")}>
                  {currentPlan ? getPlanDisplayName(currentPlan) : "Starter"}
                </Badge>
              </div>
            </div>
            {subscription?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                {t("config.plan.renewsOn", {
                  date: new Date(subscription.current_period_end).toLocaleDateString()
                })}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credits Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>{t("config.plan.credits")}</span>
              </div>
              <span className="font-medium">
                {usedCredits} / {creditsLimit} {t("config.plan.thisMonth")}
              </span>
            </div>
            <Progress 
              value={creditsPercentage} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {availableCredits} {t("config.plan.creditsRemaining")}
            </p>
          </div>

          {/* Agents & Features */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{t("config.plan.agents")}</span>
              </div>
              <p className="text-2xl font-bold">{agentsLimit}</p>
              <p className="text-xs text-muted-foreground">{t("config.plan.agentsIncluded")}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{t("config.plan.teamMembers")}</span>
              </div>
              <p className="text-2xl font-bold">{teamMembersLimit}</p>
              <p className="text-xs text-muted-foreground">{t("config.plan.membersIncluded")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {currentPlan?.name !== "enterprise" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t("config.plan.upgradeTitle")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans
              .filter(plan => {
                const planOrder = ["starter", "growth", "scale", "enterprise"];
                const currentIndex = planOrder.indexOf(currentPlan?.name || "starter");
                const planIndex = planOrder.indexOf(plan.name);
                return planIndex > currentIndex;
              })
              .slice(0, 3)
              .map((plan) => (
                <Card 
                  key={plan.id} 
                  className="relative hover:border-primary/50 transition-colors"
                >
                  {plan.name === "growth" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        {t("config.plan.popular")}
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${getPlanColor(plan.name)}`}>
                        {getPlanIcon(plan.name)}
                      </div>
                      <CardTitle className="text-lg">{getPlanDisplayName(plan)}</CardTitle>
                    </div>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">${plan.price_monthly}</span>
                      <span className="text-muted-foreground">/{t("config.plan.month")}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {(plan.features || []).slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full gap-2"
                      variant={plan.name === "growth" ? "default" : "outline"}
                      onClick={() => navigate("/pricing")}
                    >
                      {t("config.plan.upgrade")}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanSubscription;
