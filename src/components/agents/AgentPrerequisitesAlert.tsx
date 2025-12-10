import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Loader2, Sparkles, Download } from "lucide-react";
import { PrerequisiteStatus, AlternativeAction } from "@/hooks/useAgentPrerequisites";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SocialDataImportDialog } from "./SocialDataImportDialog";

interface AgentPrerequisitesAlertProps {
  status: PrerequisiteStatus;
  companyId?: string;
  userId?: string;
  onClose?: () => void;
  onRefresh?: () => void;
}

const typeToGenerator: Record<string, { function: string; label: string }> = {
  strategy: { function: 'company-strategy', label: 'estrategia' },
  branding: { function: 'brand-identity', label: 'identidad de marca' },
  audiences: { function: 'ai-audience-generator', label: 'audiencias' }
};

export const AgentPrerequisitesAlert = ({ 
  status, 
  companyId,
  userId,
  onClose,
  onRefresh 
}: AgentPrerequisitesAlertProps) => {
  const { t, i18n } = useTranslation(['common']);
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleGenerate = async (type: string) => {
    const generator = typeToGenerator[type];
    if (!generator || !companyId) return;

    setGenerating(type);
    try {
      const { error } = await supabase.functions.invoke(generator.function, {
        body: { companyId, language: i18n.language }
      });

      if (error) throw error;

      toast({
        title: t('common:success', 'Éxito'),
        description: `${generator.label.charAt(0).toUpperCase() + generator.label.slice(1)} generada correctamente`
      });

      onRefresh?.();
    } catch (error) {
      console.error('Error generating:', error);
      toast({
        title: t('common:error', 'Error'),
        description: `No se pudo generar la ${generator.label}`,
        variant: "destructive"
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleAlternativeAction = (action: AlternativeAction) => {
    if (action.type === 'scrape') {
      setShowImportDialog(true);
    }
    // Other action types can be handled here
  };

  if (status.loading) {
    return (
      <div className="flex items-center gap-2 p-3 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">{t('common:checkingPrerequisites', 'Verificando prerequisitos...')}</span>
      </div>
    );
  }

  // Show completed items with social data status
  if (status.canExecute && status.warnings.length === 0) {
    return (
      <div className="space-y-2">
        {status.completedItems && status.completedItems.length > 0 && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg space-y-1">
            {status.completedItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">
                  {item.message}
                  {item.details && <span className="text-muted-foreground ml-1">({item.details})</span>}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 p-3 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">{t('common:readyToExecute', 'Listo para ejecutar')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Import Dialog */}
      {userId && companyId && (
        <SocialDataImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          userId={userId}
          companyId={companyId}
          onSuccess={onRefresh}
        />
      )}

      {/* Completed items */}
      {status.completedItems && status.completedItems.length > 0 && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg space-y-1">
          {status.completedItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">
                {item.message}
                {item.details && <span className="text-muted-foreground ml-1">({item.details})</span>}
              </span>
            </div>
          ))}
        </div>
      )}

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
                  <div className="flex gap-1">
                    {/* Alternative action (e.g., import social data) */}
                    {blocker.alternativeAction && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAlternativeAction(blocker.alternativeAction!)}
                        className="shrink-0 border-destructive/50 hover:bg-destructive/20"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        {blocker.alternativeAction.label}
                      </Button>
                    )}
                    {/* AI Generation action */}
                    {typeToGenerator[blocker.type] && companyId && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleGenerate(blocker.type)}
                        disabled={generating === blocker.type}
                        className="shrink-0 border-destructive/50 hover:bg-destructive/20"
                      >
                        {generating === blocker.type ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-1" />
                            Generar IA
                          </>
                        )}
                      </Button>
                    )}
                    {/* Navigate action */}
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
                  </div>
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
                  <div className="flex gap-1">
                    {/* Alternative action */}
                    {warning.alternativeAction && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleAlternativeAction(warning.alternativeAction!)}
                        className="shrink-0 text-amber-700 hover:text-amber-900 hover:bg-amber-200/50"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        {warning.alternativeAction.label}
                      </Button>
                    )}
                    {typeToGenerator[warning.type] && companyId && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleGenerate(warning.type)}
                        disabled={generating === warning.type}
                        className="shrink-0 text-amber-700 hover:text-amber-900 hover:bg-amber-200/50"
                      >
                        {generating === warning.type ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-1" />
                            Generar
                          </>
                        )}
                      </Button>
                    )}
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
                  </div>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
