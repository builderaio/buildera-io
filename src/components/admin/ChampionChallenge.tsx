import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Play, BarChart3, Target, Zap, Clock, TrendingUp, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChallengeResult {
  id: string;
  function_name: string;
  model_name: string;
  test_prompt: string;
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

const MODELS_TO_TEST = [
  { name: 'gpt-4o', provider: 'OpenAI', cost_per_1k: 0.005 },
  { name: 'gpt-4o-mini', provider: 'OpenAI', cost_per_1k: 0.0015 },
  { name: 'claude-3-sonnet', provider: 'Anthropic', cost_per_1k: 0.003 },
  { name: 'claude-3-haiku', provider: 'Anthropic', cost_per_1k: 0.00025 },
  { name: 'gemini-pro', provider: 'Google', cost_per_1k: 0.0025 }
];

const ChampionChallenge = () => {
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ChallengeResult[]>([]);
  const [currentChampion, setCurrentChampion] = useState<Record<string, string>>({});

  const runChallenge = async (functionName: string) => {
    setRunning(true);
    setProgress(0);
    
    try {
      const scenario = TEST_SCENARIOS.find(s => s.function_name === functionName);
      if (!scenario) throw new Error('Escenario no encontrado');

      const challengeResults: ChallengeResult[] = [];
      const totalTests = MODELS_TO_TEST.length * scenario.test_prompts.length;
      let completedTests = 0;

      for (const model of MODELS_TO_TEST) {
        for (const prompt of scenario.test_prompts) {
          // Simular llamada a modelo (en producción sería llamada real)
          const result = await simulateModelTest(functionName, model.name, prompt, model.cost_per_1k);
          challengeResults.push(result);
          
          completedTests++;
          setProgress((completedTests / totalTests) * 100);
          
          // Pequeña pausa para mostrar progreso
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Calcular el campeón (modelo con mejor score promedio)
      const modelScores = MODELS_TO_TEST.map(model => {
        const modelResults = challengeResults.filter(r => r.model_name === model.name);
        const avgScore = modelResults.reduce((sum, r) => sum + r.score, 0) / modelResults.length;
        return { model: model.name, score: avgScore };
      });

      const champion = modelScores.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      setCurrentChampion(prev => ({ ...prev, [functionName]: champion.model }));
      setResults(challengeResults);
      
      toast.success(`Challenge completado. Campeón: ${champion.model}`);
    } catch (error) {
      console.error('Error running challenge:', error);
      toast.error('Error ejecutando el challenge');
    } finally {
      setRunning(false);
      setProgress(0);
    }
  };

  const simulateModelTest = async (
    functionName: string, 
    modelName: string, 
    prompt: string, 
    costPer1k: number
  ): Promise<ChallengeResult> => {
    // Simular latencia variable por modelo
    const latencyBase = {
      'gpt-4o': 800,
      'gpt-4o-mini': 400,
      'claude-3-sonnet': 600,
      'claude-3-haiku': 300,
      'gemini-pro': 500
    }[modelName] || 500;
    
    const latency = latencyBase + Math.random() * 500;
    
    // Simular scores basados en características del modelo
    const baseScores = {
      'gpt-4o': { relevancy: 95, accuracy: 92, creativity: 88, coherence: 94 },
      'gpt-4o-mini': { relevancy: 88, accuracy: 85, creativity: 82, coherence: 87 },
      'claude-3-sonnet': { relevancy: 93, accuracy: 90, creativity: 90, coherence: 92 },
      'claude-3-haiku': { relevancy: 85, accuracy: 82, creativity: 85, coherence: 84 },
      'gemini-pro': { relevancy: 89, accuracy: 87, creativity: 86, coherence: 88 }
    }[modelName] || { relevancy: 80, accuracy: 80, creativity: 80, coherence: 80 };

    // Añadir variabilidad
    const metrics = {
      relevancy: Math.min(100, baseScores.relevancy + (Math.random() - 0.5) * 10),
      accuracy: Math.min(100, baseScores.accuracy + (Math.random() - 0.5) * 10),
      creativity: Math.min(100, baseScores.creativity + (Math.random() - 0.5) * 10),
      coherence: Math.min(100, baseScores.coherence + (Math.random() - 0.5) * 10)
    };

    const averageScore = (metrics.relevancy + metrics.accuracy + metrics.creativity + metrics.coherence) / 4;
    
    return {
      id: `${Date.now()}-${Math.random()}`,
      function_name: functionName,
      model_name: modelName,
      test_prompt: prompt,
      response: `Respuesta simulada de ${modelName} para el prompt: "${prompt.substring(0, 50)}..."`,
      score: averageScore,
      latency: Math.round(latency),
      cost: (prompt.length / 1000) * costPer1k,
      timestamp: new Date().toISOString(),
      metrics
    };
  };

  const getModelResults = (functionName: string, modelName: string) => {
    return results.filter(r => r.function_name === functionName && r.model_name === modelName);
  };

  const getAverageScore = (functionName: string, modelName: string) => {
    const modelResults = getModelResults(functionName, modelName);
    if (modelResults.length === 0) return 0;
    return modelResults.reduce((sum, r) => sum + r.score, 0) / modelResults.length;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

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
                  {TEST_SCENARIOS.map(scenario => (
                    <SelectItem key={scenario.function_name} value={scenario.function_name}>
                      <div className="flex flex-col">
                        <span className="font-medium">{scenario.name}</span>
                        <span className="text-xs text-muted-foreground">{scenario.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={() => runChallenge(selectedFunction)}
                disabled={!selectedFunction || running}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {running ? 'Ejecutando Challenge...' : 'Iniciar Challenge'}
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
                {TEST_SCENARIOS.map(scenario => {
                  const functionResults = results.filter(r => r.function_name === scenario.function_name);
                  if (functionResults.length === 0) return null;

                  const modelRanking = MODELS_TO_TEST.map(model => ({
                    ...model,
                    avgScore: getAverageScore(scenario.function_name, model.name),
                    avgLatency: getModelResults(scenario.function_name, model.name)
                      .reduce((sum, r) => sum + r.latency, 0) / getModelResults(scenario.function_name, model.name).length || 0
                  })).sort((a, b) => b.avgScore - a.avgScore);

                  return (
                    <div key={scenario.function_name} className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Badge variant="outline">{scenario.name}</Badge>
                        {currentChampion[scenario.function_name] && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Trophy className="h-3 w-3 mr-1" />
                            Campeón: {currentChampion[scenario.function_name]}
                          </Badge>
                        )}
                      </h3>
                      
                      <div className="space-y-2">
                        {modelRanking.map((model, index) => (
                          <div key={model.name} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold">
                                #{index + 1}
                              </div>
                              <div>
                                <div className="font-medium">{model.name}</div>
                                <div className="text-sm text-muted-foreground">{model.provider}</div>
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
                                <div className="text-sm">${model.cost_per_1k.toFixed(4)}</div>
                                <div className="text-xs text-muted-foreground">Costo/1K</div>
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
                          <Badge variant="outline">{result.model_name}</Badge>
                          <Badge variant="secondary">{TEST_SCENARIOS.find(s => s.function_name === result.function_name)?.name}</Badge>
                        </div>
                        <div className={`text-lg font-bold ${getScoreColor(result.score)}`}>
                          {result.score.toFixed(1)}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-3">
                        Prompt: {result.test_prompt}
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