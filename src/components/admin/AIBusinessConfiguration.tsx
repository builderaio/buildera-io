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

interface SelectedModel {
  provider: string;
  model: string;
  api_key_id: string;
}

const FUNCTION_DESCRIPTIONS = {
  'era-chat': {
    name: 'Era Chat',
    description: 'Asistente conversacional de IA',
    icon: '💬'
  },
  'era-content-optimizer': {
    name: 'Optimizador de Contenido',
    description: 'Optimización automática de textos empresariales',
    icon: '✨'
  },
  'generate-company-content': {
    name: 'Generador de Contenido',
    description: 'Creación de misión, visión y propuesta de valor',
    icon: '📝'
  },
  'social-media-analyzer': {
    name: 'Analizador Social',
    description: 'Análisis de contenido en redes sociales',
    icon: '📊'
  },
  'content-embeddings-generator': {
    name: 'Generador de Embeddings',
    description: 'Generación de vectores para contenido',
    icon: '🔗'
  }
};

const AIBusinessConfiguration = () => {
  const [configs, setConfigs] = useState<AIModelConfig[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const loadAvailableModels = async () => {
    try {
      // Cargar modelos seleccionados de la sección anterior
      // Por ahora, usaremos una lista simulada basada en configuraciones existentes
      const { data, error } = await supabase
        .from('ai_model_configurations')
        .select('model_name')
        .order('model_name');

      if (error) throw error;
      
      const uniqueModels = Array.from(new Set(data?.map(config => config.model_name) || []));
      setAvailableModels(uniqueModels);
    } catch (error) {
      console.error('Error loading available models:', error);
      // Fallback a modelos por defecto
      setAvailableModels([
        'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo',
        'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307',
        'gemini-pro', 'gemini-pro-vision'
      ]);
    }
  };

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
      
      const functionInfo = FUNCTION_DESCRIPTIONS[config.function_name as keyof typeof FUNCTION_DESCRIPTIONS];
      toast.success(`Configuración de ${functionInfo?.name || config.function_name} actualizada`);
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
    loadAvailableModels();
    loadConfigurations();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Parametrización por Función de Negocio</h3>
        <p className="text-sm text-muted-foreground">
          Configura qué modelo usar y sus parámetros para cada función específica de Buildera
        </p>
      </div>

      <Tabs defaultValue={configs[0]?.function_name} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 h-auto p-1">
          {configs.map(config => {
            const info = FUNCTION_DESCRIPTIONS[config.function_name as keyof typeof FUNCTION_DESCRIPTIONS];
            return (
              <TabsTrigger 
                key={config.function_name} 
                value={config.function_name} 
                className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap"
              >
                <span className="hidden lg:inline">{info?.icon} {info?.name || config.function_name}</span>
                <span className="lg:hidden">{info?.icon || '⚙️'}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {configs.map(config => {
          const info = FUNCTION_DESCRIPTIONS[config.function_name as keyof typeof FUNCTION_DESCRIPTIONS];
          return (
            <TabsContent key={config.function_name} value={config.function_name} className="mt-6">
              <Card className="animate-fade-in">
                <CardHeader className="pb-4">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-base sm:text-lg flex items-center gap-2">
                      <span className="text-2xl">{info?.icon || '⚙️'}</span>
                      {info?.name || config.function_name}
                    </span>
                    <Badge variant="secondary" className="self-start sm:ml-2 text-xs">
                      {config.model_name}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {info?.description || 'Configuración de función de IA'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor={`model-${config.function_name}`} className="text-sm font-medium">
                      Modelo de IA
                    </Label>
                    <Select
                      value={config.model_name}
                      onValueChange={(value) => updateConfigValue(config.function_name, 'model_name', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un modelo disponible" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map(model => (
                          <SelectItem key={model} value={model}>
                            <div className="flex flex-col py-1">
                              <span className="font-medium text-sm">{model}</span>
                              <span className="text-xs text-muted-foreground">
                                {model.includes('gpt') ? 'OpenAI' :
                                 model.includes('claude') ? 'Anthropic' :
                                 model.includes('gemini') ? 'Google' :
                                 model.includes('llama') || model.includes('mixtral') ? 'Groq' :
                                 model.includes('grok') ? 'xAI' : 'Modelo disponible'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Solo aparecen modelos configurados en la sección "Selección de Modelos"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor={`tokens-${config.function_name}`} className="text-sm font-medium">
                        Tokens Máximos
                      </Label>
                      <Input
                        id={`tokens-${config.function_name}`}
                        type="number"
                        min="50"
                        max="4000"
                        value={config.max_tokens}
                        onChange={(e) => updateConfigValue(config.function_name, 'max_tokens', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Temperatura: {config.temperature}
                      </Label>
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

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Top P: {config.top_p}
                      </Label>
                      <Slider
                        value={[config.top_p]}
                        onValueChange={(value) => updateConfigValue(config.function_name, 'top_p', value[0])}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Penalización por Frecuencia: {config.frequency_penalty}
                      </Label>
                      <Slider
                        value={[config.frequency_penalty]}
                        onValueChange={(value) => updateConfigValue(config.function_name, 'frequency_penalty', value[0])}
                        max={2}
                        min={-2}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3 lg:col-span-2">
                      <Label className="text-sm font-medium">
                        Penalización por Presencia: {config.presence_penalty}
                      </Label>
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

                  <div className="flex justify-end pt-4 border-t">
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

      {configs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No hay configuraciones de funciones de negocio disponibles
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Las configuraciones se crean automáticamente cuando las funciones están disponibles
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIBusinessConfiguration;