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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Settings, Trash2, RefreshCw } from "lucide-react";

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

interface AIProviderModel {
  id: string;
  provider_id: string;
  model_name: string;
  display_name: string;
  model_type: string;
  capabilities: any;
  pricing_info: any;
  is_available: boolean;
  is_preferred: boolean;
}

const MODEL_TYPES = [
  { value: 'text_generation', label: 'Generación de Texto' },
  { value: 'image_generation', label: 'Generación de Imágenes' },
  { value: 'audio_generation', label: 'Generación de Audio' },
  { value: 'video_generation', label: 'Generación de Video' },
  { value: 'reasoning', label: 'Razonamiento' }
];

export default function AIProviderManagement() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [models, setModels] = useState<AIProviderModel[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshingModels, setRefreshingModels] = useState<string | null>(null);

  const [newProvider, setNewProvider] = useState({
    name: '',
    display_name: '',
    description: '',
    base_url: '',
    env_key: '',
    supported_model_types: [] as string[]
  });

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      loadModels(selectedProvider.id);
    }
  }, [selectedProvider]);

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .order('name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_provider_models')
        .select('*')
        .eq('provider_id', providerId)
        .order('model_type', { ascending: true });

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Error loading models:', error);
      toast.error('Error al cargar modelos');
    }
  };

  const toggleProviderStatus = async (provider: AIProvider) => {
    try {
      const { error } = await supabase
        .from('ai_providers')
        .update({ is_active: !provider.is_active })
        .eq('id', provider.id);

      if (error) throw error;
      
      setProviders(providers.map(p => 
        p.id === provider.id ? { ...p, is_active: !p.is_active } : p
      ));
      
      toast.success('Estado del proveedor actualizado');
    } catch (error) {
      console.error('Error updating provider status:', error);
      toast.error('Error al actualizar estado del proveedor');
    }
  };

  const refreshProviderModels = async (provider: AIProvider) => {
    setRefreshingModels(provider.id);
    try {
      // Llamar a la función edge para obtener modelos disponibles
      const { data, error } = await supabase.functions.invoke('fetch-available-models', {
        body: { provider: provider.name }
      });

      if (error) throw error;

      // Actualizar modelos en la base de datos
      if (data?.models && data.models.length > 0) {
        // Primero marcamos todos los modelos existentes como no disponibles
        await supabase
          .from('ai_provider_models')
          .update({ is_available: false })
          .eq('provider_id', provider.id);

        // Luego insertamos o actualizamos los modelos obtenidos
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

        await loadModels(provider.id);
        toast.success(`Modelos actualizados para ${provider.display_name}`);
      }
    } catch (error) {
      console.error('Error refreshing models:', error);
      toast.error('Error al actualizar modelos');
    } finally {
      setRefreshingModels(null);
    }
  };

  const addProvider = async () => {
    try {
      const { error } = await supabase
        .from('ai_providers')
        .insert({
          ...newProvider,
          auth_type: 'bearer',
          supported_model_types: newProvider.supported_model_types as any
        });

      if (error) throw error;

      await loadProviders();
      setIsAddingProvider(false);
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

  const deleteProvider = async (provider: AIProvider) => {
    if (!confirm(`¿Estás seguro de eliminar ${provider.display_name}?`)) return;

    try {
      const { error } = await supabase
        .from('ai_providers')
        .delete()
        .eq('id', provider.id);

      if (error) throw error;

      setProviders(providers.filter(p => p.id !== provider.id));
      if (selectedProvider?.id === provider.id) {
        setSelectedProvider(null);
        setModels([]);
      }
      toast.success('Proveedor eliminado');
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast.error('Error al eliminar proveedor');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando proveedores...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Proveedores de IA</h2>
          <p className="text-muted-foreground">
            Configura los proveedores de IA y sus modelos disponibles
          </p>
        </div>
        
        <Dialog open={isAddingProvider} onOpenChange={setIsAddingProvider}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Proveedor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre (interno)</Label>
                <Input
                  id="name"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                  placeholder="openai, anthropic, etc."
                />
              </div>
              <div>
                <Label htmlFor="display_name">Nombre para mostrar</Label>
                <Input
                  id="display_name"
                  value={newProvider.display_name}
                  onChange={(e) => setNewProvider({...newProvider, display_name: e.target.value})}
                  placeholder="OpenAI, Anthropic, etc."
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newProvider.description}
                  onChange={(e) => setNewProvider({...newProvider, description: e.target.value})}
                  placeholder="Descripción del proveedor"
                />
              </div>
              <div>
                <Label htmlFor="base_url">URL Base de API</Label>
                <Input
                  id="base_url"
                  value={newProvider.base_url}
                  onChange={(e) => setNewProvider({...newProvider, base_url: e.target.value})}
                  placeholder="https://api.ejemplo.com/v1"
                />
              </div>
              <div>
                <Label htmlFor="env_key">Variable de Entorno API Key</Label>
                <Input
                  id="env_key"
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Proveedores */}
        <Card>
          <CardHeader>
            <CardTitle>Proveedores Configurados</CardTitle>
            <CardDescription>
              Gestiona los proveedores de IA disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {providers.map((provider) => (
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
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-medium">{provider.display_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {provider.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {provider.supported_model_types.map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {MODEL_TYPES.find(t => t.value === type)?.label || type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={provider.is_active}
                        onCheckedChange={() => toggleProviderStatus(provider)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          refreshProviderModels(provider);
                        }}
                        disabled={refreshingModels === provider.id}
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshingModels === provider.id ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProvider(provider);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modelos del Proveedor Seleccionado */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedProvider 
                ? `Modelos de ${selectedProvider.display_name}` 
                : 'Selecciona un Proveedor'
              }
            </CardTitle>
            <CardDescription>
              {selectedProvider 
                ? 'Modelos disponibles para este proveedor'
                : 'Selecciona un proveedor para ver sus modelos'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedProvider ? (
              <div className="space-y-4">
                {models.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {models.map((model) => (
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
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay modelos disponibles para este proveedor.
                    <br />
                    Haz clic en el botón de actualizar para obtener los modelos.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Selecciona un proveedor de la lista para ver sus modelos disponibles.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}