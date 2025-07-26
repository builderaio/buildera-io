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
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  ArrowRight,
  Save,
  X,
  Plus, 
  Activity, 
  CheckCircle,
  MessageSquare,
  Globe,
  Mail,
  FileSpreadsheet,
  Webhook,
  FileText
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
  const [currentStep, setCurrentStep] = useState(1);
  
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
  
  // Ecosistema: Configuración por roles
  const [developerTools, setDeveloperTools] = useState<string[]>([]);
  const [expertRequirements, setExpertRequirements] = useState<string[]>([]);
  const [companyDataFields, setCompanyDataFields] = useState<string[]>([]);
  
  const totalSteps = 4;

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
            // Configuración del ecosistema
            developer_tools: developerTools,
            expert_requirements: expertRequirements,
            company_data_fields: companyDataFields,
          } as any,
          created_by: user?.username,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Plantilla de agente creada correctamente con configuración del ecosistema",
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
    { value: 'recursos_humanos', label: 'Recursos Humanos' },
    { value: 'servicio_cliente', label: 'Servicio al Cliente' },
    { value: 'contabilidad', label: 'Contabilidad' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'general', label: 'General' }
  ];

  const icons = [
    { emoji: '🤖', name: 'Robot' },
    { emoji: '🧠', name: 'Cerebro' },
    { emoji: '💼', name: 'Negocios' },
    { emoji: '📊', name: 'Analytics' },
    { emoji: '🔍', name: 'Investigación' },
    { emoji: '⚡', name: 'Automatización' },
    { emoji: '🎯', name: 'Objetivos' },
    { emoji: '🚀', name: 'Productividad' },
    { emoji: '💡', name: 'Ideas' },
    { emoji: '🔧', name: 'Herramientas' },
    { emoji: '👥', name: 'Recursos Humanos' },
    { emoji: '💬', name: 'Comunicación' },
    { emoji: '📈', name: 'Crecimiento' },
    { emoji: '🏆', name: 'Éxito' },
    { emoji: '📱', name: 'Digital' },
    { emoji: '💳', name: 'Finanzas' },
    { emoji: '📋', name: 'Gestión' },
    { emoji: '🌐', name: 'Global' },
    { emoji: '📞', name: 'Soporte' },
    { emoji: '🔒', name: 'Seguridad' }
  ];

  // Funciones para manejar el ecosistema
  const addDeveloperTool = (tool: string) => {
    if (tool.trim() && !developerTools.includes(tool.trim())) {
      setDeveloperTools([...developerTools, tool.trim()]);
    }
  };

  const addExpertRequirement = (requirement: string) => {
    if (requirement.trim() && !expertRequirements.includes(requirement.trim())) {
      setExpertRequirements([...expertRequirements, requirement.trim()]);
    }
  };

  const addCompanyDataField = (field: string) => {
    if (field.trim() && !companyDataFields.includes(field.trim())) {
      setCompanyDataFields([...companyDataFields, field.trim()]);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderDeveloperTools();
      case 3:
        return renderExpertRequirements();
      case 4:
        return renderCompanyRequirements();
      default:
        return null;
    }
  };

  const renderBasicInfo = () => (
    <>
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
              <Label htmlFor="icon">Icono del Agente</Label>
              <div className="grid grid-cols-5 gap-2">
                {icons.map(iconData => (
                  <button
                    key={iconData.emoji}
                    type="button"
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg hover:border-primary transition-colors ${
                      formData.icon === iconData.emoji ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                    onClick={() => setFormData({...formData, icon: iconData.emoji})}
                    title={iconData.name}
                  >
                    {iconData.emoji}
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
          <CardTitle>Instrucciones Base del Agente</CardTitle>
          <CardDescription>
            Define las instrucciones generales. Los expertos las personalizarán después.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instrucciones Base</Label>
            <Textarea
              id="instructions"
              value={formData.instructions_template}
              onChange={(e) => setFormData({...formData, instructions_template: e.target.value})}
              placeholder="Describe el comportamiento general del agente..."
              rows={6}
              required
            />
          </div>
        </CardContent>
      </Card>
    </>
  );

  const renderDeveloperTools = () => (
    <Card>
      <CardHeader>
        <CardTitle>🔧 Herramientas para Desarrolladores</CardTitle>
        <CardDescription>
          Define las herramientas técnicas que los desarrolladores deben crear o configurar para este agente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Rol: Desarrolladores</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Los desarrolladores crearán herramientas técnicas usando Python, APIs, integraciones y funciones personalizadas 
            que permitirán al agente resolver las necesidades específicas de las empresas.
          </p>
        </div>

        <div className="space-y-3">
          <Label>Herramientas Integradas Estándar</Label>
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
          <Label>Herramientas Personalizadas (Python/APIs)</Label>
          <div className="flex space-x-2">
            <Input
              value={newFunction}
              onChange={(e) => setNewFunction(e.target.value)}
              placeholder="ej. analizar_competencia_sector, integrar_api_mercado"
              onKeyPress={(e) => e.key === 'Enter' && addCustomFunction()}
            />
            <Button type="button" onClick={addCustomFunction}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {customFunctions.map(func => (
              <Badge key={func} variant="secondary" className="flex items-center gap-1">
                {func}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeCustomFunction(func)}
                />
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Requerimientos Técnicos Adicionales</Label>
          <div className="flex space-x-2">
            <Input
              placeholder="ej. Base de datos especializada, API externa específica"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  addDeveloperTool(input.value);
                  input.value = '';
                }
              }}
            />
            <Button type="button" onClick={(e) => {
              const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
              addDeveloperTool(input.value);
              input.value = '';
            }}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {developerTools.map(tool => (
              <Badge key={tool} variant="outline" className="flex items-center gap-1">
                {tool}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => setDeveloperTools(developerTools.filter(t => t !== tool))}
                />
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderExpertRequirements = () => (
    <Card>
      <CardHeader>
        <CardTitle>🧠 Configuración para Expertos</CardTitle>
        <CardDescription>
          Define qué conocimiento especializado y configuración de prompts necesitan los expertos para este agente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Rol: Expertos</h4>
          <p className="text-sm text-green-700 dark:text-green-300">
            Los expertos en cada área de conocimiento crearán los prompts especializados, definirán las bases de conocimiento 
            y configurarán los comportamientos específicos del agente según su expertise.
          </p>
        </div>

        <div className="space-y-3">
          <Label>Áreas de Expertise Requeridas</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              'Marketing Digital', 'Finanzas', 'Recursos Humanos', 'Ventas', 'Operaciones',
              'Atención al Cliente', 'Análisis de Datos', 'Estrategia Empresarial', 'Compliance',
              'Tecnología', 'Cadena de Suministro', 'Innovación'
            ].map(area => (
              <div key={area} className="flex items-center space-x-2">
                <Switch
                  checked={expertRequirements.includes(area)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      addExpertRequirement(area);
                    } else {
                      setExpertRequirements(expertRequirements.filter(req => req !== area));
                    }
                  }}
                />
                <Label className="text-sm">{area}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Especialidades Adicionales Requeridas</Label>
          <div className="flex space-x-2">
            <Input
              placeholder="ej. Normativa específica del sector, Metodología Lean"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  addExpertRequirement(input.value);
                  input.value = '';
                }
              }}
            />
            <Button type="button" onClick={(e) => {
              const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
              addExpertRequirement(input.value);
              input.value = '';
            }}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {expertRequirements.filter(req => ![
              'Marketing Digital', 'Finanzas', 'Recursos Humanos', 'Ventas', 'Operaciones',
              'Atención al Cliente', 'Análisis de Datos', 'Estrategia Empresarial', 'Compliance',
              'Tecnología', 'Cadena de Suministro', 'Innovación'
            ].includes(req)).map(req => (
              <Badge key={req} variant="secondary" className="flex items-center gap-1">
                {req}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => setExpertRequirements(expertRequirements.filter(r => r !== req))}
                />
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Interfaces de Interacción</Label>
          <div className="grid gap-3">
            {interactionInterfaces.map(interface_ => (
              <div 
                key={interface_.id} 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedInterfaces.includes(interface_.id) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => toggleInterface(interface_.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <interface_.icon className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">{interface_.name}</h4>
                      <p className="text-sm text-muted-foreground">{interface_.description}</p>
                      <Badge variant="outline" className={getCategoryColor(interface_.category)}>
                        {interface_.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {selectedInterfaces.includes(interface_.id) && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompanyRequirements = () => (
    <Card>
      <CardHeader>
        <CardTitle>🏢 Información Requerida de la Empresa</CardTitle>
        <CardDescription>
          Define qué información específica debe proporcionar cada empresa para personalizar su agente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
          <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Rol: Empresas</h4>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Las empresas proporcionarán la información específica de su negocio, datos contextuales 
            y configuraciones particulares necesarias para que el agente opere en su entorno específico.
          </p>
        </div>

        <div className="space-y-3">
          <Label>Información Empresarial Básica</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'Nombre de la empresa', 'Sector/Industria', 'Tamaño de empresa', 'Ubicación geográfica',
              'Página web corporativa', 'Modelo de negocio', 'Mercados objetivo', 'Propuesta de valor',
              'Estructura organizacional', 'Políticas internas', 'Normativas aplicables', 'Competidores principales'
            ].map(field => (
              <div key={field} className="flex items-center space-x-2">
                <Switch
                  checked={companyDataFields.includes(field)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      addCompanyDataField(field);
                    } else {
                      setCompanyDataFields(companyDataFields.filter(f => f !== field));
                    }
                  }}
                />
                <Label className="text-sm">{field}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Información Específica Adicional</Label>
          <div className="flex space-x-2">
            <Input
              placeholder="ej. Catálogo de productos, Base de clientes, Procesos internos"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  addCompanyDataField(input.value);
                  input.value = '';
                }
              }}
            />
            <Button type="button" onClick={(e) => {
              const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
              addCompanyDataField(input.value);
              input.value = '';
            }}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {companyDataFields.filter(field => ![
              'Nombre de la empresa', 'Sector/Industria', 'Tamaño de empresa', 'Ubicación geográfica',
              'Página web corporativa', 'Modelo de negocio', 'Mercados objetivo', 'Propuesta de valor',
              'Estructura organizacional', 'Políticas internas', 'Normativas aplicables', 'Competidores principales'
            ].includes(field)).map(field => (
              <Badge key={field} variant="outline" className="flex items-center gap-1">
                {field}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => setCompanyDataFields(companyDataFields.filter(f => f !== field))}
                />
              </Badge>
            ))}
          </div>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">⚠️ Importante</h4>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Los campos seleccionados se convertirán en requerimientos obligatorios durante la configuración 
            del agente por parte de la empresa. Asegúrate de incluir solo información realmente necesaria.
          </p>
        </div>
      </CardContent>
    </Card>
  );

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
                  <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">
                    Crear Plantilla de Agente - Paso {currentStep} de {totalSteps}
                  </h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Portal Admin - Buildera</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="hidden md:block">
                <Progress value={(currentStep / totalSteps) * 100} className="w-32" />
              </div>
              <ThemeSelector />
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:block">{user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Indicador de pasos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === currentStep 
                        ? 'bg-primary text-primary-foreground' 
                        : step < currentStep 
                          ? 'bg-green-500 text-white' 
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
                    </div>
                    {step < totalSteps && (
                      <div className={`w-16 h-1 mx-2 ${
                        step < currentStep ? 'bg-green-500' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold">
                  {currentStep === 1 && "Información Básica"}
                  {currentStep === 2 && "Herramientas para Desarrolladores"}
                  {currentStep === 3 && "Configuración para Expertos"}
                  {currentStep === 4 && "Requerimientos de Empresa"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentStep === 1 && "Define los datos fundamentales del agente"}
                  {currentStep === 2 && "Especifica las herramientas técnicas necesarias"}
                  {currentStep === 3 && "Define el conocimiento especializado requerido"}
                  {currentStep === 4 && "Especifica la información empresarial necesaria"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contenido del paso actual */}
          {renderStepContent()}

          {/* Navegación */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/agent-templates')}
              >
                Cancelar
              </Button>
              
              {currentStep < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Crear Plantilla
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AdminCreateAgentTemplate;