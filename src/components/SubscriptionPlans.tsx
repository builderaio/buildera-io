import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Check,
  Star,
  Bot,
  Building2,
  Shield,
  Gauge,
  Zap,
  Rocket,
  Brain,
  Settings2,
  ArrowRight,
  Crown,
  Users,
  Lock,
  BarChart3,
  Scale,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

const tierConfig = {
  assisted: {
    icon: Zap,
    color: "from-slate-500/20 to-slate-600/10",
    borderColor: "border-slate-500/30",
    accentColor: "text-slate-600",
    badgeColor: "bg-slate-500/15 text-slate-700 border-slate-500/30",
    autonomyBar: 1,
  },
  growth: {
    icon: Rocket,
    color: "from-primary/20 to-primary/5",
    borderColor: "border-primary/40",
    accentColor: "text-primary",
    badgeColor: "bg-primary/15 text-primary border-primary/30",
    autonomyBar: 2,
  },
  autopilot: {
    icon: Brain,
    color: "from-purple-500/20 to-purple-600/5",
    borderColor: "border-purple-500/40",
    accentColor: "text-purple-600",
    badgeColor: "bg-purple-500/15 text-purple-700 border-purple-500/30",
    autonomyBar: 3,
  },
  custom: {
    icon: Crown,
    color: "from-amber-500/20 to-amber-600/5",
    borderColor: "border-amber-500/40",
    accentColor: "text-amber-600",
    badgeColor: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    autonomyBar: 4,
  },
};

const SubscriptionPlans = () => {
  const { t } = useTranslation("pricing");
  const navigate = useNavigate();
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
    if (user) fetchUserSubscription();
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      console.error("Error fetching plans:", error);
      return;
    }
    setPlans(data || []);
  };

  const fetchUserSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription-status");
      if (!error) setUserSubscription(data);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const handleSubscribe = async (planSlug: string) => {
    if (planSlug === "custom") {
      navigate("/contacto");
      return;
    }
    if (!isAuthenticated) {
      navigate(`/auth?mode=register&plan=${planSlug}`);
      return;
    }
    if (planSlug === "assisted") {
      toast.info(t("errors.alreadyFree"));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription-checkout", {
        body: { planSlug, isYearly },
      });
      if (error) {
        toast.error(t("errors.checkoutFailed"));
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error(t("errors.processingFailed"));
    } finally {
      setLoading(false);
    }
  };

  const getConfig = (slug: string) => tierConfig[slug as keyof typeof tierConfig] || tierConfig.assisted;

  const formatPrice = (plan: SubscriptionPlan) => {
    if (plan.price_monthly === 0 && plan.slug === "custom") return t("pricing.contact");
    if (plan.price_monthly === 0) return t("pricing.free");
    const price = isYearly ? plan.price_yearly : plan.price_monthly;
    const period = isYearly ? t("pricing.year") : t("pricing.month");
    return `$${price}${period}`;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (plan.price_monthly === 0 || !isYearly) return null;
    const savings = plan.price_monthly * 12 - plan.price_yearly;
    return savings > 0 ? t("pricing.savings", { amount: savings }) : null;
  };

  const getLimits = (plan: SubscriptionPlan) => plan.limits as Record<string, any> || {};

  return (
    <div className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(60,70,178,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(60,70,178,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 font-mono">
            <Gauge className="w-4 h-4" />
            {t("header.badge")}
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            {t("header.title")}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            {t("header.subtitle")}
          </p>

          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!isYearly ? "font-semibold" : "text-muted-foreground"}`}>
              {t("pricing.monthly")}
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={`text-sm ${isYearly ? "font-semibold" : "text-muted-foreground"}`}>
              {t("pricing.yearly")}
            </span>
            {isYearly && (
              <Badge variant="secondary" className="ml-2">
                {t("pricing.yearlyDiscount")}
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
          {plans.map((plan, i) => {
            const config = getConfig(plan.slug);
            const isCurrentPlan = userSubscription?.plan_slug === plan.slug;
            const isPopular = plan.slug === "autopilot";
            const savings = getSavings(plan);
            const limits = getLimits(plan);
            const TierIcon = config.icon;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-card rounded-2xl border ${
                  isPopular ? config.borderColor + " shadow-lg" : "border-border/50"
                } ${isCurrentPlan ? "ring-2 ring-primary" : ""} overflow-hidden flex flex-col`}
              >
                {/* Top gradient bar */}
                <div className={`h-1.5 bg-gradient-to-r ${config.color}`} />

                {isPopular && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-purple-500 text-white border-0 text-[10px]">
                      <Star className="w-3 h-3 mr-1" />
                      {t("labels.popular")}
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="outline" className="bg-background text-[10px]">
                      {t("labels.currentPlan")}
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                      <TierIcon className={`w-5 h-5 ${config.accentColor}`} />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg">{plan.name}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-4">
                    <span className="text-3xl font-bold">{formatPrice(plan)}</span>
                    {savings && (
                      <span className="block text-xs text-emerald-600 font-medium mt-1">{savings}</span>
                    )}
                  </div>
                </div>

                {/* Autonomy Metrics */}
                <div className="px-6 pb-4 space-y-3">
                  {/* Agent count */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Bot className="w-3.5 h-3.5" />
                      {t("metrics.agents")}
                    </span>
                    <span className="font-mono font-bold">
                      {limits.agents_enabled === -1 ? t("metrics.unlimited") : limits.agents_enabled}
                    </span>
                  </div>

                  {/* Department coverage */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" />
                      {t("metrics.departments")}
                    </span>
                    <span className="font-mono font-bold">
                      {limits.departments === -1 ? t("metrics.unlimited") : `${limits.departments}/6`}
                    </span>
                  </div>

                  {/* Autonomy level */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Gauge className="w-3.5 h-3.5" />
                      {t("metrics.autonomy")}
                    </span>
                    <span className={`font-mono font-bold ${config.accentColor}`}>
                      {t(`autonomyLevels.${limits.autonomy_level}`)}
                    </span>
                  </div>

                  {/* Autonomy bar visual */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          level <= config.autonomyBar
                            ? `bg-gradient-to-r ${config.color.replace("/20", "/60").replace("/5", "/40")}`
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Governance */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Shield className="w-3.5 h-3.5" />
                      {t("metrics.governance")}
                    </span>
                    <span className="font-mono font-bold">
                      {t(`governanceLevels.${limits.governance_controls}`)}
                    </span>
                  </div>

                  {/* Scalability */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <BarChart3 className="w-3.5 h-3.5" />
                      {t("metrics.credits")}
                    </span>
                    <span className="font-mono font-bold">
                      {limits.credits_monthly === -1
                        ? t("metrics.unlimited")
                        : `${limits.credits_monthly}/mo`}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-6 border-t border-border/30" />

                {/* Features */}
                <div className="p-6 pt-4 flex-1 space-y-2.5">
                  {(plan.features || []).map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${config.accentColor}`} />
                      <span className="text-xs text-muted-foreground leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="p-6 pt-2">
                  <Button
                    className="w-full gap-2"
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.slug)}
                    disabled={loading || isCurrentPlan}
                    size="lg"
                  >
                    {!isAuthenticated
                      ? t("cta.login")
                      : isCurrentPlan
                      ? t("cta.current")
                      : plan.slug === "custom"
                      ? t("cta.contact")
                      : t(`cta.${plan.slug}`, t("cta.default"))}
                    {!isCurrentPlan && plan.slug !== "custom" && (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Current subscription info */}
        {userSubscription && (
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
              <span className="text-sm text-muted-foreground">
                {t("currentPlan.label")}: <strong>{userSubscription.plan_name}</strong>
              </span>
              {userSubscription.current_period_end && (
                <span className="text-sm text-muted-foreground">
                  • {t("currentPlan.renewsOn", {
                    date: new Date(userSubscription.current_period_end).toLocaleDateString(),
                  })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bottom benefits */}
        <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {["freeMonths", "migration", "onboarding", "governance"].map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <div className="text-2xl mb-2">{t(`benefits.${key}.icon`)}</div>
              <h4 className="font-heading font-bold text-sm mb-1">{t(`benefits.${key}.title`)}</h4>
              <p className="text-xs text-muted-foreground">{t(`benefits.${key}.description`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
