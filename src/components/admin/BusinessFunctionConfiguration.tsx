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
import { Save, AlertCircle } from "lucide-react";

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
  { value: 'text_generation', label: 'Generación de Texto', icon: '📝' },
  { value: 'image_generation', label: 'Generación de Imágenes', icon: '🎨' },
  { value: 'audio_generation', label: 'Generación de Audio', icon: '🎵' },
  { value: 'video_generation', label: 'Generación de Video', icon: '🎬' },
  { value: 'reasoning', label: 'Razonamiento', icon: '🧠' }
];

export default function BusinessFunctionConfiguration() {
  const [functions, setFunctions] = useState<BusinessFunction[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [models, setModels] = useState<AIProviderModel[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedAPIKey, setSelectedAPIKey] = useState<string>('');
  const [modelParameters, setModelParameters] = useState({
    temperature: 0.7,
    max_tokens: 500,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedFunction) {
      loadFunctionConfiguration(selectedFunction);
    }
  }, [selectedFunction]);

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
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadFunctionConfiguration = (func: BusinessFunction) => {
    // Reset form
    setSelectedModel(func.default_model_id || '');
    setSelectedAPIKey('');
    
    // Load configuration if exists
    if (func.configuration) {
      setModelParameters({
        temperature: func.configuration.temperature || 0.7,
        max_tokens: func.configuration.max_tokens || 500,
        top_p: func.configuration.top_p || 1.0,
        frequency_penalty: func.configuration.frequency_penalty || 0.0,
        presence_penalty: func.configuration.presence_penalty || 0.0
      });
    } else {
      setModelParameters({
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      });
    }

    // Load API key if model is selected
    if (func.default_model_id) {
      const model = models.find(m => m.id === func.default_model_id);
      if (model) {
        const provider = providers.find(p => p.id === model.provider_id);
        if (provider) {
          const availableKeys = apiKeys.filter(key => key.provider === provider.name);
          if (availableKeys.length > 0) {
            setSelectedAPIKey(availableKeys[0].id);
          }
        }
      }
    }
  };

  const toggleFunctionStatus = async (func: BusinessFunction) => {
    try {
      const { error } = await supabase
        .from('business_function_configurations')
        .update({ is_active: !func.is_active })
        .eq('id', func.id);

      if (error) throw error;
      
      setFunctions(functions.map(f => 
        f.id === func.id ? { ...f, is_active: !f.is_active } : f
      ));
      
      toast.success('Estado de función actualizado');
    } catch (error) {
      console.error('Error updating function status:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const saveConfiguration = async () => {
    if (!selectedFunction || !selectedModel) {
      toast.error('Selecciona una función y un modelo');
      return;
    }

    setSaving(true);
    try {
      const selectedModelData = getAvailableModels(selectedFunction.required_model_type).find(m => m.id === selectedModel);
      
      const { error } = await supabase
        .from('business_function_configurations')
        .update({
          default_model_id: selectedModel,
          default_provider_id: selectedModelData?.provider_id,
          configuration: {
            ...modelParameters,
            api_key_id: selectedAPIKey
          }
        })
        .eq('id', selectedFunction.id);

      if (error) throw error;

      // Update local state
      setFunctions(functions.map(f => 
        f.id === selectedFunction.id 
          ? { 
              ...f, 
              default_model_id: selectedModel,
              default_provider_id: selectedModelData?.provider_id,
              configuration: {
                ...modelParameters,
                api_key_id: selectedAPIKey
              }
            } 
          : f
      ));

      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const getAvailableModels = (requiredType: string) => {
    // Map function requirements to appropriate model types
    const modelTypeMapping: Record<string, string[]> = {
      'text_generation': ['text_generation'],
      'reasoning': ['reasoning'],
      'image_generation': ['image_generation'], 
      'audio_generation': ['audio_generation'],
      'video_generation': ['video_generation'],
      'content_optimization': ['text_generation', 'reasoning'],
      'content_analysis': ['text_generation', 'reasoning'],
      'semantic_analysis': ['text_generation', 'reasoning'],
      'competitive_intelligence': ['text_generation', 'reasoning'],
      'marketing_insights': ['text_generation', 'reasoning']
    };

    const allowedTypes = modelTypeMapping[requiredType] || [requiredType];
    return models.filter(model => allowedTypes.includes(model.model_type));
  };

  const getProviderForModel = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    return providers.find(p => p.id === model?.provider_id);
  };

  const getAPIKeysForProvider = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    return apiKeys.filter(key => key.provider === provider?.name);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setSelectedAPIKey('');
    
    // Auto-select first available API key for the provider
    if (modelId) {
      const model = models.find(m => m.id === modelId);
      if (model) {
        const provider = providers.find(p => p.id === model.provider_id);
        if (provider) {
          const availableKeys = apiKeys.filter(key => key.provider === provider.name);
          if (availableKeys.length > 0) {
            setSelectedAPIKey(availableKeys[0].id);
          }
        }
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando configuración...</div>;
  }

  const selectedModelData = selectedModel ? getAvailableModels(selectedFunction?.required_model_type || '').find(m => m.id === selectedModel) : null;
  const provider = selectedModelData ? getProviderForModel(selectedModel) : null;
  const availableAPIKeys = provider ? getAPIKeysForProvider(provider.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración de Funciones de Negocio</h2>
        <p className="text-muted-foreground">
          Selecciona una función y configura el modelo de IA que utilizará
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Funciones */}
        <Card>
          <CardHeader>
            <CardTitle>Funciones de Negocio</CardTitle>
            <CardDescription>
              Selecciona una función para configurar su modelo de IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {functions.map((func) => {
                const modelType = MODEL_TYPES.find(t => t.value === func.required_model_type);
                const hasModel = !!func.default_model_id;

                return (
                  <div 
                    key={func.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedFunction?.id === func.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedFunction(func)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{modelType?.icon}</div>
                        <div>
                          <h3 className="font-medium">{func.display_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {func.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline">
                              {modelType?.label}
                            </Badge>
                            <Badge variant={hasModel ? "default" : "secondary"}>
                              {hasModel ? 'Configurado' : 'Sin configurar'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={func.is_active}
                          onCheckedChange={() => toggleFunctionStatus(func)}
                        />
                        {!func.is_active && (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Configuración del Modelo */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedFunction 
                ? `Configuración: ${selectedFunction.display_name}` 
                : 'Selecciona una Función'
              }
            </CardTitle>
            <CardDescription>
              {selectedFunction 
                ? 'Configura el modelo y parámetros para esta función'
                : 'Selecciona una función para configurar su modelo'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedFunction ? (
              <div className="space-y-6">
                {/* Selección de Modelo */}
                <div>
                  <Label>Modelo de IA</Label>
                  <Select value={selectedModel} onValueChange={handleModelChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableModels(selectedFunction.required_model_type).map((model) => {
                        const modelProvider = getProviderForModel(model.id);
                        return (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{modelProvider?.display_name}</span>
                              <span className="text-muted-foreground">-</span>
                              <span>{model.display_name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selección de API Key */}
                {selectedModel && availableAPIKeys.length > 0 && (
                  <div>
                    <Label>API Key</Label>
                    <Select value={selectedAPIKey} onValueChange={setSelectedAPIKey}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una API key" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAPIKeys.map((key) => (
                          <SelectItem key={key.id} value={key.id}>
                            {key.api_key_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Parámetros del modelo */}
                {selectedModel && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Parámetros del Modelo</h4>
                    
                    <div>
                      <Label>Temperatura: {modelParameters.temperature}</Label>
                      <Slider
                        value={[modelParameters.temperature]}
                        onValueChange={(value) => setModelParameters({...modelParameters, temperature: value[0]})}
                        max={2}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Controla la creatividad del modelo (0 = determinista, 2 = muy creativo)
                      </p>
                    </div>
                    
                    <div>
                      <Label>Tokens Máximos</Label>
                      <Input
                        type="number"
                        value={modelParameters.max_tokens}
                        onChange={(e) => setModelParameters({...modelParameters, max_tokens: parseInt(e.target.value) || 500})}
                        min={1}
                        max={4000}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Número máximo de tokens en la respuesta
                      </p>
                    </div>

                    <div>
                      <Label>Top P: {modelParameters.top_p}</Label>
                      <Slider
                        value={[modelParameters.top_p]}
                        onValueChange={(value) => setModelParameters({...modelParameters, top_p: value[0]})}
                        max={1}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Controla la diversidad de tokens considerados
                      </p>
                    </div>

                    <div>
                      <Label>Penalización de Frecuencia: {modelParameters.frequency_penalty}</Label>
                      <Slider
                        value={[modelParameters.frequency_penalty]}
                        onValueChange={(value) => setModelParameters({...modelParameters, frequency_penalty: value[0]})}
                        max={2}
                        min={-2}
                        step={0.1}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Reduce la repetición de palabras frecuentes
                      </p>
                    </div>

                    <div>
                      <Label>Penalización de Presencia: {modelParameters.presence_penalty}</Label>
                      <Slider
                        value={[modelParameters.presence_penalty]}
                        onValueChange={(value) => setModelParameters({...modelParameters, presence_penalty: value[0]})}
                        max={2}
                        min={-2}
                        step={0.1}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Reduce la repetición de temas ya mencionados
                      </p>
                    </div>
                  </div>
                )}

                {/* Botón Guardar */}
                <Button 
                  onClick={saveConfiguration}
                  disabled={!selectedModel || !selectedAPIKey || saving}
                  className="w-full"
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Selecciona una función de la lista para configurar su modelo de IA.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}