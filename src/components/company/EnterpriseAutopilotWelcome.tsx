import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowRight, Briefcase, Scale, DollarSign, Users, Cog, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEPT_ICONS: Record<string, React.ElementType> = {
  marketing: Megaphone,
  sales: Briefcase,
  finance: DollarSign,
  legal: Scale,
  hr: Users,
  operations: Cog,
};

const ALL_DEPARTMENTS = ['marketing', 'sales', 'finance', 'legal', 'hr', 'operations'];

interface EnterpriseAutopilotWelcomeProps {
  unlockedDepartments: string[];
}

export const EnterpriseAutopilotWelcome = ({ unlockedDepartments }: EnterpriseAutopilotWelcomeProps) => {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 shrink-0">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base sm:text-lg mb-1">
              {t('common:enterprise.welcome.title', 'Tu Cerebro Empresarial está listo')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('common:enterprise.welcome.description', 'A medida que tu negocio crece, nuevos departamentos se desbloquean automáticamente para automatizar más áreas de tu empresa.')}
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
              {ALL_DEPARTMENTS.map(dept => {
                const Icon = DEPT_ICONS[dept] || Cog;
                const isUnlocked = unlockedDepartments.includes(dept);
                return (
                  <div
                    key={dept}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-center transition-colors ${
                      isUnlocked 
                        ? 'border-primary/30 bg-primary/5' 
                        : 'border-border/50 bg-muted/30 opacity-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isUnlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-[10px] font-medium leading-tight">
                      {t(`common:enterprise.departments.${dept}`)}
                    </span>
                    {isUnlocked && (
                      <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3">
                        {t('common:enterprise.unlocked')}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            <Button 
              size="sm" 
              onClick={() => navigate('/company-dashboard?view=autopilot')}
              className="gap-1.5"
            >
              {t('common:enterprise.welcome.cta', 'Explorar Autopilot Empresarial')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
