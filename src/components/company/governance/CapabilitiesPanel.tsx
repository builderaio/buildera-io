import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap } from "lucide-react";

interface Capability {
  id: string;
  capability_name: string;
  status: string;
  is_active: boolean;
  execution_count: number | null;
  success_rate: number | null;
  department: string;
}

interface CapabilitiesPanelProps {
  capabilities: Capability[];
}

const CapabilitiesPanel = ({ capabilities }: CapabilitiesPanelProps) => {
  const { t } = useTranslation("company");

  return (
    <Card className="border-border/50 bg-card h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("governance.capabilities.title", "Capacidades activas")}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 h-5">
            {capabilities.length}
          </Badge>
        </div>

        <ScrollArea className="flex-1 -mx-1 px-1" style={{ maxHeight: 250 }}>
          <div className="space-y-3">
            {capabilities.length === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2">
                <Zap className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground text-center">
                  {t("governance.capabilities.empty", "Sin capacidades activas")}
                </p>
              </div>
            ) : (
              capabilities.slice(0, 10).map((cap) => {
                const score = cap.success_rate ?? (cap.execution_count ? Math.min(cap.execution_count * 5, 100) : 0);
                return (
                  <div key={cap.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1 h-4 ${cap.status === 'trial'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}
                        >
                          {cap.status === 'trial' ? 'TRIAL' : 'LIVE'}
                        </Badge>
                        <span className="text-xs text-foreground truncate">{cap.capability_name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(score)}%</span>
                    </div>
                    <Progress value={score} className="h-1" />
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

export default CapabilitiesPanel;
