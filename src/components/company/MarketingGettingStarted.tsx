import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle2, Circle, Network, Palette, Megaphone, Calendar,
  ArrowRight, Sparkles, Brain, Shield, Eye, Zap, Download
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MarketingGettingStartedProps {
  userId: string;
  onNavigateTab: (tab: string) => void;
  onImportData?: () => void;
}

interface OnboardingStep {
  key: string;
  completed: boolean;
  action: () => void;
  level: 1 | 2;
}

export const MarketingGettingStarted = ({ userId, onNavigateTab, onImportData }: MarketingGettingStartedProps) => {
  const { t } = useTranslation("marketing");
  const navigate = useNavigate();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLevel2, setShowLevel2] = useState(false);

  useEffect(() => {
    if (userId) checkProgress();
  }, [userId]);

  const checkProgress = async () => {
    try {
      const [socialRes, brandingRes, postsRes, autopilotRes, guardrailsRes, igPosts, liPosts, fbPosts, tkPosts, scheduledRes] = await Promise.all([
        supabase.from("social_accounts").select("id").eq("user_id", userId).eq("is_connected", true).limit(1),
        supabase.from("company_branding").select("id").limit(1),
        supabase.from("scheduled_posts").select("id").eq("user_id", userId).limit(1),
        supabase.from("company_autopilot_config").select("autopilot_enabled, require_human_approval").eq("user_id", userId).eq("autopilot_enabled", true).maybeSingle(),
        supabase.from("company_communication_settings").select("id").limit(1),
        supabase.from("instagram_posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("linkedin_posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("facebook_posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("tiktok_posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("scheduled_posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);

      const totalImportedPosts = (igPosts.count || 0) + (liPosts.count || 0) + (fbPosts.count || 0) + (tkPosts.count || 0);
      const totalScheduledPosts = scheduledRes.count || 0;

      const level1Steps: OnboardingStep[] = [
        {
          key: "connectSocial",
          completed: (socialRes.data?.length || 0) > 0,
          action: () => navigate("/company-dashboard?view=marketing-hub&action=connect"),
          level: 1,
        },
        {
          key: "completeBrand",
          completed: (brandingRes.data?.length || 0) > 0,
          action: () => navigate("/company-dashboard?view=adn-empresa"),
          level: 1,
        },
        {
          key: "importSocialData",
          completed: totalImportedPosts >= 5 || totalScheduledPosts >= 1,
          action: () => totalImportedPosts === 0 && (socialRes.data?.length || 0) === 0
            ? onNavigateTab("create")
            : onImportData?.(),
          level: 1,
        },
        {
          key: "firstPost",
          completed: (postsRes.data?.length || 0) > 0,
          action: () => onNavigateTab("calendar"),
          level: 1,
        },
        {
          key: "activateAutopilot",
          completed: !!autopilotRes.data,
          action: () => navigate("/company-dashboard?view=autopilot"),
          level: 1,
        },
      ];

      const level1Complete = level1Steps.every(s => s.completed);

      // Check enterprise department autopilot status
      const { data: enterpriseDepts } = await supabase
        .from('company_department_config')
        .select('id')
        .eq('company_id', userId) // company_id is resolved later
        .neq('department', 'marketing')
        .eq('autopilot_enabled', true)
        .limit(1);

      // Get actual company_id for enterprise check
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('primary_company_id')
        .eq('user_id', userId)
        .maybeSingle();
      
      let hasEnterpriseDept = false;
      if (userProfile?.primary_company_id) {
        const { data: entDepts } = await supabase
          .from('company_department_config')
          .select('id')
          .eq('company_id', userProfile.primary_company_id)
          .neq('department', 'marketing')
          .eq('autopilot_enabled', true)
          .limit(1);
        hasEnterpriseDept = (entDepts?.length || 0) > 0;
      }

      const level2Steps: OnboardingStep[] = [
        {
          key: "configureGuardrails",
          completed: (guardrailsRes.data?.length || 0) > 0,
          action: () => navigate("/company-dashboard?view=adn-empresa"),
          level: 2,
        },
        {
          key: "supervisedMode",
          completed: !!autopilotRes.data && autopilotRes.data.require_human_approval === true,
          action: () => onNavigateTab("autopilot"),
          level: 2,
        },
        {
          key: "reviewDecisions",
          completed: false,
          action: () => onNavigateTab("autopilot"),
          level: 2,
        },
        {
          key: "autonomousMode",
          completed: !!autopilotRes.data && autopilotRes.data.require_human_approval === false,
          action: () => navigate("/company-dashboard?view=autopilot"),
          level: 2,
        },
        {
          key: "exploreEnterpriseBrain",
          completed: hasEnterpriseDept,
          action: () => navigate("/company-dashboard?view=enterprise-autopilot"),
          level: 2,
        },
      ];

      if (autopilotRes.data) {
        const { data: decisionsData } = await supabase
          .from("autopilot_decisions")
          .select("id")
          .limit(1);
        if (decisionsData && decisionsData.length > 0) {
          level2Steps[2].completed = true;
        }
      }

      setShowLevel2(level1Complete);
      setSteps(level1Complete ? [...level1Steps, ...level2Steps] : level1Steps);
    } catch (e) {
      console.error("Error checking getting started progress:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const activeSteps = showLevel2 ? steps.filter(s => s.level === 2) : steps.filter(s => s.level === 1);
  const completedCount = activeSteps.filter((s) => s.completed).length;
  const progress = (completedCount / activeSteps.length) * 100;

  if (showLevel2 && progress === 100) return null;
  
  const level1Icons = [Network, Palette, Download, Calendar, Brain];
  const level2Icons = [Shield, Brain, Eye, Zap, Sparkles];
  const icons = showLevel2 ? level2Icons : level1Icons;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            {showLevel2 
              ? t("hub.gettingStarted.titleLevel2")
              : t("hub.gettingStarted.title")
            }
          </CardTitle>
          <Badge variant="secondary">
            {completedCount}/{activeSteps.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {activeSteps.map((step, i) => {
          const Icon = icons[i] || Sparkles;
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
