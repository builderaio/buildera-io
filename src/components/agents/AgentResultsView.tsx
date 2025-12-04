import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2, 
  Download,
  Copy,
  ChevronDown,
  ChevronRight,
  Zap,
  BarChart3,
  FileText
} from "lucide-react";
import { ExecutionResult } from "@/hooks/useAgentConfiguration";
import { useToast } from "@/hooks/use-toast";

interface AgentResultsViewProps {
  results: ExecutionResult[];
  latestResult?: ExecutionResult | null;
  agentName: string;
  loading?: boolean;
}

export const AgentResultsView = ({
  results,
  latestResult,
  agentName,
  loading = false
}: AgentResultsViewProps) => {
  const { t } = useTranslation(['common']);
  const { toast } = useToast();
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (data: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast({
        title: "Copiado",
        description: "Resultado copiado al portapapeles",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el resultado",
        variant: "destructive",
      });
    }
  };

  const downloadResult = (result: ExecutionResult) => {
    const dataStr = JSON.stringify(result.output_data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agentName.toLowerCase().replace(/\s+/g, '-')}-${new Date(result.created_at).toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Completado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Ejecutando</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const renderResultContent = (result: ExecutionResult) => {
    if (!result.output_data) {
      return (
        <p className="text-sm text-muted-foreground text-center py-4">
          Sin datos de salida
        </p>
      );
    }

    // Try to render structured content
    const data = result.output_data;

    // Handle common output structures
    if (data.content) {
      return (
        <div className="space-y-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {typeof data.content === 'string' ? (
              <p className="whitespace-pre-wrap">{data.content}</p>
            ) : (
              <pre className="text-xs overflow-auto p-2 bg-muted rounded">
                {JSON.stringify(data.content, null, 2)}
              </pre>
            )}
          </div>
        </div>
      );
    }

    if (data.insights && Array.isArray(data.insights)) {
      return (
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Insights Generados
          </h4>
          {data.insights.map((insight: any, idx: number) => (
            <Card key={idx} className="bg-muted/50">
              <CardContent className="p-3">
                <p className="text-sm">{insight.title || insight.text || JSON.stringify(insight)}</p>
                {insight.description && (
                  <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (data.posts && Array.isArray(data.posts)) {
      return (
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Contenido Generado ({data.posts.length} posts)
          </h4>
          {data.posts.map((post: any, idx: number) => (
            <Card key={idx} className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{post.platform || 'General'}</Badge>
                  {post.date && (
                    <span className="text-xs text-muted-foreground">{post.date}</span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{post.content || post.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Fallback to JSON view
    return (
      <pre className="text-xs overflow-auto p-3 bg-muted rounded-lg max-h-60">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Latest Result Highlight */}
      {latestResult && latestResult.status === 'completed' && (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Último Resultado
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(latestResult.output_data)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadResult(latestResult)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <CardDescription className="flex items-center gap-4">
              <span>{new Date(latestResult.created_at).toLocaleString()}</span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {latestResult.credits_consumed} créditos
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(latestResult.execution_time_ms)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestResult.output_summary && (
              <p className="text-sm mb-4 p-2 bg-background rounded">
                {latestResult.output_summary}
              </p>
            )}
            {renderResultContent(latestResult)}
          </CardContent>
        </Card>
      )}

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Ejecuciones</CardTitle>
          <CardDescription>
            {results.length} ejecución{results.length !== 1 ? 'es' : ''} registrada{results.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Aún no has ejecutado este agente
            </p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {results.map((result) => {
                  const isExpanded = expandedResults.has(result.id);
                  return (
                    <div 
                      key={result.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <button
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                        onClick={() => toggleExpand(result.id)}
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <div className="text-left">
                            <p className="text-sm font-medium">
                              {result.output_summary || `Ejecución ${result.status}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(result.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(result.status)}
                          <Badge variant="outline" className="font-mono">
                            {result.credits_consumed} cr
                          </Badge>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="p-3 pt-0 border-t bg-muted/30">
                          <Tabs defaultValue="output" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="output">Resultado</TabsTrigger>
                              <TabsTrigger value="details">Detalles</TabsTrigger>
                            </TabsList>
                            <TabsContent value="output" className="mt-3">
                              {result.status === 'failed' ? (
                                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                                  <p className="text-sm text-red-700 dark:text-red-400">
                                    {result.error_message || 'Error desconocido'}
                                  </p>
                                </div>
                              ) : (
                                renderResultContent(result)
                              )}
                            </TabsContent>
                            <TabsContent value="details" className="mt-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Duración</p>
                                  <p className="font-medium">{formatDuration(result.execution_time_ms)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Créditos</p>
                                  <p className="font-medium">{result.credits_consumed}</p>
                                </div>
                                {result.input_data && (
                                  <div className="col-span-2">
                                    <p className="text-muted-foreground mb-1">Configuración usada</p>
                                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                      {JSON.stringify(result.input_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </TabsContent>
                          </Tabs>
                          <div className="flex justify-end gap-2 mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(result.output_data)}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copiar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadResult(result)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Descargar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentResultsView;
