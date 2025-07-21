import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Play, BarChart3, Target, Zap, Clock, TrendingUp, Award, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChallengeResult {
  id: string;
  modelId: string;
  modelName: string;
  provider: string;
  functionName: string;
  prompt: string;
  response: string;
  score: number;
  latency: number;
  cost: number;
  timestamp: string;
  metrics: {
    relevancy: number;
    accuracy: number;
    creativity: number;
    coherence: number;
  };
}

interface BusinessFunction {
  id: string;
  function_name: string;
  display_name: string;
  description: string;
  models: Array<{
    id: string;
    model_name: string;
    display_name: string;
    provider_name: string;
  }>;
}

interface TestScenario {
  function_name: string;
  name: string;
  description: string;
  test_prompts: string[];
  evaluation_criteria: string[];
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    function_name: 'era-chat',
    name: 'Era Chat',
    description: 'Evaluación de capacidades conversacionales',
    test_prompts: [
      'Explica cómo mejorar la estrategia de marketing digital para una startup',
      'Analiza las tendencias del mercado tecnológico para 2024',
      'Proporciona consejos para optimizar la productividad empresarial'
    ],
    evaluation_criteria: ['Claridad', 'Relevancia', 'Profundidad', 'Practicidad']
  },
  {
    function_name: 'era-content-optimizer',
    name: 'Optimizador de Contenido',
    description: 'Evaluación de optimización de textos',
    test_prompts: [
      'Optimiza este texto corporativo: "Nuestra empresa hace software"',
      'Mejora la propuesta de valor: "Vendemos productos buenos y baratos"',
      'Reescribe este mensaje promocional: "Compra ahora nuestro producto"'
    ],
    evaluation_criteria: ['Mejora del texto', 'Persuasión', 'Claridad', 'Profesionalismo']
  },
  {
    function_name: 'generate-company-content',
    name: 'Generador de Contenido',
    description: 'Evaluación de generación de contenido empresarial',
    test_prompts: [
      'Genera una misión para una fintech que democratiza las inversiones',
      'Crea una visión para una empresa de energías renovables',
      'Desarrolla una propuesta de valor para un SaaS de gestión de proyectos'
    ],
    evaluation_criteria: ['Inspiración', 'Claridad', 'Viabilidad', 'Diferenciación']
  }
];

const ChampionChallenge = () => {
  const [businessFunctions, setBusinessFunctions] = useState<BusinessFunction[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ChallengeResult[]>([]);
  const [currentChampion, setCurrentChampion] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinessFunctions();
  }, []);

  const loadBusinessFunctions = async () => {
    setLoading(true);
    try {
      const { data: functions, error: functionsError } = await supabase
        .from('business_function_configurations')
        .select(`
          id,
          function_name,
          display_name,
          description,
          is_active
        `)
        .eq('is_active', true);

      if (functionsError) throw functionsError;

      const functionsWithModels: BusinessFunction[] = [];

      for (const func of functions || []) {
        // Get assigned models for this function
        const { data: assignments, error: assignmentsError } = await supabase
          .from('function_model_assignments')
          .select(`
            id,
            model_id,
            ai_provider_models!inner(
              id,
              model_name,
              display_name,
              ai_providers!inner(name)
            )
          `)
          .eq('function_config_id', func.id)
          .eq('is_active', true);

        if (assignmentsError) {
          console.error('Error loading assignments for function', func.function_name, assignmentsError);
          continue;
        }

        const models = assignments?.map(assignment => ({
          id: assignment.ai_provider_models.id,
          model_name: assignment.ai_provider_models.model_name,
          display_name: assignment.ai_provider_models.display_name,
          provider_name: assignment.ai_provider_models.ai_providers.name
        })) || [];

        if (models.length > 1) { // Only include functions with multiple models for comparison
          functionsWithModels.push({
            id: func.id,
            function_name: func.function_name,
            display_name: func.display_name,
            description: func.description || 'Función de negocio configurada',
            models
          });
        }
      }

      setBusinessFunctions(functionsWithModels);
      
      if (functionsWithModels.length === 0) {
        toast.info('No hay funciones con múltiples modelos configurados para competir');
      }
    } catch (error) {
      console.error('Error loading business functions:', error);
      toast.error('Error cargando funciones de negocio');
    } finally {
      setLoading(false);
    }
  };

  const runChallenge = async (functionName: string) => {
    const selectedFunc = businessFunctions.find(f => f.function_name === functionName);
    if (!selectedFunc || selectedFunc.models.length < 2) {
      toast.error('Se necesitan al menos 2 modelos para ejecutar el challenge');
      return;
    }

    setRunning(true);
    setProgress(0);
    
    try {
      const scenario = TEST_SCENARIOS.find(s => s.function_name === functionName);
      if (!scenario) {
        toast.error('Escenario de prueba no encontrado para esta función');
        return;
      }

      toast.info('Ejecutando challenge real con modelos configurados...');

      // Call the edge function to run the real challenge
      const { data, error } = await supabase.functions.invoke('run-champion-challenge', {
        body: {
          functionName: functionName,
          testPrompts: scenario.test_prompts,
          modelIds: selectedFunc.models.map(m => m.id)
        }
      });

      if (error) throw error;

      const challengeResults: ChallengeResult[] = data.results.map((result: any) => ({
        id: `${Date.now()}-${Math.random()}`,
        modelId: result.modelId,
        modelName: result.modelName,
        provider: result.provider,
        functionName: functionName,
        prompt: result.prompt,
        response: result.response,
        score: result.score,
        latency: result.latency,
        cost: result.cost,
        timestamp: new Date().toISOString(),
        metrics: result.metrics
      }));

      // Calculate the champion (model with best average score)
      const modelScores = selectedFunc.models.map(model => {
        const modelResults = challengeResults.filter(r => r.modelId === model.id);
        const avgScore = modelResults.length > 0 
          ? modelResults.reduce((sum, r) => sum + r.score, 0) / modelResults.length 
          : 0;
        return { model: model.model_name, score: avgScore };
      });

      const champion = modelScores.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      setCurrentChampion(prev => ({ ...prev, [functionName]: champion.model }));
      setResults(challengeResults);
      
      toast.success(`Challenge completado. Campeón: ${champion.model} con ${champion.score.toFixed(1)} puntos`);
    } catch (error) {
      console.error('Error running challenge:', error);
      toast.error('Error ejecutando el challenge: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setRunning(false);
      setProgress(0);
    }
  };

  const getModelResults = (functionName: string, modelId: string) => {
    return results.filter(r => r.functionName === functionName && r.modelId === modelId);
  };

  const getAverageScore = (functionName: string, modelId: string) => {
    const modelResults = getModelResults(functionName, modelId);
    if (modelResults.length === 0) return 0;
    return modelResults.reduce((sum, r) => sum + r.score, 0) / modelResults.length;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Cargando configuración...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Champion Challenge IA
          </h2>
          <p className="text-muted-foreground">
            Evaluación y comparación de modelos por función de negocio
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Ejecutar Challenge
          </CardTitle>
          <CardDescription>
            Selecciona una función para evaluar todos los modelos disponibles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Función de Negocio</label>
              <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una función" />
                </SelectTrigger>
                <SelectContent>
                  {businessFunctions.map(func => (
                    <SelectItem key={func.function_name} value={func.function_name}>
                      <div className="flex flex-col">
                        <span className="font-medium">{func.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {func.description} • {func.models.length} modelos
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={() => runChallenge(selectedFunction)}
                disabled={!selectedFunction || running || businessFunctions.length === 0}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {running ? 'Ejecutando Challenge...' : 'Iniciar Challenge Real'}
              </Button>
            </div>
          </div>

          {running && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progreso del Challenge</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {businessFunctions.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay funciones configuradas para competir</h3>
                <p className="text-muted-foreground mb-4">
                  Configure al menos 2 modelos por función de negocio para poder ejecutar challenges
                </p>
                <Button onClick={loadBusinessFunctions} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="detailed">
              <BarChart3 className="h-4 w-4 mr-2" />
              Resultados Detallados
            </TabsTrigger>
            <TabsTrigger value="champion">
              <Award className="h-4 w-4 mr-2" />
              Campeones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Modelos</CardTitle>
                <CardDescription>
                  Clasificación por función basada en el score promedio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {businessFunctions.map(func => {
                  const functionResults = results.filter(r => r.functionName === func.function_name);
                  if (functionResults.length === 0) return null;

                  const modelRanking = func.models.map(model => ({
                    ...model,
                    avgScore: getAverageScore(func.function_name, model.id),
                    avgLatency: getModelResults(func.function_name, model.id)
                      .reduce((sum, r) => sum + r.latency, 0) / getModelResults(func.function_name, model.id).length || 0
                  })).sort((a, b) => b.avgScore - a.avgScore);

                  return (
                    <div key={func.function_name} className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Badge variant="outline">{func.display_name}</Badge>
                        {currentChampion[func.function_name] && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Trophy className="h-3 w-3 mr-1" />
                            Campeón: {currentChampion[func.function_name]}
                          </Badge>
                        )}
                      </h3>
                      
                      <div className="space-y-2">
                        {modelRanking.map((model, index) => (
                          <div key={model.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold">
                                #{index + 1}
                              </div>
                              <div>
                                <div className="font-medium">{model.display_name}</div>
                                <div className="text-sm text-muted-foreground">{model.provider_name}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className={`text-sm font-medium ${getScoreColor(model.avgScore)}`}>
                                  {model.avgScore.toFixed(1)}
                                </div>
                                <div className="text-xs text-muted-foreground">Score</div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm">{model.avgLatency.toFixed(0)}ms</div>
                                <div className="text-xs text-muted-foreground">Latencia</div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm">$0.002</div>
                                <div className="text-xs text-muted-foreground">Est. Costo</div>
                              </div>
                              
                              {index === 0 && (
                                <Trophy className="h-5 w-5 text-yellow-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed">
            <Card>
              <CardHeader>
                <CardTitle>Análisis Detallado</CardTitle>
                <CardDescription>
                  Métricas específicas por modelo y prompt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.slice(0, 10).map((result, index) => (
                    <div key={result.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{result.modelName}</Badge>
                          <Badge variant="secondary">{businessFunctions.find(f => f.function_name === result.functionName)?.display_name}</Badge>
                        </div>
                        <div className={`text-lg font-bold ${getScoreColor(result.score)}`}>
                          {result.score.toFixed(1)}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-3">
                        Prompt: {result.prompt}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Relevancia</div>
                          <div className={getScoreColor(result.metrics.relevancy)}>
                            {result.metrics.relevancy.toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Precisión</div>
                          <div className={getScoreColor(result.metrics.accuracy)}>
                            {result.metrics.accuracy.toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Creatividad</div>
                          <div className={getScoreColor(result.metrics.creativity)}>
                            {result.metrics.creativity.toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Coherencia</div>
                          <div className={getScoreColor(result.metrics.coherence)}>
                            {result.metrics.coherence.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {result.latency}ms
                        </span>
                        <span>${result.cost.toFixed(4)}</span>
                        <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="champion">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Modelos Campeones
                </CardTitle>
                <CardDescription>
                  Los mejores modelos para cada función de negocio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {Object.entries(currentChampion).map(([functionName, championModel]) => {
                    const scenario = TEST_SCENARIOS.find(s => s.function_name === functionName);
                    const championResults = getModelResults(functionName, championModel);
                    const avgScore = getAverageScore(functionName, championModel);
                    
                    return (
                      <div key={functionName} className="border rounded-lg p-6 bg-gradient-to-r from-yellow-50 to-orange-50">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{scenario?.name}</h3>
                            <p className="text-muted-foreground">{scenario?.description}</p>
                          </div>
                          <Trophy className="h-8 w-8 text-yellow-500" />
                        </div>
                        
                        <div className="flex items-center gap-4 mb-4">
                          <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">
                            🏆 {championModel}
                          </Badge>
                          <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                            {avgScore.toFixed(1)} puntos
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          Basado en {championResults.length} pruebas realizadas
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ChampionChallenge;