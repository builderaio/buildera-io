import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, Settings, RefreshCw, Key, Bot, Cog, 
  CheckCircle, Circle
} from "lucide-react";

interface AIProvider {
  id: string;
  name: string;
  display_name: string;
  description: string;
  base_url: string;
  auth_type: string;
  env_key: string;
  supported_model_types: string[];
  is_active: boolean;
  configuration: any;
}

interface APIKey {
  id: string;
  api_key_name: string;
  provider: string;
  status: string;
  key_last_four: string;
  created_at: string;
}

interface ProviderModel {
  id: string;
  provider_id: string;
  model_name: string;
  display_name: string;
  model_type: 'text_generation' | 'image_generation' | 'audio_generation' | 'video_generation' | 'reasoning';
  is_available: boolean;
  is_preferred: boolean;
}

const MODEL_TYPES = [
  { value: 'text_generation', label: 'Generación de Texto', icon: '📝' },
  { value: 'image_generation', label: 'Generación de Imágenes', icon: '🎨' },
  { value: 'audio_generation', label: 'Generación de Audio', icon: '🎵' },
  { value: 'video_generation', label: 'Generación de Video', icon: '🎬' },
  { value: 'reasoning', label: 'Razonamiento', icon: '🧠' }
];

export default function UnifiedAIConfiguration() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [models, setModels] = useState<ProviderModel[]>([]);
  const [typeAssignments, setTypeAssignments] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({});

  // Form states
  const [newProvider, setNewProvider] = useState({
    name: '',
    display_name: '',
    description: '',
    base_url: '',
    env_key: '',
    supported_model_types: [] as string[]
  });

  const [newAPIKey, setNewAPIKey] = useState({
    api_key_name: '',
    api_key: '',
    provider: ''
  });

  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [showAPIKeyDialog, setShowAPIKeyDialog] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [providersRes, apiKeysRes, modelsRes] = await Promise.all([
        supabase.from('ai_providers').select('*').order('display_name'),
        supabase.from('llm_api_keys').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_provider_models').select('*')
      ]);

      if (providersRes.error) throw providersRes.error;
      if (apiKeysRes.error) throw apiKeysRes.error;
      if (modelsRes.error) throw modelsRes.error;

      setProviders(providersRes.data || []);
      setAPIKeys(apiKeysRes.data || []);
      setModels(modelsRes.data || []);

      // Cargar configuraciones de tipos de modelo por proveedor
      const assignments: Record<string, Record<string, string>> = {};
      (providersRes.data || []).forEach((provider: AIProvider) => {
        assignments[provider.id] = provider.configuration?.model_types || {};
      });
      setTypeAssignments(assignments);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const addProvider = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_providers')
        .insert({
          ...newProvider,
          auth_type: 'bearer',
          supported_model_types: newProvider.supported_model_types as any
        })
        .select()
        .single();

      if (error) throw error;

      setProviders([...providers, data]);
      setShowProviderDialog(false);
      setNewProvider({
        name: '',
        display_name: '',
        description: '',
        base_url: '',
        env_key: '',
        supported_model_types: []
      });
      toast.success('Proveedor agregado exitosamente');
    } catch (error) {
      console.error('Error adding provider:', error);
      toast.error('Error al agregar proveedor');
    }
  };

  const addAPIKey = async () => {
    try {
      const keyHash = btoa(newAPIKey.api_key); // Simple encoding, use proper encryption in production
      const keyLastFour = newAPIKey.api_key.slice(-4);

      const { data, error } = await supabase
        .from('llm_api_keys')
        .insert({
          api_key_name: newAPIKey.api_key_name,
          provider: newAPIKey.provider,
          api_key_hash: keyHash,
          key_last_four: keyLastFour,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setAPIKeys([data, ...apiKeys]);
      setShowAPIKeyDialog(false);
      setNewAPIKey({ api_key_name: '', api_key: '', provider: '' });
      toast.success('API Key agregada exitosamente');
    } catch (error) {
      console.error('Error adding API key:', error);
      toast.error('Error al agregar API key');
    }
  };

  const refreshProviderModels = async (provider: AIProvider) => {
    setLoadingModels(prev => ({ ...prev, [provider.id]: true }));
    
    try {
      // Buscar una API key activa para este proveedor
      const providerAPIKey = apiKeys.find(key => key.provider === provider.name && key.status === 'active');
      
      if (!providerAPIKey) {
        toast.error(`No hay API key configurada para ${provider.display_name}`);
        return;
      }

      const { data, error } = await supabase.functions.invoke('fetch-available-models', {
        body: { 
          provider: provider.name,
          apiKeyId: providerAPIKey.id
        }
      });

      if (error) throw error;

      if (data?.models && data.models.length > 0) {
        // Actualizar modelos en la base de datos
        for (const modelName of data.models) {
          await supabase
            .from('ai_provider_models')
            .upsert({
              provider_id: provider.id,
              model_name: modelName,
              display_name: modelName,
              model_type: inferModelType(modelName) as any,
              is_available: true
            }, {
              onConflict: 'provider_id,model_name'
            });
        }

        await loadAllData();
        toast.success(`${data.models.length} modelos cargados para ${provider.display_name}`);
      } else {
        toast.warning(`No se encontraron modelos para ${provider.display_name}`);
      }
    } catch (error: any) {
      console.error('Error refreshing models:', error);
      toast.error('Error al cargar modelos: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoadingModels(prev => ({ ...prev, [provider.id]: false }));
    }
  };

  const inferModelType = (modelName: string): string => {
    const name = modelName.toLowerCase();
    if (name.includes('vision') || name.includes('dalle') || name.includes('midjourney') || name.includes('image')) {
      return 'image_generation';
    }
    if (name.includes('whisper') || name.includes('audio') || name.includes('speech')) {
      return 'audio_generation';
    }
    if (name.includes('video')) {
      return 'video_generation';
    }
    if (name.includes('o1') || name.includes('reasoning') || name.includes('claude-3')) {
      return 'reasoning';
    }
    return 'text_generation';
  };

  const getProviderStatus = (provider: AIProvider) => {
    const hasAPIKey = apiKeys.some(key => key.provider === provider.name && key.status === 'active');
    const hasModels = models.some(model => model.provider_id === provider.id && model.is_available);
    const hasTypeAssignments = typeAssignments[provider.id] && Object.keys(typeAssignments[provider.id]).length > 0;

    if (hasTypeAssignments && hasModels && hasAPIKey) return 'configured';
    if (hasModels && hasAPIKey) return 'ready';
    if (hasAPIKey) return 'api-key-added';
    return 'incomplete';
  };

  const updateModelTypeAssignment = async (providerId: string, modelType: string, modelName: string) => {
    try {
      const currentConfig = typeAssignments[providerId] || {};
      const newConfig = { ...currentConfig, [modelType]: modelName };
      
      await supabase
        .from('ai_providers')
        .update({
          configuration: { ...providers.find(p => p.id === providerId)?.configuration, model_types: newConfig }
        })
        .eq('id', providerId);

      setTypeAssignments(prev => ({
        ...prev,
        [providerId]: newConfig
      }));

      toast.success('Configuración actualizada');
    } catch (error) {
      console.error('Error updating model type assignment:', error);
      toast.error('Error al actualizar configuración');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ready': return <Settings className="h-5 w-5 text-blue-500" />;
      case 'api-key-added': return <Key className="h-5 w-5 text-yellow-500" />;
      default: return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'configured': return 'Configurado';
      case 'ready': return 'Listo para configurar';
      case 'api-key-added': return 'API Key agregada';
      default: return 'Incompleto';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración de IA</h2>
        <p className="text-muted-foreground">
          Configura proveedores, API keys, modelos y asignaciones por tipo de contenido
        </p>
      </div>

      <div className="grid gap-6">
        {/* Proveedores Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Proveedores de IA
              </CardTitle>
              <CardDescription>
                Configura los proveedores de IA disponibles
              </CardDescription>
            </div>
            <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Proveedor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nuevo Proveedor de IA</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nombre (interno)</Label>
                    <Input
                      value={newProvider.name}
                      onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                      placeholder="openai, anthropic, etc."
                    />
                  </div>
                  <div>
                    <Label>Nombre para mostrar</Label>
                    <Input
                      value={newProvider.display_name}
                      onChange={(e) => setNewProvider({...newProvider, display_name: e.target.value})}
                      placeholder="OpenAI, Anthropic, etc."
                    />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={newProvider.description}
                      onChange={(e) => setNewProvider({...newProvider, description: e.target.value})}
                      placeholder="Descripción del proveedor"
                    />
                  </div>
                  <div>
                    <Label>URL Base de API</Label>
                    <Input
                      value={newProvider.base_url}
                      onChange={(e) => setNewProvider({...newProvider, base_url: e.target.value})}
                      placeholder="https://api.ejemplo.com/v1"
                    />
                  </div>
                  <div>
                    <Label>Variable de Entorno</Label>
                    <Input
                      value={newProvider.env_key}
                      onChange={(e) => setNewProvider({...newProvider, env_key: e.target.value})}
                      placeholder="PROVIDER_API_KEY"
                    />
                  </div>
                  <Button onClick={addProvider} className="w-full">
                    Agregar Proveedor
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {providers.map((provider) => {
                const status = getProviderStatus(provider);
                const providerAPIKeys = apiKeys.filter(key => key.provider === provider.name);
                const providerModels = models.filter(model => model.provider_id === provider.id);
                
                return (
                  <div 
                    key={provider.id}
                    className="p-4 border rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(status)}
                        <div>
                          <h3 className="font-medium">{provider.display_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {provider.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{getStatusText(status)}</Badge>
                            <Switch checked={provider.is_active} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* API Keys para este proveedor */}
                    <div className="pl-8 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          API Keys
                        </h4>
                        <Dialog open={showAPIKeyDialog && newAPIKey.provider === provider.name} 
                                onOpenChange={(open) => {
                                  setShowAPIKeyDialog(open);
                                  if (open) setNewAPIKey({...newAPIKey, provider: provider.name});
                                }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Plus className="h-3 w-3 mr-1" />
                              Agregar API Key
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Nueva API Key para {provider.display_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Nombre de la API Key</Label>
                                <Input
                                  value={newAPIKey.api_key_name}
                                  onChange={(e) => setNewAPIKey({...newAPIKey, api_key_name: e.target.value})}
                                  placeholder="Ej: Producción, Desarrollo"
                                />
                              </div>
                              <div>
                                <Label>API Key</Label>
                                <Input
                                  type="password"
                                  value={newAPIKey.api_key}
                                  onChange={(e) => setNewAPIKey({...newAPIKey, api_key: e.target.value})}
                                  placeholder="Ingresa tu API key"
                                />
                              </div>
                              <Button onClick={addAPIKey} className="w-full">
                                Agregar API Key
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      {providerAPIKeys.length > 0 ? (
                        <div className="grid gap-2">
                          {providerAPIKeys.map((key) => (
                            <div key={key.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                              <div>
                                <span className="text-sm font-medium">{key.api_key_name}</span>
                                <span className="text-xs text-muted-foreground ml-2">****{key.key_last_four}</span>
                              </div>
                              <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                                {key.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay API keys configuradas</p>
                      )}

                      {/* Modelos para este proveedor */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Cog className="h-4 w-4" />
                            Modelos
                          </h4>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => refreshProviderModels(provider)}
                            disabled={!providerAPIKeys.some(key => key.status === 'active') || loadingModels[provider.id]}
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${loadingModels[provider.id] ? 'animate-spin' : ''}`} />
                            {loadingModels[provider.id] ? 'Cargando...' : 'Cargar Modelos'}
                          </Button>
                        </div>
                        
                        {providerModels.length > 0 ? (
                          <div className="grid gap-4">
                            {MODEL_TYPES.map((type) => {
                              const typeModels = providerModels.filter(m => m.model_type === type.value && m.is_available);
                              const selectedModel = typeAssignments[provider.id]?.[type.value];
                              
                              return (
                                <div key={type.value} className="space-y-2">
                                  <h5 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <span>{type.icon}</span>
                                    {type.label}
                                  </h5>
                                  <div className="pl-4">
                                    <Select
                                      value={selectedModel || 'none'}
                                      onValueChange={(value) => {
                                        const modelName = value === 'none' ? '' : value;
                                        updateModelTypeAssignment(provider.id, type.value, modelName);
                                      }}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Seleccionar modelo" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">Sin asignar</SelectItem>
                                        {typeModels.map((model) => (
                                          <SelectItem key={model.id} value={model.model_name}>
                                            {model.display_name}
                                          </SelectItem>
                                        ))}
                                         {typeModels.length === 0 && (
                                           <SelectItem value="unavailable" disabled>
                                             No hay modelos de este tipo disponibles
                                           </SelectItem>
                                         )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {providerAPIKeys.length === 0 
                              ? 'Configura una API key para cargar modelos'
                              : 'No hay modelos cargados. Haz clic en "Cargar Modelos"'
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}