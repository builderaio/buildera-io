import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Download, Sparkles, Target, Users, TrendingUp, FileText, AlertTriangle, CheckCircle, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { generateStrategy, loadExistingStrategy } from '@/utils/strategyGenerator';
import { normalizeStrategy } from '@/utils/strategyNormalizer';
import type { MarketingStrategy } from '@/types/strategy';
import { StrategyGenerationLoader } from '@/components/ui/strategy-generation-loader';
import { EditableStrategySection } from './EditableStrategySection';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface MarketingStrategyProps {
  campaignData: any;
  onComplete: (data: any) => void;
  loading?: boolean;
}

export function MarketingStrategy({ campaignData, onComplete, loading }: MarketingStrategyProps) {
  const [strategy, setStrategy] = useState<MarketingStrategy | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<any>({});
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  
  // Detectar si estamos en desarrollo
  const isDevelopment = import.meta.env.DEV;

  // Load existing strategy on mount
  useEffect(() => {
    if (!strategy && !generating && campaignData) {
      // Normalize audiences - prioritize audience.selected_audience from step 2
      const audiences = campaignData.audience?.selected_audience
        ? [campaignData.audience.selected_audience]
        : Array.isArray(campaignData.audiences)
          ? campaignData.audiences
          : (campaignData.audiences ?? null)
            ? [campaignData.audiences]
            : campaignData.audience
              ? [campaignData.audience]
              : [];

      loadExisting({ ...campaignData, audiences });
    }
  }, []);

  const loadExisting = async (normalizedCampaignData?: any) => {
    try {
      const existing = await loadExistingStrategy(normalizedCampaignData || campaignData);
      if (existing) {
        setStrategy(existing);
      }
    } catch (error) {
      console.error('Error loading existing strategy:', error);
    }
  };

  const handleGenerateStrategy = async () => {
    if (!campaignData.company) {
      toast.error('Datos de empresa requeridos');
      return;
    }

    // Validación de datos críticos
    const missingFields = [];
    if (!campaignData.company.name && !campaignData.company.nombre_empresa) {
      missingFields.push('Nombre de empresa');
    }
    if (!campaignData.company.description && !campaignData.company.objetivo_de_negocio) {
      missingFields.push('Objetivo de negocio');
    }
    if (!campaignData.company.propuesta_valor && !campaignData.company.propuesta_de_valor) {
      missingFields.push('Propuesta de valor');
    }

    if (missingFields.length > 0) {
      toast.error('Faltan datos críticos', {
        description: `Completa estos campos en ADN Empresa: ${missingFields.join(', ')}`
      });
      return;
    }

    // Normalize audiences to array format - the audience comes from step 2 as campaignData.audience.selected_audience
    const audiences = campaignData.audience?.selected_audience
      ? [campaignData.audience.selected_audience]
      : Array.isArray(campaignData.audiences) 
        ? campaignData.audiences 
        : (campaignData.audiences ?? null)
          ? [campaignData.audiences] 
          : campaignData.audience
            ? [campaignData.audience]
            : [];

    if (audiences.length === 0) {
      toast.error('Debes definir al menos una audiencia objetivo');
      return;
    }

    setGenerating(true);

    try {
      // Pass normalized campaign data with audiences as array
      // Prioritize audience.selected_audience from step 2
      const normalizedCampaignData = {
        ...campaignData,
        audiences
      };
      
      const result = await generateStrategy({ campaignData: normalizedCampaignData });
      console.log('🎯 Strategy result received in component:', {
        hasResult: !!result,
        hasCoreMessage: !!result?.core_message,
        hasAiInsights: !!result?.ai_insights,
        aiInsightsType: result?.ai_insights ? typeof result.ai_insights : 'N/A',
        resultKeys: result ? Object.keys(result) : []
      });
      
      // Validar que se recibieron datos mínimos
      if (!result.core_message && !result.competitors && !result.ai_insights) {
        console.warn('⚠️ Strategy received but missing all critical fields');
        toast.error('Estrategia generada incompleta', {
          description: 'Algunos campos importantes pueden estar vacíos'
        });
      }
      
      setStrategy(result);
      
      toast.success('¡Estrategia generada con éxito!', {
        description: 'Tu estrategia de marketing está lista'
      });
    } catch (error: any) {
      console.error('❌ Error generating strategy:', error);
      
      toast.error('Error al generar estrategia', {
        description: error.message || 'Por favor intenta nuevamente'
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadStrategyPDF = async () => {
    if (!strategy) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFillColor(60, 70, 178);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('BUILDERA', 20, 25);
      doc.setFontSize(12);
      doc.text('Estrategia de Marketing', 20, 35);

      // Campaign info
      yPos = 55;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text('Estrategia de Marketing', 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.text(`Campaña: ${campaignData.name || 'Sin nombre'}`, 20, yPos);
      yPos += 7;
      doc.text(`Empresa: ${campaignData.company?.name || 'No definido'}`, 20, yPos);
      yPos += 15;

      // Core message
      if (strategy.core_message) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('MENSAJE DIFERENCIADOR', 20, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const messageLines = doc.splitTextToSize(strategy.core_message, pageWidth - 40);
        doc.text(messageLines, 20, yPos);
        yPos += messageLines.length * 5 + 10;
      }

      // Save PDF
      doc.save(`estrategia-marketing-${campaignData.name || 'buildera'}.pdf`);
      
      toast.success('PDF descargado correctamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar PDF');
    }
  };

  const handleComplete = () => {
    onComplete({
      strategy_data: strategy,
      core_message: strategy?.core_message,
      message_variants: strategy?.differentiated_message,
      full_strategy: strategy?.full_strategy_data
    });
  };

  if (generating) {
    return <StrategyGenerationLoader isVisible={true} />;
  }

  return (
    <ErrorBoundary context="MarketingStrategyStep">
      <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Estrategia de Marketing Inteligente</CardTitle>
          <p className="text-muted-foreground">
            Genera una estrategia personalizada basada en tu audiencia y objetivos
          </p>
        </CardHeader>
      </Card>

      {/* Campaign Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">Resumen de Campaña</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Nombre:</span>
              <p className="font-medium">{campaignData.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Objetivo:</span>
              <p className="font-medium">
                {typeof campaignData.objective === 'string'
                  ? campaignData.objective
                  : (campaignData.objective?.type || campaignData.objective?.name || 'No definido')}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Audiencia:</span>
              <p className="font-medium">
                {Array.isArray(campaignData.audiences)
                  ? (campaignData.audiences[0]?.name || 'No definida')
                  : (campaignData.audiences?.name || campaignData.audience?.selected_audience?.name || campaignData.audience?.name || 'No definida')}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Empresa:</span>
              <p className="font-medium">{campaignData.company?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      {!strategy && !generating && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Generar Estrategia con IA
            </h3>
            <p className="text-muted-foreground mb-6">
              Crea una estrategia completa y personalizada para tu campaña
            </p>
            <Button onClick={handleGenerateStrategy} size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generar Estrategia
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Strategy Display */}
      {strategy && !generating && (
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Button onClick={downloadStrategyPDF} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </Button>
                <Button
                  onClick={() => {
                    if (confirm('¿Regenerar estrategia?')) {
                      setStrategy(null);
                      handleGenerateStrategy();
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Regenerar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Success Banner */}
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">
                ¡Estrategia Lista! 🚀
              </CardTitle>
              <p className="text-green-600">
                Estrategia personalizada generada exitosamente
              </p>
              {strategy?.full_strategy_data?.request_id && (
                <p className="text-xs text-green-700 mt-2">Trace ID: {strategy.full_strategy_data.request_id}</p>
              )}
            </CardHeader>
          </Card>

          {/* Debug Panel (Solo en Desarrollo) */}
          {isDevelopment && (
            <Collapsible open={debugPanelOpen} onOpenChange={setDebugPanelOpen}>
              <Card className="border-orange-200 bg-orange-50/50">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-orange-100/50 transition-colors">
                    <CardTitle className="flex items-center justify-between text-orange-900">
                      <div className="flex items-center gap-2">
                        <Bug className="h-5 w-5" />
                        Panel de Debug (Desarrollo)
                      </div>
                      {debugPanelOpen ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Campos Presentes/Ausentes */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-orange-900">Estado de Campos Críticos</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {[
                            { field: 'core_message', label: 'Mensaje Principal' },
                            { field: 'differentiated_message', label: 'Variantes de Mensaje' },
                            { field: 'competitors', label: 'Competidores' },
                            { field: 'strategies', label: 'Estrategias' },
                            { field: 'ai_insights', label: 'AI Insights' },
                            { field: 'funnel_strategies', label: 'Estrategias Funnel' },
                            { field: 'content_plan', label: 'Plan de Contenido' },
                            { field: 'kpis', label: 'KPIs' },
                            { field: 'execution_plan', label: 'Plan Ejecución' }
                          ].map(({ field, label }) => {
                            const value = strategy?.[field as keyof MarketingStrategy];
                            const isPresent = Array.isArray(value) 
                              ? value.length > 0 
                              : typeof value === 'object' 
                                ? value !== null && Object.keys(value).length > 0
                                : !!value;
                            
                            return (
                              <div 
                                key={field}
                                className={`p-2 rounded border ${
                                  isPresent 
                                    ? 'bg-green-100 border-green-300 text-green-800' 
                                    : 'bg-red-100 border-red-300 text-red-800'
                                }`}
                              >
                                <div className="font-medium">{label}</div>
                                <div className="text-xs opacity-75">
                                  {isPresent ? '✓ Presente' : '✗ Ausente'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Estructura Completa */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-orange-900">Estructura Completa</h4>
                        <pre className="bg-white p-3 rounded border border-orange-200 text-xs overflow-x-auto max-h-96 overflow-y-auto">
                          {JSON.stringify(strategy, null, 2)}
                        </pre>
                      </div>

                      {/* AI Insights Detail */}
                      {strategy?.ai_insights && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 text-orange-900">
                            AI Insights (Tipo: {typeof strategy.ai_insights})
                          </h4>
                          <pre className="bg-white p-3 rounded border border-orange-200 text-xs overflow-x-auto">
                            {JSON.stringify(strategy.ai_insights, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Core Message */}
          {strategy.core_message && (
            <EditableStrategySection
              title="Mensaje Diferenciador"
              icon={<Target className="h-6 w-6 text-primary" />}
              editMode={editingSection === 'message'}
              setEditMode={(value) => {
                setEditingSection(value ? 'message' : null);
                if (value) {
                  setEditedData({
                    core_message: strategy.core_message,
                    differentiated_message: strategy.differentiated_message
                  });
                }
              }}
              onSave={() => {
                setStrategy({
                  ...strategy,
                  core_message: editedData.core_message,
                  differentiated_message: editedData.differentiated_message
                });
                toast.success('Cambios guardados');
              }}
            >
              <div className="text-center p-6 bg-white/50 rounded-xl border">
                {editingSection === 'message' ? (
                  <Textarea
                    value={editedData.core_message || ''}
                    onChange={(e) => setEditedData({ ...editedData, core_message: e.target.value })}
                    className="text-xl text-center"
                  />
                ) : (
                  <h3 className="text-2xl font-bold text-primary">
                    "{strategy.core_message}"
                  </h3>
                )}
              </div>

              {/* Platform Variants */}
              {strategy.differentiated_message && (
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {/* LinkedIn */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">LinkedIn</h4>
                    <p className="text-sm text-blue-700">
                      {strategy.differentiated_message.linkedin_variant || 'No definido'}
                    </p>
                  </div>

                  {/* TikTok */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">TikTok</h4>
                    <p className="text-sm text-purple-700">
                      {strategy.differentiated_message.tiktok_variant || 'No definido'}
                    </p>
                  </div>

                  {/* Instagram/Facebook */}
                  <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                    <h4 className="font-semibold text-pink-900 mb-2">Instagram/Facebook</h4>
                    <p className="text-sm text-pink-700">
                      {strategy.differentiated_message.instagram_facebook_variant || 'No definido'}
                    </p>
                  </div>
                </div>
              )}
            </EditableStrategySection>
          )}

          {/* AI Insights */}
          {strategy.ai_insights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6" />
                  Insights Generados por IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    console.log('🎨 [MarketingStrategy] Rendering ai_insights:', {
                      type: typeof strategy.ai_insights,
                      isArray: Array.isArray(strategy.ai_insights),
                      value: strategy.ai_insights
                    });

                    // Caso 1: Array de insights
                    if (Array.isArray(strategy.ai_insights)) {
                      if (strategy.ai_insights.length === 0) {
                        return <p className="text-sm text-muted-foreground">No hay insights disponibles</p>;
                      }
                      return strategy.ai_insights.map((insight: any, idx: number) => (
                        <div key={idx} className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
                          <h4 className="font-bold text-primary mb-2">
                            {insight.title || insight.category || insight.name || `Insight ${idx + 1}`}
                          </h4>
                          <p className="text-sm">
                            {insight.description || insight.content || insight.text || insight.value || JSON.stringify(insight)}
                          </p>
                          {insight.recommendation && (
                            <p className="text-xs text-muted-foreground mt-2">
                              💡 {insight.recommendation}
                            </p>
                          )}
                        </div>
                      ));
                    }

                    // Caso 2: Objeto con categorías
                    if (typeof strategy.ai_insights === 'object' && strategy.ai_insights !== null) {
                      const entries = Object.entries(strategy.ai_insights);
                      if (entries.length === 0) {
                        return <p className="text-sm text-muted-foreground">No hay insights disponibles</p>;
                      }
                      return entries.map(([key, value]: [string, any]) => (
                        <div key={key} className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
                          <h4 className="font-bold text-primary mb-2 capitalize">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <div className="text-sm">
                            {typeof value === 'string' ? (
                              <p>{value}</p>
                            ) : Array.isArray(value) ? (
                              <ul className="list-disc list-inside space-y-1">
                                {value.map((item: any, i: number) => (
                                  <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                                ))}
                              </ul>
                            ) : typeof value === 'object' && value !== null ? (
                              <pre className="text-xs bg-white/50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              <p>{String(value)}</p>
                            )}
                          </div>
                        </div>
                      ));
                    }

                    // Caso 3: String simple
                    if (typeof strategy.ai_insights === 'string') {
                      return <p className="text-sm">{strategy.ai_insights}</p>;
                    }

                    // Fallback
                    return <p className="text-sm text-muted-foreground">Formato de insights no reconocido</p>;
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitors */}
          {Array.isArray(strategy.competitors) && strategy.competitors.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-6 w-6" />
                  Análisis de Competidores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategy.competitors.map((comp, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border">
                      <h4 className="font-bold mb-3">{comp?.name || 'Competidor'}</h4>
                      {Array.isArray(comp?.strengths) && comp.strengths.length > 0 && (
                        <div className="mb-3">
                          <p className="font-semibold text-green-700 mb-1">✅ Fortalezas</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {comp.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(comp?.weaknesses) && comp.weaknesses.length > 0 && (
                        <div>
                          <p className="font-semibold text-red-700 mb-1">⚠️ Debilidades</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {comp.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-6 w-6" />
                  Análisis de Competidores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Sin competidores disponibles</p>
              </CardContent>
            </Card>
          )}

          {/* Funnel Strategies */}
          {strategy && typeof strategy.strategies === 'object' && !Array.isArray(strategy.strategies) && Object.keys(strategy.strategies || {}).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6" />
                  Estrategias por Etapa del Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(strategy.strategies || {}).map(([phase, details]: [string, any]) => (
                    <div key={phase} className="bg-white p-4 rounded-lg border">
                      <h4 className="font-bold capitalize mb-2">{phase}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{details?.objective || ''}</p>
                      {Array.isArray(details?.tactics) && details.tactics.length > 0 && (
                        <div>
                          <p className="font-semibold text-sm mb-2">Tácticas:</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {details.tactics.map((t: string, i: number) => <li key={i}>{t}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6" />
                  Estrategias por Etapa del Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Sin estrategias disponibles</p>
              </CardContent>
            </Card>
          )}

          {/* Continue Button */}
          <div className="flex justify-end">
            <Button onClick={handleComplete} size="lg" className="gap-2">
              Continuar
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}
