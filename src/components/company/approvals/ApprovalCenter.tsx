import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { es, enUS, ptBR } from "date-fns/locale";
import { Check, X, Eye, ShieldAlert, Clock, Inbox, Loader2, Bot, RefreshCw } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AutopilotDecision {
  id: string;
  company_id: string;
  cycle_id: string;
  decision_type: string;
  priority: string;
  description: string;
  reasoning: string | null;
  agent_to_execute: string | null;
  action_parameters: any;
  action_taken: boolean;
  guardrail_result: string | null;
  guardrail_details: string | null;
  expected_impact: any;
  created_at: string;
}

const PRIORITY_TO_RISK: Record<string, "low" | "medium" | "high" | "critical"> = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
};

const RISK_VARIANT: Record<
  "low" | "medium" | "high" | "critical",
  "secondary" | "default" | "destructive"
> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
  critical: "destructive",
};

const ApprovalCenter = () => {
  const { t, i18n } = useTranslation(["company", "common"]);
  const { company } = useCompany();
  const companyId = company?.id;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [decisions, setDecisions] = useState<AutopilotDecision[]>([]);
  const [selected, setSelected] = useState<AutopilotDecision | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const dateLocale = useMemo(() => {
    if (i18n.language?.startsWith("en")) return enUS;
    if (i18n.language?.startsWith("pt")) return ptBR;
    return es;
  }, [i18n.language]);

  const loadDecisions = async () => {
    if (!companyId) {
      setDecisions([]);
      setLoading(false);
      return;
    }
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("autopilot_decisions")
        .select("*")
        .eq("company_id", companyId)
        .eq("action_taken", false)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setDecisions((data || []) as AutopilotDecision[]);
    } catch (err: any) {
      console.error("[ApprovalCenter] load error", err);
      toast.error(t("company:approvals.errors.load", "No se pudieron cargar las acciones pendientes"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDecisions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Realtime updates
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`autopilot_decisions_${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "autopilot_decisions",
          filter: `company_id=eq.${companyId}`,
        },
        () => loadDecisions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleDecision = async (
    decision: AutopilotDecision,
    action: "approve" | "reject"
  ) => {
    setActingId(decision.id);
    try {
      const guardrail =
        action === "approve" ? "approved_by_user" : "rejected_by_user";

      // 1. Mark the original decision as resolved
      const { error: updateError } = await supabase
        .from("autopilot_decisions")
        .update({
          action_taken: true,
          guardrail_result: guardrail,
          guardrail_details:
            action === "approve"
              ? "Acción aprobada manualmente desde el Centro de Aprobaciones"
              : "Acción rechazada manualmente desde el Centro de Aprobaciones",
        })
        .eq("id", decision.id);

      if (updateError) throw updateError;

      // 2. Log the audit trail as a separate decision row
      await supabase.from("autopilot_decisions").insert({
        company_id: decision.company_id,
        cycle_id: decision.cycle_id,
        decision_type: `manual_${action}`,
        priority: decision.priority,
        description: `${
          action === "approve"
            ? "Aprobación manual"
            : "Rechazo manual"
        }: ${decision.description}`,
        reasoning: `Usuario ${
          action === "approve" ? "aprobó" : "rechazó"
        } la decisión ${decision.id} (${decision.decision_type}) desde el Centro de Aprobaciones.`,
        agent_to_execute: decision.agent_to_execute,
        action_parameters: decision.action_parameters,
        action_taken: true,
        guardrail_result: guardrail,
        expected_impact: {
          source_decision_id: decision.id,
          manual_action: action,
        },
      });

      // 3. If approved and there is an agent, attempt async execution (best-effort)
      if (action === "approve" && decision.agent_to_execute) {
        try {
          await supabase.functions.invoke("enterprise-autopilot-engine", {
            body: {
              mode: "execute_approved_decision",
              company_id: decision.company_id,
              decision_id: decision.id,
              agent: decision.agent_to_execute,
              action_parameters: decision.action_parameters,
            },
          });
        } catch (invokeErr) {
          console.warn(
            "[ApprovalCenter] approved decision logged but engine invocation failed",
            invokeErr
          );
        }
      }

      toast.success(
        action === "approve"
          ? t("company:approvals.toast.approved", "Acción aprobada")
          : t("company:approvals.toast.rejected", "Acción rechazada")
      );

      setDecisions((prev) => prev.filter((d) => d.id !== decision.id));
      setSelected(null);
    } catch (err: any) {
      console.error("[ApprovalCenter] decision error", err);
      toast.error(
        t("company:approvals.errors.action", "No se pudo registrar la decisión")
      );
    } finally {
      setActingId(null);
    }
  };

  const renderRiskBadge = (priority: string) => {
    const risk = PRIORITY_TO_RISK[priority] || "medium";
    const label =
      risk === "low"
        ? t("company:approvals.risk.low", "BAJO")
        : risk === "medium"
        ? t("company:approvals.risk.medium", "MEDIO")
        : risk === "high"
        ? t("company:approvals.risk.high", "ALTO")
        : t("company:approvals.risk.critical", "CRÍTICO");
    return (
      <Badge variant={RISK_VARIANT[risk]} className="uppercase tracking-wide">
        <ShieldAlert className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("company:approvals.title", "Centro de Aprobaciones")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t(
              "company:approvals.subtitle",
              "Revisa y autoriza las acciones que el Autopilot tiene pendientes."
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadDecisions}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {t("common:actions.refresh", "Actualizar")}
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : decisions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center gap-3">
            <Inbox className="w-12 h-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">
              {t(
                "company:approvals.empty.title",
                "Sistema en modo observación"
              )}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {t(
                "company:approvals.empty.description",
                "Las próximas acciones que el Autopilot proponga aparecerán aquí para tu revisión."
              )}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-220px)]">
          <div className="grid gap-4">
            {decisions.map((decision) => (
              <Card key={decision.id} className="transition hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-[60%]">
                      <CardTitle className="text-base md:text-lg">
                        {decision.description}
                      </CardTitle>
                      <CardDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          {decision.agent_to_execute ||
                            t(
                              "company:approvals.unknownAgent",
                              "Agente no especificado"
                            )}
                        </span>
                        <span aria-hidden>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(decision.created_at), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </span>
                        <span aria-hidden>•</span>
                        <span className="font-mono text-[10px] uppercase">
                          {decision.decision_type}
                        </span>
                      </CardDescription>
                    </div>
                    {renderRiskBadge(decision.priority)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleDecision(decision, "approve")}
                    disabled={actingId === decision.id}
                  >
                    {actingId === decision.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    {t("company:approvals.actions.approve", "Aprobar")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDecision(decision, "reject")}
                    disabled={actingId === decision.id}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t("company:approvals.actions.reject", "Rechazar")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelected(decision)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {t("company:approvals.actions.detail", "Ver detalle")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selected?.description ||
                t("company:approvals.detail.title", "Detalle de la acción")}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? `${selected.decision_type} • ${formatDistanceToNow(
                    new Date(selected.created_at),
                    { addSuffix: true, locale: dateLocale }
                  )}`
                : null}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                {renderRiskBadge(selected.priority)}
                {selected.agent_to_execute && (
                  <Badge variant="outline">
                    <Bot className="w-3 h-3 mr-1" />
                    {selected.agent_to_execute}
                  </Badge>
                )}
              </div>
              {selected.reasoning && (
                <section>
                  <h4 className="font-semibold mb-1">
                    {t("company:approvals.detail.reasoning", "Razonamiento")}
                  </h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selected.reasoning}
                  </p>
                </section>
              )}
              {selected.action_parameters && (
                <section>
                  <h4 className="font-semibold mb-1">
                    {t("company:approvals.detail.parameters", "Parámetros de la acción")}
                  </h4>
                  <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-60">
                    {JSON.stringify(selected.action_parameters, null, 2)}
                  </pre>
                </section>
              )}
              {selected.expected_impact && (
                <section>
                  <h4 className="font-semibold mb-1">
                    {t("company:approvals.detail.expectedImpact", "Impacto esperado")}
                  </h4>
                  <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-60">
                    {JSON.stringify(selected.expected_impact, null, 2)}
                  </pre>
                </section>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleDecision(selected, "reject")}
                  disabled={actingId === selected.id}
                >
                  <X className="w-4 h-4 mr-2" />
                  {t("company:approvals.actions.reject", "Rechazar")}
                </Button>
                <Button
                  onClick={() => handleDecision(selected, "approve")}
                  disabled={actingId === selected.id}
                >
                  {actingId === selected.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {t("company:approvals.actions.approve", "Aprobar")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalCenter;
