import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Brain,
  Sparkles,
  Share2,
  Coins,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Health = "ok" | "warn" | "error" | "loading";

interface SystemStatusPanelProps {
  companyId: string | null;
  onNavigate?: (view: string) => void;
}

interface SystemStatus {
  ai: {
    lovable_gateway: { configured: boolean; reachable: boolean | null; last_error?: string };
    openai: { configured: boolean; reachable: boolean | null; last_error?: string };
    content_generation_available: boolean;
  };
  enterprise_brain: {
    configured: boolean;
    status: "active" | "no_ai" | "error";
    last_error?: string;
  };
  generated_at: string;
}

interface SocialState {
  instagram: boolean;
  linkedin: boolean;
  facebook: boolean;
  tiktok: boolean;
}

interface CreditsState {
  available: number;
  total: number;
}

interface AutopilotState {
  lastCycleAt: string | null;
  status: string | null;
}

const PLATFORMS: Array<keyof SocialState> = ["instagram", "linkedin", "facebook", "tiktok"];

const StatusDot = ({ health }: { health: Health }) => {
  if (health === "loading") return <Skeleton className="w-3 h-3 rounded-full" />;
  const color =
    health === "ok"
      ? "bg-emerald-500"
      : health === "warn"
        ? "bg-amber-500"
        : "bg-red-500";
  return <span className={cn("w-2.5 h-2.5 rounded-full", color)} aria-hidden />;
};

const StatusIcon = ({ health, className }: { health: Health; className?: string }) => {
  const cls = cn("w-4 h-4", className);
  if (health === "ok") return <CheckCircle2 className={cn(cls, "text-emerald-500")} />;
  if (health === "warn") return <AlertTriangle className={cn(cls, "text-amber-500")} />;
  if (health === "error") return <XCircle className={cn(cls, "text-red-500")} />;
  return <Clock className={cn(cls, "text-muted-foreground animate-pulse")} />;
};

const formatRelative = (iso: string | null, t: (k: string, opts?: any) => string): string => {
  if (!iso) return t("system_status.never");
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return t("system_status.justNow");
  if (min < 60) return t("system_status.minAgo", { min });
  const h = Math.round(min / 60);
  if (h < 24) return t("system_status.hoursAgo", { h });
  const d = Math.round(h / 24);
  return t("system_status.daysAgo", { d });
};

export const SystemStatusPanel = ({ companyId, onNavigate }: SystemStatusPanelProps) => {
  const { t } = useTranslation("common");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [social, setSocial] = useState<SocialState>({
    instagram: false,
    linkedin: false,
    facebook: false,
    tiktok: false,
  });
  const [credits, setCredits] = useState<CreditsState>({ available: 0, total: 0 });
  const [autopilot, setAutopilot] = useState<AutopilotState>({ lastCycleAt: null, status: null });
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!companyId) return;
    try {
      // 1. AI service status (edge function)
      const { data: statusData, error: statusErr } = await supabase.functions.invoke(
        "system-status",
        { body: { company_id: companyId } },
      );
      if (statusErr) {
        setAiError(statusErr.message || "AI status check failed");
      } else {
        setAiError(null);
        setStatus(statusData as SystemStatus);
      }

      // 2. Social accounts
      const { data: accounts } = await supabase
        .from("social_accounts")
        .select("platform, is_connected")
        .eq("company_id", companyId);
      const next: SocialState = {
        instagram: false,
        linkedin: false,
        facebook: false,
        tiktok: false,
      };
      (accounts || []).forEach((a: any) => {
        const p = (a.platform || "").toLowerCase();
        if (p in next && a.is_connected) (next as any)[p] = true;
      });
      setSocial(next);

      // 3. Credits
      const { data: creditRow } = await supabase
        .from("company_credits")
        .select("available_credits, total_credits_purchased, total_credits_consumed")
        .eq("company_id", companyId)
        .maybeSingle();
      if (creditRow) {
        const available = creditRow.available_credits ?? 0;
        const total =
          (creditRow.total_credits_purchased ?? 0) || available + (creditRow.total_credits_consumed ?? 0);
        setCredits({ available, total: Math.max(total, available) });
      }

      // 4. Last autopilot cycle
      const { data: lastCycle } = await supabase
        .from("autopilot_execution_log")
        .select("created_at, status")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setAutopilot({
        lastCycleAt: lastCycle?.created_at || null,
        status: lastCycle?.status || null,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [companyId]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  // Derive health states
  const aiContentHealth: Health = loading
    ? "loading"
    : aiError
      ? "warn"
      : status?.ai.content_generation_available
        ? "ok"
        : "error";

  const brainHealth: Health = loading
    ? "loading"
    : status?.enterprise_brain.status === "active"
      ? "ok"
      : status?.enterprise_brain.status === "no_ai"
        ? "warn"
        : "error";

  const creditsRatio = credits.total > 0 ? (credits.available / credits.total) * 100 : 0;
  const creditsHealth: Health = loading
    ? "loading"
    : credits.available <= 0
      ? "error"
      : creditsRatio < 20
        ? "warn"
        : "ok";

  const connectedSocialCount = Object.values(social).filter(Boolean).length;
  const socialHealth: Health = loading
    ? "loading"
    : connectedSocialCount === 0
      ? "error"
      : connectedSocialCount < 2
        ? "warn"
        : "ok";

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {t("system_status.title")}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="h-7 px-2"
            aria-label={t("system_status.refresh")}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("system_status.subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Enterprise Brain */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
          <Brain className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{t("system_status.brain.title")}</span>
              <StatusIcon health={brainHealth} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {brainHealth === "ok" && t("system_status.brain.active")}
              {brainHealth === "warn" && t("system_status.brain.noAi")}
              {brainHealth === "error" && t("system_status.brain.error")}
              {brainHealth === "loading" && t("system_status.checking")}
            </p>
          </div>
        </div>

        {/* Content Generation */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
          <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{t("system_status.contentGen.title")}</span>
              <StatusIcon health={aiContentHealth} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {aiContentHealth === "ok" && t("system_status.contentGen.available")}
              {aiContentHealth === "warn" && t("system_status.contentGen.degraded")}
              {aiContentHealth === "error" && t("system_status.contentGen.unavailable")}
              {aiContentHealth === "loading" && t("system_status.checking")}
            </p>
          </div>
        </div>

        {/* Social Networks */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
          <Share2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-sm font-medium">{t("system_status.social.title")}</span>
              <StatusIcon health={socialHealth} />
              <Badge variant="outline" className="text-[10px]">
                {connectedSocialCount}/{PLATFORMS.length}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => {
                const ok = social[p];
                return (
                  <Badge
                    key={p}
                    variant="outline"
                    className={cn(
                      "text-[10px] gap-1 capitalize",
                      ok
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <StatusDot health={loading ? "loading" : ok ? "ok" : "error"} />
                    {p}
                  </Badge>
                );
              })}
            </div>
            {!loading && socialHealth !== "ok" && onNavigate && (
              <Button
                variant="link"
                size="sm"
                className="px-0 h-6 text-[11px]"
                onClick={() => onNavigate("marketing")}
              >
                {t("system_status.social.connect")}
              </Button>
            )}
          </div>
        </div>

        {/* Last Autopilot Cycle */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
          <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{t("system_status.autopilot.title")}</span>
              {!loading && (
                <Badge variant="outline" className="text-[10px]">
                  {autopilot.status === "completed"
                    ? t("system_status.autopilot.ok")
                    : autopilot.status === "failed"
                      ? t("system_status.autopilot.failed")
                      : autopilot.status || t("system_status.autopilot.unknown")}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loading ? t("system_status.checking") : formatRelative(autopilot.lastCycleAt, t)}
            </p>
          </div>
        </div>

        {/* Credits */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
          <Coins className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t("system_status.credits.title")}</span>
                <StatusIcon health={creditsHealth} />
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {loading ? "—" : `${credits.available} / ${credits.total || credits.available}`}
              </span>
            </div>
            <Progress
              value={loading ? 0 : Math.min(100, creditsRatio)}
              className={cn(
                "h-2",
                creditsHealth === "error" && "[&>div]:bg-red-500",
                creditsHealth === "warn" && "[&>div]:bg-amber-500",
              )}
            />
            {!loading && creditsHealth !== "ok" && onNavigate && (
              <Button
                variant="link"
                size="sm"
                className="px-0 h-6 text-[11px] mt-1"
                onClick={() => onNavigate("plan")}
              >
                {t("system_status.credits.topUp")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemStatusPanel;
