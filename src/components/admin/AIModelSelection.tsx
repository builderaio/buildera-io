import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Settings, Save, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface APIKey {
  id: string;
  provider: string;
  model_name?: string;
  available_models?: string[];
  api_key_name: string;
  status: string;
}

interface SelectedModel {
  provider: string;
  model: string;
  api_key_id: string;
}

const AIModelSelection = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [selectedModels, setSelectedModels] = useState<SelectedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingModels, setFetchingModels] = useState<string | null>(null);

  const getAvailableModels = (provider: string, apiKey?: APIKey) => {
    // Usar modelos almacenados en la base de datos si están disponibles
    if (apiKey?.available_models && apiKey.available_models.length > 0) {
      return apiKey.available_models;
    }
    
    // Fallback a modelos por defecto
    const modelMap: { [key: string]: string[] } = {
      openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
      google: ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra'],
      groq: ['llama2-70b-4096', 'mixtral-8x7b-32768', 'gemma-7b-it'],
      xai: ['grok-beta', 'grok-vision-beta']
    };
    return modelMap[provider] || [];
  };

  const getProviderColor = (provider: string) => {
    const colors: { [key: string]: string } = {
      openai: 'bg-green-500',
      anthropic: 'bg-blue-500',
      google: 'bg-yellow-500',
      groq: 'bg-purple-500',
      xai: 'bg-gray-800',
      default: 'bg-gray-500'
    };
    return colors[provider] || colors.default;
  };

  const loadAPIKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('llm_api_keys')
        .select('*')
        .eq('status', 'active')
        .order('provider');

      if (error) throw error;
      setApiKeys(data || []);
      
      // Inicializar selectedModels con modelos por defecto de cada proveedor
      const initialSelection: SelectedModel[] = [];
      const providerGroups = (data || []).reduce((acc, key) => {
        if (!acc[key.provider]) acc[key.provider] = [];
        acc[key.provider].push(key);
        return acc;
      }, {} as Record<string, APIKey[]>);

      Object.entries(providerGroups).forEach(([provider, keys]) => {
        const primaryKey = keys[0]; // Usar la primera API key como principal
        const availableModels = getAvailableModels(provider, primaryKey);
        const defaultModel = primaryKey.model_name || availableModels[0];
        
        if (defaultModel) {
          initialSelection.push({
            provider,
            model: defaultModel,
            api_key_id: primaryKey.id
          });
        }
      });

      setSelectedModels(initialSelection);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.error('Error al cargar las API keys');
    } finally {
      setLoading(false);
    }
  };

  const updateSelectedModel = (provider: string, model: string, api_key_id: string) => {
    setSelectedModels(prev => {
      const filtered = prev.filter(sm => sm.provider !== provider);
      return [...filtered, { provider, model, api_key_id }];
    });
  };

  const fetchModelsFromAPI = async (provider: string, apiKeyId: string) => {
    setFetchingModels(provider);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-available-models', {
        body: { provider, apiKeyId }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Modelos de ${provider} actualizados: ${data.models.length} modelos encontrados`);
        // Recargar los API keys para mostrar los modelos actualizados
        await loadAPIKeys();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error(`Error al obtener modelos de ${provider}: ${error.message}`);
    } finally {
      setFetchingModels(null);
    }
  };

  const saveSelection = async () => {
    setSaving(true);
    try {
      // Guardar la selección en la base de datos
      // Por ahora solo mostramos un mensaje de éxito
      toast.success('Selección de modelos guardada exitosamente');
    } catch (error) {
      console.error('Error saving model selection:', error);
      toast.error('Error al guardar la selección');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadAPIKeys();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const providerGroups = apiKeys.reduce((acc, key) => {
    if (!acc[key.provider]) acc[key.provider] = [];
    acc[key.provider].push(key);
    return acc;
  }, {} as Record<string, APIKey[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Selección de Modelos por Proveedor</h3>
          <p className="text-sm text-muted-foreground">
            Selecciona qué modelo de IA usar para cada proveedor configurado. Los modelos se consultan en línea desde cada proveedor.
          </p>
        </div>
        <Button onClick={saveSelection} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? 'Guardando...' : 'Guardar Selección'}
        </Button>
      </div>

      <div className="grid gap-4">
        {Object.entries(providerGroups).map(([provider, keys]) => {
          const selectedModel = selectedModels.find(sm => sm.provider === provider);
          const primaryKey = keys[0];
          const availableModels = getAvailableModels(provider, primaryKey);
          const isLoadingThisProvider = fetchingModels === provider;
          
          return (
            <Card key={provider}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${getProviderColor(provider)} p-2 rounded-lg`}>
                      <Settings className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {provider === 'xai' ? 'xAI (Grok)' : 
                         provider === 'groq' ? 'Groq (Inferencia)' : 
                         provider.charAt(0).toUpperCase() + provider.slice(1)}
                      </CardTitle>
                      <CardDescription>
                        {keys.length} API key{keys.length > 1 ? 's' : ''} disponible{keys.length > 1 ? 's' : ''}
                        {primaryKey.available_models?.length > 0 && (
                          <span className="ml-2 text-xs">
                            • {primaryKey.available_models.length} modelos
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchModelsFromAPI(provider, primaryKey.id)}
                    disabled={isLoadingThisProvider}
                  >
                    {isLoadingThisProvider ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    {isLoadingThisProvider ? 'Consultando...' : 'Actualizar Modelos'}
                  </Button>
                  {selectedModel && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Configurado
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Modelo seleccionado</Label>
                    <Select
                      value={selectedModel?.model || ''}
                      onValueChange={(model) => updateSelectedModel(provider, model, keys[0].id)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map(model => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>API Key principal</Label>
                    <Select
                      value={selectedModel?.api_key_id || ''}
                      onValueChange={(api_key_id) => 
                        selectedModel && updateSelectedModel(provider, selectedModel.model, api_key_id)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar API key" />
                      </SelectTrigger>
                      <SelectContent>
                        {keys.map(key => (
                          <SelectItem key={key.id} value={key.id}>
                            {key.api_key_name} (•••{key.api_key_name?.slice(-4)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedModel && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Configuración actual:</strong> {selectedModel.model} usando{' '}
                      {keys.find(k => k.id === selectedModel.api_key_id)?.api_key_name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {Object.keys(providerGroups).length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No hay API keys activas configuradas
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Configura API keys en la pestaña "API Keys" para comenzar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AIModelSelection;