import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp, Handshake, Wallet, Scale, Users, Settings2,
  CheckCircle2, Circle, ArrowRight, Loader2, Sparkles, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DepartmentStep {
  id: string;
  label: string;
  check: () => Promise<boolean>;
  action: string; // view to navigate to
  actionLabel: string;
}

interface DepartmentGuide {
  id: string;
  icon: React.ElementType;
  color: string;
  steps: DepartmentStep[];
}

interface DepartmentActivationGuideProps {
  profile?: any;
  onNavigate?: (view: string) => void;
}

const DepartmentActivationGuide = ({ profile, onNavigate }: DepartmentActivationGuideProps) => {
  const { t } = useTranslation(["company", "common"]);
  const { company } = useCompany();
  const companyId = company?.id || profile?.primary_company_id;
  const { toast } = useToast();
  const [stepStatus, setStepStatus] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const departments: DepartmentGuide[] = [
    {
      id: "marketing",
      icon: TrendingUp,
      color: "text-primary",
      steps: [
        {
          id: "social_connected",
          label: t("company:activation.marketing.connectSocial", "Conectar al menos una red social"),
          check: async () => {
            const { count } = await supabase.from("linkedin_connections").select("*", { count: "exact", head: true }).eq("user_id", profile?.user_id);
            const { count: ig } = await supabase.from("facebook_instagram_connections").select("*", { count: "exact", head: true }).eq("user_id", profile?.user_id);
            const { count: tk } = await supabase.from("tiktok_connections").select("*", { count: "exact", head: true }).eq("user_id", profile?.user_id);
            return ((count || 0) + (ig || 0) + (tk || 0)) > 0;
          },
          action: "marketing-hub",
          actionLabel: t("company:activation.goTo", "Ir"),
        },
        {
          id: "strategy_created",
          label: t("company:activation.marketing.createStrategy", "Generar estrategia de marketing"),
          check: async () => {
            if (!companyId) return false;
            const { count } = await supabase.from("company_parameters").select("*", { count: "exact", head: true }).eq("company_id", companyId).eq("category", "strategy").eq("is_current", true);
            return (count || 0) > 0;
          },
          action: "negocio",
          actionLabel: t("company:activation.goTo", "Ir"),
        },
        {
          id: "agents_enabled",
          label: t("company:activation.marketing.enableAgents", "Habilitar agentes de contenido"),
          check: async () => {
            if (!companyId) return false;
            const { count } = await supabase.from("company_enabled_agents").select("*", { count: "exact", head: true }).eq("company_id", companyId);
            return (count || 0) > 0;
          },
          action: "agentes",
          actionLabel: t("company:activation.goTo", "Ir"),
        },
      ],
    },
    {
      id: "sales",
      icon: Handshake,
      color: "text-secondary",
      steps: [
        {
          id: "contacts_added",
          label: t("company:activation.sales.addContacts", "Agregar contactos al CRM"),
          check: async () => {
            if (!companyId) return false;
            const { count } = await supabase.from("crm_contacts").select("*", { count: "exact", head: true }).eq("company_id", companyId);
            return (count || 0) > 0;
          },
          action: "ventas",
          actionLabel: t("company:activation.goTo", "Ir"),
        },
        {
          id: "deals_created",
          label: t("company:activation.sales.createDeals", "Crear oportunidades en el pipeline"),
          check: async () => {
            if (!companyId) return false;
            const { count } = await supabase.from("crm_deals").select("*", { count: "exact", head: true }).eq("company_id", companyId);
            return (count || 0) > 0;
          },
          action: "ventas",
          actionLabel: t("company:activation.goTo", "Ir"),
        },
      ],
    },
    {
      id: "finance",
      icon: Wallet,
      color: "text-amber-500",
      steps: [
        {
          id: "budget_set",
          label: t("company:activation.finance.setBudget", "Definir presupuesto mensual"),
          check: async () => {
            if (!companyId) return false;
            const { count } = await supabase.from("company_parameters").select("*", { count: "exact", head: true }).eq("company_id", companyId).eq("category", "finance").eq("parameter_key", "monthly_budget").eq("is_current", true);
            return (count || 0) > 0;
          },
          action: "departamentos",
          actionLabel: t("company:activation.goTo", "Ir"),
        },
        {
          id: "revenue_target",
          label: t("company:activation.finance.setRevenue", "Establecer objetivo de ingresos"),
          check: async () => {
            if (!companyId) return false;
            const { count } = await supabase.from("company_parameters").select("*", { count: "exact", head: true }).eq("company_id", companyId).eq("category", "finance").eq("parameter_key", "revenue_target").eq("is_current", true);
            return (count || 0) > 0;
          },
          action: "departamentos",
          actionLabel: t("company:activation.goTo", "Ir"),
        },
      ],
    },
    {
      id: "legal",
      icon: Scale,
      color: "text-violet-500",
      steps: [
        {
          id: "compliance_set",
          label: t("company:activation.legal.setCompliance", "Definir marco de compliance"),
          check: async () => {
            if (!companyId) return false;
            const { count } = await supabase.from("company_parameters").select("*", { count: "exact", head: true }).eq("company_id", companyId).eq("category", "legal").eq("parameter_key", "compliance_framework").eq("is_current", true);
            return (count || 0) > 0;
          },
          action: "departamentos",
          actionLabel: t("company:activation.goTo", "Ir"),
        },
      ],
    },
    {
      id: "hr",
      icon: Users,
      color: "text-emerald-500",
      steps: [
        {
          id: "team_size",
          label: t("company:activation.hr.setTeamSize", "Registrar tamaño del equipo"),
          check: async () => {
            if (!companyId) return false;
            const { count } = await supabase.from("company_parameters").select("*", { count: "exact", head: true }).eq("company_id", companyId).eq("category", "hr").eq("parameter_key", "team_size").eq("is_current", true);
            return (count || 0) > 0;
          },
          action: "departamentos",
          actionLabel: t("company:activation.goTo", "Ir"),
        },
        {
          id: "culture_values",
          label: t("company:activation.hr.setCulture", "Definir valores culturales"),
          check: async () => {
            if (!companyId) return false;
            const { count } = await supabase.from("company_parameters").select("*", { count: "exact", head: true }).eq("company_id", companyId).eq("category", "hr").eq("parameter_key", "culture_values").eq("is_current", true);
            return (count || 0) > 0;
          },
          action: "departamentos",
          actionLabel: t("company:activation.goTo", "Ir"),
        },
      ],
    },
    {
      id: "operations",
      icon: Settings2,
      color: "text-orange-500",
      steps: [
        {
          id: "sla_set",
          label: t("company:activation.operations.setSLA", "Definir SLAs objetivo"),
          check: async () => {
            if (!companyId) return false;
            const { count } = await supabase.from("company_parameters").select("*", { count: "exact", head: true }).eq("company_id", companyId).eq("category", "operations").eq("parameter_key", "sla_targets").eq("is_current", true);
            return (count || 0) > 0;
          },
          action: "departamentos",
          actionLabel: t("company:activation.goTo", "Ir"),
        },
        {
          id: "processes",
          label: t("company:activation.operations.setProcesses", "Documentar procesos clave"),
          check: async () => {
            if (!companyId) return false;
            const { count } = await supabase.from("company_parameters").select("*", { count: "exact", head: true }).eq("company_id", companyId).eq("category", "operations").eq("parameter_key", "key_processes").eq("is_current", true);
            return (count || 0) > 0;
          },
          action: "departamentos",
          actionLabel: t("company:activation.goTo", "Ir"),
        },
      ],
    },
  ];

  useEffect(() => {
    if (!profile?.user_id) return;
    evaluateSteps();
  }, [profile?.user_id, companyId]);

  const evaluateSteps = async () => {
    setLoading(true);
    const results: Record<string, Record<string, boolean>> = {};

    for (const dept of departments) {
      results[dept.id] = {};
      for (const step of dept.steps) {
        try {
          results[dept.id][step.id] = await step.check();
        } catch {
          results[dept.id][step.id] = false;
        }
      }
    }

    setStepStatus(results);
    setLoading(false);
  };

  const getDeptProgress = (deptId: string) => {
    const status = stepStatus[deptId];
    if (!status) return 0;
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return 0;
    const completed = dept.steps.filter(s => status[s.id]).length;
    return Math.round((completed / dept.steps.length) * 100);
  };

  const getTotalProgress = () => {
    const totalSteps = departments.reduce((sum, d) => sum + d.steps.length, 0);
    const completedSteps = departments.reduce((sum, d) => {
      const status = stepStatus[d.id] || {};
      return sum + d.steps.filter(s => status[s.id]).length;
    }, 0);
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalProgress = getTotalProgress();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-primary" />
          {t("company:activation.title", "Activación por Departamento")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("company:activation.subtitle", "Completa estos pasos para que el Autopilot pueda operar cada departamento con contexto real.")}
        </p>
      </div>

      {/* Overall progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {t("company:activation.overallProgress", "Progreso general")}
            </span>
            <span className="text-sm font-bold text-primary">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {totalProgress === 100
              ? t("company:activation.allComplete", "🎉 ¡Todos los departamentos están configurados!")
              : t("company:activation.keepGoing", "Cada paso desbloquea más capacidades autónomas para tu empresa.")}
          </p>
        </CardContent>
      </Card>

      {/* Department cards */}
      <div className="space-y-3">
        {departments.map((dept) => {
          const Icon = dept.icon;
          const progress = getDeptProgress(dept.id);
          const isExpanded = expandedDept === dept.id;
          const isComplete = progress === 100;

          return (
            <motion.div key={dept.id} layout>
              <Card className={`transition-all ${isComplete ? "border-emerald-500/30 bg-emerald-500/5" : "hover:border-primary/20"}`}>
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isComplete ? "bg-emerald-500/10" : "bg-primary/10"}`}>
                        <Icon className={`w-5 h-5 ${isComplete ? "text-emerald-500" : dept.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-heading flex items-center gap-2">
                          {t(`company:activation.departments.${dept.id}`, dept.id)}
                          {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={progress} className="h-1.5 w-24" />
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardContent className="pt-0 space-y-2">
                        {dept.steps.map((step) => {
                          const isDone = stepStatus[dept.id]?.[step.id] || false;
                          return (
                            <div
                              key={step.id}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                isDone
                                  ? "border-emerald-500/20 bg-emerald-500/5"
                                  : "border-border/50 hover:border-primary/20"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {isDone ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                                )}
                                <span className={`text-sm ${isDone ? "text-muted-foreground line-through" : ""}`}>
                                  {step.label}
                                </span>
                              </div>
                              {!isDone && onNavigate && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate(step.action);
                                  }}
                                  className="shrink-0"
                                >
                                  {step.actionLabel}
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DepartmentActivationGuide;
