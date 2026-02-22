import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import {
  Megaphone, TrendingUp, Scale, Users, HeadphonesIcon, BarChart3
} from "lucide-react";

interface DeptInfo {
  key: string;
  enabled: boolean;
  tasksToday: number;
}

interface DepartmentsPanelProps {
  departments: DeptInfo[];
}

const DEPT_ICONS: Record<string, any> = {
  marketing: Megaphone,
  sales: TrendingUp,
  legal: Scale,
  hr: Users,
  customer_service: HeadphonesIcon,
  finance: BarChart3,
};

const DepartmentsPanel = ({ departments }: DepartmentsPanelProps) => {
  const { t } = useTranslation("company");

  const defaultDepts: DeptInfo[] = [
    { key: "marketing", enabled: false, tasksToday: 0 },
    { key: "sales", enabled: false, tasksToday: 0 },
    { key: "legal", enabled: false, tasksToday: 0 },
    { key: "hr", enabled: false, tasksToday: 0 },
    { key: "customer_service", enabled: false, tasksToday: 0 },
    { key: "finance", enabled: false, tasksToday: 0 },
  ];

  const merged = defaultDepts.map(d => {
    const found = departments.find(dep => dep.key === d.key);
    return found || d;
  });

  return (
    <Card className="border-border/50 bg-card h-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("governance.departments.title", "Departamentos activos")}
          </span>
        </div>

        <div className="space-y-2">
          {merged.map((dept) => {
            const Icon = DEPT_ICONS[dept.key] || Users;
            return (
              <div key={dept.key} className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dept.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground flex-1 truncate">
                  {t(`governance.departments.${dept.key}`, dept.key)}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {dept.tasksToday} {t("governance.departments.tasks", "tareas")}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DepartmentsPanel;
