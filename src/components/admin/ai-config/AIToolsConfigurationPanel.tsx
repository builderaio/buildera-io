import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Globe, 
  FileSearch, 
  Code, 
  Brain, 
  Image,
  Check,
  X,
  RefreshCw,
  Save,
  Plus,
  Trash2
} from "lucide-react";

interface ModelCompatibility {
  id: string;
  model_name: string;
  provider: string;
  display_name: string | null;
  supports_web_search: boolean;
  supports_file_search: boolean;
  supports_code_interpreter: boolean;
  supports_image_generation: boolean;
  supports_reasoning: boolean;
  supports_responses_api: boolean;
  max_output_tokens: number;
  context_window: number;
  notes: string | null;
  is_active: boolean;
}

const TOOL_INFO = [
  { 
    id: 'web_search_preview', 
    name: 'Web Search', 
    icon: Globe, 
    description: 'Permite buscar información actualizada en internet',
    color: 'text-blue-500'
  },
  { 
    id: 'file_search', 
    name: 'File Search', 
    icon: FileSearch, 
    description: 'Busca contenido en documentos y archivos',
    color: 'text-green-500'
  },
  { 
    id: 'code_interpreter', 
    name: 'Code Interpreter', 
    icon: Code, 
    description: 'Ejecuta código Python para análisis de datos',
    color: 'text-orange-500'
  },
  { 
    id: 'image_generation', 
    name: 'Image Generation', 
    icon: Image, 
    description: 'Genera imágenes a partir de descripciones',
    color: 'text-purple-500'
  },
  { 
    id: 'reasoning', 
    name: 'Reasoning', 
    icon: Brain, 
    description: 'Razonamiento avanzado paso a paso',
    color: 'text-pink-500'
  },
];

export default function AIToolsConfigurationPanel() {
  const [models, setModels] = useState<ModelCompatibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingModel, setEditingModel] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_model_tool_compatibility')
        .select('*')
        .order('provider', { ascending: true })
        .order('model_name', { ascending: true });

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Error loading models:', error);
      toast.error('Error al cargar modelos');
    } finally {
      setLoading(false);
    }
  };

  const updateModel = async (model: ModelCompatibility) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ai_model_tool_compatibility')
        .update({
          display_name: model.display_name,
          supports_web_search: model.supports_web_search,
          supports_file_search: model.supports_file_search,
          supports_code_interpreter: model.supports_code_interpreter,
          supports_image_generation: model.supports_image_generation,
          supports_reasoning: model.supports_reasoning,
          supports_responses_api: model.supports_responses_api,
          max_output_tokens: model.max_output_tokens,
          context_window: model.context_window,
          notes: model.notes,
          is_active: model.is_active,
        })
        .eq('id', model.id);

      if (error) throw error;
      
      toast.success('Modelo actualizado');
      setEditingModel(null);
      loadModels();
    } catch (error) {
      console.error('Error updating model:', error);
      toast.error('Error al actualizar modelo');
    } finally {
      setSaving(false);
    }
  };

  const toggleModelActive = async (model: ModelCompatibility) => {
    try {
      const { error } = await supabase
        .from('ai_model_tool_compatibility')
        .update({ is_active: !model.is_active })
        .eq('id', model.id);

      if (error) throw error;
      loadModels();
    } catch (error) {
      console.error('Error toggling model:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const updateModelField = (modelId: string, field: keyof ModelCompatibility, value: any) => {
    setModels(models.map(m => 
      m.id === modelId ? { ...m, [field]: value } : m
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Compatibilidad de Herramientas</h3>
          <p className="text-sm text-muted-foreground">
            Configura qué herramientas soporta cada modelo de IA
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadModels}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Recargar
        </Button>
      </div>

      {/* Tools Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Herramientas Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {TOOL_INFO.map(tool => {
              const Icon = tool.icon;
              return (
                <div key={tool.id} className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${tool.color}`} />
                  <div>
                    <p className="text-sm font-medium">{tool.name}</p>
                    <p className="text-xs text-muted-foreground hidden md:block">{tool.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Models Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matriz de Compatibilidad</CardTitle>
          <CardDescription>
            Indica qué herramientas están disponibles para cada modelo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Modelo</TableHead>
                  <TableHead className="text-center">
                    <Globe className="h-4 w-4 mx-auto text-blue-500" />
                  </TableHead>
                  <TableHead className="text-center">
                    <FileSearch className="h-4 w-4 mx-auto text-green-500" />
                  </TableHead>
                  <TableHead className="text-center">
                    <Code className="h-4 w-4 mx-auto text-orange-500" />
                  </TableHead>
                  <TableHead className="text-center">
                    <Image className="h-4 w-4 mx-auto text-purple-500" />
                  </TableHead>
                  <TableHead className="text-center">
                    <Brain className="h-4 w-4 mx-auto text-pink-500" />
                  </TableHead>
                  <TableHead className="text-center">Max Tokens</TableHead>
                  <TableHead className="text-center">Context</TableHead>
                  <TableHead className="text-center">Activo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map(model => (
                  <TableRow key={model.id} className={!model.is_active ? 'opacity-50' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{model.display_name || model.model_name}</p>
                        <p className="text-xs text-muted-foreground">{model.provider}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {editingModel === model.id ? (
                        <Switch 
                          checked={model.supports_web_search}
                          onCheckedChange={(checked) => updateModelField(model.id, 'supports_web_search', checked)}
                        />
                      ) : (
                        model.supports_web_search ? 
                          <Check className="h-4 w-4 mx-auto text-green-500" /> : 
                          <X className="h-4 w-4 mx-auto text-muted-foreground/30" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingModel === model.id ? (
                        <Switch 
                          checked={model.supports_file_search}
                          onCheckedChange={(checked) => updateModelField(model.id, 'supports_file_search', checked)}
                        />
                      ) : (
                        model.supports_file_search ? 
                          <Check className="h-4 w-4 mx-auto text-green-500" /> : 
                          <X className="h-4 w-4 mx-auto text-muted-foreground/30" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingModel === model.id ? (
                        <Switch 
                          checked={model.supports_code_interpreter}
                          onCheckedChange={(checked) => updateModelField(model.id, 'supports_code_interpreter', checked)}
                        />
                      ) : (
                        model.supports_code_interpreter ? 
                          <Check className="h-4 w-4 mx-auto text-green-500" /> : 
                          <X className="h-4 w-4 mx-auto text-muted-foreground/30" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingModel === model.id ? (
                        <Switch 
                          checked={model.supports_image_generation}
                          onCheckedChange={(checked) => updateModelField(model.id, 'supports_image_generation', checked)}
                        />
                      ) : (
                        model.supports_image_generation ? 
                          <Check className="h-4 w-4 mx-auto text-green-500" /> : 
                          <X className="h-4 w-4 mx-auto text-muted-foreground/30" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingModel === model.id ? (
                        <Switch 
                          checked={model.supports_reasoning}
                          onCheckedChange={(checked) => updateModelField(model.id, 'supports_reasoning', checked)}
                        />
                      ) : (
                        model.supports_reasoning ? 
                          <Check className="h-4 w-4 mx-auto text-green-500" /> : 
                          <X className="h-4 w-4 mx-auto text-muted-foreground/30" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingModel === model.id ? (
                        <Input 
                          type="number"
                          value={model.max_output_tokens}
                          onChange={(e) => updateModelField(model.id, 'max_output_tokens', parseInt(e.target.value) || 0)}
                          className="w-24 text-center"
                        />
                      ) : (
                        <span className="text-sm">{model.max_output_tokens.toLocaleString()}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingModel === model.id ? (
                        <Input 
                          type="number"
                          value={model.context_window}
                          onChange={(e) => updateModelField(model.id, 'context_window', parseInt(e.target.value) || 0)}
                          className="w-24 text-center"
                        />
                      ) : (
                        <span className="text-sm">{(model.context_window / 1000).toFixed(0)}K</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={model.is_active}
                        onCheckedChange={() => toggleModelActive(model)}
                      />
                    </TableCell>
                    <TableCell>
                      {editingModel === model.id ? (
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => updateModel(model)}
                            disabled={saving}
                          >
                            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setEditingModel(null);
                              loadModels();
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setEditingModel(model.id)}
                        >
                          Editar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uso por Herramienta</CardTitle>
          <CardDescription>
            Funciones que utilizan cada herramienta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToolUsageStats />
        </CardContent>
      </Card>
    </div>
  );
}

function ToolUsageStats() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_function_configurations')
        .select('tools_enabled')
        .eq('is_active', true);

      if (error) throw error;

      const toolCounts: Record<string, number> = {};
      (data || []).forEach(fn => {
        const tools = Array.isArray(fn.tools_enabled) ? fn.tools_enabled : [];
        tools.forEach((tool: string) => {
          toolCounts[tool] = (toolCounts[tool] || 0) + 1;
        });
      });

      setStats(toolCounts);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {TOOL_INFO.map(tool => {
        const Icon = tool.icon;
        const count = stats[tool.id] || 0;
        
        return (
          <div key={tool.id} className="flex items-center gap-3 p-3 border rounded-lg">
            <Icon className={`h-8 w-8 ${tool.color}`} />
            <div>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{tool.name}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
