import { useTranslation } from "react-i18next";
import { Activity, Cpu, CreditCard, Clock } from "lucide-react";

interface StatusBarProps {
  currentCycle: number;
  activeAgents: number;
  creditsToday: number;
  nextCycleMinutes: number;
}

const StatusBar = ({ currentCycle, activeAgents, creditsToday, nextCycleMinutes }: StatusBarProps) => {
  const { t } = useTranslation("company");

  const items = [
    { icon: Activity, label: t("governance.status.cycle", "Ciclo actual"), value: `#${currentCycle}` },
    { icon: Cpu, label: t("governance.status.agents", "Agentes activos"), value: String(activeAgents) },
    { icon: CreditCard, label: t("governance.status.credits", "Créditos hoy"), value: String(creditsToday) },
    { icon: Clock, label: t("governance.status.nextCycle", "Próximo ciclo"), value: `${nextCycleMinutes}min` },
  ];

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg bg-muted/50 border border-border/50">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{item.label}:</span>
          <span className="text-[11px] font-semibold text-foreground tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

export default StatusBar;
