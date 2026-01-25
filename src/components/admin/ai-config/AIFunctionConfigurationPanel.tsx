import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Search, 
  Globe, 
  Code, 
  FileSearch, 
  Brain,
  Zap,
  BarChart3,
  MessageSquare,
  Palette,
  Target,
  Edit,
  Check,
  X
} from "lucide-react";

interface FunctionConfig {
  id: string;
  function_name: string;
  display_name: string;
  description: string | null;
  category: string;
  provider: string;
  model_name: string;
  api_version: string;
  system_prompt: string | null;
  instructions: string | null;
  temperature: number;
  max_output_tokens: number;
  top_p: number;
  tools_enabled: string[];
  tools_config: Record<string, any>;
  custom_functions: any[];
  tool_choice: string;
  parallel_tool_calls: boolean;
  reasoning_enabled: boolean;
  reasoning_effort: string;
  is_active: boolean;
  requires_web_search: boolean;
}

interface ModelCompatibility {
  model_name: string;
  display_name: string | null;
  supports_web_search: boolean;
  supports_file_search: boolean;
  supports_code_interpreter: boolean;
  supports_reasoning: boolean;
  max_output_tokens: number;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  marketing: <Target className="h-4 w-4" />,
  analytics: <BarChart3 className="h-4 w-4" />,
  social_analytics: <MessageSquare className="h-4 w-4" />,
  content: <Edit className="h-4 w-4" />,
  strategy: <Brain className="h-4 w-4" />,
  branding: <Palette className="h-4 w-4" />,
  assistant: <MessageSquare className="h-4 w-4" />,
  general: <Settings className="h-4 w-4" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  marketing: 'Marketing',
  analytics: 'Análisis',
  social_analytics: 'Redes Sociales',
  content: 'Contenido',
  strategy: 'Estrategia',
  branding: 'Branding',
  assistant: 'Asistentes',
  general: 'General',
};

const AVAILABLE_TOOLS = [
  { id: 'web_search_preview', name: 'Web Search', icon: Globe, description: 'Búsqueda en internet en tiempo real' },
  { id: 'file_search', name: 'File Search', icon: FileSearch, description: 'Búsqueda en archivos y documentos' },
  { id: 'code_interpreter', name: 'Code Interpreter', icon: Code, description: 'Ejecuta código Python para análisis' },
];

export default function AIFunctionConfigurationPanel() {
  const [functions, setFunctions] = useState<FunctionConfig[]>([]);
  const [models, setModels] = useState<ModelCompatibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingFunction, setEditingFunction] = useState<FunctionConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [functionsRes, modelsRes] = await Promise.all([
        supabase.from('ai_function_configurations').select('*').order('category', { ascending: true }),
        supabase.from('ai_model_tool_compatibility').select('*').eq('is_active', true).order('model_name', { ascending: true }),
      ]);

      if (functionsRes.error) throw functionsRes.error;
      if (modelsRes.error) throw modelsRes.error;

      // Parse JSONB fields with proper type casting
      const parsedFunctions = (functionsRes.data || []).map(fn => ({
        ...fn,
        tools_enabled: Array.isArray(fn.tools_enabled) 
          ? (fn.tools_enabled as unknown as string[]).filter((t): t is string => typeof t === 'string')
          : [],
        tools_config: (fn.tools_config || {}) as Record<string, any>,
        custom_functions: Array.isArray(fn.custom_functions) ? fn.custom_functions as any[] : [],
      })) as FunctionConfig[];

      setFunctions(parsedFunctions);
      setModels((modelsRes.data || []) as ModelCompatibility[]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const saveFunction = async (config: FunctionConfig) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ai_function_configurations')
        .update({
          display_name: config.display_name,
          description: config.description,
          category: config.category,
          model_name: config.model_name,
          system_prompt: config.system_prompt,
          instructions: config.instructions,
          temperature: config.temperature,
          max_output_tokens: config.max_output_tokens,
          top_p: config.top_p,
          tools_enabled: config.tools_enabled,
          tools_config: config.tools_config,
          tool_choice: config.tool_choice,
          parallel_tool_calls: config.parallel_tool_calls,
          reasoning_enabled: config.reasoning_enabled,
          reasoning_effort: config.reasoning_effort,
          is_active: config.is_active,
          requires_web_search: config.requires_web_search,
        })
        .eq('id', config.id);

      if (error) throw error;

      toast.success('Configuración guardada');
      setEditingFunction(null);
      loadData();
    } catch (error) {
      console.error('Error saving function:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const toggleFunctionActive = async (fn: FunctionConfig) => {
    try {
      const { error } = await supabase
        .from('ai_function_configurations')
        .update({ is_active: !fn.is_active })
        .eq('id', fn.id);

      if (error) throw error;
      
      toast.success(fn.is_active ? 'Función desactivada' : 'Función activada');
      loadData();
    } catch (error) {
      console.error('Error toggling function:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const getModelCompatibility = (modelName: string) => {
    return models.find(m => m.model_name === modelName);
  };

  const filteredFunctions = functions.filter(fn => {
    const matchesSearch = fn.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fn.function_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || fn.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(functions.map(fn => fn.category))];

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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Configuración de Funciones IA</h3>
          <p className="text-sm text-muted-foreground">
            Configura modelos, prompts y herramientas para cada función de IA
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Recargar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar funciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.filter(c => c !== 'all').map(cat => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Functions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFunctions.map(fn => (
          <FunctionCard
            key={fn.id}
            config={fn}
            models={models}
            onEdit={() => setEditingFunction(fn)}
            onToggle={() => toggleFunctionActive(fn)}
          />
        ))}
      </div>

      {filteredFunctions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No se encontraron funciones con los filtros actuales
        </div>
      )}

      {/* Edit Dialog */}
      {editingFunction && (
        <FunctionEditDialog
          config={editingFunction}
          models={models}
          open={!!editingFunction}
          onOpenChange={(open) => !open && setEditingFunction(null)}
          onSave={saveFunction}
          saving={saving}
        />
      )}
    </div>
  );
}

interface FunctionCardProps {
  config: FunctionConfig;
  models: ModelCompatibility[];
  onEdit: () => void;
  onToggle: () => void;
}

function FunctionCard({ config, models, onEdit, onToggle }: FunctionCardProps) {
  const modelInfo = models.find(m => m.model_name === config.model_name);
  
  return (
    <Card className={`transition-opacity ${!config.is_active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {CATEGORY_ICONS[config.category] || CATEGORY_ICONS.general}
            <CardTitle className="text-base">{config.display_name}</CardTitle>
          </div>
          <Switch checked={config.is_active} onCheckedChange={onToggle} />
        </div>
        <CardDescription className="text-xs line-clamp-2">
          {config.description || config.function_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="text-xs">
            {modelInfo?.display_name || config.model_name}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {CATEGORY_LABELS[config.category] || config.category}
          </Badge>
        </div>

        {/* Tools badges */}
        {config.tools_enabled && config.tools_enabled.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {config.tools_enabled.map(tool => {
              const toolInfo = AVAILABLE_TOOLS.find(t => t.id === tool);
              const Icon = toolInfo?.icon || Zap;
              return (
                <Badge key={tool} variant="outline" className="text-xs">
                  <Icon className="h-3 w-3 mr-1" />
                  {toolInfo?.name || tool}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Temperature indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Temperatura: {config.temperature}</span>
          <span>Max tokens: {config.max_output_tokens}</span>
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Configurar
        </Button>
      </CardContent>
    </Card>
  );
}

interface FunctionEditDialogProps {
  config: FunctionConfig;
  models: ModelCompatibility[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: FunctionConfig) => void;
  saving: boolean;
}

function FunctionEditDialog({ config, models, open, onOpenChange, onSave, saving }: FunctionEditDialogProps) {
  const [editedConfig, setEditedConfig] = useState<FunctionConfig>(config);

  useEffect(() => {
    setEditedConfig(config);
  }, [config]);

  const selectedModel = models.find(m => m.model_name === editedConfig.model_name);

  const toggleTool = (toolId: string) => {
    const current = editedConfig.tools_enabled || [];
    const updated = current.includes(toolId)
      ? current.filter(t => t !== toolId)
      : [...current, toolId];
    setEditedConfig({ ...editedConfig, tools_enabled: updated });
  };

  const isToolCompatible = (toolId: string) => {
    if (!selectedModel) return true;
    switch (toolId) {
      case 'web_search_preview': return selectedModel.supports_web_search;
      case 'file_search': return selectedModel.supports_file_search;
      case 'code_interpreter': return selectedModel.supports_code_interpreter;
      default: return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar: {config.display_name}</DialogTitle>
          <DialogDescription>
            {config.function_name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="model" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="model">Modelo</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="tools">Herramientas</TabsTrigger>
            <TabsTrigger value="params">Parámetros</TabsTrigger>
          </TabsList>

          <TabsContent value="model" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Modelo de IA</Label>
              <Select 
                value={editedConfig.model_name} 
                onValueChange={(value) => setEditedConfig({ ...editedConfig, model_name: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map(model => (
                    <SelectItem key={model.model_name} value={model.model_name}>
                      <div className="flex items-center gap-2">
                        {model.display_name || model.model_name}
                        {model.supports_web_search && <Globe className="h-3 w-3 text-blue-500" />}
                        {model.supports_reasoning && <Brain className="h-3 w-3 text-purple-500" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedModel && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedModel.supports_web_search && <Badge variant="outline" className="text-xs"><Globe className="h-3 w-3 mr-1" />Web Search</Badge>}
                  {selectedModel.supports_file_search && <Badge variant="outline" className="text-xs"><FileSearch className="h-3 w-3 mr-1" />File Search</Badge>}
                  {selectedModel.supports_code_interpreter && <Badge variant="outline" className="text-xs"><Code className="h-3 w-3 mr-1" />Code</Badge>}
                  {selectedModel.supports_reasoning && <Badge variant="outline" className="text-xs"><Brain className="h-3 w-3 mr-1" />Reasoning</Badge>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select 
                value={editedConfig.category} 
                onValueChange={(value) => setEditedConfig({ ...editedConfig, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nombre para mostrar</Label>
              <Input 
                value={editedConfig.display_name} 
                onChange={(e) => setEditedConfig({ ...editedConfig, display_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea 
                value={editedConfig.description || ''} 
                onChange={(e) => setEditedConfig({ ...editedConfig, description: e.target.value })}
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="prompt" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>System Prompt (Instructions)</Label>
              <Textarea 
                value={editedConfig.system_prompt || ''} 
                onChange={(e) => setEditedConfig({ ...editedConfig, system_prompt: e.target.value })}
                rows={8}
                placeholder="Define el comportamiento y personalidad del modelo..."
              />
              <p className="text-xs text-muted-foreground">
                Este prompt define el comportamiento base del modelo para esta función.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Instrucciones adicionales</Label>
              <Textarea 
                value={editedConfig.instructions || ''} 
                onChange={(e) => setEditedConfig({ ...editedConfig, instructions: e.target.value })}
                rows={4}
                placeholder="Instrucciones adicionales que se añaden al input del usuario..."
              />
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4 mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecciona las herramientas que esta función puede usar. Algunas herramientas solo están disponibles para ciertos modelos.
              </p>

              {AVAILABLE_TOOLS.map(tool => {
                const isCompatible = isToolCompatible(tool.id);
                const isEnabled = editedConfig.tools_enabled?.includes(tool.id);
                const Icon = tool.icon;

                return (
                  <div 
                    key={tool.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${!isCompatible ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                        {!isCompatible && (
                          <p className="text-xs text-destructive">No compatible con {editedConfig.model_name}</p>
                        )}
                      </div>
                    </div>
                    <Switch 
                      checked={isEnabled}
                      onCheckedChange={() => toggleTool(tool.id)}
                      disabled={!isCompatible}
                    />
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label>Tool Choice</Label>
              <Select 
                value={editedConfig.tool_choice} 
                onValueChange={(value) => setEditedConfig({ ...editedConfig, tool_choice: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (recomendado)</SelectItem>
                  <SelectItem value="required">Required</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Llamadas paralelas</Label>
                <p className="text-xs text-muted-foreground">Permite ejecutar múltiples herramientas simultáneamente</p>
              </div>
              <Switch 
                checked={editedConfig.parallel_tool_calls}
                onCheckedChange={(checked) => setEditedConfig({ ...editedConfig, parallel_tool_calls: checked })}
              />
            </div>
          </TabsContent>

          <TabsContent value="params" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Temperatura: {editedConfig.temperature}</Label>
                  <span className="text-xs text-muted-foreground">
                    {editedConfig.temperature < 0.3 ? 'Determinístico' : editedConfig.temperature < 0.7 ? 'Balanceado' : 'Creativo'}
                  </span>
                </div>
                <Slider
                  value={[editedConfig.temperature]}
                  onValueChange={([value]) => setEditedConfig({ ...editedConfig, temperature: value })}
                  min={0}
                  max={2}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Output Tokens</Label>
                <Input 
                  type="number"
                  value={editedConfig.max_output_tokens} 
                  onChange={(e) => setEditedConfig({ ...editedConfig, max_output_tokens: parseInt(e.target.value) || 2000 })}
                  min={100}
                  max={selectedModel?.max_output_tokens || 32000}
                />
                <p className="text-xs text-muted-foreground">
                  Máximo para {editedConfig.model_name}: {selectedModel?.max_output_tokens || 'N/A'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Top P: {editedConfig.top_p}</Label>
                </div>
                <Slider
                  value={[editedConfig.top_p]}
                  onValueChange={([value]) => setEditedConfig({ ...editedConfig, top_p: value })}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>

              {selectedModel?.supports_reasoning && (
                <>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <Label>Reasoning Mode</Label>
                      <p className="text-xs text-muted-foreground">Habilita razonamiento avanzado (modelos O-series)</p>
                    </div>
                    <Switch 
                      checked={editedConfig.reasoning_enabled}
                      onCheckedChange={(checked) => setEditedConfig({ ...editedConfig, reasoning_enabled: checked })}
                    />
                  </div>

                  {editedConfig.reasoning_enabled && (
                    <div className="space-y-2">
                      <Label>Esfuerzo de razonamiento</Label>
                      <Select 
                        value={editedConfig.reasoning_effort} 
                        onValueChange={(value) => setEditedConfig({ ...editedConfig, reasoning_effort: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Bajo (más rápido)</SelectItem>
                          <SelectItem value="medium">Medio (balanceado)</SelectItem>
                          <SelectItem value="high">Alto (más profundo)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={() => onSave(editedConfig)} disabled={saving}>
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
