import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { es as esLocale, enUS as enLocale, ptBR as ptLocale } from "date-fns/locale";
import {
  Activity,
  Brain,
  Shield,
  Zap,
  GraduationCap,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { cn } from "@/lib/utils";

type Phase = "SENSE" | "THINK" | "GUARD" | "ACT" | "LEARN" | "EVOLVE" | string;

interface ExecutionLogEntry {
  id: string;
  cycle_id: string | null;
  phase: Phase;
  status: string | null;
  decisions_made: any;
  actions_taken: any;
  content_generated: number | null;
  content_approved: number | null;
  content_rejected: number | null;
  content_pending_review: number | null;
  credits_consumed: number | null;
  execution_time_ms: number | null;
  error_message: string | null;
  context_snapshot: any;
  created_at: string;
}

const PHASE_META: Record<string, { icon: any; color: string; bg: string }> = {
  SENSE:  { icon: Eye,            color: "text-sky-600",     bg: "bg-sky-500/10 border-sky-500/30" },
  THINK:  { icon: Brain,          color: "text-violet-600",  bg: "bg-violet-500/10 border-violet-500/30" },
  GUARD:  { icon: Shield,         color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/30" },
  ACT:    { icon: Zap,            color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/30" },
  LEARN:  { icon: GraduationCap,  color: "text-indigo-600",  bg: "bg-indigo-500/10 border-indigo-500/30" },
  EVOLVE: { icon: Activity,       color: "text-pink-600",    bg: "bg-pink-500/10 border-pink-500/30" },
};

const getPhaseMeta = (phase: string) =>
  PHASE_META[phase?.toUpperCase()] || {
    icon: Activity,
    color: "text-muted-foreground",
    bg: "bg-muted border-border",
  };

const statusIcon = (status: string | null) => {
  const s = (status || "").toLowerCase();
  if (["success", "completed", "ok"].some((k) => s.includes(k)))
    return { Icon: CheckCircle2, color: "text-emerald-500" };
  if (["error", "failed", "failure"].some((k) => s.includes(k)))
    return { Icon: AlertCircle, color: "text-destructive" };
  return { Icon: Clock, color: "text-muted-foreground" };
};

interface SystemActivityFeedProps {
  /** Compact embedded variant (no page header / footer) */
  compact?: boolean;
  /** Limit number of rows in compact mode */
  limit?: number;
}

export const SystemActivityFeed = ({
  compact = false,
  limit = 50,
}: SystemActivityFeedProps) => {
  const { t, i18n } = useTranslation(["common"]);
  const { company } = useCompany();
  const companyId = company?.id || null;

  const [logs, setLogs] = useState<ExecutionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyCreatedAt, setCompanyCreatedAt] = useState<string | null>(null);

  const dateLocale = useMemo(() => {
    const lang = i18n.language?.split("-")[0] || "en";
    return lang === "es" ? esLocale : lang === "pt" ? ptLocale : enLocale;
  }, [i18n.language]);

  const loadLogs = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [logsRes, companyRes] = await Promise.all([
        supabase
          .from("autopilot_execution_log")
          .select(
            "id, cycle_id, phase, status, decisions_made, actions_taken, content_generated, content_approved, content_rejected, content_pending_review, credits_consumed, execution_time_ms, error_message, context_snapshot, created_at",
          )
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("companies")
          .select("created_at")
          .eq("id", companyId)
          .maybeSingle(),
      ]);
      if (logsRes.error) throw logsRes.error;
      setLogs((logsRes.data as ExecutionLogEntry[]) || []);
      setCompanyCreatedAt(companyRes.data?.created_at || null);
    } catch (e) {
      console.error("Error loading activity log:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    if (!companyId) return;

    const channel = supabase
      .channel(`activity_feed_${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "autopilot_execution_log",
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          setLogs((prev) =>
            [payload.new as ExecutionLogEntry, ...prev].slice(0, limit),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, limit]);

  // Hours since company creation (for empty state)
  const hoursInSense = useMemo(() => {
    if (!companyCreatedAt) return 0;
    const ms = Date.now() - new Date(companyCreatedAt).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60)));
  }, [companyCreatedAt]);

  const renderEmpty = () => (
    <div className="text-center py-10 px-4">
      <div className="w-14 h-14 rounded-full bg-sky-500/10 flex items-center justify-center mx-auto mb-3">
        <Eye className="w-7 h-7 text-sky-600 animate-pulse" />
      </div>
      <p className="font-semibold text-base mb-1">
        {t(
          "common:systemActivity.empty.title",
          "El sistema está observando tu empresa",
        )}
      </p>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {t("common:systemActivity.empty.body", {
          hours: hoursInSense,
          defaultValue:
            "El sistema lleva {{hours}} horas en modo SENSE. Las primeras decisiones aparecerán aquí.",
        })}
      </p>
      <p className="text-xs text-muted-foreground mt-3">
        {t(
          "common:systemActivity.empty.hint",
          "El Autopilot prioriza observar antes de actuar — esto es normal en los primeros ciclos.",
        )}
      </p>
    </div>
  );

  const renderRow = (log: ExecutionLogEntry) => {
    const meta = getPhaseMeta(log.phase);
    const PhaseIcon = meta.icon;
    const { Icon: StatusIconCmp, color: statusColor } = statusIcon(log.status);

    const decisionsCount = Array.isArray(log.decisions_made)
      ? log.decisions_made.length
      : 0;
    const actionsCount = Array.isArray(log.actions_taken)
      ? log.actions_taken.length
      : 0;

    // Build a short description
    const description =
      log.error_message ||
      (decisionsCount > 0
        ? t("common:systemActivity.row.decisionsMade", {
            count: decisionsCount,
            defaultValue: "{{count}} decision(s) generated",
          })
        : actionsCount > 0
        ? t("common:systemActivity.row.actionsTaken", {
            count: actionsCount,
            defaultValue: "{{count}} action(s) executed",
          })
        : (log.content_generated ?? 0) > 0
        ? t("common:systemActivity.row.contentGenerated", {
            count: log.content_generated,
            defaultValue: "{{count}} content piece(s) generated",
          })
        : t("common:systemActivity.row.observation", "Phase observation logged"));

    return (
      <div
        key={log.id}
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-accent/30",
          meta.bg,
        )}
      >
        <div className={cn("rounded-lg p-2 shrink-0 bg-background/60", meta.color)}>
          <PhaseIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn("text-[10px] font-bold uppercase tracking-wider", meta.color)}
            >
              {log.phase}
            </Badge>
            {log.status && (
              <span className={cn("inline-flex items-center gap-1 text-xs", statusColor)}>
                <StatusIconCmp className="w-3 h-3" />
                {log.status}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
              {formatDistanceToNow(new Date(log.created_at), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </span>
          </div>
          <p
            className={cn(
              "text-sm mt-1 line-clamp-2",
              log.error_message ? "text-destructive" : "text-foreground",
            )}
          >
            {description}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
            {(log.credits_consumed ?? 0) > 0 && (
              <span>
                ⚡ {log.credits_consumed} {t("common:credits", "credits")}
              </span>
            )}
            {(log.execution_time_ms ?? 0) > 0 && (
              <span>⏱ {Math.round((log.execution_time_ms || 0) / 1000)}s</span>
            )}
            {(log.content_approved ?? 0) > 0 && (
              <span className="text-emerald-600">
                ✓ {log.content_approved} {t("common:systemActivity.approved", "approved")}
              </span>
            )}
            {(log.content_rejected ?? 0) > 0 && (
              <span className="text-destructive">
                ✕ {log.content_rejected} {t("common:systemActivity.rejected", "rejected")}
              </span>
            )}
            {(log.content_pending_review ?? 0) > 0 && (
              <span className="text-amber-600">
                ⏳ {log.content_pending_review}{" "}
                {t("common:systemActivity.pending", "pending")}
              </span>
            )}
            {log.cycle_id && (
              <span className="font-mono opacity-60">
                #{log.cycle_id.slice(0, 8)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const body = (
    <div className="space-y-2.5">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        renderEmpty()
      ) : compact ? (
        logs.slice(0, limit).map(renderRow)
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)] pr-2">
          <div className="space-y-2.5">{logs.map(renderRow)}</div>
        </ScrollArea>
      )}
    </div>
  );

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {t("common:systemActivity.title", "Actividad del Sistema")}
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={loadLogs}
            disabled={loading}
            className="h-7 px-2"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            {t("common:systemActivity.title", "Actividad del Sistema")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "common:systemActivity.subtitle",
              "Cada fase del Autopilot — SENSE, THINK, GUARD, ACT, LEARN — registrada en tiempo real.",
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t("common:systemActivity.live", "En vivo")}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={loadLogs}
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            {t("common:actions.refresh", "Refrescar")}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">{body}</CardContent>
      </Card>
    </div>
  );
};

export default SystemActivityFeed;
