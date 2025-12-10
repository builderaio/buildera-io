import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock, ArrowRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SandboxResult {
  success: boolean;
  input: Record<string, any>;
  output: Record<string, any>;
  mappings: Array<{
    source_path: string;
    target_key: string;
    category: string;
    value: any;
  }>;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
  timing: {
    total_ms: number;
    webhook_ms?: number;
    mapping_ms?: number;
  };
  error?: string;
}

interface SandboxResultsViewerProps {
  result: SandboxResult | null;
  isLoading: boolean;
}

export const SandboxResultsViewer = ({ result, isLoading }: SandboxResultsViewerProps) => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (content: any, tab: string) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(content, null, 2));
      setCopiedTab(tab);
      setTimeout(() => setCopiedTab(null), 2000);
      toast({ title: "Copiado al portapapeles" });
    } catch (err) {
      toast({ title: "Error al copiar", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Ejecutando prueba...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Ejecuta una prueba para ver los resultados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            Resultados de la Prueba
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={result.success ? "default" : "destructive"}>
              {result.success ? "Éxito" : "Error"}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {result.timing.total_ms}ms
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="output" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="mappings">Mappings</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="mt-4">
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 z-10"
                onClick={() => copyToClipboard(result.input, 'input')}
              >
                {copiedTab === 'input' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <ScrollArea className="h-[400px] rounded-md border bg-muted/30 p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {JSON.stringify(result.input, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="output" className="mt-4">
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 z-10"
                onClick={() => copyToClipboard(result.output, 'output')}
              >
                {copiedTab === 'output' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <ScrollArea className="h-[400px] rounded-md border bg-muted/30 p-4">
                {result.error ? (
                  <div className="text-red-500">
                    <p className="font-semibold mb-2">Error:</p>
                    <pre className="text-sm font-mono whitespace-pre-wrap">{result.error}</pre>
                  </div>
                ) : (
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {JSON.stringify(result.output, null, 2)}
                  </pre>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="mappings" className="mt-4">
            <ScrollArea className="h-[400px]">
              {result.mappings.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hay mappings configurados
                </div>
              ) : (
                <div className="space-y-2">
                  {result.mappings.map((mapping, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20"
                    >
                      <div className="flex-1">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {mapping.source_path}
                        </code>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <code className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                          {mapping.target_key}
                        </code>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {mapping.category}
                        </Badge>
                      </div>
                      <div className="flex-1 truncate">
                        <span className="text-sm text-muted-foreground">
                          {typeof mapping.value === 'object' 
                            ? JSON.stringify(mapping.value).substring(0, 50) + '...'
                            : String(mapping.value).substring(0, 50)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <ScrollArea className="h-[400px] rounded-md border bg-muted/30 p-4">
              {result.logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hay logs disponibles
                </div>
              ) : (
                <div className="space-y-1 font-mono text-sm">
                  {result.logs.map((log, index) => (
                    <div
                      key={index}
                      className={`flex gap-2 ${
                        log.level === 'error' ? 'text-red-500' :
                        log.level === 'warn' ? 'text-yellow-500' :
                        'text-muted-foreground'
                      }`}
                    >
                      <span className="text-muted-foreground/60">{log.timestamp}</span>
                      <span className="uppercase w-12">[{log.level}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
