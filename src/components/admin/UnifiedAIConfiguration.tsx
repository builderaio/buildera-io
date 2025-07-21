import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, Settings, Trash2, RefreshCw, Key, Bot, Cog, 
  CheckCircle, Circle, AlertCircle, Save, Edit
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
  model_type: string;
  is_available: boolean;
  is_preferred: boolean;
}

interface BusinessFunction {
  id: string;
  function_name: string;
  display_name: string;
  required_model_type: string;
  is_active: boolean;
}

interface FunctionAssignment {
  id: string;
  function_config_id: string;
  provider_id: string;
  model_id: string;
  api_key_id: string;
  model_parameters: any;
  is_active: boolean;
  provider?: AIProvider;
  model?: ProviderModel;
  api_key?: APIKey;
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
  const [functions, setFunctions] = useState<BusinessFunction[]>([]);
  const [assignments, setAssignments] = useState<FunctionAssignment[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("providers");
  const [loading, setLoading] = useState(true);

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
  const [editingAPIKey, setEditingAPIKey] = useState<APIKey | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [providersRes, apiKeysRes, modelsRes, functionsRes] = await Promise.all([
        supabase.from('ai_providers').select('*').order('display_name'),
        supabase.from('llm_api_keys').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_provider_models').select('*'),
        supabase.from('business_function_configurations').select('*').order('function_name')
      ]);

      if (providersRes.error) throw providersRes.error;
      if (apiKeysRes.error) throw apiKeysRes.error;
      if (modelsRes.error) throw modelsRes.error;
      if (functionsRes.error) throw functionsRes.error;

      setProviders(providersRes.data || []);
      setAPIKeys(apiKeysRes.data || []);
      setModels(modelsRes.data || []);
      setFunctions(functionsRes.data || []);

      // Load assignments
      const { data: assignmentsData } = await supabase
        .from('function_model_assignments')
        .select(`
          *,
          provider:ai_providers(*),
          model:ai_provider_models(*),
          api_key:llm_api_keys(*)
        `);
      
      setAssignments(assignmentsData || []);
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
      
      // Auto-select the new provider and move to next step
      setSelectedProvider(data);
      setCurrentStep("api-keys");
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
        // Update models in database
        for (const model of data.models) {
          await supabase
            .from('ai_provider_models')
            .upsert({
              provider_id: provider.id,
              model_name: model.name,
              display_name: model.display_name || model.name,
              model_type: model.type || 'text_generation',
              capabilities: model.capabilities || {},
              pricing_info: model.pricing || {},
              is_available: true
            }, {
              onConflict: 'provider_id,model_name'
            });
        }

        await loadAllData();
        toast.success(`Modelos actualizados para ${provider.display_name}`);
      }
    } catch (error) {
      console.error('Error refreshing models:', error);
      toast.error('Error al actualizar modelos');
    }
  };

  const getProviderStatus = (provider: AIProvider) => {
    const hasAPIKey = apiKeys.some(key => key.provider === provider.name && key.status === 'active');
    const hasModels = models.some(model => model.provider_id === provider.id && model.is_available);
    const hasAssignments = assignments.some(assignment => assignment.provider_id === provider.id && assignment.is_active);

    if (hasAssignments && hasModels && hasAPIKey) return 'configured';
    if (hasModels && hasAPIKey) return 'ready';
    if (hasAPIKey) return 'api-key-added';
    return 'incomplete';
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
        <h2 className="text-2xl font-bold">Configuración Unificada de IA</h2>
        <p className="text-muted-foreground">
          Configura proveedores, API keys y modelos en un flujo secuencial
        </p>
      </div>

      <Tabs value={currentStep} onValueChange={setCurrentStep} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            1. Proveedores
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            2. API Keys
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            3. Modelos
          </TabsTrigger>
          <TabsTrigger value="functions" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            4. Funciones
          </TabsTrigger>
        </TabsList>

        {/* Step 1: Providers */}
        <TabsContent value="providers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Paso 1: Proveedores de IA</CardTitle>
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
              <div className="grid gap-4">
                {providers.map((provider) => {
                  const status = getProviderStatus(provider);
                  return (
                    <div 
                      key={provider.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedProvider?.id === provider.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
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
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProvider(provider);
                              setCurrentStep("api-keys");
                            }}
                            disabled={status === 'incomplete'}
                          >
                            Configurar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: API Keys */}
        <TabsContent value="api-keys">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Paso 2: API Keys</CardTitle>
                <CardDescription>
                  {selectedProvider 
                    ? `Configura las API keys para ${selectedProvider.display_name}`
                    : 'Selecciona un proveedor para configurar sus API keys'
                  }
                </CardDescription>
              </div>
              {selectedProvider && (
                <Dialog open={showAPIKeyDialog} onOpenChange={setShowAPIKeyDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingAPIKey ? 'Editar API Key' : 'Nueva API Key'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nombre de la API Key</Label>
                        <Input
                          value={newAPIKey.api_key_name}
                          onChange={(e) => setNewAPIKey({...newAPIKey, api_key_name: e.target.value})}
                          placeholder="Mi API Key de OpenAI"
                        />
                      </div>
                      <div>
                        <Label>API Key</Label>
                        <Input
                          type="password"
                          value={newAPIKey.api_key}
                          onChange={(e) => setNewAPIKey({...newAPIKey, api_key: e.target.value})}
                          placeholder="sk-..."
                        />
                      </div>
                      <div>
                        <Label>Proveedor</Label>
                        <Select 
                          value={newAPIKey.provider || selectedProvider?.name} 
                          onValueChange={(value) => setNewAPIKey({...newAPIKey, provider: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.map((provider) => (
                              <SelectItem key={provider.id} value={provider.name}>
                                {provider.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={addAPIKey} className="w-full">
                        {editingAPIKey ? 'Actualizar' : 'Agregar'} API Key
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {selectedProvider ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Últimos 4</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys
                      .filter(key => key.provider === selectedProvider.name)
                      .map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.api_key_name}</TableCell>
                        <TableCell>{key.provider}</TableCell>
                        <TableCell>
                          <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                            {key.status === 'active' ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </TableCell>
                        <TableCell>****{key.key_last_four}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Selecciona un proveedor en el paso anterior para configurar sus API keys
                </div>
              )}

              {selectedProvider && apiKeys.some(key => key.provider === selectedProvider.name) && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setCurrentStep("models")}>
                    Continuar a Modelos
                    <Settings className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Models */}
        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Paso 3: Configuración de Modelos</CardTitle>
              <CardDescription>
                {selectedProvider 
                  ? `Obtén y configura los modelos para ${selectedProvider.display_name}`
                  : 'Selecciona un proveedor para configurar sus modelos'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedProvider ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Modelos Disponibles</h3>
                    <Button
                      onClick={() => refreshProviderModels(selectedProvider)}
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualizar Modelos
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {models
                        .filter(model => model.provider_id === selectedProvider.id)
                        .map((model) => (
                        <TableRow key={model.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{model.display_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {model.model_name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {MODEL_TYPES.find(t => t.value === model.model_type)?.label || model.model_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {model.is_available && (
                                <Badge variant="default">Disponible</Badge>
                              )}
                              {model.is_preferred && (
                                <Badge variant="secondary">Preferido</Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {models.some(model => model.provider_id === selectedProvider.id && model.is_available) && (
                    <div className="flex justify-end">
                      <Button onClick={() => setCurrentStep("functions")}>
                        Continuar a Funciones
                        <Bot className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Selecciona un proveedor y configura su API key primero
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 4: Functions */}
        <TabsContent value="functions">
          <Card>
            <CardHeader>
              <CardTitle>Paso 4: Asignación de Funciones</CardTitle>
              <CardDescription>
                Asigna modelos específicos a las funciones de negocio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {functions.map((func) => {
                  const modelType = MODEL_TYPES.find(t => t.value === func.required_model_type);
                  const assignment = assignments.find(a => a.function_config_id === func.id && a.is_active);
                  
                  return (
                    <div key={func.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{modelType?.icon}</div>
                          <div>
                            <h3 className="font-medium">{func.display_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Requiere: {modelType?.label}
                            </p>
                            {assignment && (
                              <p className="text-sm text-green-600">
                                Configurado: {assignment.provider?.display_name} - {assignment.model?.display_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch checked={func.is_active} />
                          {assignment ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}