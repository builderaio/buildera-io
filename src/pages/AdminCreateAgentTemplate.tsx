import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Save,
  X,
  Bot, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Activity, 
  FileText, 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  MessageSquare,
  Globe,
  Mail,
  FileSpreadsheet,
  Code,
  Webhook
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import ThemeSelector from '@/components/ThemeSelector';

interface ToolConfig {
  name: string;
  type: 'web_browser' | 'code_interpreter' | 'file_search' | 'function';
  enabled: boolean;
  config?: Record<string, any>;
}

interface InteractionInterface {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'conversational' | 'automation' | 'data' | 'integration';
  config_schema: Record<string, any>;
}

const AdminCreateAgentTemplate = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions_template: '',
    category: 'general',
    pricing_model: 'free',
    pricing_amount: 0,
    icon: '🤖',
    is_featured: false,
    version: '1.0.0',
  });

  const [tools, setTools] = useState<ToolConfig[]>([
    { name: 'web_browser', type: 'web_browser', enabled: false },
    { name: 'code_interpreter', type: 'code_interpreter', enabled: false },
    { name: 'file_search', type: 'file_search', enabled: false },
  ]);

  const [customFunctions, setCustomFunctions] = useState<string[]>([]);
  const [newFunction, setNewFunction] = useState('');
  const [selectedInterfaces, setSelectedInterfaces] = useState<string[]>([]);

  // Definir interfaces de interacción disponibles
  const interactionInterfaces: InteractionInterface[] = [
    {
      id: 'chat',
      name: 'Chat Conversacional',
      description: 'Los usuarios interactúan con el agente mediante chat en tiempo real',
      icon: MessageSquare,
      category: 'conversational',
      config_schema: {
        welcome_message: 'string',
        max_conversation_length: 'number',
        response_style: 'enum'
      }
    },
    {
      id: 'form_wizard',
      name: 'Formularios Inteligentes',
      description: 'El agente presenta formularios dinámicos para recopilar información',
      icon: FileText,
      category: 'data',
      config_schema: {
        form_fields: 'array',
        validation_rules: 'object',
        completion_callback: 'string'
      }
    },
    {
      id: 'email_monitor',
      name: 'Monitor de Correos',
      description: 'El agente lee y responde correos automáticamente',
      icon: Mail,
      category: 'automation',
      config_schema: {
        email_filters: 'array',
        response_templates: 'object',
        auto_reply_rules: 'object'
      }
    },
    {
      id: 'web_widget',
      name: 'Widget Web',
      description: 'Embebido en páginas web como chat o formulario',
      icon: Globe,
      category: 'integration',
      config_schema: {
        widget_style: 'object',
        trigger_events: 'array',
        page_integration: 'object'
      }
    },
    {
      id: 'api_webhook',
      name: 'API/Webhook',
      description: 'Recibe datos vía API y responde programáticamente',
      icon: Webhook,
      category: 'integration',
      config_schema: {
        webhook_url: 'string',
        authentication: 'object',
        response_format: 'enum'
      }
    },
    {
      id: 'dashboard',
      name: 'Dashboard Ejecutivo',
      description: 'Presenta resultados en dashboards visuales interactivos',
      icon: FileSpreadsheet,
      category: 'data',
      config_schema: {
        chart_types: 'array',
        update_frequency: 'enum',
        data_sources: 'array'
      }
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const toolsConfig = [
        ...tools.filter(tool => tool.enabled),
        ...customFunctions.map(func => ({
          name: func,
          type: 'function' as const,
          enabled: true,
          config: { function_name: func }
        }))
      ];

      const { error } = await supabase
        .from('agent_templates')
        .insert({
          ...formData,
          tools_config: toolsConfig as any,
          permissions_template: {
            allowed_tools: tools.filter(t => t.enabled).map(t => t.type),
            custom_functions: customFunctions,
            interaction_interfaces: selectedInterfaces,
          } as any,
          created_by: user?.username,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Plantilla de agente creada correctamente",
      });

      navigate('/admin/agent-templates');
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la plantilla",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTool = (toolName: string) => {
    setTools(tools.map(tool => 
      tool.name === toolName 
        ? { ...tool, enabled: !tool.enabled }
        : tool
    ));
  };

  const addCustomFunction = () => {
    if (newFunction.trim() && !customFunctions.includes(newFunction.trim())) {
      setCustomFunctions([...customFunctions, newFunction.trim()]);
      setNewFunction('');
    }
  };

  const removeCustomFunction = (func: string) => {
    setCustomFunctions(customFunctions.filter(f => f !== func));
  };

  const toggleInterface = (interfaceId: string) => {
    setSelectedInterfaces(prev => 
      prev.includes(interfaceId)
        ? prev.filter(id => id !== interfaceId)
        : [...prev, interfaceId]
    );
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      conversational: 'bg-blue-100 text-blue-800',
      automation: 'bg-green-100 text-green-800',
      data: 'bg-purple-100 text-purple-800',
      integration: 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const categories = [
    { value: 'marketing', label: 'Marketing' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'research', label: 'Research' },
    { value: 'automation', label: 'Automation' },
    { value: 'general', label: 'General' },
  ];

  const icons = ['🤖', '🧠', '💼', '📊', '🔍', '⚡', '🎯', '🚀', '💡', '🔧'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/agent-templates')}
                className="flex items-center p-2 sm:px-3 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Volver a Plantillas</span>
              </Button>
              <div className="h-4 sm:h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center min-w-0">
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">Crear Plantilla de Agente</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Portal Admin - Buildera</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <ThemeSelector />
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:block">{user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Define los datos fundamentales de la plantilla de agente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Agente</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="ej. Agente de Inteligencia de Mercado"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe qué hace este agente y para qué sirve..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icono</Label>
                  <div className="flex gap-2 flex-wrap">
                    {icons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg hover:border-primary ${
                          formData.icon === icon ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                        onClick={() => setFormData({...formData, icon})}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricing_model">Modelo de Precio</Label>
                  <Select value={formData.pricing_model} onValueChange={(value) => setFormData({...formData, pricing_model: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Gratis</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="subscription">Suscripción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.pricing_model !== 'free' && (
                  <div className="space-y-2">
                    <Label htmlFor="pricing_amount">Precio</Label>
                    <Input
                      id="pricing_amount"
                      type="number"
                      value={formData.pricing_amount}
                      onChange={(e) => setFormData({...formData, pricing_amount: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({...formData, is_featured: checked})}
                />
                <Label htmlFor="featured">Destacar en el marketplace</Label>
              </div>
            </CardContent>
          </Card>

          {/* Instrucciones del Agente */}
          <Card>
            <CardHeader>
              <CardTitle>Instrucciones del Agente</CardTitle>
              <CardDescription>
                Define las instrucciones que guiarán el comportamiento del agente. 
                Usa placeholders como {"{{company_name}}"}, {"{{industry}}"} para personalización automática.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="instructions">Instrucciones Base</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions_template}
                  onChange={(e) => setFormData({...formData, instructions_template: e.target.value})}
                  placeholder={`Eres un agente especializado en inteligencia de mercado para {{company_name}}, una empresa del sector {{industry}}.

Tu objetivo es:
- Analizar la competencia de {{company_name}}
- Identificar oportunidades de mercado
- Generar reportes detallados con insights accionables

Siempre mantén un tono profesional y basa tus análisis en datos concretos.`}
                  rows={8}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Herramientas y Capacidades */}
          <Card>
            <CardHeader>
              <CardTitle>Herramientas y Capacidades</CardTitle>
              <CardDescription>
                Selecciona las herramientas que el agente podrá utilizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Herramientas Integradas</Label>
                {tools.map(tool => (
                  <div key={tool.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium capitalize">
                        {tool.name.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tool.type === 'web_browser' && 'Navegar y buscar información en la web'}
                        {tool.type === 'code_interpreter' && 'Ejecutar código Python para análisis'}
                        {tool.type === 'file_search' && 'Buscar información en archivos subidos'}
                      </div>
                    </div>
                    <Switch
                      checked={tool.enabled}
                      onCheckedChange={() => toggleTool(tool.name)}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Label>Funciones Personalizadas</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFunction}
                    onChange={(e) => setNewFunction(e.target.value)}
                    placeholder="Nombre de función personalizada"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomFunction())}
                  />
                  <Button type="button" variant="outline" onClick={addCustomFunction}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {customFunctions.map(func => (
                    <Badge key={func} variant="secondary" className="flex items-center gap-1">
                      {func}
                      <button
                        type="button"
                        onClick={() => removeCustomFunction(func)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interfaces de Interacción */}
          <Card>
            <CardHeader>
              <CardTitle>Interfaces de Interacción</CardTitle>
              <CardDescription>
                Define cómo los usuarios interactuarán con este agente. Puedes seleccionar múltiples interfaces.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {interactionInterfaces.map(interactionInterface => {
                  const IconComponent = interactionInterface.icon;
                  const isSelected = selectedInterfaces.includes(interactionInterface.id);
                  
                  return (
                    <div
                      key={interactionInterface.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleInterface(interactionInterface.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{interactionInterface.name}</h4>
                            <Badge 
                              variant="outline" 
                              className={getCategoryColor(interactionInterface.category)}
                            >
                              {interactionInterface.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {interactionInterface.description}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {selectedInterfaces.length > 0 && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium mb-2">Interfaces seleccionadas:</div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedInterfaces.map(interfaceId => {
                      const interactionInterface = interactionInterfaces.find(i => i.id === interfaceId);
                      return interactionInterface ? (
                        <Badge key={interfaceId} variant="secondary">
                          {interactionInterface.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              {selectedInterfaces.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Selecciona al menos una interfaz de interacción</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex gap-3 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/admin/agent-templates')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Plantilla
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AdminCreateAgentTemplate;