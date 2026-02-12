import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle2, Circle, Network, Palette, Megaphone, Video, Calendar,
  ArrowRight, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MarketingGettingStartedProps {
  userId: string;
  onNavigateTab: (tab: string) => void;
}

interface OnboardingStep {
  key: string;
  completed: boolean;
  action: () => void;
}

export const MarketingGettingStarted = ({ userId, onNavigateTab }: MarketingGettingStartedProps) => {
  const { t } = useTranslation("marketing");
  const navigate = useNavigate();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) checkProgress();
  }, [userId]);

  const checkProgress = async () => {
    try {
      const [socialRes, brandingRes, campaignRes, creatifyRes, postsRes] = await Promise.all([
        supabase.from("social_accounts").select("id").eq("user_id", userId).eq("is_connected", true).limit(1),
        supabase.from("company_branding").select("id").limit(1),
        supabase.from("marketing_campaigns").select("id").eq("user_id", userId).limit(1),
        supabase.from("creatify_jobs").select("id").eq("user_id", userId).limit(1),
        supabase.from("scheduled_posts").select("id").eq("user_id", userId).limit(1),
      ]);

      setSteps([
        {
          key: "connectSocial",
          completed: (socialRes.data?.length || 0) > 0,
          action: () => navigate("/company-dashboard?view=configuracion"),
        },
        {
          key: "completeBrand",
          completed: (brandingRes.data?.length || 0) > 0,
          action: () => navigate("/company-dashboard?view=adn-empresa"),
        },
        {
          key: "firstCampaign",
          completed: (campaignRes.data?.length || 0) > 0,
          action: () => onNavigateTab("campaigns"),
        },
        {
          key: "firstVideo",
          completed: (creatifyRes.data?.length || 0) > 0,
          action: () => onNavigateTab("create"),
        },
        {
          key: "firstPost",
          completed: (postsRes.data?.length || 0) > 0,
          action: () => onNavigateTab("calendar"),
        },
      ]);
    } catch (e) {
      console.error("Error checking getting started progress:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  if (progress === 100) return null;

  const icons = [Network, Palette, Megaphone, Video, Calendar];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("hub.gettingStarted.title")}
          </CardTitle>
          <Badge variant="secondary">
            {completedCount}/{steps.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step, i) => {
          const Icon = icons[i];
          return (
            <div
              key={step.key}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                step.completed
                  ? "bg-primary/5 text-muted-foreground"
                  : "bg-card hover:bg-muted/50 cursor-pointer"
              }`}
              onClick={!step.completed ? step.action : undefined}
            >
              <div className="flex items-center gap-3">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <Icon className="h-4 w-4" />
                <span className={`text-sm font-medium ${step.completed ? "line-through" : ""}`}>
                  {t(`hub.gettingStarted.steps.${step.key}`)}
                </span>
              </div>
              {!step.completed && (
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
