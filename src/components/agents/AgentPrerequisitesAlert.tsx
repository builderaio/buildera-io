import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { PrerequisiteStatus } from "@/hooks/useAgentPrerequisites";
import { useTranslation } from "react-i18next";

interface AgentPrerequisitesAlertProps {
  status: PrerequisiteStatus;
  onClose?: () => void;
}

export const AgentPrerequisitesAlert = ({ status, onClose }: AgentPrerequisitesAlertProps) => {
  const { t } = useTranslation(['common']);

  if (status.loading) {
    return (
      <div className="flex items-center gap-2 p-3 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">{t('common:checkingPrerequisites', 'Verificando prerequisitos...')}</span>
      </div>
    );
  }

  if (status.canExecute && status.warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm font-medium">{t('common:readyToExecute', 'Listo para ejecutar')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Blockers - Required prerequisites not met */}
      {status.blockers.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>{t('common:missingPrerequisites', 'Prerequisitos faltantes')}</AlertTitle>
          <AlertDescription>
            <p className="mb-3 text-sm">
              {t('common:completeBeforeExecuting', 'Completa estos pasos antes de ejecutar el agente:')}
            </p>
            <ul className="space-y-2">
              {status.blockers.map((blocker, idx) => (
                <li key={idx} className="flex items-center justify-between gap-2 p-2 bg-destructive/10 rounded">
                  <span className="text-sm">{blocker.message}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                    className="shrink-0 border-destructive/50 hover:bg-destructive/20"
                    onClick={onClose}
                  >
                    <Link to={blocker.actionUrl}>
                      {t('common:complete', 'Completar')}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings - Recommended but not required */}
      {status.warnings.length > 0 && (
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            {t('common:recommendations', 'Recomendaciones')}
          </AlertTitle>
          <AlertDescription>
            <p className="mb-2 text-sm text-amber-700 dark:text-amber-300">
              {t('common:betterResultsWith', 'Obtendrás mejores resultados si:')}
            </p>
            <ul className="space-y-2">
              {status.warnings.map((warning, idx) => (
                <li key={idx} className="flex items-center justify-between gap-2 p-2 bg-amber-100/50 dark:bg-amber-900/30 rounded">
                  <span className="text-sm text-amber-800 dark:text-amber-200">{warning.message}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    asChild
                    className="shrink-0 text-amber-700 hover:text-amber-900 hover:bg-amber-200/50"
                    onClick={onClose}
                  >
                    <Link to={warning.actionUrl}>
                      {t('common:configure', 'Configurar')}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
