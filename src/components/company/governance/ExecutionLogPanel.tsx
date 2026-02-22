import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getDateLocale } from "@/utils/dateLocale";

interface Decision {
  id: string;
  description: string;
  agent_to_execute: string | null;
  guardrail_result: string | null;
  created_at: string;
  action_taken: boolean;
  decision_type: string;
}

interface ExecutionLogPanelProps {
  decisions: Decision[];
}

const ExecutionLogPanel = ({ decisions }: ExecutionLogPanelProps) => {
  const { t } = useTranslation("company");
  const locale = getDateLocale();
  const todayDecisions = decisions.filter(d => {
    const today = new Date();
    const created = new Date(d.created_at);
    return created.toDateString() === today.toDateString();
  });

  return (
    <Card className="border-border/50 bg-card h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("governance.log.title", "Log de ejecución")}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 h-5">
            {todayDecisions.length} {t("governance.log.today", "hoy")}
          </Badge>
        </div>

        <ScrollArea className="flex-1 -mx-1 px-1" style={{ maxHeight: 280 }}>
          <div className="space-y-2">
            {decisions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                {t("governance.log.empty", "Sin decisiones ejecutadas aún")}
              </p>
            ) : (
              decisions.slice(0, 20).map((dec) => {
                const isBlocked = dec.guardrail_result === 'blocked';
                const isPending = dec.guardrail_result === 'requires_approval' || dec.guardrail_result === 'escalated';
                const StatusIcon = isBlocked ? XCircle : isPending ? Clock : CheckCircle;
                const statusColor = isBlocked ? 'text-destructive' : isPending ? 'text-amber-500' : 'text-emerald-500';

                return (
                  <div key={dec.id} className="flex items-start gap-2 py-2 border-b border-border/30 last:border-0">
                    <StatusIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${statusColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground line-clamp-2">{dec.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {dec.agent_to_execute && (
                          <span className="text-[10px] text-primary font-medium">{dec.agent_to_execute}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(dec.created_at), { addSuffix: true, locale })}
                        </span>
                      </div>
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

export default ExecutionLogPanel;
