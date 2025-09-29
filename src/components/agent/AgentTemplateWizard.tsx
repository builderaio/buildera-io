import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  MessageSquare, 
  Brain,
  Globe,
  DollarSign,
  Rocket,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  FileText,
  Settings,
  Users
} from 'lucide-react';

interface AgentTemplate {
  name: string;
  description: string;
  category: string;
  purpose: string;
  personality: {
    tone: string;
    style: string;
    expertise_level: string;
  };
  capabilities: string[];
  knowledge_sources: string[];
  integrations: string[];
  customization_options: {
    branding: boolean;
    custom_responses: boolean;
    workflow_rules: boolean;
  };
  pricing: {
    model: 'free' | 'subscription' | 'usage_based';
    amount: number;
    revenue_share: number;
  };
}

const categories = [
  { id: 'marketing', name: 'Marketing', icon: Sparkles, color: 'bg-category-marketing text-category-marketing-foreground' },
  { id: 'servicio-cliente', name: 'Servicio al Cliente', icon: MessageSquare, color: 'bg-category-servicio-cliente text-category-servicio-cliente-foreground' },
  { id: 'recursos-humanos', name: 'Recursos Humanos', icon: Users, color: 'bg-category-recursos-humanos text-category-recursos-humanos-foreground' },
  { id: 'contabilidad', name: 'Contabilidad', icon: DollarSign, color: 'bg-category-contabilidad text-category-contabilidad-foreground' },
  { id: 'analytics', name: 'Analytics', icon: Brain, color: 'bg-category-analytics text-category-analytics-foreground' },
  { id: 'general', name: 'General', icon: Bot, color: 'bg-category-general text-category-general-foreground' }
];

const capabilities = [
  'Procesamiento de Lenguaje Natural',
  'Análisis de Sentimientos',
  'Generación de Contenido',
  'Respuestas Automáticas',
  'Clasificación de Tickets',
  'Extracción de Datos',
  'Traducción Multiidioma',
  'Análisis Predictivo'
];

const integrations = [
  'Widget de Chat Web',
  'API REST Personalizada',
  'Webhook Endpoints',
  'Dashboard Widget',
  'Email Automation',
  'SMS Notifications',
  'Analytics Tracking',
  'Knowledge Base Integration',
  'File Upload Handler',
  'Form Processor',
  'Calendar Integration',
  'PDF Generator',
  'Report Builder',
  'Data Export API',
  'Real-time Notifications',
  'User Authentication API'
];

export function AgentTemplateWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [template, setTemplate] = useState<AgentTemplate>({
    name: '',
    description: '',
    category: '',
    purpose: '',
    personality: {
      tone: 'professional',
      style: 'helpful',
      expertise_level: 'intermediate'
    },
    capabilities: [],
    knowledge_sources: [],
    integrations: [],
    customization_options: {
      branding: true,
      custom_responses: true,
      workflow_rules: false
    },
    pricing: {
      model: 'free',
      amount: 0,
      revenue_share: 70
    }
  });

  const totalSteps = 6;
  const stepTitles = [
    'Información Básica',
    'Propósito y Personalidad',
    'Capacidades de IA',
    'Base de Conocimiento',
    'Integraciones',
    'Precios y Publicación'
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('No user found');

      const { error } = await supabase
        .from('whitelabel_agent_templates')
        .insert({
          developer_id: user.user.id,
          template_name: template.name,
          description: template.description,
          category: template.category,
          flow_definition: {
            purpose: template.purpose,
            personality: template.personality
          },
          ai_capabilities: template.capabilities,
          knowledge_base_config: template.knowledge_sources,
          integration_config: template.integrations,
          customization_options: template.customization_options,
          pricing_model: template.pricing.model,
          base_price: template.pricing.amount,
          revenue_share_percentage: template.pricing.revenue_share,
          is_published: true
        });

      if (error) throw error;

      toast({
        title: "🎉 Agente Creado",
        description: "Tu plantilla de agente ha sido creada y está lista para ser desplegada por empresas."
      });

      navigate('/whitelabel/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Nombre del Agente</Label>
              <Input
                id="name"
                placeholder="ej. Asistente de Marketing Pro"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción Breve</Label>
              <Textarea
                id="description"
                placeholder="Una breve descripción de qué hace tu agente y por qué es útil..."
                value={template.description}
                onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <Label>Categoría</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setTemplate({ ...template, category: category.id })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        template.category === category.id
                          ? `border-primary ${category.color}`
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-sm font-medium">{category.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="purpose">Propósito Principal</Label>
              <Textarea
                id="purpose"
                placeholder="Describe el propósito principal de tu agente: qué problemas resuelve, cómo ayuda a las empresas..."
                value={template.purpose}
                onChange={(e) => setTemplate({ ...template, purpose: e.target.value })}
                className="mt-2"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tone">Tono de Comunicación</Label>
                <Select 
                  value={template.personality.tone} 
                  onValueChange={(value) => 
                    setTemplate({ 
                      ...template, 
                      personality: { ...template.personality, tone: value } 
                    })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profesional</SelectItem>
                    <SelectItem value="friendly">Amigable</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="style">Estilo de Respuesta</Label>
                <Select 
                  value={template.personality.style} 
                  onValueChange={(value) => 
                    setTemplate({ 
                      ...template, 
                      personality: { ...template.personality, style: value } 
                    })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="helpful">Servicial</SelectItem>
                    <SelectItem value="concise">Conciso</SelectItem>
                    <SelectItem value="detailed">Detallado</SelectItem>
                    <SelectItem value="creative">Creativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expertise">Nivel de Expertise</Label>
                <Select 
                  value={template.personality.expertise_level} 
                  onValueChange={(value) => 
                    setTemplate({ 
                      ...template, 
                      personality: { ...template.personality, expertise_level: value } 
                    })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="expert">Experto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label>Capacidades de IA</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Selecciona las capacidades que tu agente necesita
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {capabilities.map((capability) => (
                  <div key={capability} className="flex items-center space-x-3">
                    <Switch
                      checked={template.capabilities.includes(capability)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTemplate({
                            ...template,
                            capabilities: [...template.capabilities, capability]
                          });
                        } else {
                          setTemplate({
                            ...template,
                            capabilities: template.capabilities.filter(c => c !== capability)
                          });
                        }
                      }}
                    />
                    <Label className="text-sm">{capability}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label>Base de Conocimiento</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Define los tipos de información que tu agente necesita conocer
              </p>
              
              <div className="mt-4 space-y-3">
                {template.knowledge_sources.map((source, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={source}
                      onChange={(e) => {
                        const newSources = [...template.knowledge_sources];
                        newSources[index] = e.target.value;
                        setTemplate({ ...template, knowledge_sources: newSources });
                      }}
                      placeholder="ej. Documentos de producto, FAQ, políticas de empresa..."
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSources = template.knowledge_sources.filter((_, i) => i !== index);
                        setTemplate({ ...template, knowledge_sources: newSources });
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setTemplate({
                      ...template,
                      knowledge_sources: [...template.knowledge_sources, '']
                    });
                  }}
                >
                  + Agregar Fuente de Conocimiento
                </Button>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label>Integraciones Disponibles</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Selecciona las plataformas con las que tu agente puede integrarse
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {integrations.map((integration) => (
                  <div key={integration} className="flex items-center space-x-3">
                    <Switch
                      checked={template.integrations.includes(integration)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTemplate({
                            ...template,
                            integrations: [...template.integrations, integration]
                          });
                        } else {
                          setTemplate({
                            ...template,
                            integrations: template.integrations.filter(i => i !== integration)
                          });
                        }
                      }}
                    />
                    <Label className="text-sm">{integration}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Opciones de Personalización</Label>
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Branding Personalizado</Label>
                    <p className="text-sm text-muted-foreground">
                      Las empresas pueden personalizar colores, logos y estilo
                    </p>
                  </div>
                  <Switch
                    checked={template.customization_options.branding}
                    onCheckedChange={(checked) =>
                      setTemplate({
                        ...template,
                        customization_options: {
                          ...template.customization_options,
                          branding: checked
                        }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Respuestas Personalizadas</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite modificar respuestas específicas del agente
                    </p>
                  </div>
                  <Switch
                    checked={template.customization_options.custom_responses}
                    onCheckedChange={(checked) =>
                      setTemplate({
                        ...template,
                        customization_options: {
                          ...template.customization_options,
                          custom_responses: checked
                        }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reglas de Flujo de Trabajo</Label>
                    <p className="text-sm text-muted-foreground">
                      Configuración avanzada de comportamientos específicos
                    </p>
                  </div>
                  <Switch
                    checked={template.customization_options.workflow_rules}
                    onCheckedChange={(checked) =>
                      setTemplate({
                        ...template,
                        customization_options: {
                          ...template.customization_options,
                          workflow_rules: checked
                        }
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <Label>Modelo de Precios</Label>
              <Tabs 
                value={template.pricing.model} 
                onValueChange={(value: any) => 
                  setTemplate({ 
                    ...template, 
                    pricing: { ...template.pricing, model: value, amount: value === 'free' ? 0 : template.pricing.amount } 
                  })
                }
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="free">Gratuito</TabsTrigger>
                  <TabsTrigger value="subscription">Suscripción</TabsTrigger>
                  <TabsTrigger value="usage_based">Por Uso</TabsTrigger>
                </TabsList>
                
                <TabsContent value="free" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        Tu agente será completamente gratuito. Ideal para ganar popularidad y conseguir reviews.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="subscription" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div>
                        <Label htmlFor="monthly-price">Precio Mensual (USD)</Label>
                        <Input
                          id="monthly-price"
                          type="number"
                          placeholder="29"
                          value={template.pricing.amount}
                          onChange={(e) => 
                            setTemplate({ 
                              ...template, 
                              pricing: { ...template.pricing, amount: Number(e.target.value) } 
                            })
                          }
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="usage_based" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div>
                        <Label htmlFor="per-interaction">Precio por Interacción (USD)</Label>
                        <Input
                          id="per-interaction"
                          type="number"
                          step="0.01"
                          placeholder="0.10"
                          value={template.pricing.amount}
                          onChange={(e) => 
                            setTemplate({ 
                              ...template, 
                              pricing: { ...template.pricing, amount: Number(e.target.value) } 
                            })
                          }
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {template.pricing.model !== 'free' && (
              <div>
                <Label htmlFor="revenue-share">Revenue Share (%)</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Porcentaje que recibes de cada venta (Buildera se queda con el resto)
                </p>
                <Input
                  id="revenue-share"
                  type="number"
                  min="0"
                  max="90"
                  value={template.pricing.revenue_share}
                  onChange={(e) => 
                    setTemplate({ 
                      ...template, 
                      pricing: { ...template.pricing, revenue_share: Number(e.target.value) } 
                    })
                  }
                  className="mt-2"
                />
              </div>
            )}

            <div className="p-4 bg-primary/5 rounded-lg">
              <h4 className="font-semibold mb-2">Resumen del Agente</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Nombre:</strong> {template.name}</p>
                <p><strong>Categoría:</strong> {categories.find(c => c.id === template.category)?.name}</p>
                <p><strong>Capacidades:</strong> {template.capabilities.length} seleccionadas</p>
                <p><strong>Integraciones:</strong> {template.integrations.length} disponibles</p>
                <p><strong>Precio:</strong> {
                  template.pricing.model === 'free' ? 'Gratuito' :
                  template.pricing.model === 'subscription' ? `$${template.pricing.amount}/mes` :
                  `$${template.pricing.amount} por uso`
                }</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/whitelabel/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Crear Agente</h1>
              <p className="text-muted-foreground mt-1">
                Crea un agente que las empresas puedan contratar para automatizar su trabajo
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Paso {currentStep} de {totalSteps}
              </span>
              <div className="flex space-x-1">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="w-5 h-5" />
                <span>{stepTitles[currentStep - 1]}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStep()}
              
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                
                {currentStep < totalSteps ? (
                  <Button
                    onClick={handleNext}
                    disabled={
                      (currentStep === 1 && (!template.name || !template.description || !template.category)) ||
                      (currentStep === 2 && !template.purpose)
                    }
                  >
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSave} className="bg-gradient-primary">
                    <Rocket className="w-4 h-4 mr-2" />
                    Publicar Agente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}