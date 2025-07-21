import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";

interface BusinessFunction {
  id: string;
  function_name: string;
  display_name: string;
  description: string;
  required_model_type: string;
  default_provider_id: string | null;
  default_model_id: string | null;
  configuration: any;
  is_active: boolean;
}

interface AIProvider {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
}

interface AIProviderModel {
  id: string;
  provider_id: string;
  model_name: string;
  display_name: string;
  model_type: string;
  is_available: boolean;
}

interface APIKey {
  id: string;
  api_key_name: string;
  provider: string;
  status: string;
}

const MODEL_TYPES = [
  { value: 'text_generation', label: 'Texto', icon: '📝' },
  { value: 'image_generation', label: 'Imagen', icon: '🎨' },
  { value: 'audio_generation', label: 'Audio', icon: '🎵' },
  { value: 'video_generation', label: 'Video', icon: '🎬' },
  { value: 'reasoning', label: 'Razonamiento', icon: '🧠' }
];

export default function BusinessFunctionConfiguration() {
  const [functions, setFunctions] = useState<BusinessFunction[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [models, setModels] = useState<AIProviderModel[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedFunction, setExpandedFunction] = useState<string | null>(null);

  // Track configurations for each function
  const [functionConfigs, setFunctionConfigs] = useState<Record<string, {
    selectedModel: string;
    selectedAPIKey: string;
    modelParameters: any;
  }>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [functionsRes, providersRes, modelsRes, apiKeysRes] = await Promise.all([
        supabase.from('business_function_configurations').select('*').order('function_name'),
        supabase.from('ai_providers').select('*').eq('is_active', true).order('display_name'),
        supabase.from('ai_provider_models').select('*').eq('is_available', true),
        supabase.from('llm_api_keys').select('*').eq('status', 'active')
      ]);

      if (functionsRes.error) throw functionsRes.error;
      if (providersRes.error) throw providersRes.error;
      if (modelsRes.error) throw modelsRes.error;
      if (apiKeysRes.error) throw apiKeysRes.error;

      setFunctions(functionsRes.data || []);
      setProviders(providersRes.data || []);
      setModels(modelsRes.data || []);
      setApiKeys(apiKeysRes.data || []);

      // Initialize function configs
      const configs: typeof functionConfigs = {};
      functionsRes.data?.forEach(func => {
        configs[func.id] = {
          selectedModel: func.default_model_id || '',
          selectedAPIKey: '',
          modelParameters: func.configuration || {
            temperature: 0.7,
            max_tokens: 500,
            top_p: 1.0,
            frequency_penalty: 0.0,
            presence_penalty: 0.0
          }
        };
      });
      setFunctionConfigs(configs);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableModels = (requiredType: string) => {
    // Solo mostrar modelos configurados en UnifiedAIConfiguration por tipo
    return models.filter(model => model.model_type === requiredType);
  };

  const getProviderForModel = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    return providers.find(p => p.id === model?.provider_id);
  };

  const updateFunctionConfig = (functionId: string, updates: Partial<typeof functionConfigs[string]>) => {
    setFunctionConfigs(prev => ({
      ...prev,
      [functionId]: { ...prev[functionId], ...updates }
    }));
  };

  const saveConfiguration = async (functionId: string) => {
    const config = functionConfigs[functionId];
    if (!config?.selectedModel) return;

    setSaving(true);
    try {
      const selectedModelData = models.find(m => m.id === config.selectedModel);
      
      const { error } = await supabase
        .from('business_function_configurations')
        .update({
          default_model_id: config.selectedModel,
          default_provider_id: selectedModelData?.provider_id,
          configuration: config.modelParameters
        })
        .eq('id', functionId);

      if (error) throw error;
      toast.success('Configuración guardada');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración de Funciones</h2>
        <p className="text-muted-foreground">
          Configura modelos de IA por función usando solo los modelos configurados por proveedor
        </p>
      </div>

      <div className="space-y-4">
        {functions.map((func) => {
          const modelType = MODEL_TYPES.find(t => t.value === func.required_model_type);
          const isExpanded = expandedFunction === func.id;
          const config = functionConfigs[func.id];
          const availableModels = getAvailableModels(func.required_model_type);

          return (
            <Card key={func.id}>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setExpandedFunction(isExpanded ? null : func.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div className="text-2xl">{modelType?.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{func.display_name}</CardTitle>
                      <CardDescription>{func.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{modelType?.label}</Badge>
                    <Badge variant={config?.selectedModel ? "default" : "secondary"}>
                      {config?.selectedModel ? 'Configurado' : 'Sin configurar'}
                    </Badge>
                    <Switch
                      checked={func.is_active}
                      onCheckedChange={(checked) => {
                        // Toggle function status logic here
                      }}
                    />
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Selección de Modelo */}
                    <div className="space-y-4">
                      <Label>Modelo de IA</Label>
                      <Select 
                        value={config?.selectedModel || ''} 
                        onValueChange={(value) => updateFunctionConfig(func.id, { selectedModel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModels.map((model) => {
                            const provider = getProviderForModel(model.id);
                            return (
                              <SelectItem key={model.id} value={model.id}>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{provider?.display_name}</span>
                                  <span>-</span>
                                  <span>{model.display_name}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Parámetros del modelo */}
                    {config?.selectedModel && (
                      <div className="space-y-4">
                        <Label>Parámetros</Label>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Temperatura: {config.modelParameters.temperature}</Label>
                            <Slider
                              value={[config.modelParameters.temperature]}
                              onValueChange={(value) => updateFunctionConfig(func.id, {
                                modelParameters: { ...config.modelParameters, temperature: value[0] }
                              })}
                              max={2} min={0} step={0.1}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Max Tokens</Label>
                            <Input
                              type="number"
                              value={config.modelParameters.max_tokens}
                              onChange={(e) => updateFunctionConfig(func.id, {
                                modelParameters: { ...config.modelParameters, max_tokens: parseInt(e.target.value) || 500 }
                              })}
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={() => saveConfiguration(func.id)}
                          disabled={saving}
                          size="sm"
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Guardar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}