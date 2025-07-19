import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Brain, Save, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIModelConfig {
  id: string;
  function_name: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  created_at: string;
  updated_at: string;
}

const AI_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Rápido y económico' },
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Más potente y preciso' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Modelo premium optimizado' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Equilibrio precio-rendimiento' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', description: 'Modelo de Anthropic avanzado' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', description: 'Claude rápido y eficiente' }
];

const FUNCTION_DESCRIPTIONS = {
  'era-chat': {
    name: 'Era Chat',
    description: 'Asistente conversacional de IA'
  },
  'era-content-optimizer': {
    name: 'Optimizador de Contenido',
    description: 'Optimización automática de textos empresariales'
  },
  'generate-company-content': {
    name: 'Generador de Contenido',
    description: 'Creación de misión, visión y propuesta de valor'
  }
};

export default function ConfiguracionIA() {
  const [configs, setConfigs] = useState<AIModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const loadConfigurations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_model_configurations')
        .select('*')
        .order('function_name');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error loading AI configurations:', error);
      toast.error('Error al cargar las configuraciones de IA');
    } finally {
      setLoading(false);
    }
  };

  const updateConfiguration = async (config: AIModelConfig) => {
    setSaving(config.function_name);
    try {
      const { error } = await supabase
        .from('ai_model_configurations')
        .update({
          model_name: config.model_name,
          temperature: config.temperature,
          max_tokens: config.max_tokens,
          top_p: config.top_p,
          frequency_penalty: config.frequency_penalty,
          presence_penalty: config.presence_penalty,
          updated_at: new Date().toISOString()
        })
        .eq('function_name', config.function_name);

      if (error) throw error;
      
      toast.success(`Configuración de ${FUNCTION_DESCRIPTIONS[config.function_name as keyof typeof FUNCTION_DESCRIPTIONS]?.name} actualizada`);
      await loadConfigurations();
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error('Error al actualizar la configuración');
    } finally {
      setSaving(null);
    }
  };

  const updateConfigValue = (functionName: string, field: string, value: any) => {
    setConfigs(prev => prev.map(config => 
      config.function_name === functionName 
        ? { ...config, [field]: value }
        : config
    ));
  };

  useEffect(() => {
    loadConfigurations();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Brain className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Configuración de IA</h2>
          <p className="text-muted-foreground">
            Configura los modelos y parámetros de inteligencia artificial
          </p>
        </div>
      </div>

      <Tabs defaultValue={configs[0]?.function_name} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {configs.map(config => {
            const info = FUNCTION_DESCRIPTIONS[config.function_name as keyof typeof FUNCTION_DESCRIPTIONS];
            return (
              <TabsTrigger key={config.function_name} value={config.function_name} className="text-xs sm:text-sm">
                {info?.name || config.function_name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {configs.map(config => {
          const info = FUNCTION_DESCRIPTIONS[config.function_name as keyof typeof FUNCTION_DESCRIPTIONS];
          return (
            <TabsContent key={config.function_name} value={config.function_name}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {info?.name || config.function_name}
                    <Badge variant="secondary" className="ml-2">
                      {config.model_name}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {info?.description || 'Configuración de función de IA'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor={`model-${config.function_name}`}>Modelo de IA</Label>
                    <Select
                      value={config.model_name}
                      onValueChange={(value) => updateConfigValue(config.function_name, 'model_name', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map(model => (
                          <SelectItem key={model.value} value={model.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{model.label}</span>
                              <span className="text-xs text-muted-foreground">{model.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`tokens-${config.function_name}`}>Tokens Máximos</Label>
                      <Input
                        id={`tokens-${config.function_name}`}
                        type="number"
                        min="50"
                        max="4000"
                        value={config.max_tokens}
                        onChange={(e) => updateConfigValue(config.function_name, 'max_tokens', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Temperatura: {config.temperature}</Label>
                      <Slider
                        value={[config.temperature]}
                        onValueChange={(value) => updateConfigValue(config.function_name, 'temperature', value[0])}
                        max={2}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Conservador</span>
                        <span>Creativo</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Top P: {config.top_p}</Label>
                      <Slider
                        value={[config.top_p]}
                        onValueChange={(value) => updateConfigValue(config.function_name, 'top_p', value[0])}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Penalización por Frecuencia: {config.frequency_penalty}</Label>
                      <Slider
                        value={[config.frequency_penalty]}
                        onValueChange={(value) => updateConfigValue(config.function_name, 'frequency_penalty', value[0])}
                        max={2}
                        min={-2}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Penalización por Presencia: {config.presence_penalty}</Label>
                      <Slider
                        value={[config.presence_penalty]}
                        onValueChange={(value) => updateConfigValue(config.function_name, 'presence_penalty', value[0])}
                        max={2}
                        min={-2}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => updateConfiguration(config)}
                      disabled={saving === config.function_name}
                      className="min-w-[120px]"
                    >
                      {saving === config.function_name ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saving === config.function_name ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}