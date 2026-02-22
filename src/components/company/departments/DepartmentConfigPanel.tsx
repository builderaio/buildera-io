import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet, Scale, Users, Settings2, Save, Loader2, Plus, Trash2, CheckCircle
} from "lucide-react";

interface DepartmentField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number";
  placeholder: string;
}

interface DepartmentConfig {
  id: string;
  icon: React.ElementType;
  category: string;
  fields: DepartmentField[];
}

const departmentConfigs: DepartmentConfig[] = [
  {
    id: "finance",
    icon: Wallet,
    category: "finance",
    fields: [
      { key: "monthly_budget", label: "departments.finance.monthlyBudget", type: "number", placeholder: "10000" },
      { key: "revenue_target", label: "departments.finance.revenueTarget", type: "number", placeholder: "50000" },
      { key: "cost_categories", label: "departments.finance.costCategories", type: "textarea", placeholder: "departments.finance.costCategoriesPlaceholder" },
      { key: "financial_notes", label: "departments.finance.notes", type: "textarea", placeholder: "departments.finance.notesPlaceholder" },
    ],
  },
  {
    id: "legal",
    icon: Scale,
    category: "legal",
    fields: [
      { key: "compliance_framework", label: "departments.legal.complianceFramework", type: "text", placeholder: "GDPR, SOX, ISO 27001" },
      { key: "legal_jurisdiction", label: "departments.legal.jurisdiction", type: "text", placeholder: "departments.legal.jurisdictionPlaceholder" },
      { key: "contract_templates", label: "departments.legal.contractTemplates", type: "textarea", placeholder: "departments.legal.contractsPlaceholder" },
      { key: "regulatory_notes", label: "departments.legal.regulatoryNotes", type: "textarea", placeholder: "departments.legal.regulatoryPlaceholder" },
    ],
  },
  {
    id: "hr",
    icon: Users,
    category: "hr",
    fields: [
      { key: "team_size", label: "departments.hr.teamSize", type: "number", placeholder: "15" },
      { key: "hiring_goals", label: "departments.hr.hiringGoals", type: "textarea", placeholder: "departments.hr.hiringPlaceholder" },
      { key: "culture_values", label: "departments.hr.cultureValues", type: "textarea", placeholder: "departments.hr.culturePlaceholder" },
      { key: "training_priorities", label: "departments.hr.trainingPriorities", type: "textarea", placeholder: "departments.hr.trainingPlaceholder" },
    ],
  },
  {
    id: "operations",
    icon: Settings2,
    category: "operations",
    fields: [
      { key: "sla_targets", label: "departments.operations.slaTargets", type: "textarea", placeholder: "departments.operations.slaPlaceholder" },
      { key: "key_processes", label: "departments.operations.keyProcesses", type: "textarea", placeholder: "departments.operations.processesPlaceholder" },
      { key: "bottlenecks", label: "departments.operations.knownBottlenecks", type: "textarea", placeholder: "departments.operations.bottlenecksPlaceholder" },
      { key: "automation_priorities", label: "departments.operations.automationPriorities", type: "textarea", placeholder: "departments.operations.automationPlaceholder" },
    ],
  },
];

interface DepartmentConfigPanelProps {
  profile?: any;
}

const DepartmentConfigPanel = ({ profile }: DepartmentConfigPanelProps) => {
  const { t } = useTranslation(["company", "common"]);
  const { company } = useCompany();
  const companyId = company?.id || profile?.primary_company_id;
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedDepts, setSavedDepts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!companyId) return;
    loadParameters();
  }, [companyId]);

  const loadParameters = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("company_parameters")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_current", true)
      .in("category", ["finance", "legal", "hr", "operations"]);

    if (data) {
      const grouped: Record<string, Record<string, string>> = {};
      const hasDepts = new Set<string>();
      data.forEach((param) => {
        if (!grouped[param.category]) grouped[param.category] = {};
        grouped[param.category][param.parameter_key] = 
          typeof param.parameter_value === "string" 
            ? param.parameter_value 
            : JSON.stringify(param.parameter_value);
        hasDepts.add(param.category);
      });
      setValues(grouped);
      setSavedDepts(hasDepts);
    }
    setLoading(false);
  };

  const handleChange = (dept: string, key: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [dept]: { ...prev[dept], [key]: value },
    }));
  };

  const handleSave = async (deptId: string) => {
    if (!companyId) return;
    setSaving(deptId);
    const deptValues = values[deptId] || {};
    const { data: { user } } = await supabase.auth.getUser();

    try {
      for (const [key, val] of Object.entries(deptValues)) {
        if (!val?.trim()) continue;
        
        // Mark old ones as not current
        await supabase
          .from("company_parameters")
          .update({ is_current: false })
          .eq("company_id", companyId)
          .eq("category", deptId)
          .eq("parameter_key", key);

        // Insert new
        await supabase
          .from("company_parameters")
          .insert({
            company_id: companyId,
            category: deptId,
            parameter_key: key,
            parameter_value: val as any,
            is_current: true,
            created_by: user?.id || null,
          });
      }
      
      setSavedDepts(prev => new Set(prev).add(deptId));
      toast({
        title: t("common:status.success"),
        description: t("company:departments.savedSuccess", "Configuración guardada correctamente"),
      });
    } catch (err) {
      toast({
        title: t("common:status.error"),
        description: t("company:departments.savedError", "Error al guardar"),
        variant: "destructive",
      });
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">
          {t("company:departments.title", "Configuración por Departamento")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("company:departments.subtitle", "Configura los datos base de cada departamento para que el Autopilot pueda operar con contexto real.")}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {departmentConfigs.map((dept) => {
          const Icon = dept.icon;
          const isSaved = savedDepts.has(dept.id);
          
          return (
            <Card key={dept.id} className={`transition-all ${isSaved ? "border-primary/30" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-heading">
                        {t(`company:departments.${dept.id}.title`, dept.id)}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {t(`company:departments.${dept.id}.description`, `Configuración de ${dept.id}`)}
                      </CardDescription>
                    </div>
                  </div>
                  {isSaved && (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {dept.fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      {t(`company:${field.label}`, field.key.replace("_", " "))}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        value={values[dept.id]?.[field.key] || ""}
                        onChange={(e) => handleChange(dept.id, field.key, e.target.value)}
                        placeholder={t(`company:${field.placeholder}`, field.placeholder)}
                        rows={3}
                        className="text-sm"
                      />
                    ) : (
                      <Input
                        type={field.type}
                        value={values[dept.id]?.[field.key] || ""}
                        onChange={(e) => handleChange(dept.id, field.key, e.target.value)}
                        placeholder={t(`company:${field.placeholder}`, field.placeholder)}
                        className="text-sm"
                      />
                    )}
                  </div>
                ))}
                <Button
                  onClick={() => handleSave(dept.id)}
                  disabled={saving === dept.id}
                  className="w-full"
                  size="sm"
                >
                  {saving === dept.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {t("common:actions.save", "Guardar")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DepartmentConfigPanel;
