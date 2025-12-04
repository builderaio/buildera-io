import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Zap, Star, Play, Clock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { PlatformAgent } from "@/hooks/usePlatformAgents";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AgentInteractionPanelProps {
  agent: PlatformAgent | null;
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  creditsAvailable: number;
  companyId?: string;
  userId?: string;
  onExecutionComplete?: () => void;
}

interface ExecutionHistory {
  id: string;
  created_at: string;
  status: string;
  credits_consumed: number;
  output_summary?: string;
}

const categoryColors: Record<string, string> = {
  strategy: "from-blue-500 to-indigo-600",
  content: "from-purple-500 to-pink-500",
  analytics: "from-emerald-500 to-teal-500",
  branding: "from-amber-500 to-orange-500",
  assistant: "from-cyan-500 to-blue-500",
  publishing: "from-green-500 to-emerald-500",
};

const categoryIcons: Record<string, string> = {
  strategy: "🧠",
  content: "🎨",
  analytics: "📊",
  branding: "✨",
  assistant: "💬",
  publishing: "📤",
};

export const AgentInteractionPanel = ({
  agent,
  isOpen,
  onClose,
  isEnabled,
  creditsAvailable,
  companyId,
  userId,
  onExecutionComplete
}: AgentInteractionPanelProps) => {
  const { t } = useTranslation(['common']);
  const { toast } = useToast();
  const [executing, setExecuting] = useState(false);
  const [recentExecutions, setRecentExecutions] = useState<ExecutionHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadExecutionHistory = async () => {
    if (!agent || !userId) return;
    
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('agent_usage_log')
        .select('id, created_at, status, credits_consumed, output_summary')
        .eq('agent_id', agent.id)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentExecutions(data || []);
    } catch (error) {
      console.error('Error loading execution history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleExecute = async () => {
    if (!agent || !userId || !companyId) {
      toast({
        title: t('common:error', 'Error'),
        description: t('common:missingData', 'Faltan datos necesarios'),
        variant: "destructive"
      });
      return;
    }

    if (creditsAvailable < agent.credits_per_use) {
      toast({
        title: t('common:insufficientCredits', 'Créditos insuficientes'),
        description: t('common:needMoreCredits', 'Necesitas más créditos para ejecutar este agente'),
        variant: "destructive"
      });
      return;
    }

    setExecuting(true);
    try {
      // Log the execution start
      const { data: logEntry, error: logError } = await supabase
        .from('agent_usage_log')
        .insert({
          agent_id: agent.id,
          user_id: userId,
          company_id: companyId,
          credits_consumed: agent.credits_per_use,
          status: 'running',
          input_data: { triggered_at: new Date().toISOString() }
        })
        .select()
        .single();

      if (logError) throw logError;

      // Execute the edge function
      const { data, error } = await supabase.functions.invoke(agent.edge_function_name, {
        body: {
          companyId,
          userId,
          agentId: agent.id,
          logId: logEntry.id
        }
      });

      if (error) throw error;

      // Update log entry with success
      await supabase
        .from('agent_usage_log')
        .update({
          status: 'completed',
          output_data: data,
          output_summary: data?.summary || 'Ejecución completada exitosamente'
        })
        .eq('id', logEntry.id);

      toast({
        title: t('common:success', 'Éxito'),
        description: `${agent.name} ${t('common:executedSuccessfully', 'ejecutado correctamente')}`
      });

      onExecutionComplete?.();
      loadExecutionHistory();
    } catch (error) {
      console.error('Error executing agent:', error);
      toast({
        title: t('common:error', 'Error'),
        description: t('common:executionFailed', 'No se pudo ejecutar el agente'),
        variant: "destructive"
      });
    } finally {
      setExecuting(false);
    }
  };

  if (!agent) return null;

  const categoryColor = categoryColors[agent.category] || "from-gray-500 to-gray-600";
  const categoryIcon = categoryIcons[agent.category] || "🤖";
  const hasEnoughCredits = creditsAvailable >= agent.credits_per_use;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${categoryColor} flex items-center justify-center text-white text-2xl shadow-lg`}>
              {categoryIcon}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                {agent.name}
                {agent.is_premium && (
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                )}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {agent.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Cost and Credits */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span className="font-medium">{t('common:cost', 'Costo')}:</span>
                  <Badge variant="secondary" className="text-lg">
                    {agent.credits_per_use} {t('common:credits', 'créditos')}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('common:available', 'Disponible')}</p>
                  <p className={`text-lg font-bold ${hasEnoughCredits ? 'text-emerald-600' : 'text-red-500'}`}>
                    {creditsAvailable} cr
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Execute Button */}
          {isEnabled ? (
            <Button 
              className="w-full h-12 text-lg"
              onClick={handleExecute}
              disabled={executing || !hasEnoughCredits}
            >
              {executing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('common:executing', 'Ejecutando...')}
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  {t('common:executeAgent', 'Ejecutar Agente')}
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {t('common:agentNotEnabled', 'Este agente no está habilitado para tu empresa')}
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => {/* Navigate to marketplace */}}>
                <ArrowRight className="w-4 h-4 mr-2" />
                {t('common:viewInMarketplace', 'Ver en Marketplace')}
              </Button>
            </div>
          )}

          {!hasEnoughCredits && isEnabled && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700 dark:text-red-400">
                {t('common:insufficientCreditsMessage', 'No tienes créditos suficientes para ejecutar este agente')}
              </p>
            </div>
          )}

          <Separator />

          {/* Recent Executions */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('common:recentExecutions', 'Ejecuciones Recientes')}
            </h4>
            
            {loadingHistory ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentExecutions.length > 0 ? (
              <div className="space-y-2">
                {recentExecutions.map((exec) => (
                  <div 
                    key={exec.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      {exec.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : exec.status === 'failed' ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      <span className="text-sm truncate max-w-[200px]">
                        {exec.output_summary || exec.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(exec.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('common:noExecutionsYet', 'Aún no has ejecutado este agente')}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentInteractionPanel;
