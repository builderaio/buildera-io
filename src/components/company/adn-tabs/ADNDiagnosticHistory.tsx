import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { 
  History, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  RefreshCw,
  Calendar,
  Target,
  Lightbulb,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DiagnosticEntry {
  id: string;
  company_id: string;
  digital_footprint_summary: string | null;
  what_is_working: any;
  what_is_missing: any;
  key_risks: any;
  competitive_positioning: string | null;
  action_plan: any;
  executive_diagnosis: any;
  source_url: string | null;
  created_at: string;
}

interface ADNDiagnosticHistoryProps {
  companyId: string;
}

export const ADNDiagnosticHistory = ({ companyId }: ADNDiagnosticHistoryProps) => {
  const { t } = useTranslation(['common', 'company']);
  const [diagnostics, setDiagnostics] = useState<DiagnosticEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      loadDiagnostics();
    }
  }, [companyId]);

  const loadDiagnostics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_digital_presence')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiagnostics(data || []);
    } catch (error) {
      console.error('Error loading diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderArrayOrObject = (data: any, type: 'success' | 'warning' | 'danger' | 'info' = 'info') => {
    if (!data) return null;
    
    const items = Array.isArray(data) ? data : 
                  typeof data === 'object' ? Object.values(data).flat() : [data];
    
    if (items.length === 0) return null;

    const colorMap = {
      success: 'bg-green-50 text-green-700 border-green-200',
      warning: 'bg-amber-50 text-amber-700 border-amber-200',
      danger: 'bg-red-50 text-red-700 border-red-200',
      info: 'bg-blue-50 text-blue-700 border-blue-200'
    };

    return (
      <div className="space-y-1.5">
        {items.map((item: any, idx: number) => (
          <div 
            key={idx} 
            className={`text-xs px-3 py-2 rounded-md border ${colorMap[type]}`}
          >
            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (diagnostics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p>{t('common:adn.diagnostic.noHistory', 'No hay historial de diagnósticos')}</p>
        <p className="text-sm mt-2">{t('common:adn.diagnostic.noHistoryDesc', 'Los diagnósticos de presencia digital aparecerán aquí')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <History className="w-4 h-4" />
          {t('common:adn.diagnostic.historyTitle', 'Historial de Diagnósticos')}
          <Badge variant="secondary" className="text-xs">{diagnostics.length}</Badge>
        </h3>
        <Button variant="ghost" size="sm" onClick={loadDiagnostics}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <Accordion type="single" collapsible value={expandedId || undefined} onValueChange={(v) => setExpandedId(v)}>
          {diagnostics.map((diagnostic, index) => (
            <AccordionItem key={diagnostic.id} value={diagnostic.id} className="border rounded-lg mb-3 bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full text-left">
                  <div className="flex flex-col items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-semibold text-primary mt-0.5">
                      #{diagnostics.length - index}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {format(new Date(diagnostic.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(diagnostic.created_at), "HH:mm", { locale: es })} hrs
                    </p>
                    {diagnostic.digital_footprint_summary && (
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-[300px]">
                        {diagnostic.digital_footprint_summary.slice(0, 80)}...
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  {/* Digital Footprint Summary */}
                  {diagnostic.digital_footprint_summary && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {t('common:adn.diagnostic.footprintSummary', 'Resumen de Huella Digital')}
                      </p>
                      <p className="text-sm bg-muted/50 p-3 rounded-md">
                        {diagnostic.digital_footprint_summary}
                      </p>
                    </div>
                  )}

                  {/* Competitive Positioning */}
                  {diagnostic.competitive_positioning && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {t('common:adn.diagnostic.competitivePositioning', 'Posicionamiento Competitivo')}
                      </p>
                      <p className="text-sm bg-muted/50 p-3 rounded-md">
                        {diagnostic.competitive_positioning}
                      </p>
                    </div>
                  )}

                  {/* What's Working */}
                  {diagnostic.what_is_working && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        {t('common:adn.diagnostic.whatIsWorking', 'Lo que Funciona')}
                      </p>
                      {renderArrayOrObject(diagnostic.what_is_working, 'success')}
                    </div>
                  )}

                  {/* What's Missing */}
                  {diagnostic.what_is_missing && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium flex items-center gap-1 text-amber-600">
                        <XCircle className="w-3 h-3" />
                        {t('common:adn.diagnostic.whatIsMissing', 'Lo que Falta')}
                      </p>
                      {renderArrayOrObject(diagnostic.what_is_missing, 'warning')}
                    </div>
                  )}

                  {/* Key Risks */}
                  {diagnostic.key_risks && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        {t('common:adn.diagnostic.keyRisks', 'Riesgos Clave')}
                      </p>
                      {renderArrayOrObject(diagnostic.key_risks, 'danger')}
                    </div>
                  )}

                  {/* Action Plan */}
                  {diagnostic.action_plan && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium flex items-center gap-1 text-blue-600">
                        <Lightbulb className="w-3 h-3" />
                        {t('common:adn.diagnostic.actionPlan', 'Plan de Acción')}
                      </p>
                      {renderArrayOrObject(diagnostic.action_plan, 'info')}
                    </div>
                  )}

                  {/* Executive Diagnosis */}
                  {diagnostic.executive_diagnosis && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium flex items-center gap-1 text-purple-600">
                        <Shield className="w-3 h-3" />
                        {t('common:adn.diagnostic.executiveDiagnosis', 'Diagnóstico Ejecutivo')}
                      </p>
                      <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                        {typeof diagnostic.executive_diagnosis === 'object' ? (
                          <pre className="text-xs text-purple-700 whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(diagnostic.executive_diagnosis, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-sm text-purple-700">{String(diagnostic.executive_diagnosis)}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
};
