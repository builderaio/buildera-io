import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Clock, Coins } from "lucide-react";

interface GenerationStatusTrackerProps {
  status: string;
  progress: number;
  error?: string | null;
  onRetry?: () => void;
  output?: any;
  children?: React.ReactNode;
  creditsUsed?: number | null;
  duration?: number | null;
  thumbnailUrl?: string | null;
}

export const GenerationStatusTracker = ({
  status,
  progress,
  error,
  onRetry,
  children,
  creditsUsed,
  duration,
  thumbnailUrl,
}: GenerationStatusTrackerProps) => {
  const { t } = useTranslation("creatify");

  if (status === "done") {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <p className="text-green-800 font-medium">{t("status.completed")}</p>
            {creditsUsed != null && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Coins className="h-3 w-3" /> {creditsUsed} {t("status.credits")}
              </span>
            )}
            {duration != null && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {duration}s
              </span>
            )}
          </div>
          {children}
        </CardContent>
      </Card>
    );
  }

  if (status === "failed") {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-destructive font-medium">{t("status.failed")}</p>
          </div>
          {error && <p className="text-sm text-muted-foreground mb-4">{error}</p>}
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("actions.retry")}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Loading states
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm font-medium">
            {status === "in_queue" ? t("status.inQueue") :
             status === "running" ? t("status.generating") :
             t("status.preparing")}
          </p>
        </div>
        {thumbnailUrl && (
          <img src={thumbnailUrl} alt="Preview" className="w-full rounded-lg max-h-[200px] object-cover mb-3" />
        )}
        <Progress value={progress} className="h-2 mb-2" />
        <p className="text-xs text-muted-foreground text-right">{Math.round(progress)}%</p>
      </CardContent>
    </Card>
  );
};
