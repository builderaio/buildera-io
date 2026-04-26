import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Coins,
  Layers,
  ClipboardCheck,
  Brain,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface StrategicControlOperationsPanelProps {
  companyId: string | null;
  onNavigate?: (view: string) => void;
}

interface CreditsState {
  available: number;
  total: number;
  consumed: number;
}

type DepartmentStatus = "active" | "inactive" | "unconfigured";
interface DepartmentRow {
  department: string;
  status: DepartmentStatus;
  autopilotEnabled: boolean;
  requiresApproval: boolean;
  guardrailCount: number;
  lastExecutionAt: string | null;
}

interface ApprovalRow {
  id: string;
  content_type: string;
  submitted_at: string;
  status: string;
}

interface DecisionRow {
  id: string;
  decision_type: string;
  description: string | null;
  priority: string | null;
  action_taken: boolean | null;
  guardrail_result: string | null;
  created_at: string;
}

interface Guardrail {
  department: string;
  key: string;
  value: any;
}

const KNOWN_DEPARTMENTS = [
  "marketing",
  "sales",
  "finance",
  "legal",
  "talent",
  "operations",
];

const formatRelative = (iso: string | null, t: (k: string, opts?: any) => string): string => {
  if (!iso) return t("strategic.ops.never");
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return t("strategic.ops.justNow");
  if (min < 60) return t("strategic.ops.minAgo", { min });
  const h = Math.round(min / 60);
  if (h < 24) return t("strategic.ops.hoursAgo", { h });
  const d = Math.round(h / 24);
  return t("strategic.ops.daysAgo", { d });
};

const StatusBadge = ({ status, t }: { status: DepartmentStatus; t: (k: string, def?: string) => string }) => {
  if (status === "active") {
    return (
      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
        <CheckCircle2 className="w-3 h-3" />
        {t("strategic.ops.dept.active", "Activo")}
      </Badge>
    );
  }
  if (status === "inactive") {
    return (
      <Badge variant="outline" className="text-[10px] gap-1">
        <Clock className="w-3 h-3" />
        {t("strategic.ops.dept.inactive", "Inactivo")}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1">
      <AlertTriangle className="w-3 h-3" />
      {t("strategic.ops.dept.unconfigured", "Sin configurar")}
    </Badge>
  );
};

export const StrategicControlOperationsPanel = ({
  companyId,
  onNavigate,
}: StrategicControlOperationsPanelProps) => {
  const { t } = useTranslation("common");
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<CreditsState>({ available: 0, total: 0, consumed: 0 });
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [decisions, setDecisions] = useState<DecisionRow[]>([]);
  const [guardrails, setGuardrails] = useState<Guardrail[]>([]);

  const fetchAll = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    try {
      const [creditsRes, deptRes, approvalsRes, decisionsRes] = await Promise.all([
        supabase
          .from("company_credits")
          .select("available_credits, total_credits_purchased, total_credits_consumed")
          .eq("company_id", companyId)
          .maybeSingle(),
        supabase
          .from("company_department_config")
          .select(
            "department, autopilot_enabled, require_human_approval, guardrails, last_execution_at",
          )
          .eq("company_id", companyId),
        supabase
          .from("content_approvals")
          .select("id, content_type, status, submitted_at")
          .eq("company_id", companyId)
          .eq("status", "pending_review")
          .order("submitted_at", { ascending: false })
          .limit(5),
        supabase
          .from("autopilot_decisions")
          .select(
            "id, decision_type, description, priority, action_taken, guardrail_result, created_at",
          )
          .eq("company_id", companyId)
          .neq("decision_type", "cycle_error")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // Credits
      const c = creditsRes.data;
      if (c) {
        const available = c.available_credits ?? 0;
        const consumed = c.total_credits_consumed ?? 0;
        const total =
          (c.total_credits_purchased ?? 0) || available + consumed;
        setCredits({ available, total: Math.max(total, available), consumed });
      }

      // Departments — merge known list with rows from DB
      const rows = deptRes.data || [];
      const map = new Map<string, any>();
      rows.forEach((r: any) => map.set(r.department, r));
      const merged: DepartmentRow[] = KNOWN_DEPARTMENTS.map((dept) => {
        const r = map.get(dept);
        if (!r) {
          return {
            department: dept,
            status: "unconfigured",
            autopilotEnabled: false,
            requiresApproval: false,
            guardrailCount: 0,
            lastExecutionAt: null,
          };
        }
        const guardrailObj = (r.guardrails as Record<string, any> | null) || {};
        const guardrailCount = Object.keys(guardrailObj).length;
        return {
          department: dept,
          status: r.autopilot_enabled ? "active" : "inactive",
          autopilotEnabled: !!r.autopilot_enabled,
          requiresApproval: !!r.require_human_approval,
          guardrailCount,
          lastExecutionAt: r.last_execution_at || null,
        };
      });
      setDepartments(merged);

      // Aggregate guardrails (top 5 by department)
      const allGuardrails: Guardrail[] = [];
      rows.forEach((r: any) => {
        const obj = (r.guardrails as Record<string, any> | null) || {};
        Object.entries(obj).forEach(([key, value]) => {
          allGuardrails.push({ department: r.department, key, value });
        });
      });
      setGuardrails(allGuardrails);

      setApprovals((approvalsRes.data as ApprovalRow[]) || []);
      setDecisions((decisionsRes.data as DecisionRow[]) || []);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  const creditsRatio = credits.total > 0 ? (credits.available / credits.total) * 100 : 0;
  const creditsHealth = credits.available <= 0 ? "error" : creditsRatio < 20 ? "warn" : "ok";
  const activeDepts = departments.filter((d) => d.status === "active").length;
  const pendingApprovalsCount = approvals.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* === CREDITS BUDGET === */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" />
            {t("strategic.ops.creditsTitle", "Presupuesto de créditos")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {credits.available}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {credits.total || credits.available}
              </span>
            </span>
            {creditsHealth === "error" && (
              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 text-[10px]">
                {t("strategic.ops.creditsEmpty", "Sin créditos")}
              </Badge>
            )}
            {creditsHealth === "warn" && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                {t("strategic.ops.creditsLow", "Bajo")}
              </Badge>
            )}
          </div>
          <Progress
            value={Math.min(100, creditsRatio)}
            className={cn(
              "h-2",
              creditsHealth === "error" && "[&>div]:bg-red-500",
              creditsHealth === "warn" && "[&>div]:bg-amber-500",
            )}
          />
          <p className="text-[11px] text-muted-foreground">
            {t("strategic.ops.creditsConsumed", "Consumidos este ciclo")}: {credits.consumed}
          </p>
          {creditsHealth !== "ok" && onNavigate && (
            <Button
              variant="link"
              size="sm"
              className="h-6 px-0 text-[11px]"
              onClick={() => onNavigate("plan")}
            >
              {t("strategic.ops.topUp", "Recargar créditos →")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* === PENDING APPROVALS === */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-primary" />
              {t("strategic.ops.approvalsTitle", "Aprobaciones pendientes")}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {pendingApprovalsCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {approvals.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3">
              {t("strategic.ops.approvalsEmpty", "Nada pendiente — todo aprobado o sin solicitudes")}
            </p>
          ) : (
            <ul className="space-y-2">
              {approvals.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 text-xs p-2 rounded-md bg-muted/30 border border-border/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate capitalize">
                      {a.content_type.replace(/_/g, " ")}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatRelative(a.submitted_at, t)}
                    </div>
                  </div>
                  {onNavigate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => onNavigate("autopilot")}
                    >
                      {t("strategic.ops.review", "Revisar")}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* === DEPARTMENTS STATUS === */}
      <Card className="border-border/60 lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              {t("strategic.ops.deptTitle", "Estado de departamentos")}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {activeDepts}/{departments.length} {t("strategic.ops.active", "activos")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {departments.map((d) => (
              <div
                key={d.department}
                className="p-2.5 rounded-lg bg-muted/30 border border-border/40 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold capitalize">
                    {t(`strategic.ops.departments.${d.department}`, d.department)}
                  </span>
                  <StatusBadge status={d.status} t={t as any} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {d.requiresApproval && (
                    <Badge variant="outline" className="text-[9px] gap-1">
                      <ClipboardCheck className="w-2.5 h-2.5" />
                      {t("strategic.ops.dept.humanApproval", "Aprobación humana")}
                    </Badge>
                  )}
                  {d.guardrailCount > 0 && (
                    <Badge variant="outline" className="text-[9px] gap-1">
                      <Shield className="w-2.5 h-2.5" />
                      {d.guardrailCount}
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {formatRelative(d.lastExecutionAt, t)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* === LATEST AUTOPILOT DECISIONS === */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            {t("strategic.ops.decisionsTitle", "Últimas decisiones del Autopilot")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {decisions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3">
              {t(
                "strategic.ops.decisionsEmpty",
                "El Autopilot aún no ha tomado decisiones. Aparecerán aquí en cuanto el sistema empiece a operar.",
              )}
            </p>
          ) : (
            <ul className="space-y-2">
              {decisions.map((d) => (
                <li
                  key={d.id}
                  className="text-xs p-2 rounded-md bg-muted/30 border border-border/40"
                >
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className="text-[9px] capitalize">
                      {d.decision_type.replace(/_/g, " ")}
                    </Badge>
                    {d.priority && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px]",
                          d.priority === "high" && "bg-red-500/10 text-red-600 border-red-500/30",
                          d.priority === "medium" && "bg-amber-500/10 text-amber-600 border-amber-500/30",
                        )}
                      >
                        {d.priority}
                      </Badge>
                    )}
                    {d.action_taken === true && (
                      <Badge
                        variant="outline"
                        className="text-[9px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      >
                        <Zap className="w-2.5 h-2.5" />
                        {t("strategic.ops.executed", "Ejecutada")}
                      </Badge>
                    )}
                    {d.guardrail_result === "blocked" && (
                      <Badge
                        variant="outline"
                        className="text-[9px] gap-1 bg-red-500/10 text-red-600 border-red-500/30"
                      >
                        <XCircle className="w-2.5 h-2.5" />
                        {t("strategic.ops.blocked", "Bloqueada")}
                      </Badge>
                    )}
                  </div>
                  {d.description && (
                    <p className="text-[11px] line-clamp-2 text-foreground/90">{d.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatRelative(d.created_at, t)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* === ACTIVE GUARDRAILS === */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              {t("strategic.ops.guardrailsTitle", "Guardrails activos")}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {guardrails.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {guardrails.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3">
              {t(
                "strategic.ops.guardrailsEmpty",
                "Sin guardrails configurados. Configura límites por departamento para reforzar la gobernanza.",
              )}
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {guardrails.slice(0, 12).map((g, i) => (
                <li
                  key={`${g.department}-${g.key}-${i}`}
                  className="flex items-center justify-between gap-2 text-[11px] p-2 rounded-md bg-muted/30 border border-border/40"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium capitalize">
                      {t(`strategic.ops.departments.${g.department}`, g.department)}
                    </span>
                    <span className="text-muted-foreground"> · </span>
                    <span className="text-muted-foreground">{g.key.replace(/_/g, " ")}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                    {typeof g.value === "object"
                      ? JSON.stringify(g.value).slice(0, 24)
                      : String(g.value)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          {onNavigate && (
            <Button
              variant="link"
              size="sm"
              className="h-6 px-0 text-[11px] mt-2"
              onClick={() => onNavigate("governance")}
            >
              {t("strategic.ops.manageGovernance", "Gestionar gobernanza →")}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StrategicControlOperationsPanel;
