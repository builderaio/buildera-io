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
  Clock,
  Upload,
  Link,
  Copy,
  Eye,
  ExternalLink,
  PenTool
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
  const [knowledgeBaseConfig, setKnowledgeBaseConfig] = useState({
    sourceType: '', // 'file', 'url', 'text'
    sourceContent: '',
    sourceFile: null as File | null
  });
  const [deployedUrls, setDeployedUrls] = useState<Record<string, string>>({});
  
  const totalSteps = 6;

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

      // Usar edge function para desplegar el agente con integraciones reales
      const { data, error } = await supabase.functions.invoke('deploy-agent-instance', {
        body: {
          template_id: templateId,
          name: agentName,
          contextualized_instructions: contextualizedInstructions,
          tenant_config: {
            company_name: profile?.company_name,
            industry: profile?.industry,
            interface_configs: interfaceConfigs.filter(c => c.enabled),
            knowledge_base: knowledgeBaseConfig,
          },
          tools_permissions: template?.tools_config,
        }
      });

      if (error) throw error;

      // Guardar las URLs generadas para mostrar en el paso 5
      setDeployedUrls(data.interface_urls);

      toast({
        title: "¡Agente desplegado exitosamente!",
        description: `${agentName} está listo para trabajar con interfaces únicas`,
      });

      // Ir al paso de URLs generadas antes de finalizar
      setCurrentStep(5);
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

  const generateApiUrl = (agentId: string) => {
    return `https://api.buildera.ai/v1/agents/${agentId}/chat`;
  };

  const generateWebWidgetUrl = (agentId: string) => {
    return `https://widget.buildera.ai/embed/${agentId}`;
  };

  const generateDashboardUrl = (agentId: string) => {
    return `https://dashboard.buildera.ai/agents/${agentId}/analytics`;
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
                <PenTool className="w-5 h-5" />
                Base de Conocimiento
              </CardTitle>
              <CardDescription>
                Proporciona información específica de tu empresa para personalizar el agente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Label>Selecciona cómo proporcionar la información</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={knowledgeBaseConfig.sourceType === 'file' ? 'default' : 'outline'}
                    onClick={() => setKnowledgeBaseConfig({...knowledgeBaseConfig, sourceType: 'file'})}
                    className="h-20 flex-col"
                  >
                    <Upload className="w-6 h-6 mb-2" />
                    Archivo
                  </Button>
                  <Button
                    variant={knowledgeBaseConfig.sourceType === 'url' ? 'default' : 'outline'}
                    onClick={() => setKnowledgeBaseConfig({...knowledgeBaseConfig, sourceType: 'url'})}
                    className="h-20 flex-col"
                  >
                    <Link className="w-6 h-6 mb-2" />
                    URL
                  </Button>
                  <Button
                    variant={knowledgeBaseConfig.sourceType === 'text' ? 'default' : 'outline'}
                    onClick={() => setKnowledgeBaseConfig({...knowledgeBaseConfig, sourceType: 'text'})}
                    className="h-20 flex-col"
                  >
                    <FileText className="w-6 h-6 mb-2" />
                    Texto
                  </Button>
                </div>

                {knowledgeBaseConfig.sourceType === 'file' && (
                  <div className="space-y-2">
                    <Label>Subir archivo (PDF, DOCX, TXT)</Label>
                    <Input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => setKnowledgeBaseConfig({
                        ...knowledgeBaseConfig,
                        sourceFile: e.target.files?.[0] || null
                      })}
                    />
                  </div>
                )}

                {knowledgeBaseConfig.sourceType === 'url' && (
                  <div className="space-y-2">
                    <Label>URL de información</Label>
                    <Input
                      value={knowledgeBaseConfig.sourceContent}
                      onChange={(e) => setKnowledgeBaseConfig({
                        ...knowledgeBaseConfig,
                        sourceContent: e.target.value
                      })}
                      placeholder="https://empresa.com/sobre-nosotros"
                    />
                  </div>
                )}

                {knowledgeBaseConfig.sourceType === 'text' && (
                  <div className="space-y-2">
                    <Label>Información de la empresa</Label>
                    <Textarea
                      value={knowledgeBaseConfig.sourceContent}
                      onChange={(e) => setKnowledgeBaseConfig({
                        ...knowledgeBaseConfig,
                        sourceContent: e.target.value
                      })}
                      rows={6}
                      placeholder="Describe tu empresa, productos, servicios, valores, etc..."
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 3:
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

      case 4:
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
                              <Label>Email de la Empresa</Label>
                              <Input
                                value={config.config.company_email || ''}
                                onChange={(e) => handleInterfaceConfig(config.id, 'company_email', e.target.value)}
                                placeholder="soporte@tuempresa.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Servidor IMAP</Label>
                              <Input
                                value={config.config.imap_server || ''}
                                onChange={(e) => handleInterfaceConfig(config.id, 'imap_server', e.target.value)}
                                placeholder="imap.gmail.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Servidor SMTP</Label>
                              <Input
                                value={config.config.smtp_server || ''}
                                onChange={(e) => handleInterfaceConfig(config.id, 'smtp_server', e.target.value)}
                                placeholder="smtp.gmail.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Contraseña de App</Label>
                              <Input
                                type="password"
                                value={config.config.email_password || ''}
                                onChange={(e) => handleInterfaceConfig(config.id, 'email_password', e.target.value)}
                                placeholder="Contraseña de aplicación"
                              />
                            </div>
                          </>
                        )}
                        
                        {config.id === 'web_widget' && (
                          <>
                            <div className="space-y-2">
                              <Label>Color Principal</Label>
                              <Input
                                type="color"
                                value={config.config.primary_color || '#3b82f6'}
                                onChange={(e) => handleInterfaceConfig(config.id, 'primary_color', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Logo de la Empresa (URL)</Label>
                              <Input
                                value={config.config.company_logo || ''}
                                onChange={(e) => handleInterfaceConfig(config.id, 'company_logo', e.target.value)}
                                placeholder="https://tuempresa.com/logo.png"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Nombre de la Empresa</Label>
                              <Input
                                value={config.config.company_name || ''}
                                onChange={(e) => handleInterfaceConfig(config.id, 'company_name', e.target.value)}
                                placeholder="Tu Empresa S.A."
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

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5" />
                URLs de Integración Generadas
              </CardTitle>
              <CardDescription>
                Interfaces únicas para tu empresa - Estas URLs son exclusivas para ti
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(deployedUrls).map(([key, value]: [string, any]) => {
                const interfaceConfig = interfaceConfigs.find(c => c.enabled && (
                  (key === 'chat' && c.id === 'chat') ||
                  (key === 'api' && c.id === 'api_webhook') ||
                  (key === 'widget' && c.id === 'web_widget') ||
                  (key === 'email' && c.id === 'email_monitor') ||
                  (key === 'dashboard' && c.id === 'dashboard')
                ));
                
                if (!interfaceConfig) return null;

                const IconComponent = getInterfaceIcon(interfaceConfig.id);
                
                return (
                  <div key={key} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-primary" />
                      <h4 className="font-medium">{getInterfaceName(interfaceConfig.id)}</h4>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Activo
                      </Badge>
                    </div>
                    
                    {value.url && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">URL Principal:</Label>
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                          <code className="flex-1 text-sm font-mono truncate">{value.url}</code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(value.url)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(value.url, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {value.api_key && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">API Key:</Label>
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                          <code className="flex-1 text-sm font-mono truncate">{value.api_key}</code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(value.api_key)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {value.embed_code && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Código de Integración:</Label>
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <code className="block text-xs font-mono text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                            {value.embed_code}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            onClick={() => navigator.clipboard.writeText(value.embed_code)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copiar Código
                          </Button>
                        </div>
                      </div>
                    )}

                    {value.access_token && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Token de Acceso:</Label>
                        <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                          <code className="flex-1 text-sm font-mono truncate">{value.access_token}</code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(value.access_token)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {value.webhook_url && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Webhook URL:</Label>
                        <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                          <code className="flex-1 text-sm font-mono truncate">{value.webhook_url}</code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(value.webhook_url)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {value.documentation && (
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="link"
                          onClick={() => window.open(value.documentation, '_blank')}
                          className="h-auto p-0 text-blue-600"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver Documentación
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">¡Agente Desplegado!</h4>
                    <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                      Tu agente está activo y las interfaces están listas para usar. 
                      Estas URLs son únicas para tu empresa y no se compartirán con otras organizaciones.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 6:
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
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">BASE DE CONOCIMIENTO</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {knowledgeBaseConfig.sourceType === 'file' && 'Archivo'}
                      {knowledgeBaseConfig.sourceType === 'url' && 'URL'}
                      {knowledgeBaseConfig.sourceType === 'text' && 'Texto'}
                    </Badge>
                    {knowledgeBaseConfig.sourceType && (
                      <span className="text-sm text-muted-foreground">
                        {knowledgeBaseConfig.sourceType === 'file' && knowledgeBaseConfig.sourceFile?.name}
                        {knowledgeBaseConfig.sourceType === 'url' && knowledgeBaseConfig.sourceContent}
                        {knowledgeBaseConfig.sourceType === 'text' && `${knowledgeBaseConfig.sourceContent.slice(0, 50)}...`}
                      </span>
                    )}
                  </div>
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
              disabled={
                (currentStep === 1 && !agentName.trim()) ||
                (currentStep === 2 && !knowledgeBaseConfig.sourceType) ||
                (currentStep === 2 && knowledgeBaseConfig.sourceType === 'file' && !knowledgeBaseConfig.sourceFile) ||
                (currentStep === 2 && (knowledgeBaseConfig.sourceType === 'url' || knowledgeBaseConfig.sourceType === 'text') && !knowledgeBaseConfig.sourceContent.trim())
              }
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : currentStep === 5 ? (
            <Button
              onClick={() => navigate('/company-dashboard?view=mis-agentes')}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Ir a Mis Agentes
            </Button>
          ) : currentStep === 6 ? (
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
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AgentConfigWizard;