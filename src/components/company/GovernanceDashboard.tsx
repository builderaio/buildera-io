import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, RefreshCw, Loader2 } from "lucide-react";
import EnterpriseIQPanel from "./governance/EnterpriseIQPanel";
import DepartmentsPanel from "./governance/DepartmentsPanel";
import ExecutionLogPanel from "./governance/ExecutionLogPanel";
import GuardrailsPanel from "./governance/GuardrailsPanel";
import ApprovalsPanel from "./governance/ApprovalsPanel";
import CapabilitiesPanel from "./governance/CapabilitiesPanel";
import StatusBar from "./governance/StatusBar";

interface GovernanceDashboardProps {
  profile?: any;
}

const GovernanceDashboard = ({ profile }: GovernanceDashboardProps) => {
  const { t } = useTranslation(["company", "common"]);
  const { company } = useCompany();
  const companyId = company?.id || profile?.primary_company_id;

  const [loading, setLoading] = useState(true);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [lessonsCount, setLessonsCount] = useState(0);
  const [cyclesCount, setCyclesCount] = useState(0);
  const [creditsToday, setCreditsToday] = useState(0);
  const [departments, setDepartments] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      decisionsRes,
      approvalsRes,
      capsRes,
      interventionsRes,
      lessonsRes,
      cyclesRes,
      creditsRes,
      deptsRes,
    ] = await Promise.all([
      supabase
        .from("autopilot_decisions")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("content_approvals")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("autopilot_capabilities")
        .select("*")
        .eq("company_id", companyId)
        .or("is_active.eq.true,status.eq.trial"),
      supabase
        .from("autopilot_execution_log")
        .select("*")
        .eq("company_id", companyId)
        .eq("phase", "guardrail_intervention")
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("autopilot_memory")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId),
      supabase
        .from("autopilot_execution_log")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .in("phase", ["SENSE", "THINK", "GUARD", "ACT", "LEARN"]),
      supabase
        .from("agent_usage_log")
        .select("credits_consumed")
        .eq("company_id", companyId)
        .gte("created_at", todayStart.toISOString()),
      supabase
        .from("company_department_config")
        .select("*")
        .eq("company_id", companyId),
    ]);

    setDecisions(decisionsRes.data || []);
    setApprovals(approvalsRes.data || []);
    setCapabilities(capsRes.data || []);
    setInterventions(interventionsRes.data || []);
    setLessonsCount(lessonsRes.count || 0);
    setCyclesCount(cyclesRes.count || 0);

    const totalCredits = (creditsRes.data || []).reduce(
      (sum: number, row: any) => sum + (row.credits_consumed || 0), 0
    );
    setCreditsToday(totalCredits);

    // Map departments
    const deptConfigs = deptsRes.data || [];
    const deptKeys = ["marketing", "sales", "legal", "hr", "customer_service", "finance"];
    const todayDecisions = (decisionsRes.data || []).filter((d: any) => {
      const created = new Date(d.created_at);
      return created.toDateString() === new Date().toDateString();
    });

    const mappedDepts = deptKeys.map(key => {
      const config = deptConfigs.find((c: any) => c.department === key);
      const tasksToday = todayDecisions.filter(
        (d: any) => (d.decision_type || "").toLowerCase().includes(key) ||
          (d.agent_to_execute || "").toLowerCase().includes(key)
      ).length;
      return {
        key,
        enabled: config?.autopilot_enabled ?? false,
        tasksToday,
      };
    });
    setDepartments(mappedDepts);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived metrics
  const activeCapsCount = capabilities.filter(c => c.is_active).length;
  const pendingCount = approvals.filter(a => a.status === "pending_review").length;

  // Budget usage estimate (simplified: credits today vs daily limit of 100)
  const budgetUsedPct = Math.min(Math.round((creditsToday / Math.max(100, creditsToday + 20)) * 100), 100);

  // Active agents count
  const uniqueAgents = new Set(decisions.filter(d => d.agent_to_execute).map(d => d.agent_to_execute));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground flex items-center gap-2">
              {t("company:governance.title", "Autonomy Control Center")}
              {pendingCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 h-5">{pendingCount}</Badge>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("company:governance.subtitle", "Control total de la autonomía empresarial en tiempo real")}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          {t("common:actions.refresh", "Actualizar")}
        </Button>
      </div>

      {/* 6-Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min">
        {/* Left Column: IQ + Departments */}
        <div className="md:col-span-3 space-y-4">
          <EnterpriseIQPanel
            cyclesCompleted={cyclesCount}
            lessonsLearned={lessonsCount}
            activatedCaps={activeCapsCount}
            previousIQ={0}
          />
          <DepartmentsPanel departments={departments} />
        </div>

        {/* Center Column: Execution Log + Guardrails */}
        <div className="md:col-span-5 space-y-4">
          <ExecutionLogPanel decisions={decisions} />
          <GuardrailsPanel interventions={interventions} budgetUsedPct={budgetUsedPct} />
        </div>

        {/* Right Column: Approvals + Capabilities */}
        <div className="md:col-span-4 space-y-4">
          <ApprovalsPanel approvals={approvals} onRefresh={fetchData} />
          <CapabilitiesPanel capabilities={capabilities} />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        currentCycle={cyclesCount}
        activeAgents={uniqueAgents.size}
        creditsToday={creditsToday}
        nextCycleMinutes={Math.max(0, 60 - new Date().getMinutes())}
      />
    </div>
  );
};

export default GovernanceDashboard;
