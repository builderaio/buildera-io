import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Save, AlertCircle } from "lucide-react";

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

interface FunctionModelAssignment {
  id: string;
  function_config_id: string;
  provider_id: string;
  model_id: string;
  api_key_id: string | null;
  model_parameters: any;
  is_active: boolean;
  priority: number;
  provider?: AIProvider;
  model?: AIProviderModel;
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
  const [assignments, setAssignments] = useState<FunctionModelAssignment[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [loading, setLoading] = useState(true);

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
      loadFunctionAssignments(selectedFunction.id);
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

  const loadFunctionAssignments = async (functionId: string) => {
    try {
      const { data, error } = await supabase
        .from('function_model_assignments')
        .select(`
          *,
          provider:ai_providers(*),
          model:ai_provider_models(*)
        `)
        .eq('function_config_id', functionId)
        .order('priority');

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Error al cargar asignaciones');
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

  const addModelAssignment = async (providerId: string, modelId: string, apiKeyId: string) => {
    if (!selectedFunction) return;

    try {
      const { error } = await supabase
        .from('function_model_assignments')
        .insert({
          function_config_id: selectedFunction.id,
          provider_id: providerId,
          model_id: modelId,
          api_key_id: apiKeyId,
          model_parameters: modelParameters,
          is_active: true,
          priority: assignments.length + 1
        });

      if (error) throw error;

      await loadFunctionAssignments(selectedFunction.id);
      setIsConfiguring(false);
      toast.success('Asignación de modelo agregada');
    } catch (error) {
      console.error('Error adding assignment:', error);
      toast.error('Error al agregar asignación');
    }
  };

  const toggleAssignmentStatus = async (assignment: FunctionModelAssignment) => {
    try {
      const { error } = await supabase
        .from('function_model_assignments')
        .update({ is_active: !assignment.is_active })
        .eq('id', assignment.id);

      if (error) throw error;

      setAssignments(assignments.map(a => 
        a.id === assignment.id ? { ...a, is_active: !a.is_active } : a
      ));
      
      toast.success('Estado de asignación actualizado');
    } catch (error) {
      console.error('Error updating assignment status:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const deleteAssignment = async (assignment: FunctionModelAssignment) => {
    if (!confirm('¿Estás seguro de eliminar esta asignación?')) return;

    try {
      const { error } = await supabase
        .from('function_model_assignments')
        .delete()
        .eq('id', assignment.id);

      if (error) throw error;

      setAssignments(assignments.filter(a => a.id !== assignment.id));
      toast.success('Asignación eliminada');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Error al eliminar asignación');
    }
  };

  const getAvailableModels = (requiredType: string) => {
    return models.filter(model => model.model_type === requiredType);
  };

  const getProviderForModel = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    return providers.find(p => p.id === model?.provider_id);
  };

  const getAPIKeysForProvider = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    return apiKeys.filter(key => key.provider === provider?.name);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración de Funciones de Negocio</h2>
        <p className="text-muted-foreground">
          Configura qué modelos de IA usar para cada función específica del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Funciones */}
        <Card>
          <CardHeader>
            <CardTitle>Funciones de Negocio</CardTitle>
            <CardDescription>
              Funciones que utilizan IA en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {functions.map((func) => {
                const modelType = MODEL_TYPES.find(t => t.value === func.required_model_type);
                const activeAssignments = assignments.filter(a => 
                  a.function_config_id === func.id && a.is_active
                ).length;

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
                            {selectedFunction?.id === func.id && (
                              <Badge variant="secondary">
                                {activeAssignments} modelo(s) activo(s)
                              </Badge>
                            )}
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

        {/* Configuración de Modelos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {selectedFunction 
                ? `Modelos para ${selectedFunction.display_name}` 
                : 'Selecciona una Función'
              }
              {selectedFunction && (
                <Dialog open={isConfiguring} onOpenChange={setIsConfiguring}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Modelo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Configurar Nuevo Modelo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <ModelConfigurationForm
                        selectedFunction={selectedFunction}
                        availableModels={getAvailableModels(selectedFunction.required_model_type)}
                        providers={providers}
                        apiKeys={apiKeys}
                        modelParameters={modelParameters}
                        setModelParameters={setModelParameters}
                        onAdd={addModelAssignment}
                        getProviderForModel={getProviderForModel}
                        getAPIKeysForProvider={getAPIKeysForProvider}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardTitle>
            <CardDescription>
              {selectedFunction 
                ? 'Modelos asignados para esta función'
                : 'Selecciona una función para configurar sus modelos'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedFunction ? (
              <div className="space-y-4">
                {assignments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div className="font-medium">
                              {assignment.provider?.display_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {assignment.model?.display_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {assignment.model?.model_name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={assignment.is_active ? "default" : "secondary"}>
                              {assignment.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Switch
                                checked={assignment.is_active}
                                onCheckedChange={() => toggleAssignmentStatus(assignment)}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteAssignment(assignment)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay modelos configurados para esta función.
                    <br />
                    Haz clic en "Configurar Modelo" para agregar uno.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Selecciona una función de la lista para configurar sus modelos.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ModelConfigurationForm({ 
  selectedFunction, 
  availableModels, 
  providers,
  apiKeys,
  modelParameters, 
  setModelParameters,
  onAdd,
  getProviderForModel,
  getAPIKeysForProvider
}: {
  selectedFunction: BusinessFunction;
  availableModels: AIProviderModel[];
  providers: AIProvider[];
  apiKeys: APIKey[];
  modelParameters: any;
  setModelParameters: (params: any) => void;
  onAdd: (providerId: string, modelId: string, apiKeyId: string) => void;
  getProviderForModel: (modelId: string) => AIProvider | undefined;
  getAPIKeysForProvider: (providerId: string) => APIKey[];
}) {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedAPIKey, setSelectedAPIKey] = useState<string>('');

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setSelectedAPIKey('');
  };

  const selectedModelData = availableModels.find(m => m.id === selectedModel);
  const provider = selectedModelData ? getProviderForModel(selectedModel) : null;
  const availableAPIKeys = provider ? getAPIKeysForProvider(provider.id) : [];

  return (
    <>
      <div>
        <Label>Modelo</Label>
        <Select onValueChange={handleModelChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un modelo" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((model) => {
              const modelProvider = getProviderForModel(model.id);
              return (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center space-x-2">
                    <span>{modelProvider?.display_name}</span>
                    <span className="text-muted-foreground">-</span>
                    <span>{model.display_name}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {selectedModel && availableAPIKeys.length > 0 && (
        <div>
          <Label>API Key</Label>
          <Select onValueChange={setSelectedAPIKey}>
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
      <div className="space-y-4">
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
        </div>
        
        <div>
          <Label>Tokens Máximos</Label>
          <Input
            type="number"
            value={modelParameters.max_tokens}
            onChange={(e) => setModelParameters({...modelParameters, max_tokens: parseInt(e.target.value)})}
            min={1}
            max={4000}
          />
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
        </div>
      </div>

      <Button 
        onClick={() => {
          if (selectedModel && selectedAPIKey && provider) {
            onAdd(provider.id, selectedModel, selectedAPIKey);
          }
        }}
        disabled={!selectedModel || !selectedAPIKey}
        className="w-full"
      >
        <Save className="h-4 w-4 mr-2" />
        Guardar Configuración
      </Button>
    </>
  );
}