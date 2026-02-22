import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp } from "lucide-react";

interface EnterpriseIQPanelProps {
  cyclesCompleted: number;
  lessonsLearned: number;
  activatedCaps: number;
  previousIQ: number;
}

const IQ_LEVELS = [
  { max: 50, label: "beginner" },
  { max: 150, label: "apprentice" },
  { max: 300, label: "competent" },
  { max: 500, label: "expert" },
  { max: 999, label: "master" },
];

const EnterpriseIQPanel = ({ cyclesCompleted, lessonsLearned, activatedCaps, previousIQ }: EnterpriseIQPanelProps) => {
  const { t } = useTranslation("company");

  const iq = Math.min((cyclesCompleted * 2) + (lessonsLearned * 5) + (activatedCaps * 10), 999);
  const growth = previousIQ > 0 ? Math.round(((iq - previousIQ) / previousIQ) * 100) : 0;

  const currentLevel = IQ_LEVELS.find(l => iq < l.max) || IQ_LEVELS[IQ_LEVELS.length - 1];
  const prevLevel = IQ_LEVELS[IQ_LEVELS.indexOf(currentLevel) - 1];
  const progressMin = prevLevel ? prevLevel.max : 0;
  const progressMax = currentLevel.max;
  const progressPct = Math.min(((iq - progressMin) / (progressMax - progressMin)) * 100, 100);

  return (
    <Card className="border-border/50 bg-card h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("governance.iq.title", "Enterprise IQ")}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 h-5 border-primary/30 text-primary">
            {t(`governance.iq.levels.${currentLevel.label}`, currentLevel.label)}
          </Badge>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          <p className="text-5xl font-heading font-bold text-foreground">{iq}</p>
          {growth !== 0 && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">+{growth}%</span>
              <span className="text-muted-foreground">{t("governance.iq.monthly", "mensual")}</span>
            </div>
          )}
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{t(`governance.iq.levels.${currentLevel.label}`, currentLevel.label)}</span>
            <span>{iq}/{progressMax}</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{cyclesCompleted}</p>
            <p className="text-[10px] text-muted-foreground">{t("governance.iq.cycles", "Ciclos")}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{lessonsLearned}</p>
            <p className="text-[10px] text-muted-foreground">{t("governance.iq.lessons", "Lecciones")}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{activatedCaps}</p>
            <p className="text-[10px] text-muted-foreground">{t("governance.iq.capabilities", "Capacidades")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnterpriseIQPanel;
