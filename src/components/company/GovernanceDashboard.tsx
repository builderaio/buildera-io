import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, CheckCircle, Clock, XCircle, FileEdit, Send,
  AlertTriangle, Eye, Brain, RefreshCw, Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getDateLocale } from "@/utils/dateLocale";

interface GovernanceDashboardProps {
  profile?: any;
}

const statusIcons: Record<string, any> = {
  draft: FileEdit,
  pending_review: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  published: Send,
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_review: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  published: "bg-primary/10 text-primary border-primary/20",
};

const GovernanceDashboard = ({ profile }: GovernanceDashboardProps) => {
  const { t } = useTranslation(["company", "common"]);
  const { company } = useCompany();
  const companyId = company?.id || profile?.primary_company_id;
  const [approvals, setApprovals] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);

    const [approvalsRes, decisionsRes] = await Promise.all([
      supabase
        .from("content_approvals")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("autopilot_decisions")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    setApprovals(approvalsRes.data || []);
    setDecisions(decisionsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const pendingCount = approvals.filter(a => a.status === "pending_review").length;
  const approvedCount = approvals.filter(a => a.status === "approved").length;
  const blockedDecisions = decisions.filter(d => d.guardrail_result === "blocked").length;
  const passedGuardrails = decisions.filter(d => d.guardrail_result === "passed").length;
  const locale = getDateLocale();

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary" />
            {t("company:governance.title", "Gobernanza y Control")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("company:governance.subtitle", "Aprobaciones, guardrails y trazabilidad de decisiones autónomas")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {t("common:actions.refresh", "Actualizar")}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-heading font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">{t("company:governance.pendingReview", "Pendientes de revisión")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-heading font-bold">{approvedCount}</p>
            <p className="text-xs text-muted-foreground">{t("company:governance.approved", "Aprobados")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-heading font-bold">{passedGuardrails}</p>
            <p className="text-xs text-muted-foreground">{t("company:governance.guardrailsPassed", "Guardrails OK")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-heading font-bold">{blockedDecisions}</p>
            <p className="text-xs text-muted-foreground">{t("company:governance.guardrailsBlocked", "Bloqueados")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="approvals" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            {t("company:governance.contentApprovals", "Aprobaciones de contenido")}
            {pendingCount > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 h-4">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="decisions" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            {t("company:governance.autopilotDecisions", "Decisiones del Autopilot")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : approvals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Eye className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">{t("company:governance.noApprovals", "No hay aprobaciones aún. El contenido generado por agentes aparecerá aquí.")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {approvals.map((item) => {
                const StatusIcon = statusIcons[item.status] || FileEdit;
                return (
                  <Card key={item.id} className="hover:border-primary/20 transition-colors">
                    <CardContent className="flex items-center gap-4 py-4">
                      <StatusIcon className="w-5 h-5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.content_type} — {item.content_id?.substring(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale })}
                        </p>
                      </div>
                      <Badge className={statusColors[item.status] || ""} variant="outline">
                        {item.status?.replace("_", " ")}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="decisions" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : decisions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">{t("company:governance.noDecisions", "No hay decisiones del autopilot aún. Activa el Cerebro Empresarial para ver decisiones aquí.")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {decisions.map((dec) => (
                <Card key={dec.id} className="hover:border-primary/20 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{dec.description}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{dec.decision_type}</Badge>
                          <Badge variant="outline" className="text-[10px]">{dec.priority}</Badge>
                          {dec.guardrail_result && (
                            <Badge
                              variant="outline"
                              className={dec.guardrail_result === "passed"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                                : "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"}
                            >
                              {dec.guardrail_result}
                            </Badge>
                          )}
                        </div>
                        {dec.reasoning && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{dec.reasoning}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(dec.created_at), { addSuffix: true, locale })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GovernanceDashboard;
