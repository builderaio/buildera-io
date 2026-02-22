import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { getDateLocale } from "@/utils/dateLocale";

interface Approval {
  id: string;
  content_type: string;
  content_id: string | null;
  status: string;
  content_data: any;
  created_at: string;
}

interface ApprovalsPanelProps {
  approvals: Approval[];
  onRefresh: () => void;
}

const ApprovalsPanel = ({ approvals, onRefresh }: ApprovalsPanelProps) => {
  const { t } = useTranslation("company");
  const locale = getDateLocale();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pending = approvals.filter(a => a.status === "pending_review");

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    setProcessingId(id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("content_approvals")
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewer_id: user?.id,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success(t(`governance.approvals.${action}Success`, action === "approved" ? "Aprobado" : "Rechazado"));
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card className="border-border/50 bg-card h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("governance.approvals.title", "Aprobaciones pendientes")}
            </span>
          </div>
          {pending.length > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 h-5">
              {pending.length}
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1 -mx-1 px-1" style={{ maxHeight: 280 }}>
          <div className="space-y-2">
            {pending.length === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2">
                <CheckCircle className="w-8 h-8 text-emerald-500/40" />
                <p className="text-xs text-muted-foreground text-center">
                  {t("governance.approvals.allClear", "No hay aprobaciones pendientes")}
                </p>
              </div>
            ) : (
              pending.map((item) => {
                const riskLevel = (item.content_data as any)?.risk_level || "medium";
                const riskColors: Record<string, string> = {
                  low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                  high: "bg-destructive/10 text-destructive border-destructive/20",
                  critical: "bg-destructive/20 text-destructive border-destructive/30",
                };

                return (
                  <div key={item.id} className="flex items-center gap-2 py-2 border-b border-border/30 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="outline" className={`text-[9px] px-1 h-4 ${riskColors[riskLevel] || riskColors.medium}`}>
                          {riskLevel}
                        </Badge>
                        <span className="text-xs text-foreground truncate">{item.content_type}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale })}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-emerald-500 hover:bg-emerald-500/10"
                        onClick={() => handleAction(item.id, "approved")}
                        disabled={processingId === item.id}
                      >
                        {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        onClick={() => handleAction(item.id, "rejected")}
                        disabled={processingId === item.id}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
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

export default ApprovalsPanel;
