import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getDateLocale } from "@/utils/dateLocale";

interface GuardrailEntry {
  id: string;
  status: string;
  phase: string;
  context_snapshot: any;
  created_at: string;
  credits_consumed: number;
}

interface GuardrailsPanelProps {
  interventions: GuardrailEntry[];
  budgetUsedPct: number;
}

const GuardrailsPanel = ({ interventions, budgetUsedPct }: GuardrailsPanelProps) => {
  const { t } = useTranslation("company");
  const locale = getDateLocale();

  const getIcon = (status: string) => {
    if (status === 'blocked') return <AlertTriangle className="w-3.5 h-3.5 text-destructive" />;
    if (status === 'requires_approval' || status === 'escalated') return <Info className="w-3.5 h-3.5 text-amber-500" />;
    return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
  };

  return (
    <Card className="border-border/50 bg-card h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("governance.guardrails.title", "Guardrails presupuestarios")}
            </span>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 h-5 ${budgetUsedPct > 80 ? 'border-destructive/50 text-destructive' : 'border-emerald-500/30 text-emerald-600'}`}
          >
            {budgetUsedPct}% {t("governance.guardrails.used", "usado")}
          </Badge>
        </div>

        <ScrollArea className="flex-1 -mx-1 px-1" style={{ maxHeight: 250 }}>
          <div className="space-y-2">
            {interventions.length === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2">
                <Shield className="w-8 h-8 text-emerald-500/40" />
                <p className="text-xs text-muted-foreground text-center">
                  {t("governance.guardrails.allClear", "Todos los guardrails operando normalmente")}
                </p>
              </div>
            ) : (
              interventions.slice(0, 15).map((entry) => {
                const details = typeof entry.context_snapshot === 'object' && entry.context_snapshot
                  ? (entry.context_snapshot as any)?.guardrail_applied || entry.status
                  : entry.status;
                return (
                  <div key={entry.id} className="flex items-start gap-2 py-2 border-b border-border/30 last:border-0">
                    {getIcon(entry.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground line-clamp-2">{String(details)}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default GuardrailsPanel;
