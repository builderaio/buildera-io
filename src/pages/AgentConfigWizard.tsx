import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  ArrowRight, 
  Bot, 
  CheckCircle, 
  Settings, 
  MessageSquare,
  Globe,
  Mail,
  FileSpreadsheet,
  Webhook,
  FileText,
  Play,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  instructions_template: string;
  tools_config: any;
  permissions_template: any;
  icon: string;
  category: string;
}

interface InterfaceConfig {
  id: string;
  enabled: boolean;
  config: Record<string, any>;
}

const AgentConfigWizard = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<AgentTemplate | null>(null);
  const [agentName, setAgentName] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [interfaceConfigs, setInterfaceConfigs] = useState<InterfaceConfig[]>([]);
  
  const totalSteps = 4;

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      setTemplate(data);
      setAgentName(`${data.name} - Mi Empresa`);
      setCustomInstructions(data.instructions_template);
      
      // Inicializar configuraciones de interfaz
      const permissions = data.permissions_template as any;
      const interfacesObj = permissions?.interaction_interfaces || {};
      const interfaceIds = Object.keys(interfacesObj);
      setInterfaceConfigs(
        interfaceIds.map((id: string) => ({
          id,
          enabled: true,
          config: {}
        }))
      );
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la plantilla del agente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInterfaceToggle = (interfaceId: string) => {
    setInterfaceConfigs(configs => 
      configs.map(config => 
        config.id === interfaceId 
          ? { ...config, enabled: !config.enabled }
          : config
      )
    );
  };

  const handleInterfaceConfig = (interfaceId: string, configKey: string, value: any) => {
    setInterfaceConfigs(configs => 
      configs.map(config => 
        config.id === interfaceId 
          ? { 
              ...config, 
              config: { ...config.config, [configKey]: value }
            }
          : config
      )
    );
  };

  const deployAgent = async () => {
    try {
      setLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Usuario no autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, industry')
        .eq('user_id', user.id)
        .single();

      // Contextualizar instrucciones
      const contextualizedInstructions = customInstructions
        .replace(/\{\{company_name\}\}/g, profile?.company_name || 'Tu empresa')
        .replace(/\{\{industry\}\}/g, profile?.industry || 'tu industria');

      const { error } = await supabase
        .from('agent_instances')
        .insert({
          template_id: templateId,
          user_id: user.id,
          name: agentName,
          contextualized_instructions: contextualizedInstructions,
          tenant_config: {
            company_name: profile?.company_name,
            industry: profile?.industry,
            interface_configs: interfaceConfigs.filter(c => c.enabled),
          } as any,
          tools_permissions: template?.tools_config as any,
        });

      if (error) throw error;

      toast({
        title: "¡Agente desplegado exitosamente!",
        description: `${agentName} está listo para trabajar`,
      });

      navigate('/company-dashboard?view=mis-agentes');
    } catch (error) {
      console.error('Error deploying agent:', error);
      toast({
        title: "Error",
        description: "No se pudo desplegar el agente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInterfaceIcon = (interfaceId: string) => {
    const icons: Record<string, any> = {
      chat: MessageSquare,
      form_wizard: FileText,
      email_monitor: Mail,
      web_widget: Globe,
      api_webhook: Webhook,
      dashboard: FileSpreadsheet,
    };
    return icons[interfaceId] || Bot;
  };

  const getInterfaceName = (interfaceId: string) => {
    const names: Record<string, string> = {
      chat: 'Chat Conversacional',
      form_wizard: 'Formularios Inteligentes',
      email_monitor: 'Monitor de Correos',
      web_widget: 'Widget Web',
      api_webhook: 'API/Webhook',
      dashboard: 'Dashboard Ejecutivo',
    };
    return names[interfaceId] || interfaceId;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Información del Agente
              </CardTitle>
              <CardDescription>
                Personaliza los detalles básicos de tu agente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agent-name">Nombre del Agente</Label>
                <Input
                  id="agent-name"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="ej. Agente de Marketing - ACME Corp"
                />
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-xl">
                    {template?.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{template?.name}</h3>
                    <Badge variant="outline">{template?.category}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {template?.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Personalización de Instrucciones
              </CardTitle>
              <CardDescription>
                Ajusta las instrucciones del agente para tu empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instructions">Instrucciones Personalizadas</Label>
                <Textarea
                  id="instructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={8}
                  placeholder="Personaliza las instrucciones del agente..."
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p><strong>Tip:</strong> Las variables como <code>{"{{company_name}}"}</code> y <code>{"{{industry}}"}</code> se sustituirán automáticamente con los datos de tu empresa.</p>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Interfaces de Interacción
              </CardTitle>
              <CardDescription>
                Configura cómo los usuarios interactuarán con tu agente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {interfaceConfigs.map(config => {
                const IconComponent = getInterfaceIcon(config.id);
                return (
                  <div key={config.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-5 h-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{getInterfaceName(config.id)}</h4>
                        </div>
                      </div>
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={() => handleInterfaceToggle(config.id)}
                      />
                    </div>
                    
                    {config.enabled && (
                      <div className="space-y-3 pl-8">
                        {config.id === 'chat' && (
                          <>
                            <div className="space-y-2">
                              <Label>Mensaje de Bienvenida</Label>
                              <Input
                                value={config.config.welcome_message || ''}
                                onChange={(e) => handleInterfaceConfig(config.id, 'welcome_message', e.target.value)}
                                placeholder="¡Hola! Soy tu agente IA..."
                              />
                            </div>
                          </>
                        )}
                        
                        {config.id === 'email_monitor' && (
                          <>
                            <div className="space-y-2">
                              <Label>Filtros de Email</Label>
                              <Input
                                value={config.config.email_filters || ''}
                                onChange={(e) => handleInterfaceConfig(config.id, 'email_filters', e.target.value)}
                                placeholder="soporte@, ventas@"
                              />
                            </div>
                          </>
                        )}
                        
                        {config.id === 'web_widget' && (
                          <>
                            <div className="space-y-2">
                              <Label>Color del Widget</Label>
                              <Input
                                type="color"
                                value={config.config.widget_color || '#3b82f6'}
                                onChange={(e) => handleInterfaceConfig(config.id, 'widget_color', e.target.value)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Resumen y Despliegue
              </CardTitle>
              <CardDescription>
                Revisa la configuración antes de desplegar tu agente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">AGENTE</h4>
                  <p className="font-semibold">{agentName}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">INTERFACES ACTIVAS</h4>
                  <div className="flex gap-2 flex-wrap">
                    {interfaceConfigs
                      .filter(c => c.enabled)
                      .map(config => (
                        <Badge key={config.id} variant="secondary">
                          {getInterfaceName(config.id)}
                        </Badge>
                      ))
                    }
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">CAPACIDADES</h4>
                  <div className="flex gap-2 flex-wrap">
                    {template?.tools_config?.filter((tool: any) => tool.enabled)?.map((tool: any) => (
                      <Badge key={tool.name} variant="outline">
                        {tool.name.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Tiempo estimado de despliegue</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      Tu agente estará listo en aproximadamente 2-3 minutos
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/marketplace/agents')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Marketplace
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight mb-2">Configurar Agente</h1>
          <p className="text-muted-foreground">
            Personaliza tu agente antes del despliegue
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Paso {currentStep} de {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="w-full" />
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
              disabled={currentStep === 1 && !agentName.trim()}
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={deployAgent}
              disabled={loading || interfaceConfigs.filter(c => c.enabled).length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Desplegando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Desplegar Agente
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentConfigWizard;